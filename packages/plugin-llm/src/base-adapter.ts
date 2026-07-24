/**
 * @file: base-adapter.ts
 * @description: LLM 适配器基类 — 公共 HTTP/SSE 逻辑
 */
import { SSEClient } from "./sse";
import type { ChatChunk, ChatRequest, ChatResponse, LLMAdapter, ProviderConfig, StreamCallback } from "./types";
import { LLMError } from "./types";

/** 默认请求超时 (ms) */
const DEFAULT_TIMEOUT = 60_000;

/** 生成请求 ID */
export function genRequestId(prefix = "chatcmpl"): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

/** HTTP 请求工具 — 带 timeout */
export async function fetchWithTimeout(
  url: string,
  init: RequestInit & { timeout?: number } = {}
): Promise<Response> {
  const { timeout = DEFAULT_TIMEOUT, ...rest } = init;
  const signal = AbortSignal.timeout(timeout);
  const combinedSignal = rest.signal ? AbortSignal.any([rest.signal, signal]) : signal;

  try {
    const resp = await fetch(url, { ...rest, signal: combinedSignal });
    return resp;
  } catch (err) {
    const e = err as Error;
    if (e.name === "TimeoutError" || e.name === "AbortError") {
      throw new LLMError(`请求超时 (${timeout}ms)`, "openai", 408, true);
    }
    throw new LLMError(`网络错误: ${e.message}`, "openai", undefined, true);
  }
}

/** 抽象基类 — 公共逻辑 */
export abstract class BaseAdapter implements LLMAdapter {
  abstract readonly provider: import("./types").LLMProvider;
  readonly config: ProviderConfig;

  constructor(config: ProviderConfig) {
    this.config = config;
  }

  /** 子类实现: 转换 ChatRequest 为 Provider 请求体 */
  protected abstract buildRequestBody(req: ChatRequest): Record<string, unknown>;
  /** 子类实现: 解析非流式响应 */
  protected abstract parseResponse(data: unknown): ChatResponse;
  /** 子类实现: 解析流式 chunk */
  protected abstract parseStreamChunk(data: unknown): ChatChunk | null;

  /** 子类提供: 端点 URL */
  protected abstract getChatEndpoint(): string;
  /** 子类提供: 请求头构造 (含 Authorization) */
  protected getHeaders(): Record<string, string> {
    return {
      "Content-Type": "application/json",
      Authorization: `Bearer ${this.config.apiKey}`,
      ...this.config.headers,
    };
  }

  async chat(req: ChatRequest): Promise<ChatResponse> {
    const endpoint = this.getChatEndpoint();
    const body = this.buildRequestBody({ ...req, stream: false });

    const resp = await fetchWithTimeout(endpoint, {
      method: "POST",
      headers: this.getHeaders(),
      body: JSON.stringify(body),
      timeout: this.config.timeout ?? DEFAULT_TIMEOUT,
    });

    if (!resp.ok) {
      const errText = await resp.text().catch(() => "");
      throw new LLMError(
        `${this.provider} HTTP ${resp.status}: ${errText.slice(0, 200)}`,
        this.provider,
        resp.status,
        resp.status >= 500 || resp.status === 429
      );
    }

    const data = await resp.json();
    return this.parseResponse(data);
  }

  async chatStream(req: ChatRequest, onChunk: StreamCallback): Promise<void> {
    const endpoint = this.getChatEndpoint();
    const body = this.buildRequestBody({ ...req, stream: true });

    return new Promise((resolve, reject) => {
      let finalSent = false;
      const client = new SSEClient(
        {
          url: endpoint,
          method: "POST",
          headers: this.getHeaders(),
          body,
          autoReconnect: false,
          timeout: this.config.timeout ?? DEFAULT_TIMEOUT,
        },
        {
          onEvent: (evt) => {
            if (evt.event === "done") {
              if (!finalSent) {
                onChunk({ delta: "", finished: true, finishReason: "stop" });
                finalSent = true;
              }
              return;
            }
            try {
              const chunk = this.parseStreamChunk(evt.data);
              if (chunk) {
                if (chunk.finished) finalSent = true;
                onChunk(chunk);
              }
            } catch (e) {
              // 解析失败不中断流, 仅记录
              console.warn(`[${this.provider}] SSE chunk parse failed:`, e);
            }
          },
          onError: (err) => {
            reject(new LLMError(`SSE 错误: ${err.message}`, this.provider, undefined, true));
          },
          onClose: () => resolve(),
        }
      );
      client.connect();
    });
  }

  async healthCheck(): Promise<boolean> {
    try {
      // 简化: 发送一个最小请求, 检查 HTTP 200
      await this.chat({
        messages: [{ role: "user", content: "ping" }],
        maxTokens: 1,
      });
      return true;
    } catch {
      return false;
    }
  }
}
