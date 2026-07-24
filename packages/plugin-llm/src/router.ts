/**
 * @file: router.ts
 * @description: 模型路由器 — 多 Provider 选择 + 故障转移 + 成本核算
 *
 * 路由策略:
 * - cost:     按 $/1K tokens 排序, 选最便宜的
 * - latency:  按 P99 延迟排序, 选最快的
 * - quality:  按质量评分排序, 选最强的
 * - manual:   使用指定 provider
 */
import type { ChatRequest, ChatResponse, LLMProvider, ProviderConfig, RoutingStrategy, StreamCallback } from "./types";
import type { BaseAdapter } from "./base-adapter";
import { createAdapter } from "./providers";
import { LLMError } from "./types";

/** 模型元数据 — 用于路由决策 */
export interface ModelMeta {
  provider: LLMProvider;
  model: string;
  /** 输入价格 $/1M tokens */
  inputPricePer1M: number;
  /** 输出价格 $/1M tokens */
  outputPricePer1M: number;
  /** 上下文窗口 (tokens) */
  contextWindow: number;
  /** 质量评分 0-100 */
  qualityScore: number;
  /** P99 延迟 (ms) — 用于 latency 路由 */
  p99Latency: number;
}

/** 路由器配置 */
export interface RouterConfig {
  strategy: RoutingStrategy;
  /** 启用的 Provider 列表 (按优先级) */
  providers: ProviderConfig[];
  /** 故障转移最大尝试次数 */
  maxFallbacks?: number;
  /** 模型元数据 (可选, 用于智能路由) */
  modelMeta?: Partial<Record<LLMProvider, ModelMeta[]>>;
}

/** 模型元数据预设 (公开价格表, 2025 数据) */
export const DEFAULT_MODEL_META: Record<LLMProvider, ModelMeta[]> = {
  openai: [
    { provider: "openai", model: "gpt-4o", inputPricePer1M: 2.5, outputPricePer1M: 10, contextWindow: 128_000, qualityScore: 90, p99Latency: 3500 },
    { provider: "openai", model: "gpt-4o-mini", inputPricePer1M: 0.15, outputPricePer1M: 0.6, contextWindow: 128_000, qualityScore: 78, p99Latency: 1200 },
    { provider: "openai", model: "o1-preview", inputPricePer1M: 15, outputPricePer1M: 60, contextWindow: 128_000, qualityScore: 95, p99Latency: 30_000 },
  ],
  anthropic: [
    { provider: "anthropic", model: "claude-3-5-sonnet-20241022", inputPricePer1M: 3, outputPricePer1M: 15, contextWindow: 200_000, qualityScore: 92, p99Latency: 3000 },
    { provider: "anthropic", model: "claude-3-5-haiku-20241022", inputPricePer1M: 0.8, outputPricePer1M: 4, contextWindow: 200_000, qualityScore: 82, p99Latency: 1500 },
  ],
  qwen: [
    { provider: "qwen", model: "qwen-max", inputPricePer1M: 2.8, outputPricePer1M: 8.4, contextWindow: 32_768, qualityScore: 85, p99Latency: 2200 },
    { provider: "qwen", model: "qwen-plus", inputPricePer1M: 0.4, outputPricePer1M: 1.2, contextWindow: 131_072, qualityScore: 75, p99Latency: 1400 },
    { provider: "qwen", model: "qwen-turbo", inputPricePer1M: 0.05, outputPricePer1M: 0.2, contextWindow: 1_000_000, qualityScore: 65, p99Latency: 900 },
  ],
  deepseek: [
    { provider: "deepseek", model: "deepseek-chat", inputPricePer1M: 0.14, outputPricePer1M: 0.28, contextWindow: 64_000, qualityScore: 80, p99Latency: 1800 },
    { provider: "deepseek", model: "deepseek-reasoner", inputPricePer1M: 0.55, outputPricePer1M: 2.19, contextWindow: 64_000, qualityScore: 88, p99Latency: 5000 },
  ],
  kimi: [
    { provider: "kimi", model: "moonshot-v1-8k", inputPricePer1M: 1.7, outputPricePer1M: 1.7, contextWindow: 8_192, qualityScore: 78, p99Latency: 1600 },
    { provider: "kimi", model: "moonshot-v1-128k", inputPricePer1M: 8.5, outputPricePer1M: 8.5, contextWindow: 131_072, qualityScore: 80, p99Latency: 2500 },
  ],
  custom: [],
};

/** 路由决策结果 */
export interface RoutingDecision {
  adapter: BaseAdapter;
  model: string;
  meta: ModelMeta | null;
  reason: string;
}

/**
 * LLM 路由器 — 多 Provider 故障转移
 */
export class LLMRouter {
  private adapters: Map<LLMProvider, BaseAdapter> = new Map();
  private readonly config: RouterConfig;
  private readonly meta: Record<LLMProvider, ModelMeta[]>;

