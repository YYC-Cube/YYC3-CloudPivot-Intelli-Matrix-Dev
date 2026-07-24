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

/**
 * @file 模型路由器
 * @description 智能模型选择和路由管理
 * @module model/ModelRouter
 * @author YYC³ Team
 * @version 1.0.0
 * @created 2025-12-30
 */

import { logger } from '../deps/logger';
import { metrics } from '../deps/metrics';
import { ModelProvider, ChatRequest, ChatResponse } from '../deps/model-types';
import { BaseModelAdapter } from './BaseModelAdapter';
import { OpenAIAdapter } from './OpenAIAdapter';
import { AnthropicAdapter } from './AnthropicAdapter';
import { GeminiAdapter } from './GeminiAdapter';
import { OllamaAdapter } from './OllamaAdapter';

/**
 * 路由策略枚举
 */
export enum RoutingStrategy {
  ROUND_ROBIN = 'round_robin',
  LEAST_LATENCY = 'least_latency',
  COST_OPTIMIZED = 'cost_optimized',
  QUALITY_FIRST = 'quality_first',
  CAPABILITY_BASED = 'capability_based',
  MANUAL = 'manual'
}

/**
 * 模型配置接口
 */
export interface ModelRouteConfig {
  provider: ModelProvider;
  model: string;
  priority: number;
  enabled: boolean;
  config?: {
    apiKey?: string;
    baseUrl?: string;
    modelPath?: string;
    host?: string;
    port?: number;
  };
}

/**
 * 路由器配置接口
 */
export interface RouterConfig {
  strategy: RoutingStrategy;
  defaultProvider: ModelProvider;
  routes: ModelRouteConfig[];
  fallbackEnabled: boolean;
}

/**
 * 模型性能统计
 */
interface ModelStats {
  totalRequests: number;
  successRequests: number;
  failedRequests: number;
  averageLatency: number;
  lastUsed: Date;
}

/**
 * 熔断器状态
 */
enum CircuitState {
  CLOSED = 'closed',
  OPEN = 'open',
  HALF_OPEN = 'half_open',
}

/**
 * 熔断器配置
 */
export interface CircuitBreakerConfig {
  failureThreshold: number;
  resetTimeoutMs: number;
  halfOpenMaxAttempts: number;
}

const DEFAULT_CIRCUIT_CONFIG: CircuitBreakerConfig = {
  failureThreshold: 5,
  resetTimeoutMs: 30000,
  halfOpenMaxAttempts: 1,
};

/**
 * 熔断器 — 在连续失败后暂时阻断请求
 */
class CircuitBreaker {
  private state: CircuitState = CircuitState.CLOSED;
  private failureCount = 0;
  private lastFailureTime = 0;
  private halfOpenAttempts = 0;
  private readonly config: CircuitBreakerConfig;

  constructor(config: Partial<CircuitBreakerConfig> = {}) {
    this.config = { ...DEFAULT_CIRCUIT_CONFIG, ...config };
  }

  isAvailable(): boolean {
    if (this.state === CircuitState.CLOSED) return true;
    if (this.state === CircuitState.HALF_OPEN) {
      return this.halfOpenAttempts < this.config.halfOpenMaxAttempts;
    }
    if (Date.now() - this.lastFailureTime >= this.config.resetTimeoutMs) {
      this.state = CircuitState.HALF_OPEN;
      this.halfOpenAttempts = 0;
      return true;
    }
    return false;
  }

  recordSuccess(): void {
    this.failureCount = 0;
    this.state = CircuitState.CLOSED;
    this.halfOpenAttempts = 0;
  }

  recordFailure(): void {
    this.failureCount++;
    this.lastFailureTime = Date.now();
    if (this.failureCount >= this.config.failureThreshold) {
      this.state = CircuitState.OPEN;
    }
  }

  getState(): CircuitState {
    return this.state;
  }
}

/**
 * 模型路由器
 */
export class ModelRouter {
  private config: RouterConfig;
  private adapters: Map<string, BaseModelAdapter> = new Map();
  private stats: Map<string, ModelStats> = new Map();
  private circuitBreakers: Map<string, CircuitBreaker> = new Map();
  private roundRobinIndex: number = 0;

  constructor(config: RouterConfig) {
    this.config = config;

    logger.info('模型路由器初始化', 'ModelRouter', {
      strategy: config.strategy,
      defaultProvider: config.defaultProvider,
      routesCount: config.routes.length
    });
  }

  async initialize(): Promise<void> {
    logger.info('初始化模型路由器', 'ModelRouter');

    for (const route of this.config.routes) {
      if (!route.enabled) {
        continue;
      }

      try {
        const adapter = this.createAdapter(route);
        await adapter.initialize();

        const adapterKey = this.getAdapterKey(route.provider, route.model);
        this.adapters.set(adapterKey, adapter);
        this.circuitBreakers.set(adapterKey, new CircuitBreaker());
        this.stats.set(adapterKey, {
          totalRequests: 0,
          successRequests: 0,
          failedRequests: 0,
          averageLatency: 0,
          lastUsed: new Date()
        });

        logger.info('模型适配器已初始化', 'ModelRouter', {
          provider: route.provider,
          model: route.model
        });
      } catch (error) {
        logger.error('模型适配器初始化失败', 'ModelRouter', {
          provider: route.provider,
          model: route.model,
          error
        });

        if (!this.config.fallbackEnabled) {
          throw error;
        }
      }
    }

    logger.info('模型路由器初始化完成', 'ModelRouter', {
      adaptersCount: this.adapters.size
    });
  }

