/**
 * ============================================================
 * YYC³ AI Family — 人从众曌众从人
 * 亦师亦友亦伯乐，一言一语一协同
 * 拟人为本 · AI为核 · 纯粹为心
 * ============================================================
 * @Family   : YYC³ AI Family (永久开源)
 * @License  : Apache-2.0
 * @Homepage : https://matrix.yyc3.top
 * ============================================================
 * 此文件承载家人温度，请以玫瑰之心待之 🌹
 * ============================================================
 */

export enum ModelProvider {
  OPENAI = 'openai',
  ANTHROPIC = 'anthropic',
  GOOGLE = 'google',
  OLLAMA = 'ollama',
  LOCAL = 'local',
  CUSTOM = 'custom'
}

export interface ModelAdapterConfig {
  provider: ModelProvider;
  model: string;
  apiKey?: string;
  baseUrl?: string;
  timeout?: number;
  cacheTTL?: number;
  cache?: { enabled: boolean };
  modelPath?: string;
  host?: string;
  port?: number;
}

export interface CompletionRequest {
  provider?: ModelProvider;
  model: string;
  type: string;
  prompt: string;
  maxTokens?: number;
  temperature?: number;
}

export interface ChatRequest {
  provider?: ModelProvider;
  model: string;
  messages: Array<{ role: string; content: string }>;
  maxTokens?: number;
  temperature?: number;
}

export interface EmbeddingRequest {
  model: string;
  input: string | string[];
}

export interface CompletionResponse {
  success: boolean;
  type: string;
  model: string;
  provider: ModelProvider;
  timestamp: Date;
  processingTime: number;
  content: string;
  finishReason: string;
  usage: { promptTokens: number; completionTokens: number; totalTokens: number };
  error?: ErrorResponse;
}

export interface ChatResponse {
  success: boolean;
  model: string;
  provider: ModelProvider;
  timestamp: Date;
  processingTime: number;
  content: string;
  finishReason: string;
  usage: { promptTokens: number; completionTokens: number; totalTokens: number };
  error?: ErrorResponse;
}

export interface EmbeddingResponse {
  success: boolean;
  model: string;
  provider: ModelProvider;
  usage: { promptTokens: number; completionTokens: number; totalTokens: number };
  totalTokens: number;
}

export interface ErrorResponse {
  code: string;
  message: string;
  retryable?: boolean;
  suggestedRetryAfter?: number;
  index?: number;
}

export interface StreamChunk {
  delta: { content?: string };
  finishReason?: string;
  index: number;
  isComplete: boolean;
  usage?: { promptTokens: number; completionTokens: number; totalTokens: number };
}

export interface ModelInfo {
  limits?: { maxInputTokens: number };
  pricing?: { inputPrice: number };
}

export interface ModelMetrics {
  requestCount: number;
  successCount: number;
  errorCount: number;
  averageLatency: number;
  p95Latency: number;
  p99Latency: number;
  totalTokens: number;
  totalCost: number;
  errorRate: number;
}

export function generateTraceId(): string {
  return `trace-${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
}
