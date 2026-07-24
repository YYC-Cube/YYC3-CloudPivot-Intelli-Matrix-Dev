/**
 * @file: sse.ts
 * @description: Server-Sent Events 客户端 — 兼容原生 EventSource 与 fetch streaming
 *
 * 设计原则:
 * 1. 统一 SSE 协议封装 — 自动解析 data: / event: / id: / retry: 字段
 * 2. 自动重连 (指数退避 + jitter) — 网络抖动恢复
 * 3. 支持 POST 请求 — 原生 EventSource 仅支持 GET, 这里用 fetch 实现
 * 4. 错误恢复 — onerror 回调, 用户可决定是否终止
 * 5. AbortController 取消 — 支持中断流式输出
 */

/** SSE 事件 */
export interface SSEEvent {
  /** event: 字段 (默认 "message") */
  event: string;
  /** data: 字段拼接 (按换行符拼接多行 data:) */
  data: string;
  /** id: 字段 (Last-Event-ID) */
  id?: string;
  /** retry: 字段 (重连间隔 ms) */
  retry?: number;
}

/** SSE 客户端配置 */
export interface SSEClientOptions {
  /** 请求 URL */
  url: string;
  /** HTTP 方法 (默认 GET) */
  method?: "GET" | "POST";
  /** 请求头 */
  headers?: Record<string, string>;
  /** POST body */
  body?: string | Record<string, unknown>;
  /** 凭证 (默认 "omit") */
  credentials?: RequestCredentials;
  /** 是否自动重连 (默认 true) */
  autoReconnect?: boolean;
  /** 最大重试次数 (默认 3) */
  maxRetries?: number;
  /** 初始重连间隔 (ms, 默认 1000) */
  retryInterval?: number;
  /** 最大重连间隔 (ms, 默认 30000) */
  maxRetryInterval?: number;
  /** 请求超时 (ms, 默认 0 = 不超时) */
  timeout?: number;
  /** withCredentials for native EventSource */
  withCredentials?: boolean;
}

/** SSE 事件回调 */
export interface SSEHandlers {
  onEvent: (event: SSEEvent) => void;
  onError?: (err: Error, retryCount: number) => void;
  onOpen?: () => void;
  onClose?: () => void;
}

/**
 * SSE 客户端 — 基于 fetch + ReadableStream 实现
 *
 * 优势:
 * - 支持 POST 方法 (原生 EventSource 仅支持 GET)
 * - 支持自定义请求头 (Authorization 等)
 * - 支持请求超时
 * - 自动重连 + 指数退避 + jitter
 */
export class SSEClient {
  private controller: AbortController | null = null;
  private retryCount = 0;
  private retryTimer: ReturnType<typeof setTimeout> | null = null;
  private closed = false;
  private lastEventId: string | undefined;

  constructor(
    private readonly options: SSEClientOptions,
    private readonly handlers: SSEHandlers
  ) {}

  /** 启动 SSE 连接 */
  async connect(): Promise<void> {
    this.closed = false;
    this.controller = new AbortController();

    const {
      url,
      method = "GET",
      headers = {},
      body,
      credentials = "omit",
      timeout = 0,
    } = this.options;

    const reqHeaders: Record<string, string> = {
      Accept: "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      ...headers,
    };

    const reqBody =
      body && typeof body === "object" ? JSON.stringify(body) : (body as string | undefined);

    if (reqBody && !reqHeaders["Content-Type"]) {
      reqHeaders["Content-Type"] = "application/json";
    }

    if (this.lastEventId) {
      reqHeaders["Last-Event-ID"] = this.lastEventId;
    }

    try {
      const timeoutSignal = timeout
        ? AbortSignal.timeout(timeout)
        : null;
      const signal = timeoutSignal
        ? AbortSignal.any([this.controller.signal, timeoutSignal])
        : this.controller.signal;

      const resp = await fetch(url, {
        method,
        headers: reqHeaders,
        body: method === "POST" ? reqBody : undefined,
        credentials,
        signal,
      });

      if (!resp.ok) {
        throw new Error(`SSE HTTP ${resp.status}: ${resp.statusText}`);
      }

      if (!resp.body) {
        throw new Error("SSE response has no body");
      }

      this.handlers.onOpen?.();
      this.retryCount = 0;

      await this.consumeStream(resp.body);
      this.handlers.onClose?.();
    } catch (err) {
      if (this.closed) return;
      const e = err as Error;
      this.handlers.onError?.(e, this.retryCount);
      this.maybeReconnect();
    }
  }

