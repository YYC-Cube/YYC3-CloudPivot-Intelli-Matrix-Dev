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
 * @file GeminiAdapter.ts
 * @description Google Gemini API 模型适配器实现
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

/** Gemini 内容部分：支持文本和多模态 */
interface GeminiContentPart {
  text?: string;
  inlineData?: { mimeType: string; data: string };
  fileData?: { mimeType: string; fileUri: string };
}

/** 上层传入的多模态内容块 */
interface ContentBlock {
  type: 'text' | 'image' | 'file';
  text?: string;
  mimeType?: string;
  data?: string;
  fileUri?: string;
}

const DEFAULT_GEMINI_BASE_URL = 'https://generativelanguage.googleapis.com/v1beta';

export class GeminiAdapter extends BaseModelAdapter {
  private baseUrl: string;
  private apiKey: string;
  private cacheStore: Map<string, { response: unknown; expiry: number }> = new Map();
  private cacheTTL: number;

  /**
   * 构建 Gemini parts 数组，支持文本和多模态输入
   * @param content 字符串（纯文本）或 ContentBlock[]（多模态）
   */
  static buildGeminiParts(content: string | ContentBlock[]): GeminiContentPart[] {
    if (typeof content === 'string') {
      return [{ text: content }];
    }
    return content.map((block) => {
      switch (block.type) {
        case 'image':
          return {
            inlineData: { mimeType: block.mimeType ?? 'image/png', data: block.data ?? '' },
          };
        case 'file':
          return {
            fileData: { mimeType: block.mimeType ?? 'application/octet-stream', fileUri: block.fileUri ?? '' },
          };
        case 'text':
        default:
          return { text: block.text ?? '' };
      }
    });
  }

  constructor(config: ModelAdapterConfig, modelInfo?: ModelInfo) {
    super(config, modelInfo ?? {
      limits: { maxInputTokens: 1048576 },
      pricing: { inputPrice: 0.00000125 },
    });

    this.baseUrl = config.baseUrl ?? DEFAULT_GEMINI_BASE_URL;
    this.apiKey = config.apiKey ?? '';
    this.cacheTTL = config.cacheTTL ?? 300000;

    if (!this.apiKey) {
      logger.warn('Gemini API key not set — requests will fail', 'GeminiAdapter');
    }
  }

