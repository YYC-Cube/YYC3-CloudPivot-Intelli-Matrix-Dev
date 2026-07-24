/**
 * @file: providers.ts
 * @description: 5 大 LLM Provider 适配器实现 — OpenAI/Anthropic/Qwen/DeepSeek/Kimi
 *
 * 统一接口:
 * - chat(req): Promise<ChatResponse>
 * - chatStream(req, onChunk): Promise<void>
 *
 * 流式协议:
 * - OpenAI/Qwen/DeepSeek/Kimi: data: {"choices":[{"delta":{"content":"..."}}]}
 * - Anthropic: event: content_block_delta, data: {"delta":{"text":"..."}}
 */
import { BaseAdapter, genRequestId } from "./base-adapter";
import type {
  ChatChunk, ChatRequest, ChatResponse, LLMProvider, ProviderConfig,
} from "./types";
import { LLMError } from "./types";

// ============================================================
// OpenAI 适配器 (兼容 Azure OpenAI / OpenAI 兼容协议)
// ============================================================
export class OpenAIAdapter extends BaseAdapter {
  readonly provider: LLMProvider = "openai";

  protected getChatEndpoint(): string {
    return this.config.baseURL || "https://api.openai.com/v1/chat/completions";
  }

  protected buildRequestBody(req: ChatRequest): Record<string, unknown> {
    return {
      model: req.model || this.config.defaultModel,
      messages: req.messages,
      temperature: req.temperature ?? 0.7,
      top_p: req.topP ?? 1,
      max_tokens: req.maxTokens ?? -1,
      stream: req.stream ?? false,
      stop: req.stop,
      user: req.user,
      ...req.extra,
    };
  }

  protected parseResponse(data: any): ChatResponse {
    if (!data?.choices?.[0]) {
      throw new LLMError("OpenAI 响应缺少 choices", "openai");
    }
    const choice = data.choices[0];
    return {
      id: data.id || genRequestId(),
      content: choice.message?.content || "",
      model: data.model || this.config.defaultModel,
      provider: "openai",
      usage: data.usage ? {
        promptTokens: data.usage.prompt_tokens ?? 0,
        completionTokens: data.usage.completion_tokens ?? 0,
        totalTokens: data.usage.total_tokens ?? 0,
      } : undefined,
      finishReason: choice.finish_reason || null,
      created: data.created || Date.now(),
    };
  }

  protected parseStreamChunk(data: unknown): ChatChunk | null {
    let obj: any = data;
    if (typeof data === "string") {
      try {
        obj = JSON.parse(data);
      } catch {
        return null;
      }
    }
    if (!obj?.choices?.[0]) return null;
    const choice = obj.choices[0];
    return {
      delta: choice.delta?.content || "",
      finished: choice.finish_reason === "stop" || choice.finish_reason === "length",
      finishReason: choice.finish_reason || undefined,
    };
  }
}

// ============================================================
// Anthropic Claude 适配器
// ============================================================
export class AnthropicAdapter extends BaseAdapter {
  readonly provider: LLMProvider = "anthropic";

  protected getChatEndpoint(): string {
    return this.config.baseURL || "https://api.anthropic.com/v1/messages";
  }

  protected getHeaders(): Record<string, string> {
    return {
      "Content-Type": "application/json",
      "x-api-key": this.config.apiKey,
      "anthropic-version": "2023-06-01",
      "anthropic-dangerous-direct-browser-access": "true",
      ...this.config.headers,
    };
  }

  protected buildRequestBody(req: ChatRequest): Record<string, unknown> {
    // Anthropic: system 消息单独传, 其余 messages 数组不含 system
    const system = req.messages.find(m => m.role === "system")?.content;
    const messages = req.messages
      .filter(m => m.role !== "system")
      .map(m => ({ role: m.role, content: m.content }));

    return {
      model: req.model || this.config.defaultModel,
      system,
      messages,
      max_tokens: req.maxTokens ?? 4096,
      temperature: req.temperature ?? 0.7,
      top_p: req.topP ?? 1,
      stream: req.stream ?? false,
      stop_sequences: req.stop,
      ...req.extra,
    };
  }

  async chat(req: ChatRequest): Promise<ChatResponse> {
    // Anthropic 非流式不走 SSE
    const endpoint = this.getChatEndpoint();
    const body = this.buildRequestBody({ ...req, stream: false });

    const resp = await fetch(endpoint, {
      method: "POST",
      headers: this.getHeaders(),
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(this.config.timeout ?? 60_000),
    });

    if (!resp.ok) {
      const errText = await resp.text().catch(() => "");
      throw new LLMError(
        `Anthropic HTTP ${resp.status}: ${errText.slice(0, 200)}`,
        "anthropic",
        resp.status,
        resp.status >= 500 || resp.status === 429
      );
    }

    const data = await resp.json();
    return this.parseResponse(data);
  }

