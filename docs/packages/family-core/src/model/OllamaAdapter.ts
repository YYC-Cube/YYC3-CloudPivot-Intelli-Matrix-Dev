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
 * @file OllamaAdapter.ts
 * @description Ollama 本地模型适配器实现
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.0.0
 * @created 2026-06-12
 * @updated 2026-06-12
 * @status stable
 * @license MIT
 * @copyright Copyright (c) 2026 YanYuCloudCube Team
 */

import { BaseModelAdapter, PreprocessedRequest, RawModelResponse } from './BaseModelAdapter';
import { logger } from '../deps/logger';
import { metrics } from '../deps/metrics';
import {
  ModelAdapterConfig,
  CompletionRequest,
  CompletionResponse,
  ChatRequest,
  ChatResponse,
  EmbeddingRequest,
  EmbeddingResponse,
  ModelInfo,
} from '../deps/model-types';

const DEFAULT_OLLAMA_BASE_URL = 'http://localhost:11434';

export class OllamaAdapter extends BaseModelAdapter {
  private baseUrl: string;
  private cacheStore: Map<string, { response: unknown; expiry: number }> = new Map();
  private cacheTTL: number;

  constructor(config: ModelAdapterConfig, modelInfo?: ModelInfo) {
    super(config, modelInfo ?? {
      limits: { maxInputTokens: 32768 },
      pricing: { inputPrice: 0 },
    });

    this.baseUrl = config.baseUrl ?? DEFAULT_OLLAMA_BASE_URL;
    this.cacheTTL = config.cacheTTL ?? 300000;
  }

  async initialize(): Promise<void> {
    logger.info('Ollama adapter initialized', 'OllamaAdapter', {
      baseUrl: this.baseUrl,
      model: this.getConfig().model,
    });
  }