  async chat(request: ChatRequest): Promise<ChatResponse> {
    const startTime = Date.now();

    const selectedRoute = this.selectAvailableModel(request);
    const adapterKey = this.getAdapterKey(selectedRoute.provider, selectedRoute.model);
    const adapter = this.adapters.get(adapterKey);

    if (!adapter) {
      throw new Error(`未找到模型适配器: ${selectedRoute.provider}/${selectedRoute.model}`);
    }

    try {
      const response = await adapter.generateChatCompletion(request);
      const processingTime = Date.now() - startTime;

      this.updateStats(adapterKey, true, processingTime);
      this.circuitBreakers.get(adapterKey)?.recordSuccess();

      metrics.increment('model_router.success', 1, {
        provider: selectedRoute.provider,
        model: selectedRoute.model
      });

      return response;
    } catch (error) {
      const processingTime = Date.now() - startTime;

      this.updateStats(adapterKey, false, processingTime);
      this.circuitBreakers.get(adapterKey)?.recordFailure();

      metrics.increment('model_router.error', 1, {
        provider: selectedRoute.provider,
        model: selectedRoute.model
      });

      if (this.config.fallbackEnabled) {
        logger.info('尝试故障转移', 'ModelRouter');
        return this.chatWithFallback(request, adapterKey);
      }

      throw error;
    }
  }

  private selectAvailableModel(request: ChatRequest): ModelRouteConfig {
    const route = this.selectModel(request);
    const cb = this.circuitBreakers.get(this.getAdapterKey(route.provider, route.model));
    if (cb && !cb.isAvailable()) {
      if (this.config.fallbackEnabled) {
        const fallback = this.findAvailableRoute(route);
        if (fallback) return fallback;
      }
    }
    return route;
  }

  private findAvailableRoute(exclude?: ModelRouteConfig): ModelRouteConfig | undefined {
    for (const route of this.config.routes) {
      if (!route.enabled) continue;
      if (exclude && route.provider === exclude.provider && route.model === exclude.model) continue;
      const key = this.getAdapterKey(route.provider, route.model);
      const cb = this.circuitBreakers.get(key);
      if (cb && cb.isAvailable() && this.adapters.has(key)) return route;
    }
    return undefined;
  }

  private async chatWithFallback(request: ChatRequest, failedAdapterKey: string): Promise<ChatResponse> {
    const availableRoutes = this.config.routes.filter(route => {
      const key = this.getAdapterKey(route.provider, route.model);
      const cb = this.circuitBreakers.get(key);
      return route.enabled && this.adapters.has(key) && key !== failedAdapterKey && (!cb || cb.isAvailable());
    });

    if (availableRoutes.length === 0) {
      throw new Error('没有可用的备用模型');
    }

    const fallbackRoute = availableRoutes[0]!;
    const adapterKey = this.getAdapterKey(fallbackRoute.provider, fallbackRoute.model);
    const adapter = this.adapters.get(adapterKey)!;

    const response = await adapter.generateChatCompletion(request);

    metrics.increment('model_router.fallback', 1, {
      fromProvider: this.getProviderFromKey(failedAdapterKey),
      toProvider: fallbackRoute.provider
    });

    return response;
  }

  private selectModel(request: ChatRequest): ModelRouteConfig {
    if (request.provider && request.model) {
      const route = this.config.routes.find(
        r => r.provider === request.provider && r.model === request.model && r.enabled
      );

      if (route) {
        return route;
      }
    }

    switch (this.config.strategy) {
      case RoutingStrategy.ROUND_ROBIN:
        return this.selectRoundRobin();
      case RoutingStrategy.LEAST_LATENCY:
        return this.selectLeastLatency();
      case RoutingStrategy.COST_OPTIMIZED:
        return this.selectCostOptimized();
      case RoutingStrategy.QUALITY_FIRST:
        return this.selectQualityFirst();
      case RoutingStrategy.CAPABILITY_BASED:
        return this.selectCapabilityBased(request);
      case RoutingStrategy.MANUAL:
        return this.selectManual();
      default:
        return this.selectDefault();
    }
  }

  private selectRoundRobin(): ModelRouteConfig {
    const enabledRoutes = this.config.routes.filter(r => r.enabled);
    this.roundRobinIndex = (this.roundRobinIndex + 1) % enabledRoutes.length;
    return enabledRoutes[this.roundRobinIndex]!;
  }

