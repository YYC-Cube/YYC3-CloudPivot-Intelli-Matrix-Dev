/**
 * @file: llm-bridge.ts
 * @description: AIAssistantHub ↔ plugin-llm 桥接器 — 真实 LLM 调用 + Mock 回退
 *
 * 设计原则:
 * 1. 渐进增强 — 未配置 API Key 时自动回退 Mock
 * 2. 流式优先 — 支持流式输出, Token-by-Token 渲染
 * 3. 错误恢复 — LLM 失败自动回退 Mock, 不阻塞用户
 * 4. Keyring 隔离 — API Key 加密存储, 不落明文盘
 * 5. 多 Provider 路由 — cost/latency/quality/manual 策略
 * 6. 可选依赖 — plugin-llm 动态加载, 未安装时自动降级 Mock (零静态依赖)
 */

// ── 本地类型 (与 @yyc3/plugin-llm 结构兼容, 避免静态 import) ──
type RoutingStrategy = "cost" | "latency" | "quality" | "manual";

interface ChatMessage {
  role: string;
  content: string;
}

interface ChatRequest {
  messages: ChatMessage[];
  stream?: boolean;
  model?: string;
  temperature?: number;
}

interface ChatChunk {
  delta?: string;
}

interface LLMErrorShape extends Error {
  provider?: string;
}

/** 桥接器配置 */
export interface LLMBridgeConfig {
  /** 路由策略 (默认 manual) */
  strategy?: RoutingStrategy;
  /** 是否启用流式 (默认 true) */
  stream?: boolean;
  /** 是否回退 Mock (默认 true) */
  fallbackToMock?: boolean;
  /** Mock 回复函数 (与 AIAssistantHub 原生兼容) */
  mockResponse?: (msg: string) => string;
  /** 流式 mock 模拟延迟 (ms) */
  mockDelay?: number;
  /** 调试模式 — 打印路由决策 */
  debug?: boolean;
}

/** 桥接结果 */
export interface BridgeResult {
  content: string;
  provider: "openai" | "anthropic" | "qwen" | "deepseek" | "kimi" | "custom" | "mock";
  model?: string;
  routingReason?: string;
  usage?: { promptTokens: number; completionTokens: number; totalTokens: number };
  /** 是否使用了 Mock 回退 */
  fellBack: boolean;
  /** 错误信息 (如有) */
  error?: string;
}

/** 桥接器 — 应用层封装 */
export class LLMBridge {
  /** 动态加载的 plugin-llm 模块 (null = 未安装/加载失败, 自动降级 Mock) */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private llm: any = null;
  /** LLM 路由器实例 */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private router: any = null;
  private initialized = false;
  private config: Required<LLMBridgeConfig>;

  constructor(config: LLMBridgeConfig = {}) {
    this.config = {
      strategy: config.strategy ?? "manual",
      stream: config.stream ?? true,
      fallbackToMock: config.fallbackToMock ?? true,
      mockResponse: config.mockResponse ?? defaultMockResponse,
      mockDelay: config.mockDelay ?? 800,
      debug: config.debug ?? false,
    };
  }

  /** 初始化 — 异步, 必须在首次使用前调用 */
  async init(): Promise<void> {
    if (this.initialized) return;

    // 0. 动态加载 plugin-llm (可选依赖, 未安装时降级 Mock)
    if (!this.llm) {
      try {
        this.llm = await import("@yyc3/plugin-llm");
      } catch {
        this.llm = null;
      }
    }

    const km = this.llm?.keyManager;

    // 1. 尝试从 sessionStorage 恢复 Keyring
    if (km?.canRestoreFromSession()) {
      await km.restoreFromSession();
    }

    // 2. 若仍 locked, 用设备指纹初始化 (开发模式自动)
    if (km) {
      const status = km.getStatus();
      if (status === "locked" || status === "uninitialized") {
        try {
          await km.initWithDeviceFingerprint();
        } catch {
          // 初始化失败, 保持 Mock 模式
        }
      }
    }

    // 3. 构造路由器 (若有 API Key)
    this.refreshRouter();
    this.initialized = true;
  }

  /** 重新构造 Router (Keyring 变更后调用) */
  refreshRouter(): void {
    const providers = this.llm?.keyManager?.buildProviderConfigs() ?? [];
    if (providers.length > 0 && this.llm) {
      this.router = new this.llm.LLMRouter({
        strategy: this.config.strategy,
        providers,
      });
    } else {
      this.router = null;
    }
  }

  /** 是否已配置真实 LLM Key */
  isRealLLMAvailable(): boolean {
    return this.router !== null;
  }

  /** 当前已配置 Provider 列表 */
  listProviders(): { provider: string; hasApiKey: boolean }[] {
    const providers = this.llm?.keyManager?.buildProviderConfigs() ?? [];
    if (providers.length === 0) return [];
    return providers.map((p: { provider: string; apiKey?: string }) => ({
      provider: p.provider,
      hasApiKey: Boolean(p.apiKey),
    }));
  }