  /** 消费 ReadableStream, 按行解析 SSE 帧 */
  private async consumeStream(stream: ReadableStream<Uint8Array>): Promise<void> {
    const reader = stream.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        // SSE 帧以空行分隔
        let frameEnd: number;
        while ((frameEnd = this.findFrameEnd(buffer)) !== -1) {
          const frame = buffer.slice(0, frameEnd);
          buffer = buffer.slice(frameEnd + 2); // 跳过 \n\n
          this.processFrame(frame);
        }
      }
    } finally {
      reader.releaseLock();
    }
  }

  /** 查找帧结束位置 (\n\n) */
  private findFrameEnd(buf: string): number {
    const idx = buf.indexOf("\n\n");
    return idx === -1 ? -1 : idx;
  }

  /** 处理单个 SSE 帧 */
  private processFrame(frame: string): void {
    if (!frame.trim()) return;

    let event = "message";
    let data = "";
    let id: string | undefined;
    let retry: number | undefined;

    for (const line of frame.split("\n")) {
      if (!line) continue;
      const colonIdx = line.indexOf(":");
      const field = colonIdx === -1 ? line : line.slice(0, colonIdx);
      const value = colonIdx === -1 ? "" : line.slice(colonIdx + 1).replace(/^ /, "");

      switch (field) {
        case "event":
          event = value;
          break;
        case "data":
          data = data ? `${data}\n${value}` : value;
          break;
        case "id":
          id = value;
          this.lastEventId = value;
          break;
        case "retry":
          retry = Number(value);
          if (!Number.isNaN(retry) && retry > 0) {
            this.options.retryInterval = retry;
          }
          break;
        default:
          // 注释行 (以 : 开头) 或未知字段, 忽略
          break;
      }
    }

    // [DONE] 标记 (OpenAI 风格)
    if (data === "[DONE]") {
      this.handlers.onEvent?.({ event: "done", data: "", id });
      return;
    }

    this.handlers.onEvent?.({ event, data, id, retry });
  }

  /** 是否重连 */
  private maybeReconnect(): void {
    if (this.closed) return;
    const { autoReconnect = true, maxRetries = 3 } = this.options;
    if (!autoReconnect || this.retryCount >= maxRetries) {
      this.handlers.onClose?.();
      return;
    }

    this.retryCount += 1;
    const interval = this.computeBackoff();
    this.retryTimer = setTimeout(() => {
      this.connect();
    }, interval);
  }

  /** 指数退避 + jitter (避免惊群) */
  private computeBackoff(): number {
    const { retryInterval = 1000, maxRetryInterval = 30000 } = this.options;
    const exp = retryInterval * Math.pow(2, this.retryCount - 1);
    const jitter = Math.random() * 500;
    return Math.min(exp + jitter, maxRetryInterval);
  }

  /** 关闭连接, 取消重连 */
  close(): void {
    this.closed = true;
    this.controller?.abort();
    this.controller = null;
    if (this.retryTimer) {
      clearTimeout(this.retryTimer);
      this.retryTimer = null;
    }
  }

  /** 是否已关闭 */
  get isClosed(): boolean {
    return this.closed;
  }
}

/**
 * 简化版: 一次性流式读取, 自动解析 JSON chunk
 * 适用于不需要重连的场景
 */
export async function readSSEStream(
  url: string,
  options: {
    method?: "GET" | "POST";
    headers?: Record<string, string>;
    body?: unknown;
    signal?: AbortSignal;
    onChunk: (data: string) => void;
    onDone?: () => void;
    onError?: (err: Error) => void;
  }
): Promise<void> {
  const { method = "POST", headers = {}, body, signal, onChunk, onDone, onError } = options;

  try {
    const resp = await fetch(url, {
      method,
      headers: {
        Accept: "text/event-stream",
        "Content-Type": "application/json",
        ...headers,
      },
      body: method === "POST" && body ? JSON.stringify(body) : undefined,
      signal,
    });

    if (!resp.ok || !resp.body) {
      throw new Error(`SSE ${resp.status}: ${resp.statusText}`);
    }

    const reader = resp.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });

      let frameEnd: number;
      while ((frameEnd = buffer.indexOf("\n\n")) !== -1) {
        const frame = buffer.slice(0, frameEnd);
        buffer = buffer.slice(frameEnd + 2);
        const data = parseSSEFrame(frame);
        if (data === "[DONE]") {
          onDone?.();
          return;
        }
        if (data) onChunk(data);
      }
    }
    onDone?.();
  } catch (err) {
    onError?.(err as Error);
  }
}

/** 解析单个 SSE 帧, 提取 data 字段 */
function parseSSEFrame(frame: string): string {
  let data = "";
  for (const line of frame.split("\n")) {
    if (line.startsWith("data:")) {
      const val = line.slice(5).replace(/^ /, "");
      data = data ? `${data}\n${val}` : val;
    }
  }
  return data;
}