  constructor(config: RouterConfig) {
    this.config = config;
    // 合并元数据
    this.meta = { ...DEFAULT_MODEL_META, ...config.modelMeta } as Record<LLMProvider, ModelMeta[]>;
    // 初始化适配器
    for (const pc of config.providers) {
      this.adapters.set(pc.provider, createAdapter(pc));
    }
  }

  /** 路由决策 */
  route(req: ChatRequest): RoutingDecision {
    const { strategy, providers } = this.config;
    if (providers.length === 0) throw new LLMError("未配置任何 Provider", "custom");

    // manual: 找第一个有 apiKey 的 provider
    if (strategy === "manual" || strategy === undefined) {
      const pc = providers.find(p => p.apiKey) || providers[0];
      const adapter = this.adapters.get(pc.provider)!;
      const model = req.model || pc.defaultModel;
      const meta = this.meta[pc.provider]?.find(m => m.model === model) || null;
      return { adapter, model, meta, reason: `manual → ${pc.provider}/${model}` };
    }

    // 收集所有可用 (有 apiKey) 的 adapter
    const available = providers.filter(p => p.apiKey);
    if (available.length === 0) {
      // 没配置 key, 退化为第一个
      const pc = providers[0];
      const adapter = this.adapters.get(pc.provider)!;
      return { adapter, model: pc.defaultModel, meta: null, reason: `no-key fallback → ${pc.provider}` };
    }

    // 按 strategy 排序所有模型
    const candidates: { provider: LLMProvider; meta: ModelMeta }[] = [];
    for (const pc of available) {
      for (const m of this.meta[pc.provider] || []) {
        candidates.push({ provider: pc.provider, meta: m });
      }
    }

    candidates.sort((a, b) => {
      switch (strategy) {
        case "cost":
          return (a.meta.inputPricePer1M + a.meta.outputPricePer1M) - (b.meta.inputPricePer1M + b.meta.outputPricePer1M);
        case "latency":
          return a.meta.p99Latency - b.meta.p99Latency;
        case "quality":
          return b.meta.qualityScore - a.meta.qualityScore;
        default:
          return 0;
      }
    });

    const top = candidates[0];
    if (!top) {
      const pc = available[0];
      return { adapter: this.adapters.get(pc.provider)!, model: pc.defaultModel, meta: null, reason: `default → ${pc.provider}/${pc.defaultModel}` };
    }
    return {
      adapter: this.adapters.get(top.provider)!,
      model: top.meta.model,
      meta: top.meta,
      reason: `${strategy} → ${top.provider}/${top.meta.model} (cost=$${top.meta.inputPricePer1M + top.meta.outputPricePer1M}/1M, latency=${top.meta.p99Latency}ms, q=${top.meta.qualityScore})`,
    };
  }

  /** 非流式聊天 + 故障转移 */
  async chat(req: ChatRequest): Promise<ChatResponse & { _routing: RoutingDecision }> {
    const decision = this.route(req);
    const maxFallbacks = this.config.maxFallbacks ?? this.config.providers.length - 1;
    let lastErr: LLMError | null = null;

    // 尝试首选 + 故障转移
    const tried = new Set<LLMProvider>();
    for (let i = 0; i <= maxFallbacks; i++) {
      const adapter = i === 0 ? decision.adapter : this.pickFallback(tried);
      if (!adapter || tried.has(adapter.provider)) continue;
      tried.add(adapter.provider);

      try {
        const resp = await adapter.chat({ ...req, model: decision.model });
        return { ...resp, _routing: decision };
      } catch (err) {
        lastErr = err as LLMError;
        if (!lastErr.retryable) throw lastErr;
        // 否则尝试下一个
      }
    }

    throw lastErr || new LLMError("所有 Provider 均失败", "custom");
  }

  /** 流式聊天 + 故障转移 (仅首次, 流式启动后不再切换) */
  async chatStream(req: ChatRequest, onChunk: StreamCallback): Promise<{ routing: RoutingDecision }> {
    const decision = this.route(req);
    await decision.adapter.chatStream({ ...req, model: decision.model }, onChunk);
    return { routing: decision };
  }

  /** 选下一个未尝试的 provider */
  private pickFallback(tried: Set<LLMProvider>): BaseAdapter | null {
    for (const [provider, adapter] of this.adapters) {
      if (!tried.has(provider)) return adapter;
    }
    return null;
  }

  /** 列出所有可用 Provider + 模型 */
  listAvailable(): { provider: LLMProvider; models: ModelMeta[]; hasApiKey: boolean }[] {
    return this.config.providers.map(pc => ({
      provider: pc.provider,
      models: this.meta[pc.provider] || [],
      hasApiKey: Boolean(pc.apiKey),
    }));
  }

  /** 估算单次请求成本 (USD) */
  estimateCost(provider: LLMProvider, model: string, inputTokens: number, outputTokens: number): number {
    const m = this.meta[provider]?.find(x => x.model === model);
    if (!m) return 0;
    return (inputTokens / 1_000_000) * m.inputPricePer1M + (outputTokens / 1_000_000) * m.outputPricePer1M;
  }
}
