/**
 * @file: providers.test.ts
 * @description: 5 大 LLM Provider 适配器单元测试
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  AnthropicAdapter,
  createAdapter,
  DeepSeekAdapter,
  KimiAdapter,
  OpenAIAdapter,
  PROVIDER_PRESETS,
  QwenAdapter,
} from "./src/providers";
import type { ProviderConfig } from "./src/types";

const mkConfig = (provider: ProviderConfig["provider"], extra: Partial<ProviderConfig> = {}): ProviderConfig => ({
  provider,
  apiKey: "sk-test",
  defaultModel: "test-model",
  models: ["test-model"],
  ...extra,
});

/** 模拟 OpenAI 风格响应 */
const openaiResp = {
  id: "chatcmpl-test",
  choices: [{
    index: 0,
    message: { role: "assistant", content: "你好！" },
    finish_reason: "stop",
  }],
  model: "gpt-4o",
  usage: { prompt_tokens: 5, completion_tokens: 3, total_tokens: 8 },
  created: 1700000000,
};

/** 模拟 Anthropic 响应 */
const anthropicResp = {
  id: "msg_test",
  type: "message",
  role: "assistant",
  model: "claude-3-5-sonnet",
  content: [{ type: "text", text: "Hello!" }],
  stop_reason: "end_turn",
  usage: { input_tokens: 10, output_tokens: 5 },
};

describe("createAdapter 工厂", () => {
  it("应为每个 provider 创建对应适配器", () => {
    expect(createAdapter(mkConfig("openai"))).toBeInstanceOf(OpenAIAdapter);
    expect(createAdapter(mkConfig("anthropic"))).toBeInstanceOf(AnthropicAdapter);
    expect(createAdapter(mkConfig("qwen"))).toBeInstanceOf(QwenAdapter);
    expect(createAdapter(mkConfig("deepseek"))).toBeInstanceOf(DeepSeekAdapter);
    expect(createAdapter(mkConfig("kimi"))).toBeInstanceOf(KimiAdapter);
    // custom 复用 OpenAI 协议
    expect(createAdapter(mkConfig("custom"))).toBeInstanceOf(OpenAIAdapter);
  });
});

describe("PROVIDER_PRESETS", () => {
  it("应包含 5 个 Provider 的默认模型", () => {
    expect(PROVIDER_PRESETS.openai.defaultModel).toBe("gpt-4o-mini");
    expect(PROVIDER_PRESETS.anthropic.defaultModel).toContain("claude");
    expect(PROVIDER_PRESETS.qwen.defaultModel).toBe("qwen-turbo");
    expect(PROVIDER_PRESETS.deepseek.defaultModel).toBe("deepseek-chat");
    expect(PROVIDER_PRESETS.kimi.defaultModel).toContain("moonshot");
  });

  it("每个 provider 应有至少 2 个模型", () => {
    for (const [name, preset] of Object.entries(PROVIDER_PRESETS)) {
      expect(preset.models.length, `${name} models`).toBeGreaterThanOrEqual(2);
    }
  });
});

describe("OpenAIAdapter — 非流式", () => {
  let adapter: OpenAIAdapter;
  let fetchSpy: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    adapter = new OpenAIAdapter(mkConfig("openai", {
      defaultModel: "gpt-4o-mini",
      baseURL: "https://test.openai.com/v1/chat/completions",
    }));
    fetchSpy = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.resolve(openaiResp),
    });
    vi.stubGlobal("fetch", fetchSpy);
  });
  afterEach(() => vi.unstubAllGlobals());

  it("应正确构造请求体并解析响应", async () => {
    const resp = await adapter.chat({
      messages: [{ role: "user", content: "你好" }],
      temperature: 0.5,
      maxTokens: 100,
    });

    expect(fetchSpy).toHaveBeenCalled();
    const [, init] = fetchSpy.mock.calls[0];
    const body = JSON.parse(init.body);
    expect(body.model).toBe("gpt-4o-mini");
    expect(body.messages[0].content).toBe("你好");
    expect(body.temperature).toBe(0.5);
    expect(body.max_tokens).toBe(100);
    expect(body.stream).toBe(false);
    expect(init.headers.Authorization).toBe("Bearer sk-test");

    expect(resp.content).toBe("你好！");
    expect(resp.provider).toBe("openai");
    expect(resp.model).toBe("gpt-4o");
    expect(resp.usage?.totalTokens).toBe(8);
    expect(resp.finishReason).toBe("stop");
  });

  it("HTTP 错误应抛出 LLMError", async () => {
    fetchSpy.mockResolvedValueOnce({
      ok: false,
      status: 429,
      text: () => Promise.resolve("rate limited"),
    });
    await expect(adapter.chat({ messages: [] })).rejects.toThrow();
  });
});