  private selectLeastLatency(): ModelRouteConfig {
    const enabledRoutes = this.config.routes.filter(r => r.enabled);

    let bestRoute: ModelRouteConfig | undefined;
    let bestLatency = Infinity;

    for (const route of enabledRoutes) {
      const key = this.getAdapterKey(route.provider, route.model);
      const stats = this.stats.get(key);

      if (stats && stats.totalRequests > 0) {
        if (stats.averageLatency < bestLatency) {
          bestLatency = stats.averageLatency;
          bestRoute = route;
        }
      }
    }

    return bestRoute ?? enabledRoutes[0]!;
  }

  private selectCostOptimized(): ModelRouteConfig {
    const enabledRoutes = this.config.routes.filter(r => r.enabled);
    return enabledRoutes.sort((a, b) => a.priority - b.priority)[0]!;
  }

  private selectQualityFirst(): ModelRouteConfig {
    const enabledRoutes = this.config.routes.filter(r => r.enabled);
    return enabledRoutes.sort((a, b) => b.priority - a.priority)[0]!;
  }

  private selectManual(): ModelRouteConfig {
    const route = this.config.routes.find(
      r => r.provider === this.config.defaultProvider && r.enabled
    );

    if (!route) {
      throw new Error(`默认模型未启用: ${this.config.defaultProvider}`);
    }

    return route;
  }

  private selectCapabilityBased(request: ChatRequest): ModelRouteConfig {
    const enabledRoutes = this.config.routes.filter(r => r.enabled);

    // 根据请求特征选择最适合的模型
    const hasSystemPrompt = request.messages?.some(m => m.role === 'system') ?? false;
    const isLongContext = JSON.stringify(request.messages).length > 8000;
    const isCreative = (request.temperature ?? 0.7) > 0.8;

    // 匹配规则：长上下文 -> Anthropic/Claude；本地/成本敏感 -> Ollama；多模态/通用 -> Gemini；默认 -> OpenAI
    for (const route of enabledRoutes) {
      if (isLongContext && route.provider === ModelProvider.ANTHROPIC) return route;
      if (isCreative && route.provider === ModelProvider.ANTHROPIC) return route;
    }

    for (const route of enabledRoutes) {
      if (hasSystemPrompt && route.provider === ModelProvider.OPENAI) return route;
    }

    for (const route of enabledRoutes) {
      if (route.provider === ModelProvider.GOOGLE) return route;
    }

    for (const route of enabledRoutes) {
      if (route.provider === ModelProvider.OLLAMA) return route;
    }

    return enabledRoutes[0]!;
  }

  private selectDefault(): ModelRouteConfig {
    return this.selectManual();
  }

  private createAdapter(route: ModelRouteConfig): BaseModelAdapter {
    switch (route.provider) {
      case ModelProvider.OPENAI:
        return new OpenAIAdapter({
          provider: route.provider,
          model: route.model,
          apiKey: route.config?.apiKey,
          baseUrl: route.config?.baseUrl,
        });
      case ModelProvider.ANTHROPIC:
        return new AnthropicAdapter({
          provider: route.provider,
          model: route.model,
          apiKey: route.config?.apiKey,
          baseUrl: route.config?.baseUrl,
        });
      case ModelProvider.GOOGLE:
        return new GeminiAdapter({
          provider: route.provider,
          model: route.model,
          apiKey: route.config?.apiKey,
          baseUrl: route.config?.baseUrl,
        });
      case ModelProvider.OLLAMA:
        return new OllamaAdapter({
          provider: route.provider,
          model: route.model,
          baseUrl: route.config?.baseUrl,
          host: route.config?.host,
          port: route.config?.port,
        });
      default:
        throw new Error(`Unsupported model provider: ${route.provider}. Please register a custom adapter.`);
    }
  }

  private updateStats(adapterKey: string, success: boolean, latency: number): void {
    const stats = this.stats.get(adapterKey);

    if (!stats) {
      return;
    }

    stats.totalRequests++;
    stats.lastUsed = new Date();

    if (success) {
      stats.successRequests++;
      stats.averageLatency =
        (stats.averageLatency * (stats.successRequests - 1) + latency) /
        stats.successRequests;
    } else {
      stats.failedRequests++;
    }

    this.stats.set(adapterKey, stats);
  }

  private getAdapterKey(provider: ModelProvider, model: string): string {
    return `${provider}:${model}`;
  }

  private getProviderFromKey(key: string): ModelProvider {
    return key.split(':')[0] as ModelProvider;
  }

  getStats(): Record<string, ModelStats> {
    return Object.fromEntries(this.stats);
  }

  async getHealthStatus(): Promise<Record<string, { status: string; latency?: number; message?: string }>> {
    const healthStatus: Record<string, { status: string; latency?: number; message?: string }> = {};

    for (const [key, adapter] of this.adapters) {
      try {
        healthStatus[key] = await adapter.healthCheck();
      } catch (error) {
        healthStatus[key] = {
          status: 'unhealthy',
          message: error instanceof Error ? error.message : 'Unknown error'
        };
      }
    }

    return healthStatus;
  }
}