  /** 设置 Provider API Key (会加密存储) */
  async setProviderKey(
    provider: string,
    apiKey: string,
    opts?: { baseURL?: string; defaultModel?: string }
  ): Promise<void> {
    await this.llm?.keyManager?.setKey(provider, apiKey, opts);
    this.refreshRouter();
  }

  /** 删除 Provider Key */
  removeProviderKey(provider: string): void {
    this.llm?.keyManager?.removeKey(provider);
    this.refreshRouter();
  }

  /** 非流式聊天 — 自动选择真实 LLM 或 Mock */
  async chat(messages: ChatRequest["messages"], opts?: Partial<ChatRequest>): Promise<BridgeResult> {
    await this.init();

    if (this.router) {
      try {
        const resp = await this.router.chat({ messages, ...opts });
        return {
          content: resp.content,
          provider: resp.provider as BridgeResult["provider"],
          model: resp.model,
          routingReason: resp._routing?.reason,
          usage: resp.usage,
          fellBack: false,
        };
      } catch (err) {
        const e = err as LLMErrorShape;
        if (!this.config.fallbackToMock) {
          return { content: "", provider: "mock", fellBack: false, error: e.message };
        }
        // 回退 Mock
        const mockContent = this.config.mockResponse(messages[messages.length - 1]?.content || "");
        return {
          content: mockContent,
          provider: "mock",
          fellBack: true,
          error: `[${e.provider}] ${e.message} — 已回退 Mock`,
        };
      }
    }

    // 无 API Key — 直接 Mock
    await delay(this.config.mockDelay);
    const mockContent = this.config.mockResponse(messages[messages.length - 1]?.content || "");
    return { content: mockContent, provider: "mock", fellBack: true };
  }

  /** 流式聊天 — Token-by-Token 输出 */
  async chatStream(
    messages: ChatRequest["messages"],
    onChunk: (delta: string) => void,
    opts?: Partial<ChatRequest>
  ): Promise<BridgeResult> {
    await this.init();

    if (this.router && this.config.stream) {
      try {
        let fullContent = "";
        let routingReason = "";
        let lastMeta: { provider?: string; model?: string } = {};

        const result = await this.router.chatStream(
          { messages, stream: true, ...opts },
          (chunk: ChatChunk) => {
            if (chunk.delta) {
              fullContent += chunk.delta;
              onChunk(chunk.delta);
            }
          }
        );
        routingReason = result.routing.reason;
        lastMeta = { provider: result.routing.adapter.provider, model: result.routing.model };

        return {
          content: fullContent,
          provider: (lastMeta.provider as BridgeResult["provider"]) || "mock",
          model: lastMeta.model,
          routingReason,
          fellBack: false,
        };
      } catch (err) {
        const e = err as LLMErrorShape;
        if (!this.config.fallbackToMock) {
          return { content: "", provider: "mock", fellBack: false, error: e.message };
        }
        // 流式 Mock — 按 token 模拟流式
        const mockContent = this.config.mockResponse(messages[messages.length - 1]?.content || "");
        await streamMock(mockContent, onChunk, this.config.mockDelay);
        return {
          content: mockContent,
          provider: "mock",
          fellBack: true,
          error: `[${e.provider}] ${e.message} — 已回退 Mock`,
        };
      }
    }

    // 无 API Key — 流式 Mock
    const mockContent = this.config.mockResponse(messages[messages.length - 1]?.content || "");
    await streamMock(mockContent, onChunk, this.config.mockDelay);
    return { content: mockContent, provider: "mock", fellBack: true };
  }
}

/** 默认 Mock 回复 (与 AIAssistantHub.mockResponse 同款) */
function defaultMockResponse(msg: string): string {
  const l = msg.toLowerCase();
  if (l.includes("状态") || l.includes("节点"))
    return `## 状态报告\n\n**时间**: ${new Date().toLocaleString("zh-CN")}\n\n系统运行正常，所有节点在线。`;
  if (l.includes("帮助") || l.includes("help"))
    return `可用命令：\n- 查看状态\n- 执行分析\n- 生成报告\n- 配置参数`;
  return `收到: "${msg}"\n\n已处理完毕。需要进一步帮助吗？`;
}

/** 延迟工具 */
function delay(ms: number): Promise<void> {
  return new Promise(r => setTimeout(r, ms));
}

/** Mock 流式输出 — 按 token 切分, 模拟 LLM 流式 */
async function streamMock(content: string, onChunk: (delta: string) => void, baseDelay: number): Promise<void> {
  // 按中文按字符 / 英文按词 切分
  const tokens = content.match(/[\u4e00-\u9fa5]|[a-zA-Z0-9]+|\s+|[^\s\w]/g) || [content];
  for (const t of tokens) {
    onChunk(t);
    await delay(20 + Math.random() * 60);
  }
  void baseDelay;
}

/** 全局单例 */
let _bridge: LLMBridge | null = null;
export function getLLMBridge(config?: LLMBridgeConfig): LLMBridge {
  if (!_bridge) _bridge = new LLMBridge(config);
  return _bridge;
}