  async initialize(): Promise<void> {
    if (!this.apiKey) {
      throw new Error('Gemini API key is required');
    }
    logger.info('Gemini adapter initialized', 'GeminiAdapter', {
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
      endpoint = `${this.baseUrl}/models/${config.model}:generateContent?key=${this.apiKey}`;
      const chatReq = original as ChatRequest;
      const contents = chatReq.messages
        .filter(m => m.role !== 'system')
        .map(m => ({
          role: m.role === 'assistant' ? 'model' : 'user',
          parts: GeminiAdapter.buildGeminiParts(m.content),
        }));
      const systemInstruction = chatReq.messages.find(m => m.role === 'system');

      body = {
        contents,
        generationConfig: {
          maxOutputTokens: chatReq.maxTokens ?? 2048,
          temperature: chatReq.temperature ?? 0.7,
        },
      };

      // 支持 safetySettings
      const safetySettings = (chatReq as unknown as { safetySettings?: Array<{ category: string; threshold: string }> }).safetySettings;
      if (safetySettings) {
        body.safetySettings = safetySettings;
      }

      if (systemInstruction) {
        body.systemInstruction = { parts: GeminiAdapter.buildGeminiParts(systemInstruction.content) };
      }
    } else if ('prompt' in original) {
      endpoint = `${this.baseUrl}/models/${config.model}:generateContent?key=${this.apiKey}`;
      body = {
        contents: [{ role: 'user', parts: [{ text: (original as CompletionRequest).prompt }] }],
        generationConfig: {
          maxOutputTokens: (original as CompletionRequest).maxTokens ?? 2048,
          temperature: (original as CompletionRequest).temperature ?? 0.7,
        },
      };
    } else if ('input' in original) {
      endpoint = `${this.baseUrl}/models/${config.model}:embedContent?key=${this.apiKey}`;
      const input = (original as EmbeddingRequest).input;
      body = {
        content: { parts: [{ text: Array.isArray(input) ? input.join(' ') : input }] },
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
        throw new Error(`Gemini API error ${response.status}: ${errorText}`);
      }

      const raw = await response.json();
      const normalized = this.normalizeGeminiResponse(raw, original);

      metrics.increment('model_adapter.gemini.api_call', 1, { model: config.model, status: 'success' });

      return { raw, normalized };
    } catch (error) {
      clearTimeout(timeoutId);
      metrics.increment('model_adapter.gemini.api_call', 1, { model: config.model, status: 'error' });
      throw error;
    }
  }

  protected async callModelStream(request: PreprocessedRequest): Promise<AsyncIterable<unknown>> {
    const config = this.getConfig();
    const original = request.original;

    if (!('messages' in original) && !('prompt' in original)) {
      throw new Error('Streaming only supported for completion and chat requests');
    }

    const endpoint = `${this.baseUrl}/models/${config.model}:streamGenerateContent?alt=sse&key=${this.apiKey}`;

    const contents = 'messages' in original
      ? (original as ChatRequest).messages
        .filter(m => m.role !== 'system')
        .map(m => ({
          role: m.role === 'assistant' ? 'model' : 'user',
          parts: GeminiAdapter.buildGeminiParts(m.content),
        }))
      : [{ role: 'user', parts: [{ text: (original as CompletionRequest).prompt }] }];

    const systemInstruction = 'messages' in original
      ? (original as ChatRequest).messages.find(m => m.role === 'system')
      : undefined;

    const body: Record<string, unknown> = {
      contents,
      generationConfig: {
        maxOutputTokens: ('maxTokens' in original ? original.maxTokens : 2048) ?? 2048,
        temperature: ('temperature' in original ? original.temperature : 0.7) ?? 0.7,
      },
    };
    if (systemInstruction) {
      body.systemInstruction = { parts: GeminiAdapter.buildGeminiParts(systemInstruction.content) };
    }

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (!response.ok || !response.body) {
      throw new Error(`Gemini streaming error: ${response.status}`);
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
              logger.warn('Malformed stream chunk in Gemini response', 'GeminiAdapter', { error: e instanceof Error ? e.message : String(e) });
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
    const c = chunk as Record<string, unknown>;
    const candidates = c.candidates as Array<Record<string, unknown>> | undefined;
    const candidate = candidates?.[0];

    if (!candidate) {
      return { text: '', tokens: 0, finished: false };
    }

    const content = candidate.content as Record<string, unknown> | undefined;
    const parts = content?.parts as Array<{ text?: string }> | undefined;
    const text = parts?.map(p => p.text).join('') ?? '';
    const finishReason = candidate.finishReason as string | undefined;

    return {
      text,
      tokens: 0,
      finished: finishReason != null,
      finishedReason: finishReason,
      index: 0,
    };
  }

  protected async performHealthCheck(): Promise<void> {
    if (!this.apiKey) {
      throw new Error('API key not configured');
    }

    const response = await fetch(`${this.baseUrl}/models?key=${this.apiKey}`, {
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

    metrics.increment('model_adapter.gemini.cache_hit');
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
    logger.info('Gemini adapter cache cleared', 'GeminiAdapter');
  }

  private normalizeGeminiResponse(
    raw: Record<string, unknown>,
    original: CompletionRequest | ChatRequest | EmbeddingRequest,
  ): CompletionResponse | ChatResponse | EmbeddingResponse {
    const config = this.getConfig();

    if ('input' in original) {
      const embedding = (raw.embedding as { values?: number[] })?.values ?? [];
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

    const candidates = (raw.candidates as Array<Record<string, unknown>>) ?? [];
    const candidate = candidates[0] ?? {};
    const content = candidate.content as Record<string, unknown> | undefined;
    const parts = content?.parts as Array<{ text?: string }> | undefined;
    const text = parts?.map(p => p.text).join('') ?? '';
    const finishReason = (candidate.finishReason as string) ?? 'stop';
    const usage = (raw.usageMetadata as Record<string, number>) ?? {};

    if ('messages' in original) {
      return {
        success: true,
        model: config.model,
        provider: config.provider,
        timestamp: new Date(),
        processingTime: 0,
        content: text,
        finishReason,
        usage: {
          promptTokens: usage.promptTokenCount ?? 0,
          completionTokens: usage.candidatesTokenCount ?? 0,
          totalTokens: usage.totalTokenCount ?? 0,
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
      content: text,
      finishReason,
      usage: {
        promptTokens: usage.promptTokenCount ?? 0,
        completionTokens: usage.candidatesTokenCount ?? 0,
        totalTokens: usage.totalTokenCount ?? 0,
      },
    } as CompletionResponse;
  }
}