  protected parseResponse(data: any): ChatResponse {
    if (!data?.content?.[0]) {
      throw new LLMError("Anthropic 响应缺少 content", "anthropic");
    }
    return {
      id: data.id || genRequestId(),
      content: data.content.map((c: any) => c.text || "").join(""),
      model: data.model || this.config.defaultModel,
      provider: "anthropic",
      usage: data.usage ? {
        promptTokens: data.usage.input_tokens ?? 0,
        completionTokens: data.usage.output_tokens ?? 0,
        totalTokens: (data.usage.input_tokens ?? 0) + (data.usage.output_tokens ?? 0),
      } : undefined,
      finishReason: data.stop_reason || null,
      created: Date.now(),
    };
  }

  protected parseStreamChunk(data: unknown): ChatChunk | null {
    let obj: any = data;
    if (typeof data === "string") {
      try {
        obj = JSON.parse(data);
      } catch {
        return null;
      }
    }
    // Anthropic SSE 事件类型: message_start / content_block_start / content_block_delta / message_delta / message_stop
    if (obj?.type === "content_block_delta" && obj.delta?.type === "text_delta") {
      return { delta: obj.delta.text || "", finished: false };
    }
    if (obj?.type === "message_stop") {
      return { delta: "", finished: true, finishReason: "stop" };
    }
    return null;
  }
}

// ============================================================
// 通义千问 (Qwen) 适配器 — 阿里云 DashScope
// ============================================================
export class QwenAdapter extends OpenAIAdapter {
  readonly provider: LLMProvider = "qwen";

  protected getChatEndpoint(): string {
    return this.config.baseURL || "https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions";
  }

  protected getHeaders(): Record<string, string> {
    return {
      "Content-Type": "application/json",
      Authorization: `Bearer ${this.config.apiKey}`,
      ...this.config.headers,
    };
  }

  protected parseResponse(data: any): ChatResponse {
    // Qwen 兼容 OpenAI 协议
    const resp = super.parseResponse(data);
    return { ...resp, provider: "qwen" };
  }

  protected parseStreamChunk(data: any): ChatChunk | null {
    const chunk = super.parseStreamChunk(data);
    return chunk ? { ...chunk } : null;
  }
}

// ============================================================
// DeepSeek 适配器 — OpenAI 兼容协议
// ============================================================
export class DeepSeekAdapter extends OpenAIAdapter {
  readonly provider: LLMProvider = "deepseek";

  protected getChatEndpoint(): string {
    return this.config.baseURL || "https://api.deepseek.com/v1/chat/completions";
  }

  protected parseResponse(data: any): ChatResponse {
    const resp = super.parseResponse(data);
    return { ...resp, provider: "deepseek" };
  }
}

// ============================================================
// Kimi (Moonshot) 适配器 — OpenAI 兼容协议
// ============================================================
export class KimiAdapter extends OpenAIAdapter {
  readonly provider: LLMProvider = "kimi";

  protected getChatEndpoint(): string {
    return this.config.baseURL || "https://api.moonshot.cn/v1/chat/completions";
  }

  protected parseResponse(data: any): ChatResponse {
    const resp = super.parseResponse(data);
    return { ...resp, provider: "kimi" };
  }
}

// ============================================================
// 适配器工厂
// ============================================================
const ADAPTER_REGISTRY: Record<LLMProvider, new (config: ProviderConfig) => BaseAdapter> = {
  openai: OpenAIAdapter,
  anthropic: AnthropicAdapter,
  qwen: QwenAdapter,
  deepseek: DeepSeekAdapter,
  kimi: KimiAdapter,
  custom: OpenAIAdapter, // 自定义 endpoint 复用 OpenAI 协议
};

/** 创建适配器实例 */
export function createAdapter(config: ProviderConfig): BaseAdapter {
  const AdapterCls = ADAPTER_REGISTRY[config.provider];
  if (!AdapterCls) {
    throw new LLMError(`未知的 provider: ${config.provider}`, config.provider);
  }
  return new AdapterCls(config);
}

/** 默认 Provider 配置模板 (不含 API Key) */
export const PROVIDER_PRESETS: Record<Exclude<LLMProvider, "custom">, Omit<ProviderConfig, "apiKey">> = {
  openai: {
    provider: "openai",
    defaultModel: "gpt-4o-mini",
    models: ["gpt-4o", "gpt-4o-mini", "gpt-4-turbo", "gpt-3.5-turbo", "o1-mini", "o1-preview"],
  },
  anthropic: {
    provider: "anthropic",
    defaultModel: "claude-3-5-haiku-20241022",
    models: [
      "claude-3-5-haiku-20241022",
      "claude-3-5-sonnet-20241022",
      "claude-3-opus-20240229",
    ],
  },
  qwen: {
    provider: "qwen",
    defaultModel: "qwen-turbo",
    models: ["qwen-turbo", "qwen-plus", "qwen-max", "qwen-long", "qwen-vl-max"],
  },
  deepseek: {
    provider: "deepseek",
    defaultModel: "deepseek-chat",
    models: ["deepseek-chat", "deepseek-reasoner", "deepseek-coder"],
  },
  kimi: {
    provider: "kimi",
    defaultModel: "moonshot-v1-8k",
    models: ["moonshot-v1-8k", "moonshot-v1-32k", "moonshot-v1-128k"],
  },
};