  protected async callModelAPI(request: PreprocessedRequest): Promise<RawModelResponse> {
    const config = this.getConfig();
    const original = request.original;

    let endpoint: string;
    let body: Record<string, unknown>;

    if ('messages' in original) {
      endpoint = `${this.baseUrl}/api/chat`;
      body = {
        model: config.model,
        messages: (original as ChatRequest).messages,
        stream: false,
        options: {
          num_predict: (original as ChatRequest).maxTokens ?? 2048,
          temperature: (original as ChatRequest).temperature ?? 0.7,
        },
      };
    } else if ('prompt' in original) {
      endpoint = `${this.baseUrl}/api/generate`;
      body = {
        model: config.model,
        prompt: (original as CompletionRequest).prompt,
        stream: false,
        options: {
          num_predict: (original as CompletionRequest).maxTokens ?? 2048,
          temperature: (original as CompletionRequest).temperature ?? 0.7,
        },
      };
    } else if ('input' in original) {
      endpoint = `${this.baseUrl}/api/embed`;
      body = {
        model: config.model,
        input: (original as EmbeddingRequest).input,
      };
    } else {
      throw new Error('Unknown request type');
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), request.timeout);

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...request.headers,
        },
        body: JSON.stringify(body),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text().catch(() => 'Unknown error');
        throw new Error(`Ollama API error ${response.status}: ${errorText}`);
      }

      const raw = await response.json();
      const normalized = this.normalizeOllamaResponse(raw, original);

      metrics.increment('model_adapter.ollama.api_call', 1, { model: config.model, status: 'success' });

      return { raw, normalized };
    } catch (error) {
      clearTimeout(timeoutId);
      metrics.increment('model_adapter.ollama.api_call', 1, { model: config.model, status: 'error' });
      throw error;
    }
  }

  protected async callModelStream(request: PreprocessedRequest): Promise<AsyncIterable<unknown>> {
    const config = this.getConfig();
    const original = request.original;

    if (!('messages' in original) && !('prompt' in original)) {
      throw new Error('Streaming only supported for completion and chat requests');
    }

    const isChat = 'messages' in original;
    const endpoint = isChat ? `${this.baseUrl}/api/chat` : `${this.baseUrl}/api/generate`;

    const body: Record<string, unknown> = {
      model: config.model,
      stream: true,
      options: {
        num_predict: ('maxTokens' in original ? original.maxTokens : 2048) ?? 2048,
        temperature: ('temperature' in original ? original.temperature : 0.7) ?? 0.7,
      },
    };

    if (isChat) {
      body.messages = (original as ChatRequest).messages;
    } else {
      body.prompt = (original as CompletionRequest).prompt;
    }

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (!response.ok || !response.body) {
      throw new Error(`Ollama streaming error: ${response.status}`);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();

    return (async function* () {
      let buffer = '';
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() ?? '';

        for (const line of lines) {
          if (!line.trim()) continue;
          try {
            yield JSON.parse(line);
          } catch (e) {
            logger.warn('Malformed stream chunk in Ollama response', 'OllamaAdapter', { error: e instanceof Error ? e.message : String(e) });
          }
        }
      }
    })();
  }

  protected parseStreamChunk(chunk: unknown): {
    text?: string;
    tokens?: number;
    finished?: boolean;
    finishedReason?: string;
    index?: number;
  } {
    const c = chunk as Record<string, unknown>;

    if (c.done) {
      return {
        text: '',
        tokens: 0,
        finished: true,
        finishedReason: 'stop',
      };
    }

    return {
      text: (c.message as Record<string, string>)?.content ?? (c.response as string) ?? '',
      tokens: (c.eval_count as number) ?? 0,
      finished: false,
    };
  }

  protected async performHealthCheck(): Promise<void> {
    const response = await fetch(`${this.baseUrl}/api/tags`, {
      signal: AbortSignal.timeout(5000),
    });

    if (!response.ok) {
      throw new Error(`Health check failed: ${response.status}`);
    }

    const data = await response.json() as { models?: Array<{ name: string }> };
    const modelNames = data.models?.map(m => m.name) ?? [];
    const config = this.getConfig();

    if (!modelNames.includes(config.model) && !modelNames.some(n => n.startsWith(config.model))) {
      logger.warn('Ollama model not found locally', 'OllamaAdapter', { model: config.model, available: modelNames });
    }
  }

  protected async checkCache(request: PreprocessedRequest): Promise<any | null> {
    const config = this.getConfig();
    if (!config.cache?.enabled) return null;

    const key = `${config.provider}:${config.model}:${JSON.stringify(request.normalized)}`;
    const cached = this.cacheStore.get(key);
    if (!cached) return null;
    if (Date.now() > cached.expiry) {
      this.cacheStore.delete(key);
      return null;
    }

    metrics.increment('model_adapter.ollama.cache_hit');
    return cached.response;
  }

  protected async cacheResult(request: PreprocessedRequest, response: any): Promise<void> {
    const config = this.getConfig();
    if (!config.cache?.enabled) return;

    const key = `${config.provider}:${config.model}:${JSON.stringify(request.normalized)}`;
    this.cacheStore.set(key, { response, expiry: Date.now() + this.cacheTTL });

    if (this.cacheStore.size > 100) {
      const now = Date.now();
      for (const [k, v] of this.cacheStore) {
        if (now > v.expiry) this.cacheStore.delete(k);
      }
    }
  }

  async clearCache(): Promise<void> {
    this.cacheStore.clear();
    logger.info('Ollama adapter cache cleared', 'OllamaAdapter');
  }

  private normalizeOllamaResponse(
    raw: Record<string, unknown>,
    original: CompletionRequest | ChatRequest | EmbeddingRequest,
  ): CompletionResponse | ChatResponse | EmbeddingResponse {
    const config = this.getConfig();

    if ('input' in original) {
      const embeddings = (raw.embeddings as number[][]) ?? [];
      return {
        success: true,
        model: config.model,
        provider: config.provider,
        usage: {
          promptTokens: 0,
          completionTokens: 0,
          totalTokens: 0,
        },
        totalTokens: 0,
      } as EmbeddingResponse;
    }

    const content = (raw.message as Record<string, string>)?.content ?? (raw.response as string) ?? '';
    const doneReason = (raw.done_reason as string) ?? 'stop';
    const evalCount = (raw.eval_count as number) ?? 0;
    const promptEvalCount = (raw.prompt_eval_count as number) ?? 0;

    if ('messages' in original) {
      return {
        success: true,
        model: config.model,
        provider: config.provider,
        timestamp: new Date(),
        processingTime: 0,
        content,
        finishReason: doneReason,
        usage: {
          promptTokens: promptEvalCount,
          completionTokens: evalCount,
          totalTokens: promptEvalCount + evalCount,
        },
      } as ChatResponse;
    }

    return {
      success: true,
      type: 'llm',
      model: config.model,
      provider: config.provider,
      timestamp: new Date(),
      processingTime: 0,
      content,
      finishReason: doneReason,
      usage: {
        promptTokens: promptEvalCount,
        completionTokens: evalCount,
        totalTokens: promptEvalCount + evalCount,
      },
    } as CompletionResponse;
  }
}
