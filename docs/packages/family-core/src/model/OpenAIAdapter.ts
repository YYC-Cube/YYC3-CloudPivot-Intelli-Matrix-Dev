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
 * @file OpenAIAdapter.ts
 * @description OpenAI API 模型适配器实现
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

const DEFAULT_OPENAI_BASE_URL = 'https://api.openai.com/v1';

export class OpenAIAdapter extends BaseModelAdapter {
  private baseUrl: string;
  private apiKey: string;
  private cacheStore: Map<string, { response: any; expiry: number }> = new Map();
  private cacheTTL: number;

  constructor(config: ModelAdapterConfig, modelInfo?: ModelInfo) {
    super(config, modelInfo ?? {
      limits: { maxInputTokens: 128000 },
      pricing: { inputPrice: 0.00003 },
    });

    this.baseUrl = config.baseUrl ?? DEFAULT_OPENAI_BASE_URL;
    this.apiKey = config.apiKey ?? '';
    this.cacheTTL = config.cacheTTL ?? 300000;

    if (!this.apiKey) {
      logger.warn('OpenAI API key not set — requests will fail', 'OpenAIAdapter');
    }
  }

  async initialize(): Promise<void> {
    if (!this.apiKey) {
      throw new Error('OpenAI API key is required');
    }
    logger.info('OpenAI adapter initialized', 'OpenAIAdapter', {
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
      endpoint = `${this.baseUrl}/chat/completions`;
      body = {
        model: config.model,
        messages: (original as ChatRequest).messages,
        max_tokens: (original as ChatRequest).maxTokens ?? 2048,
        temperature: (original as ChatRequest).temperature ?? 0.7,
      };
    } else if ('prompt' in original) {
      endpoint = `${this.baseUrl}/completions`;
      body = {
        model: config.model,
        prompt: (original as CompletionRequest).prompt,
        max_tokens: (original as CompletionRequest).maxTokens ?? 2048,
        temperature: (original as CompletionRequest).temperature ?? 0.7,
      };
    } else if ('input' in original) {
      endpoint = `${this.baseUrl}/embeddings`;
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
          'Authorization': `Bearer ${this.apiKey}`,
          ...request.headers,
        },
        body: JSON.stringify(body),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text().catch(() => 'Unknown error');
        throw new Error(`OpenAI API error ${response.status}: ${errorText}`);
      }

      const raw = await response.json();
      const normalized = this.normalizeOpenAIResponse(raw, original);

      metrics.increment('model_adapter.openai.api_call', 1, { model: config.model, status: 'success' });

      return { raw, normalized };
    } catch (error) {
      clearTimeout(timeoutId);
      metrics.increment('model_adapter.openai.api_call', 1, { model: config.model, status: 'error' });
      throw error;
    }
  }

  protected async callModelStream(request: PreprocessedRequest): Promise<AsyncIterable<unknown>> {
    const config = this.getConfig();
    const original = request.original;

    if (!('messages' in original) && !('prompt' in original)) {
      throw new Error('Streaming only supported for completion and chat requests');
    }

    const endpoint = 'messages' in original
      ? `${this.baseUrl}/chat/completions`
      : `${this.baseUrl}/completions`;

    const body: Record<string, unknown> = {
      model: config.model,
      stream: true,
      max_tokens: ('maxTokens' in original ? original.maxTokens : 2048) ?? 2048,
      temperature: ('temperature' in original ? original.temperature : 0.7) ?? 0.7,
    };

    if ('messages' in original) {
      body.messages = (original as ChatRequest).messages;
    } else {
      body.prompt = (original as CompletionRequest).prompt;
    }

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify(body),
    });

    if (!response.ok || !response.body) {
      throw new Error(`OpenAI streaming error: ${response.status}`);
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
          const trimmed = line.trim();
          if (trimmed.startsWith('data: ')) {
            const data = trimmed.slice(6);
            if (data === '[DONE]') return;
            try {
              yield JSON.parse(data);
            } catch (e) {
              logger.warn('Malformed stream chunk in OpenAI response', 'OpenAIAdapter', { error: e instanceof Error ? e.message : String(e) });
            }
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
    const c = chunk as Record<string, any>;
    const choice = c.choices?.[0];

    if (!choice) {
      return { text: '', tokens: 0, finished: false };
    }

    return {
      text: choice.delta?.content ?? choice.text ?? '',
      tokens: c.usage?.completion_tokens ?? 0,
      finished: choice.finish_reason != null,
      finishedReason: choice.finish_reason ?? undefined,
      index: choice.index ?? 0,
    };
  }

  protected async performHealthCheck(): Promise<void> {
    if (!this.apiKey) {
      throw new Error('API key not configured');
    }

    const response = await fetch(`${this.baseUrl}/models`, {
      headers: { 'Authorization': `Bearer ${this.apiKey}` },
      signal: AbortSignal.timeout(5000),
    });

    if (!response.ok) {
      throw new Error(`Health check failed: ${response.status}`);
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

    metrics.increment('model_adapter.openai.cache_hit');
    return cached.response;
  }

  protected async cacheResult(request: PreprocessedRequest, response: any): Promise<void> {
    const config = this.getConfig();
    if (!config.cache?.enabled) return;

    const key = `${config.provider}:${config.model}:${JSON.stringify(request.normalized)}`;
    this.cacheStore.set(key, { response, expiry: Date.now() + this.cacheTTL });

    // Evict expired entries
    if (this.cacheStore.size > 100) {
      const now = Date.now();
      for (const [k, v] of this.cacheStore) {
        if (now > v.expiry) this.cacheStore.delete(k);
      }
    }
  }

  async clearCache(): Promise<void> {
    this.cacheStore.clear();
    logger.info('OpenAI adapter cache cleared', 'OpenAIAdapter');
  }

  private normalizeOpenAIResponse(raw: Record<string, any>, original: CompletionRequest | ChatRequest | EmbeddingRequest): CompletionResponse | ChatResponse | EmbeddingResponse {
    const config = this.getConfig();

    if ('input' in original) {
      const data = raw.data as Array<{ embedding: number[]; index: number }>;
      return {
        success: true,
        model: raw.model ?? config.model,
        provider: config.provider,
        usage: {
          promptTokens: raw.usage?.prompt_tokens ?? 0,
          completionTokens: 0,
          totalTokens: raw.usage?.total_tokens ?? 0,
        },
        totalTokens: raw.usage?.total_tokens ?? 0,
      } as EmbeddingResponse;
    }

    const choice = raw.choices?.[0];
    const content = choice?.message?.content ?? choice?.text ?? '';
    const finishReason = choice?.finish_reason ?? 'stop';

    if ('messages' in original) {
      return {
        success: true,
        model: raw.model ?? config.model,
        provider: config.provider,
        timestamp: new Date(),
        processingTime: 0,
        content,
        finishReason,
        usage: {
          promptTokens: raw.usage?.prompt_tokens ?? 0,
          completionTokens: raw.usage?.completion_tokens ?? 0,
          totalTokens: raw.usage?.total_tokens ?? 0,
        },
      } as ChatResponse;
    }

    return {
      success: true,
      type: 'llm',
      model: raw.model ?? config.model,
      provider: config.provider,
      timestamp: new Date(),
      processingTime: 0,
      content,
      finishReason,
      usage: {
        promptTokens: raw.usage?.prompt_tokens ?? 0,
        completionTokens: raw.usage?.completion_tokens ?? 0,
        totalTokens: raw.usage?.total_tokens ?? 0,
      },
    } as CompletionResponse;
  }
}
