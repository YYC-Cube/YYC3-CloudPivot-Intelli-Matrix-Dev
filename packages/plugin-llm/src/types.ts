/**
 * @file: types.ts
 * @description: LLM 适配层 — 统一类型定义
 */

/** 支持的 LLM 提供商 */
export type LLMProvider =
  | "openai"
  | "anthropic"
  | "qwen"      // 通义千问
  | "deepseek"
  | "kimi"      // Moonshot
  | "custom";

/** 模型路由策略 */
export type RoutingStrategy =
  | "cost"        // 成本优先
  | "latency"     // 延迟优先
  | "quality"     // 质量优先
  | "manual";     // 手动指定

/** 聊天消息角色 */
export type ChatRole = "system" | "user" | "assistant";

/** 统一聊天消息 */
export interface ChatMessage {
  role: ChatRole;
  content: string;
  name?: string;
}

/** 请求参数 */
export interface ChatRequest {
  messages: ChatMessage[];
  model?: string;
  temperature?: number;   // 0-2, 默认 0.7
  topP?: number;          // 0-1, 默认 1
  maxTokens?: number;     // -1 表示不限制
  stream?: boolean;       // 是否流式输出
  stop?: string[];
  /** 用户标识 (OpenAI 风格) */
  user?: string;
  /** 透传到适配器的额外参数 */
  extra?: Record<string, unknown>;
}

/** 使用统计 (用于成本核算) */
export interface UsageStats {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
}

/** 非流式响应 */
export interface ChatResponse {
  id: string;
  content: string;
  model: string;
  provider: LLMProvider;
  usage?: UsageStats;
  finishReason: "stop" | "length" | "content_filter" | "tool_calls" | null;
  created: number;
}

/** 流式输出 chunk */
export interface ChatChunk {
  delta: string;
  finished: boolean;
  finishReason?: ChatResponse["finishReason"];
  usage?: UsageStats;
}

/** 流式回调 */
export type StreamCallback = (chunk: ChatChunk) => void;

/** Provider 配置 */
export interface ProviderConfig {
  provider: LLMProvider;
  apiKey: string;
  baseURL?: string;
  /** 默认模型 */
  defaultModel: string;
  /** 可用模型列表 */
  models: string[];
  /** 路由策略 */
  strategy?: RoutingStrategy;
  /** 请求超时 (ms) */
  timeout?: number;
  /** 自定义请求头 */
  headers?: Record<string, string>;
}

/** 适配器接口 — 所有 Provider 实现此接口 */
export interface LLMAdapter {
  readonly provider: LLMProvider;
  readonly config: ProviderConfig;

  /** 非流式聊天 */
  chat(req: ChatRequest): Promise<ChatResponse>;
  /** 流式聊天 */
  chatStream(req: ChatRequest, onChunk: StreamCallback): Promise<void>;
  /** 测试连通性 */
  healthCheck(): Promise<boolean>;
}

/** LLM 错误 */
export class LLMError extends Error {
  constructor(
    message: string,
    public readonly provider: LLMProvider,
    public readonly statusCode?: number,
    public readonly retryable = false
  ) {
    super(message);
    this.name = "LLMError";
  }
}
