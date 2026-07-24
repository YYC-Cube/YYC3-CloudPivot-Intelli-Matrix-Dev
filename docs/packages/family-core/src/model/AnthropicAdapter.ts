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
 * @file AnthropicAdapter.ts
 * @description Anthropic Claude API 模型适配器实现
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

interface ThinkingConfig {
  type: 'enabled';
  budget_tokens: number;
}

/** Anthropic 流式事件类型 */
type AnthropicStreamEvent =
  | 'message_start'
  | 'content_block_start'
  | 'content_block_delta'
  | 'content_block_stop'
  | 'message_delta'
  | 'message_stop'
  | 'ping'
  | 'thinking_delta'
  | 'signature';

const DEFAULT_ANTHROPIC_BASE_URL = 'https://api.anthropic.com/v1';
const ANTHROPIC_VERSION = '2023-06-01';

export class AnthropicAdapter extends BaseModelAdapter {
  private baseUrl: string;
  private apiKey: string;
  private cacheStore: Map<string, { response: unknown; expiry: number }> = new Map();
  private cacheTTL: number;

  constructor(config: ModelAdapterConfig, modelInfo?: ModelInfo) {
    super(config, modelInfo ?? {
      limits: { maxInputTokens: 200000 },
      pricing: { inputPrice: 0.000008 },
    });

    this.baseUrl = config.baseUrl ?? DEFAULT_ANTHROPIC_BASE_URL;
    this.apiKey = config.apiKey ?? '';
    this.cacheTTL = config.cacheTTL ?? 300000;

    if (!this.apiKey) {
      logger.warn('Anthropic API key not set — requests will fail', 'AnthropicAdapter');
    }
  }

  async initialize(): Promise<void> {
    if (!this.apiKey) {
      throw new Error('Anthropic API key is required');
    }
    logger.info('Anthropic adapter initialized', 'AnthropicAdapter', {
      baseUrl: this.baseUrl,
      model: this.getConfig().model,
    });
  }

  protected async callModelAPI(request: PreprocessedRequest): Promise<RawModelResponse> {
    const config = this.getConfig();
    const original = request.original;

    let endpoint: string;
    let body: Record<string, unknown>;
    const extraHeaders: Record<string, string> = {};

    if ('messages' in original) {
      endpoint = `${this.baseUrl}/messages`;
      const chatReq = original as ChatRequest;
      const systemMessage = chatReq.messages.find(m => m.role === 'system');
      const conversation = chatReq.messages.filter(m => m.role !== 'system');

      body = {
        model: config.model,
        messages: conversation.map(m => ({ role: m.role === 'assistant' ? 'assistant' : 'user', content: m.content })),
        max_tokens: chatReq.maxTokens ?? 4096,
        temperature: chatReq.temperature ?? 0.7,
      };
      if (systemMessage) {
        body.system = systemMessage.content;
      }

      // 支持 extended thinking
      const thinking = (chatReq as unknown as { thinking?: ThinkingConfig }).thinking;
      if (thinking) {
        body.thinking = thinking;
        extraHeaders['anthropic-beta'] = 'output-128k-2025-02-19';
      }
    } else if ('prompt' in original) {
      endpoint = `${this.baseUrl}/messages`;
      body = {
        model: config.model,
        messages: [{ role: 'user', content: (original as CompletionRequest).prompt }],
        max_tokens: (original as CompletionRequest).maxTokens ?? 4096,
        temperature: (original as CompletionRequest).temperature ?? 0.7,
      };
    } else if ('input' in original) {
      // Anthropic 没有直接的 embedding API，使用第三方兼容端点
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
          'x-api-key': this.apiKey,
          'anthropic-version': ANTHROPIC_VERSION,
          ...extraHeaders,
          ...request.headers,
        },
        body: JSON.stringify(body),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text().catch(() => 'Unknown error');
        throw new Error(`Anthropic API error ${response.status}: ${errorText}`);
      }

      const raw = await response.json();
      const normalized = this.normalizeAnthropicResponse(raw, original);

      metrics.increment('model_adapter.anthropic.api_call', 1, { model: config.model, status: 'success' });

