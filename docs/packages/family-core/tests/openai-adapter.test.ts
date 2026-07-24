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

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { OpenAIAdapter } from '../src/model/OpenAIAdapter.js';
import { ModelProvider } from '../src/deps/model-types.js';
import { metrics } from '../src/deps/metrics.js';

function makeConfig(overrides?: Record<string, unknown>) {
  return {
    provider: ModelProvider.OPENAI,
    model: 'gpt-4',
    apiKey: 'test-api-key',
    baseUrl: 'http://localhost:1234/v1',
    ...overrides,
  };
}

function makeChatRequest(messages: Array<{ role: string; content: string }> = [{ role: 'user', content: 'Hello' }]) {
  return {
    provider: ModelProvider.OPENAI,
    model: 'gpt-4',
    messages,
    maxTokens: 100,
    temperature: 0.7,
  };
}

function makeCompletionRequest(prompt = 'Once upon a time') {
  return {
    provider: ModelProvider.OPENAI,
    model: 'gpt-4',
    type: 'llm',
    prompt,
    maxTokens: 100,
    temperature: 0.7,
  };
}

function makeEmbeddingRequest(input = 'Hello world') {
  return {
    model: 'text-embedding-3-small',
    input,
  };
}

describe('OpenAIAdapter', () => {
  let fetchSpy: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    fetchSpy = vi.fn();
    (globalThis as any).fetch = fetchSpy;
    metrics.reset();
  });

  describe('constructor & initialize', () => {
    it('should create adapter with config', () => {
      const adapter = new OpenAIAdapter(makeConfig());
      expect(adapter.getConfig().model).toBe('gpt-4');
    });

    it('should throw on initialize without API key', async () => {
      const adapter = new OpenAIAdapter(makeConfig({ apiKey: '' }));
      await expect(adapter.initialize()).rejects.toThrow('API key is required');
    });

    it('should initialize with valid API key', async () => {
      const adapter = new OpenAIAdapter(makeConfig());
      await expect(adapter.initialize()).resolves.toBeUndefined();
    });

    it('should use default base URL when not specified', () => {
      const adapter = new OpenAIAdapter(makeConfig({ baseUrl: undefined }));
      expect(adapter.getConfig().baseUrl).toBeUndefined();
    });
  });

  describe('generateChatCompletion', () => {
    it('should call chat completions endpoint', async () => {
      fetchSpy.mockResolvedValue({
        ok: true,
        json: async () => ({
          id: 'chatcmpl-123',
          model: 'gpt-4',
          choices: [{ message: { content: 'Hi there!' }, finish_reason: 'stop', index: 0 }],
          usage: { prompt_tokens: 10, completion_tokens: 5, total_tokens: 15 },
        }),
      });

      const adapter = new OpenAIAdapter(makeConfig());
      const response = await adapter.generateChatCompletion(makeChatRequest());

      expect(response.success).toBe(true);
      expect(response.content).toBe('Hi there!');
      expect(response.usage.totalTokens).toBe(15);
      expect(fetchSpy).toHaveBeenCalledTimes(1);
      const callUrl = fetchSpy.mock.calls[0][0] as string;
      expect(callUrl).toContain('/chat/completions');
    });

    it('should include Authorization header', async () => {
      fetchSpy.mockResolvedValue({
        ok: true,
        json: async () => ({
          id: 'chatcmpl-123',
          model: 'gpt-4',
          choices: [{ message: { content: 'Hi' }, finish_reason: 'stop', index: 0 }],
          usage: { prompt_tokens: 5, completion_tokens: 2, total_tokens: 7 },
        }),
      });

      const adapter = new OpenAIAdapter(makeConfig());
      await adapter.generateChatCompletion(makeChatRequest());

      const callOpts = fetchSpy.mock.calls[0][1] as Record<string, any>;
      expect(callOpts.headers['Authorization']).toBe('Bearer test-api-key');
    });

    it('should handle API error responses', async () => {
      fetchSpy.mockResolvedValue({
        ok: false,
        status: 429,
        statusText: 'Too Many Requests',
        text: async () => 'Rate limited',
      });

      const adapter = new OpenAIAdapter(makeConfig());
      const response = await adapter.generateChatCompletion(makeChatRequest());

      expect(response.success).toBe(false);
      expect(response.error).toBeDefined();
    });

    it('should handle network errors', async () => {
      fetchSpy.mockRejectedValue(new Error('Network failure'));

      const adapter = new OpenAIAdapter(makeConfig());
      const response = await adapter.generateChatCompletion(makeChatRequest());

      expect(response.success).toBe(false);
    });
  });

  describe('generateCompletion', () => {
    it('should call completions endpoint', async () => {
      fetchSpy.mockResolvedValue({
        ok: true,
        json: async () => ({
          id: 'cmpl-123',
          model: 'gpt-4',
          choices: [{ text: 'Once upon a time', finish_reason: 'stop', index: 0 }],
          usage: { prompt_tokens: 5, completion_tokens: 5, total_tokens: 10 },
        }),
      });

      const adapter = new OpenAIAdapter(makeConfig());
      const response = await adapter.generateCompletion(makeCompletionRequest());

      expect(response.success).toBe(true);
      expect(response.content).toBe('Once upon a time');
      const callUrl = fetchSpy.mock.calls[0][0] as string;
      expect(callUrl).toContain('/completions');
    });
  });

  describe('generateEmbedding', () => {
    it('should call embeddings endpoint', async () => {
      fetchSpy.mockResolvedValue({
        ok: true,
        json: async () => ({
          model: 'text-embedding-3-small',
          data: [{ embedding: [0.1, 0.2, 0.3], index: 0 }],
          usage: { prompt_tokens: 3, total_tokens: 3 },
        }),
      });

      const adapter = new OpenAIAdapter(makeConfig({ model: 'text-embedding-3-small' }));
      const response = await adapter.generateEmbedding(makeEmbeddingRequest());

      expect(response.success).toBe(true);
      expect(response.totalTokens).toBe(3);
      const callUrl = fetchSpy.mock.calls[0][0] as string;
      expect(callUrl).toContain('/embeddings');
    });
  });

  describe('streaming', () => {
    it('should stream chat completion chunks', async () => {
      const encoder = new TextEncoder();
      const chunks = [
        encoder.encode('data: {"choices":[{"delta":{"content":"Hello"},"index":0}]}\n\n'),
        encoder.encode('data: {"choices":[{"delta":{"content":" World"},"finish_reason":"stop","index":0}]}\n\n'),
        encoder.encode('data: [DONE]\n\n'),
      ];

      const reader = {
        read: vi.fn()
          .mockResolvedValueOnce({ done: false, value: chunks[0] })
          .mockResolvedValueOnce({ done: false, value: chunks[1] })
          .mockResolvedValueOnce({ done: false, value: chunks[2] })
          .mockResolvedValueOnce({ done: true }),
      };

      fetchSpy.mockResolvedValue({
        ok: true,
        body: { getReader: () => reader },
      });

      const adapter = new OpenAIAdapter(makeConfig());
      const collected: string[] = [];

      for await (const chunk of adapter.streamCompletion(makeChatRequest())) {
        if (chunk.delta?.content) {
          collected.push(chunk.delta.content);
        }
      }

      expect(collected).toEqual(['Hello', ' World']);
    });

    it('should throw for embedding request streaming', async () => {
      const adapter = new OpenAIAdapter(makeConfig());
      await expect(async () => {
        for await (const _ of adapter.streamCompletion(makeEmbeddingRequest() as any)) {
          // should not get here
        }
      }).rejects.toThrow();
    });
  });

  describe('parseStreamChunk', () => {
    it('should parse delta content', () => {
      const adapter = new OpenAIAdapter(makeConfig());
      const result = (adapter as any).parseStreamChunk({
        choices: [{ delta: { content: 'test' }, index: 0 }],
      });
      expect(result.text).toBe('test');
      expect(result.finished).toBe(false);
    });

    it('should detect finish', () => {
      const adapter = new OpenAIAdapter(makeConfig());
      const result = (adapter as any).parseStreamChunk({
        choices: [{ delta: {}, finish_reason: 'stop', index: 0 }],
      });
      expect(result.finished).toBe(true);
      expect(result.finishedReason).toBe('stop');
    });

    it('should handle chunk without choices', () => {
      const adapter = new OpenAIAdapter(makeConfig());
      const result = (adapter as any).parseStreamChunk({});
      expect(result.text).toBe('');
      expect(result.tokens).toBe(0);
    });

    it('should extract usage tokens', () => {
      const adapter = new OpenAIAdapter(makeConfig());
      const result = (adapter as any).parseStreamChunk({
        choices: [{ delta: { content: 'test' }, index: 0 }],
        usage: { completion_tokens: 5 },
      });
      expect(result.tokens).toBe(5);
    });
  });

  describe('caching', () => {
    it('should cache and return cached responses', async () => {
      const adapter = new OpenAIAdapter(makeConfig({ cache: { enabled: true } }));

      fetchSpy.mockResolvedValue({
        ok: true,
        json: async () => ({
          id: 'chatcmpl-123',
          model: 'gpt-4',
          choices: [{ message: { content: 'Cached response' }, finish_reason: 'stop', index: 0 }],
          usage: { prompt_tokens: 5, completion_tokens: 3, total_tokens: 8 },
        }),
      });

      const response1 = await adapter.generateChatCompletion(makeChatRequest());
      expect(response1.content).toBe('Cached response');
      expect(fetchSpy).toHaveBeenCalledTimes(1);

      const response2 = await adapter.generateChatCompletion(makeChatRequest());
      expect(response2.content).toBe('Cached response');
    });

    it('should not cache when disabled', async () => {
      const adapter = new OpenAIAdapter(makeConfig({ cache: { enabled: false } }));

      fetchSpy.mockResolvedValue({
        ok: true,
        json: async () => ({
          id: 'chatcmpl-123',
          model: 'gpt-4',
          choices: [{ message: { content: 'No cache' }, finish_reason: 'stop', index: 0 }],
          usage: { prompt_tokens: 5, completion_tokens: 3, total_tokens: 8 },
        }),
      });

      await adapter.generateChatCompletion(makeChatRequest());
      await adapter.generateChatCompletion(makeChatRequest());
      expect(fetchSpy).toHaveBeenCalledTimes(2);
    });

    it('should clear cache', async () => {
      const adapter = new OpenAIAdapter(makeConfig({ cache: { enabled: true } }));

      fetchSpy.mockResolvedValue({
        ok: true,
        json: async () => ({
          id: 'chatcmpl-123',
          model: 'gpt-4',
          choices: [{ message: { content: 'Clear me' }, finish_reason: 'stop', index: 0 }],
          usage: { prompt_tokens: 5, completion_tokens: 3, total_tokens: 8 },
        }),
      });

      await adapter.generateChatCompletion(makeChatRequest());
      await adapter.clearCache();

      await adapter.generateChatCompletion(makeChatRequest());
      expect(fetchSpy).toHaveBeenCalledTimes(2);
    });
  });

  describe('healthCheck', () => {
    it('should return healthy when models endpoint responds', async () => {
      fetchSpy.mockResolvedValue({ ok: true });

      const adapter = new OpenAIAdapter(makeConfig());
      const result = await adapter.healthCheck();

      expect(result.status).toBe('healthy');
      expect(fetchSpy.mock.calls[0][0] as string).toContain('/models');
    });

    it('should return unhealthy when models endpoint fails', async () => {
      fetchSpy.mockResolvedValue({ ok: false, status: 401 });

      const adapter = new OpenAIAdapter(makeConfig());
      const result = await adapter.healthCheck();

      expect(result.status).toBe('unhealthy');
    });

    it('should return unhealthy without API key', async () => {
      const adapter = new OpenAIAdapter(makeConfig({ apiKey: '' }));
      const result = await adapter.healthCheck();

      expect(result.status).toBe('unhealthy');
    });
  });

  describe('metrics', () => {
    it('should track request metrics', async () => {
      fetchSpy.mockResolvedValue({
        ok: true,
        json: async () => ({
          id: 'chatcmpl-123',
          model: 'gpt-4',
          choices: [{ message: { content: 'ok' }, finish_reason: 'stop', index: 0 }],
          usage: { prompt_tokens: 5, completion_tokens: 3, total_tokens: 8 },
        }),
      });

      const adapter = new OpenAIAdapter(makeConfig());
      await adapter.generateChatCompletion(makeChatRequest());

      const m = adapter.getMetrics();
      expect(m.requestCount).toBe(1);
      expect(m.successCount).toBe(1);
    });

    it('should track error metrics', async () => {
      fetchSpy.mockRejectedValue(new Error('fail'));

      const adapter = new OpenAIAdapter(makeConfig());
      await adapter.generateChatCompletion(makeChatRequest());

      const m = adapter.getMetrics();
      expect(m.requestCount).toBe(1);
      expect(m.errorCount).toBe(1);
    });
  });

  describe('batchComplete', () => {
    it('should handle batch requests', async () => {
      fetchSpy.mockResolvedValue({
        ok: true,
        json: async () => ({
          id: 'cmpl-123',
          model: 'gpt-4',
          choices: [{ text: 'result', finish_reason: 'stop', index: 0 }],
          usage: { prompt_tokens: 3, completion_tokens: 3, total_tokens: 6 },
        }),
      });

      const adapter = new OpenAIAdapter(makeConfig());
      const results = await adapter.batchComplete([
        makeCompletionRequest('one'),
        makeCompletionRequest('two'),
      ]);

      expect(results.length).toBe(2);
      expect(results[0].success).toBe(true);
    });
  });
});
