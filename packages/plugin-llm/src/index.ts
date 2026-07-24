/**
 * @file: index.ts
 * @description: @yyc3/plugin-llm — YYC³ LLM 适配层入口
 *
 * 提供能力:
 * - 5 大 Provider 适配器 (OpenAI/Anthropic/Qwen/DeepSeek/Kimi)
 * - SSE 流式输出 (Server-Sent Events)
 * - AES-256-GCM API Key 加密存储
 * - 模型路由器 (cost/latency/quality/manual 策略)
 *
 * 使用示例:
 * ```ts
 * import { keyManager, LLMRouter, PROVIDER_PRESETS } from "@yyc3/plugin-llm";
 *
 * // 1. 初始化 Keyring (开发环境用设备指纹)
 * keyManager.initWithDeviceFingerprint();
 *
 * // 2. 设置 API Key (会自动 AES-256-GCM 加密)
 * await keyManager.setKey("openai", "sk-xxx");
 *
 * // 3. 创建路由器
 * const router = new LLMRouter({
 *   strategy: "cost",
 *   providers: keyManager.buildProviderConfigs(),
 * });
 *
 * // 4. 非流式聊天
 * const resp = await router.chat({
 *   messages: [{ role: "user", content: "你好" }],
 * });
 *
 * // 5. 流式聊天
 * await router.chatStream(
 *   { messages: [{ role: "user", content: "讲个笑话" }], stream: true },
 *   (chunk) => console.log(chunk.delta)
 * );
 * ```
 */
export type {
  LLMProvider,
  RoutingStrategy,
  ChatRole,
  ChatMessage,
  ChatRequest,
  ChatResponse,
  ChatChunk,
  StreamCallback,
  UsageStats,
  ProviderConfig,
  LLMAdapter,
  LLMError,
} from "./types";

export {
  BaseAdapter,
  fetchWithTimeout,
  genRequestId,
} from "./base-adapter";

export {
  OpenAIAdapter,
  AnthropicAdapter,
  QwenAdapter,
  DeepSeekAdapter,
  KimiAdapter,
  createAdapter,
  PROVIDER_PRESETS,
} from "./providers";

export {
  SSEClient,
  readSSEStream,
} from "./sse";
export type { SSEEvent, SSEClientOptions, SSEHandlers } from "./sse";

export {
  encryptString,
  decryptString,
  getDeviceFingerprint,
  generateDemoKey,
} from "./crypto";

export {
  APIKeyManager,
  keyManager,
} from "./key-manager";
export type { KeyringEntry, KeyringStatus } from "./key-manager";

export {
  LLMRouter,
  DEFAULT_MODEL_META,
} from "./router";
export type { RouterConfig, ModelMeta, RoutingDecision } from "./router";