      return { raw, normalized };
    } catch (error) {
      clearTimeout(timeoutId);
      metrics.increment('model_adapter.anthropic.api_call', 1, { model: config.model, status: 'error' });
      throw error;
    }
  }

  protected async callModelStream(request: PreprocessedRequest): Promise<AsyncIterable<unknown>> {
    const config = this.getConfig();
    const original = request.original;

    if (!('messages' in original) && !('prompt' in original)) {
      throw new Error('Streaming only supported for completion and chat requests');
    }

    const endpoint = `${this.baseUrl}/messages`;
    const chatReq = 'messages' in original ? (original as ChatRequest) : undefined;
    const messages = chatReq
      ? chatReq.messages.filter(m => m.role !== 'system').map(m => ({
          role: m.role === 'assistant' ? 'assistant' : 'user',
          content: m.content,
        }))
      : [{ role: 'user', content: (original as CompletionRequest).prompt }];

    const systemMessage = chatReq?.messages.find(m => m.role === 'system')?.content;

    const body: Record<string, unknown> = {
      model: config.model,
      messages,
      max_tokens: ('maxTokens' in original ? original.maxTokens : 4096) ?? 4096,
      temperature: ('temperature' in original ? original.temperature : 0.7) ?? 0.7,
      stream: true,
    };
    if (systemMessage) {
      body.system = systemMessage;
    }

    // 支持 extended thinking
    const thinking = chatReq
      ? (chatReq as unknown as { thinking?: ThinkingConfig }).thinking
      : undefined;
    const extraHeaders: Record<string, string> = {};
    if (thinking) {
      body.thinking = thinking;
      extraHeaders['anthropic-beta'] = 'output-128k-2025-02-19';
    }

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.apiKey,
        'anthropic-version': ANTHROPIC_VERSION,
        ...extraHeaders,
      },
      body: JSON.stringify(body),
    });

    if (!response.ok || !response.body) {
      throw new Error(`Anthropic streaming error: ${response.status}`);
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
              logger.warn('Malformed stream chunk in Anthropic response', 'AnthropicAdapter', { error: e instanceof Error ? e.message : String(e) });
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
    thinking?: string;
    eventType?: AnthropicStreamEvent;
  } {
    const c = chunk as Record<string, unknown>;
    const type = c.type as AnthropicStreamEvent;

    // thinking_delta: 处理 extended thinking 的思维链内容
    if (type === 'thinking_delta') {
      const delta = (c.delta as Record<string, unknown>) ?? {};
      return {
        thinking: (delta.thinking as string) ?? '',
        tokens: 0,
        finished: false,
        eventType: type,
      };
    }

    // signature: 处理 thinking 签名字段
    if (type === 'signature') {
      return {
        text: '',
        tokens: 0,
        finished: false,
        eventType: type,
      };
    }

    if (type === 'content_block_delta') {
      const delta = (c.delta as Record<string, unknown>) ?? {};
      return {
        text: (delta.text as string) ?? '',
        tokens: (delta.tokens as number) ?? 0,
        finished: false,
        eventType: type,
      };
    }

    if (type === 'message_stop') {
      return { text: '', tokens: 0, finished: true, finishedReason: 'stop', eventType: type };
    }

    if (type === 'message_delta') {
      const delta = (c.delta as Record<string, unknown>) ?? {};
      return {
        text: '',
        tokens: 0,
        finished: true,
        finishedReason: (delta.stop_reason as string) ?? 'stop',
        eventType: type,
      };
    }

    return { text: '', tokens: 0, finished: false, eventType: type };
  }

  protected async performHealthCheck(): Promise<void> {
    if (!this.apiKey) {
      throw new Error('API key not configured');
    }

    const response = await fetch(`${this.baseUrl}/models`, {
      headers: {
        'x-api-key': this.apiKey,
        'anthropic-version': ANTHROPIC_VERSION,
      },
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

    metrics.increment('model_adapter.anthropic.cache_hit');
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
    logger.info('Anthropic adapter cache cleared', 'AnthropicAdapter');
  }

  private normalizeAnthropicResponse(
    raw: Record<string, unknown>,
    original: CompletionRequest | ChatRequest | EmbeddingRequest,
  ): CompletionResponse | ChatResponse | EmbeddingResponse {
    const config = this.getConfig();

    if ('input' in original) {
      const data = (raw.data as Array<{ embedding: number[]; index: number }>) ?? [];
      const usage = (raw.usage as Record<string, number> | undefined) ?? {};
      return {
        success: true,
        model: config.model,
        provider: config.provider,
        usage: {
          promptTokens: usage.input_tokens ?? 0,
          completionTokens: 0,
          totalTokens: usage.input_tokens ?? 0,
        },
        totalTokens: usage.input_tokens ?? 0,
      } as EmbeddingResponse;
    }

    // 处理 non-streaming 中的 thinking content blocks
    const contentBlocks = (raw.content as Array<{ type: string; text?: string }>) ?? [];
    let thinking = '';
    let content = '';
    for (const block of contentBlocks) {
      if (block.type === 'thinking') {
        thinking += block.text ?? '';
      } else if (block.type === 'text') {
        content += block.text ?? '';
      } else {
        content += block.text ?? '';
      }
    }
    const finishReason = (raw.stop_reason as string) ?? 'stop';
    const usage = (raw.usage as Record<string, number> | undefined) ?? {};

    if ('messages' in original) {
      return {
        success: true,
        model: config.model,
        provider: config.provider,
        timestamp: new Date(),
        processingTime: 0,
        content,
        finishReason,
        usage: {
          promptTokens: usage.input_tokens ?? 0,
          completionTokens: usage.output_tokens ?? 0,
          totalTokens: (usage.input_tokens ?? 0) + (usage.output_tokens ?? 0),
        },
        ...(thinking ? { extra: { thinking } } : {}),
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
      finishReason,
      usage: {
        promptTokens: usage.input_tokens ?? 0,
        completionTokens: usage.output_tokens ?? 0,
        totalTokens: (usage.input_tokens ?? 0) + (usage.output_tokens ?? 0),
      },
    } as CompletionResponse;
  }
}