describe("OpenAIAdapter — 流式", () => {
  let adapter: OpenAIAdapter;
  beforeEach(() => {
    adapter = new OpenAIAdapter(mkConfig("openai", {
      baseURL: "https://test.openai.com/v1/chat/completions",
    }));
    const frames = [
      `data: ${JSON.stringify({ choices: [{ delta: { content: "你" } }] })}\n\n`,
      `data: ${JSON.stringify({ choices: [{ delta: { content: "好" } }] })}\n\n`,
      `data: ${JSON.stringify({ choices: [{ delta: {}, finish_reason: "stop" }] })}\n\n`,
      "data: [DONE]\n\n",
    ];
    const encoder = new TextEncoder();
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      body: new ReadableStream({
        start(c) {
          for (const f of frames) c.enqueue(encoder.encode(f));
          c.close();
        },
      }),
    }));
  });
  afterEach(() => vi.unstubAllGlobals());

  it("应按 chunk 输出 delta", async () => {
    const deltas: string[] = [];
    await adapter.chatStream(
      { messages: [{ role: "user", content: "hi" }], stream: true },
      (chunk) => deltas.push(chunk.delta)
    );
    expect(deltas).toEqual(["你", "好", ""]);
  });
});

describe("AnthropicAdapter — 非流式", () => {
  let adapter: AnthropicAdapter;
  let fetchSpy: ReturnType<typeof vi.fn>;
  beforeEach(() => {
    adapter = new AnthropicAdapter(mkConfig("anthropic", {
      defaultModel: "claude-3-5-sonnet-20241022",
      baseURL: "https://test.anthropic.com/v1/messages",
    }));
    fetchSpy = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.resolve(anthropicResp),
    });
    vi.stubGlobal("fetch", fetchSpy);
  });
  afterEach(() => vi.unstubAllGlobals());

  it("应使用 x-api-key 头 + anthropic-version", async () => {
    await adapter.chat({
      messages: [
        { role: "system", content: "你是助手" },
        { role: "user", content: "Hi" },
      ],
    });
    const [, init] = fetchSpy.mock.calls[0];
    expect(init.headers["x-api-key"]).toBe("sk-test");
    expect(init.headers["anthropic-version"]).toBe("2023-06-01");
    expect(init.headers["anthropic-dangerous-direct-browser-access"]).toBe("true");
  });

  it("应将 system 消息从 messages 分离", async () => {
    await adapter.chat({
      messages: [
        { role: "system", content: "你是助手" },
        { role: "user", content: "Hi" },
      ],
    });
    const body = JSON.parse(fetchSpy.mock.calls[0][1].body);
    expect(body.system).toBe("你是助手");
    expect(body.messages).toHaveLength(1);
    expect(body.messages[0].role).toBe("user");
  });

  it("应解析 Anthropic 响应格式", async () => {
    const resp = await adapter.chat({
      messages: [{ role: "user", content: "Hi" }],
    });
    expect(resp.content).toBe("Hello!");
    expect(resp.provider).toBe("anthropic");
    expect(resp.usage?.promptTokens).toBe(10);
    expect(resp.finishReason).toBe("end_turn");
  });
});

describe("AnthropicAdapter — 流式", () => {
  let adapter: AnthropicAdapter;
  beforeEach(() => {
    adapter = new AnthropicAdapter(mkConfig("anthropic"));
    const frames = [
      `event: content_block_delta\ndata: ${JSON.stringify({ type: "content_block_delta", delta: { type: "text_delta", text: "你" } })}\n\n`,
      `event: content_block_delta\ndata: ${JSON.stringify({ type: "content_block_delta", delta: { type: "text_delta", text: "好" } })}\n\n`,
      `event: message_stop\ndata: ${JSON.stringify({ type: "message_stop" })}\n\n`,
    ];
    const encoder = new TextEncoder();
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: true, status: 200,
      body: new ReadableStream({
        start(c) { for (const f of frames) c.enqueue(encoder.encode(f)); c.close(); },
      }),
    }));
  });
  afterEach(() => vi.unstubAllGlobals());

  it("应识别 content_block_delta 事件", async () => {
    const deltas: string[] = [];
    await adapter.chatStream(
      { messages: [{ role: "user", content: "hi" }], stream: true },
      (c) => deltas.push(c.delta)
    );
    expect(deltas).toEqual(["你", "好", ""]);
  });
});

describe("国产模型适配器 — Qwen/DeepSeek/Kimi", () => {
  it("QwenAdapter 应使用 DashScope baseURL", () => {
    const adapter = new QwenAdapter(mkConfig("qwen"));
    expect((adapter as any).getChatEndpoint()).toContain("dashscope.aliyuncs.com");
    expect(adapter.provider).toBe("qwen");
  });

  it("DeepSeekAdapter 应使用 deepseek.com baseURL", () => {
    const adapter = new DeepSeekAdapter(mkConfig("deepseek"));
    expect((adapter as any).getChatEndpoint()).toContain("api.deepseek.com");
    expect(adapter.provider).toBe("deepseek");
  });

  it("KimiAdapter 应使用 moonshot.cn baseURL", () => {
    const adapter = new KimiAdapter(mkConfig("kimi"));
    expect((adapter as any).getChatEndpoint()).toContain("api.moonshot.cn");
    expect(adapter.provider).toBe("kimi");
  });

  it("Qwen 解析响应应保留 qwen provider 标识", async () => {
    const adapter = new QwenAdapter(mkConfig("qwen", { baseURL: "https://test/v1" }));
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: true, status: 200,
      json: () => Promise.resolve({ ...openaiResp, model: "qwen-turbo" }),
    }));
    const resp = await adapter.chat({ messages: [{ role: "user", content: "hi" }] });
    expect(resp.provider).toBe("qwen");
    expect(resp.model).toBe("qwen-turbo");
    vi.unstubAllGlobals();
  });
});
