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
import { OllamaAdapter } from '../src/model/OllamaAdapter';
import { ModelProvider } from '../src/deps/model-types';
import { metrics } from '../src/deps/metrics';

function makeConfig(overrides?: Record<string, unknown>) {
  return {
    provider: ModelProvider.OLLAMA,
    model: 'llama3.2',
    baseUrl: 'http://localhost:11434',
    ...overrides,
  };
}

function makeChatRequest(messages = [{ role: 'user', content: 'Hello' }], overrides?: Record<string, unknown>) {
  return { provider: ModelProvider.OLLAMA, model: 'llama3.2', messages, maxTokens: 100, temperature: 0.7, ...overrides };
}

function makeCompletionRequest(prompt = 'Say hello') {
  return { provider: ModelProvider.OLLAMA, model: 'llama3.2', type: 'llm', prompt, maxTokens: 100, temperature: 0.7 };
}

function makeEmbeddingRequest(input = 'Hello world') {
  return { model: 'llama3.2', input };
}

describe('OllamaAdapter', () => {
  let fetchSpy: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    fetchSpy = vi.fn();
    (globalThis as any).fetch = fetchSpy;
    metrics.reset();
  });

  describe('constructor & initialize', () => {
    it('should create adapter with config', () => {
      const adapter = new OllamaAdapter(makeConfig());
      expect(adapter.getConfig().model).toBe('llama3.2');
    });

    it('should use default base URL', () => {
      const adapter = new OllamaAdapter(makeConfig({ baseUrl: undefined }));
      expect((adapter as any).baseUrl).toBe('http://localhost:11434');
    });

    it('should initialize without API key (local model)', async () => {
      const adapter = new OllamaAdapter(makeConfig());
      await expect(adapter.initialize()).resolves.toBeUndefined();
    });
  });

  describe('generateChatCompletion', () => {
    it('should call /api/chat endpoint', async () => {
      fetchSpy.mockResolvedValue({
        ok: true,
        json: async () => ({ model: 'llama3.2', message: { content: 'Ollama reply', role: 'assistant' }, done: true, eval_count: 5, prompt_eval_count: 3 }),
      });

      const adapter = new OllamaAdapter(makeConfig());
      const response = await adapter.generateChatCompletion(makeChatRequest());

      expect(response.success).toBe(true);
      expect(response.content).toBe('Ollama reply');
      expect(response.usage.totalTokens).toBe(8);
      const callUrl = fetchSpy.mock.calls[0][0] as string;
      expect(callUrl).toContain('/api/chat');
    });

    it('should handle API errors', async () => {
      fetchSpy.mockResolvedValue({ ok: false, status: 500, text: async () => 'Internal error' });
      const adapter = new OllamaAdapter(makeConfig());
      const response = await adapter.generateChatCompletion(makeChatRequest());
      expect(response.success).toBe(false);
    });
  });

  describe('generateCompletion', () => {
    it('should call /api/generate endpoint', async () => {
      fetchSpy.mockResolvedValue({
        ok: true,
        json: async () => ({ model: 'llama3.2', response: 'Completion text', done: true, eval_count: 7, prompt_eval_count: 4 }),
      });

      const adapter = new OllamaAdapter(makeConfig());
      const response = await adapter.generateCompletion(makeCompletionRequest());

      expect(response.success).toBe(true);
      expect(response.content).toBe('Completion text');
      const callUrl = fetchSpy.mock.calls[0][0] as string;
      expect(callUrl).toContain('/api/generate');
    });
  });

  describe('generateEmbedding', () => {
    it('should call /api/embed endpoint', async () => {
      fetchSpy.mockResolvedValue({
        ok: true,
        json: async () => ({ embeddings: [[0.1, 0.2, 0.3]] }),
      });

      const adapter = new OllamaAdapter(makeConfig());
      const response = await adapter.generateEmbedding(makeEmbeddingRequest());

      expect(response.success).toBe(true);
      const callUrl = fetchSpy.mock.calls[0][0] as string;
      expect(callUrl).toContain('/api/embed');
    });
  });

  describe('healthCheck', () => {
    it('should return healthy when /api/tags responds', async () => {
      fetchSpy.mockResolvedValue({ ok: true, json: async () => ({ models: [{ name: 'llama3.2' }] }) });
      const adapter = new OllamaAdapter(makeConfig());
      const result = await adapter.healthCheck();
      expect(result.status).toBe('healthy');
    });

    it('should return unhealthy when tags endpoint fails', async () => {
      fetchSpy.mockResolvedValue({ ok: false, status: 503 });
      const adapter = new OllamaAdapter(makeConfig());
      const result = await adapter.healthCheck();
      expect(result.status).toBe('unhealthy');
    });

    it('should warn when model not found locally', async () => {
      const warnSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      fetchSpy.mockResolvedValue({ ok: true, json: async () => ({ models: [{ name: 'mistral' }] }) });
      const adapter = new OllamaAdapter(makeConfig());
      await adapter.healthCheck();
      expect(warnSpy).toHaveBeenCalled();
      warnSpy.mockRestore();
    });
  });

  describe('parseStreamChunk', () => {
    let adapter: OllamaAdapter;
    beforeEach(() => { adapter = new OllamaAdapter(makeConfig()); });

    it('should parse chat response chunk', () => {
      const result = (adapter as any).parseStreamChunk({ message: { content: 'Hello' }, done: false });
      expect(result.text).toBe('Hello');
      expect(result.finished).toBe(false);
    });

    it('should parse completion response chunk', () => {
      const result = (adapter as any).parseStreamChunk({ response: 'Generated', done: false });
      expect(result.text).toBe('Generated');
    });

    it('should detect done state', () => {
      const result = (adapter as any).parseStreamChunk({ done: true });
      expect(result.finished).toBe(true);
      expect(result.finishedReason).toBe('stop');
    });

    it('should extract eval_count', () => {
      const result = (adapter as any).parseStreamChunk({ message: { content: 'test' }, eval_count: 10, done: false });
      expect(result.tokens).toBe(10);
    });
  });

  describe('caching', () => {
    it('should cache responses when enabled', async () => {
      fetchSpy.mockResolvedValue({ ok: true, json: async () => ({ message: { content: 'cached' }, done: true, eval_count: 2, prompt_eval_count: 1 }) });

      const adapter = new OllamaAdapter(makeConfig({ cache: { enabled: true } }));
      await adapter.generateChatCompletion(makeChatRequest());
      await adapter.generateChatCompletion(makeChatRequest());
      expect(fetchSpy).toHaveBeenCalledTimes(1);
    });

    it('should clear cache', async () => {
      fetchSpy.mockResolvedValue({ ok: true, json: async () => ({ message: { content: 'x' }, done: true, eval_count: 1, prompt_eval_count: 1 }) });

      const adapter = new OllamaAdapter(makeConfig({ cache: { enabled: true } }));
      await adapter.generateChatCompletion(makeChatRequest());
      await adapter.clearCache();
      await adapter.generateChatCompletion(makeChatRequest());
      expect(fetchSpy).toHaveBeenCalledTimes(2);
    });
  });

  describe('streaming', () => {
    it('should reject streaming for embedding request', async () => {
      const adapter = new OllamaAdapter(makeConfig());
      await expect(async () => {
        for await (const _ of adapter.streamCompletion(makeEmbeddingRequest() as any)) { /* */ }
      }).rejects.toThrow();
    });
  });
});
