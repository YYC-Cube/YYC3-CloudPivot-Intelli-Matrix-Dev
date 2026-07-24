/**
 * @file: router.test.ts
 * @description: LLM 路由器 + 故障转移 + 成本核算测试
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { LLMRouter, DEFAULT_MODEL_META } from "./src/router";
import type { ProviderConfig } from "./src/types";

const configs: ProviderConfig[] = [
  { provider: "openai", apiKey: "sk-1", defaultModel: "gpt-4o", models: ["gpt-4o", "gpt-4o-mini"] },
  { provider: "deepseek", apiKey: "sk-2", defaultModel: "deepseek-chat", models: ["deepseek-chat"] },
  { provider: "qwen", apiKey: "sk-3", defaultModel: "qwen-turbo", models: ["qwen-turbo"] },
  { provider: "kimi", apiKey: "sk-4", defaultModel: "moonshot-v1-8k", models: ["moonshot-v1-8k"] },
  { provider: "anthropic", apiKey: "sk-5", defaultModel: "claude-3-5-sonnet-20241022", models: ["claude-3-5-sonnet-20241022"] },
];

describe("DEFAULT_MODEL_META", () => {
  it("应包含所有 5 个 provider 的元数据", () => {
    expect(DEFAULT_MODEL_META.openai.length).toBeGreaterThan(0);
    expect(DEFAULT_MODEL_META.anthropic.length).toBeGreaterThan(0);
    expect(DEFAULT_MODEL_META.qwen.length).toBeGreaterThan(0);
    expect(DEFAULT_MODEL_META.deepseek.length).toBeGreaterThan(0);
    expect(DEFAULT_MODEL_META.kimi.length).toBeGreaterThan(0);
  });

  it("每个模型应包含完整字段", () => {
    for (const m of DEFAULT_MODEL_META.openai) {
      expect(m.provider).toBe("openai");
      expect(m.model).toBeTruthy();
      expect(m.inputPricePer1M).toBeGreaterThan(0);
      expect(m.outputPricePer1M).toBeGreaterThan(0);
      expect(m.contextWindow).toBeGreaterThan(0);
      expect(m.qualityScore).toBeGreaterThanOrEqual(0);
      expect(m.p99Latency).toBeGreaterThan(0);
    }
  });
});

describe("LLMRouter — 路由策略", () => {
  it("cost 策略应选最便宜的模型 (qwen-turbo)", () => {
    const router = new LLMRouter({ strategy: "cost", providers: configs });
    const d = router.route({ messages: [] });
    expect(d.meta?.model).toBe("qwen-turbo");
    expect(d.reason).toContain("cost");
  });

  it("latency 策略应选最低延迟 (qwen-turbo)", () => {
    const router = new LLMRouter({ strategy: "latency", providers: configs });
    const d = router.route({ messages: [] });
    expect(d.meta?.p99Latency).toBe(900);
  });

  it("quality 策略应选最高分 (o1-preview)", () => {
    const router = new LLMRouter({ strategy: "quality", providers: configs });
    const d = router.route({ messages: [] });
    expect(d.meta?.qualityScore).toBe(95);
  });

  it("manual 策略应使用第一个 provider 的默认模型", () => {
    const router = new LLMRouter({ strategy: "manual", providers: configs });
    const d = router.route({ messages: [] });
    expect(d.model).toBe("gpt-4o");
  });
});

describe("LLMRouter — listAvailable + estimateCost", () => {
  it("listAvailable 应列出所有 provider", () => {
    const router = new LLMRouter({ strategy: "cost", providers: configs });
    const list = router.listAvailable();
    expect(list).toHaveLength(5);
    expect(list.every(p => p.hasApiKey)).toBe(true);
  });

  it("estimateCost 应正确计算 USD", () => {
    const router = new LLMRouter({ strategy: "cost", providers: configs });
    // gpt-4o: $2.5/1M input + $10/1M output
    const cost = router.estimateCost("openai", "gpt-4o", 1_000_000, 1_000_000);
    expect(cost).toBeCloseTo(12.5, 2);
  });

  it("estimateCost 未知模型应返回 0", () => {
    const router = new LLMRouter({ strategy: "cost", providers: configs });
    expect(router.estimateCost("openai", "unknown", 1000, 1000)).toBe(0);
  });
});

describe("LLMRouter — 故障转移", () => {
  let router: LLMRouter;
  let fetchSpy: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    router = new LLMRouter({
      strategy: "manual",
      providers: [
        { provider: "openai", apiKey: "sk-1", defaultModel: "gpt-4o", models: ["gpt-4o"] },
        { provider: "deepseek", apiKey: "sk-2", defaultModel: "deepseek-chat", models: ["deepseek-chat"] },
      ],
      maxFallbacks: 1,
    });
  });
  afterEach(() => vi.unstubAllGlobals());

  it("首个 provider 失败 (可重试) 应尝试下一个", async () => {
    const okResp = {
      id: "test",
      choices: [{ message: { content: "ok" }, finish_reason: "stop" }],
      model: "deepseek-chat",
      usage: { prompt_tokens: 1, completion_tokens: 1, total_tokens: 2 },
      created: 1700000000,
    };
    fetchSpy = vi.fn()
      .mockResolvedValueOnce({ ok: false, status: 500, text: () => Promise.resolve("err") })
      .mockResolvedValueOnce({ ok: true, status: 200, json: () => Promise.resolve(okResp) });
    vi.stubGlobal("fetch", fetchSpy);

    const resp = await router.chat({ messages: [{ role: "user", content: "hi" }] });
    expect(resp.content).toBe("ok");
    expect(resp.provider).toBe("deepseek");
    expect(fetchSpy).toHaveBeenCalledTimes(2);
  });

  it("不可重试错误 (400) 应立即抛出", async () => {
    fetchSpy = vi.fn().mockResolvedValue({
      ok: false, status: 400, text: () => Promise.resolve("bad request"),
    });
    vi.stubGlobal("fetch", fetchSpy);
    await expect(router.chat({ messages: [] })).rejects.toThrow();
    expect(fetchSpy).toHaveBeenCalledTimes(1);
  });

  it("所有 provider 失败应抛出错误", async () => {
    fetchSpy = vi.fn().mockResolvedValue({
      ok: false, status: 500, text: () => Promise.resolve("server error"),
    });
    vi.stubGlobal("fetch", fetchSpy);
    await expect(router.chat({ messages: [] })).rejects.toThrow();
    expect(fetchSpy).toHaveBeenCalledTimes(2);
  });
});

describe("LLMRouter — 无 API Key 情况", () => {
  it("无 Key 时仍应可路由 (退化到第一个 provider)", () => {
    const router = new LLMRouter({
      strategy: "cost",
      providers: [{ provider: "openai", apiKey: "", defaultModel: "gpt-4o", models: ["gpt-4o"] }],
    });
    const d = router.route({ messages: [] });
    expect(d.adapter).toBeDefined();
    expect(d.reason).toContain("no-key fallback");
  });
});
