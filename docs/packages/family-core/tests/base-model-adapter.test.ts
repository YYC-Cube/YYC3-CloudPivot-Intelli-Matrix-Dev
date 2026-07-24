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
import { BaseModelAdapter, PreprocessedRequest, RawModelResponse } from '../src/model/BaseModelAdapter';
import { ModelProvider, ModelInfo } from '../src/deps/model-types';
import { metrics } from '../src/deps/metrics';

/** 测试用的具体子类 */
class TestAdapter extends BaseModelAdapter {
  initCalled = false;
  healthCheckCalled = false;
  callModelAPIMock = vi.fn();
  callModelStreamMock = vi.fn();
  parseStreamChunkMock = vi.fn();

  async initialize(): Promise<void> { this.initCalled = true; }
  protected async callModelAPI(request: PreprocessedRequest): Promise<RawModelResponse> { return this.callModelAPIMock(request); }
  protected async callModelStream(request: PreprocessedRequest): Promise<AsyncIterable<unknown>> { return this.callModelStreamMock(request); }
  protected parseStreamChunk(chunk: unknown): any { return this.parseStreamChunkMock(chunk); }
  protected async performHealthCheck(): Promise<void> { this.healthCheckCalled = true; }
}

function makeConfig(overrides?: Record<string, unknown>) {
  return {
    provider: ModelProvider.OPENAI,
    model: 'gpt-4',
    apiKey: 'test-key',
    ...overrides,
  };
}

const defaultModelInfo: ModelInfo = {
  limits: { maxInputTokens: 4096 },
  pricing: { inputPrice: 0.01 },
};

describe('BaseModelAdapter', () => {
  let adapter: TestAdapter;

  beforeEach(() => {
    vi.clearAllMocks();
    metrics.reset();
    adapter = new TestAdapter(makeConfig(), defaultModelInfo);
  });

  describe('constructor', () => {
    it('should store config and model info', () => {
      expect(adapter.getConfig().model).toBe('gpt-4');
      expect(adapter.getConfig().provider).toBe(ModelProvider.OPENAI);
    });

    it('should initialize metrics to zero', () => {
      const m = adapter.getMetrics();
      expect(m.requestCount).toBe(0);
      expect(m.successCount).toBe(0);
      expect(m.errorCount).toBe(0);
      expect(m.errorRate).toBe(0);
    });

    it('should accept custom model info', () => {
      const customInfo: ModelInfo = { limits: { maxInputTokens: 8000 }, pricing: { inputPrice: 0.02 } };
      const a = new TestAdapter(makeConfig(), customInfo);
      expect(a.getModelInfo()).toEqual(customInfo);
    });
  });

  describe('getModelInfo', () => {
    it('should return the model info', () => {
      expect(adapter.getModelInfo()).toEqual(defaultModelInfo);
    });
  });

  describe('isAvailable', () => {
    it('should return true when health check passes', async () => {
      const result = await adapter.isAvailable();
      expect(result).toBe(true);
      expect(adapter.healthCheckCalled).toBe(true);
    });

    it('should return true even when health check throws (healthCheck catches errors)', async () => {
      class FailingAdapter extends TestAdapter {
        protected async performHealthCheck(): Promise<void> { throw new Error('Down'); }
      }
      const a = new FailingAdapter(makeConfig(), defaultModelInfo);
      // healthCheck() catches errors and returns { status: 'unhealthy' }, so isAvailable() returns true
      const result = await a.isAvailable();
      expect(result).toBe(true);
    });
  });

  describe('healthCheck', () => {
    it('should return healthy status on success', async () => {
      const result = await adapter.healthCheck();
      expect(result.status).toBe('healthy');
      expect(result.latency).toBeGreaterThanOrEqual(0);
      expect(result.message).toContain('is healthy');
    });

    it('should return unhealthy status on failure', async () => {
      class FailingAdapter extends TestAdapter {
        protected async performHealthCheck(): Promise<void> { throw new Error('Connection refused'); }
      }
      const a = new FailingAdapter(makeConfig(), defaultModelInfo);
      const result = await a.healthCheck();
      expect(result.status).toBe('unhealthy');
      expect(result.message).toContain('Connection refused');
    });
  });

  describe('generateCompletion', () => {
    it('should call callModelAPI and return processed response', async () => {
      adapter.callModelAPIMock.mockResolvedValue({
        raw: { id: 'cmpl-1' },
        normalized: {
          success: true,
          type: 'llm',
          model: 'gpt-4',
          provider: ModelProvider.OPENAI,
          content: 'Hello world',
          finishReason: 'stop',
          usage: { promptTokens: 5, completionTokens: 5, totalTokens: 10 },
        },
      });

      const response = await adapter.generateCompletion({
        provider: ModelProvider.OPENAI,
        model: 'gpt-4',
        type: 'llm',
        prompt: 'Say hello',
      });

      expect(response.success).toBe(true);
      expect(response.content).toBe('Hello world');
      expect(response.usage.totalTokens).toBe(10);
      expect(adapter.callModelAPIMock).toHaveBeenCalledTimes(1);
    });

    it('should handle error and return error response', async () => {
      adapter.callModelAPIMock.mockRejectedValue(new Error('API timeout'));

      const response = await adapter.generateCompletion({
        provider: ModelProvider.OPENAI,
        model: 'gpt-4',
        type: 'llm',
        prompt: 'test',
      });

      expect(response.success).toBe(false);
      expect(response.error).toBeDefined();
      expect(response.error?.code).toBeDefined();
    });

    it('should update metrics on success', async () => {
      adapter.callModelAPIMock.mockResolvedValue({
        raw: {},
        normalized: {
          success: true,
          type: 'llm',
          model: 'gpt-4',
          provider: ModelProvider.OPENAI,
          content: 'ok',
          finishReason: 'stop',
          usage: { promptTokens: 3, completionTokens: 3, totalTokens: 6 },
        },
      });

      await adapter.generateCompletion({
        provider: ModelProvider.OPENAI,
        model: 'gpt-4',
        type: 'llm',
        prompt: 'test',
      });

      const m = adapter.getMetrics();
      expect(m.requestCount).toBe(1);
      expect(m.successCount).toBe(1);
      expect(m.totalTokens).toBe(6);
    });
  });

  describe('generateChatCompletion', () => {
    it('should process chat completion', async () => {
      adapter.callModelAPIMock.mockResolvedValue({
        raw: {},
        normalized: {
          success: true,
          model: 'gpt-4',
          provider: ModelProvider.OPENAI,
          content: 'Chat reply',
          finishReason: 'stop',
          usage: { promptTokens: 10, completionTokens: 5, totalTokens: 15 },
        },
      });

      const response = await adapter.generateChatCompletion({
        provider: ModelProvider.OPENAI,
        model: 'gpt-4',
        messages: [{ role: 'user', content: 'Hi' }],
      });

      expect(response.success).toBe(true);
      expect(response.content).toBe('Chat reply');
    });
  });

  describe('generateEmbedding', () => {
    it('should process embedding request', async () => {
      adapter.callModelAPIMock.mockResolvedValue({
        raw: {},
        normalized: {
          success: true,
          model: 'text-embedding',
          provider: ModelProvider.OPENAI,
          usage: { promptTokens: 3, completionTokens: 0, totalTokens: 3 },
          totalTokens: 3,
        },
      });

      const response = await adapter.generateEmbedding({
        model: 'text-embedding',
        input: 'Hello world',
      });

      expect(response.success).toBe(true);
      expect(response.totalTokens).toBe(3);
    });

    it('should rethrow error on failure', async () => {
      adapter.callModelAPIMock.mockRejectedValue(new Error('Embedding failed'));

      await expect(adapter.generateEmbedding({
        model: 'text-embedding',
        input: 'test',
      })).rejects.toThrow('Embedding failed');
    });
  });

  describe('streamCompletion', () => {
    it('should yield chunks from stream', async () => {
      async function* mockStream() {
        yield { text: 'Hello', tokens: 2, finished: false };
        yield { text: ' World', tokens: 2, finished: true, finishedReason: 'stop' };
      }
      adapter.callModelStreamMock.mockResolvedValue(mockStream());
      adapter.parseStreamChunkMock
        .mockReturnValueOnce({ text: 'Hello', tokens: 2, finished: false })
        .mockReturnValueOnce({ text: ' World', tokens: 2, finished: true, finishedReason: 'stop' });

      const collected: string[] = [];
      for await (const chunk of adapter.streamCompletion({
        provider: ModelProvider.OPENAI,
        model: 'gpt-4',
        type: 'llm',
        prompt: 'Hi',
      })) {
        if (chunk.delta?.content) collected.push(chunk.delta.content);
      }

      expect(collected).toEqual(['Hello', ' World']);
    });
  });

  describe('batchComplete', () => {
    it('should batch multiple requests', async () => {
      adapter.callModelAPIMock.mockResolvedValue({
        raw: {},
        normalized: {
          success: true,
          type: 'llm',
          model: 'gpt-4',
          provider: ModelProvider.OPENAI,
          content: 'result',
          finishReason: 'stop',
          usage: { promptTokens: 3, completionTokens: 3, totalTokens: 6 },
        },
      });

      const results = await adapter.batchComplete([
        { provider: ModelProvider.OPENAI, model: 'gpt-4', type: 'llm', prompt: 'a' },
        { provider: ModelProvider.OPENAI, model: 'gpt-4', type: 'llm', prompt: 'b' },
      ]);

      expect(results).toHaveLength(2);
      expect(results[0].success).toBe(true);
      expect(results[1].success).toBe(true);
    });

    it('should handle partial failures in batch (errors go through handleError)', async () => {
      adapter.callModelAPIMock
        .mockResolvedValueOnce({
          raw: {},
          normalized: { success: true, type: 'llm', model: 'gpt-4', provider: ModelProvider.OPENAI, content: 'ok', finishReason: 'stop', usage: { promptTokens: 1, completionTokens: 1, totalTokens: 2 } },
        })
        .mockRejectedValueOnce(new Error('Failed'));

      const results = await adapter.batchComplete([
        { provider: ModelProvider.OPENAI, model: 'gpt-4', type: 'llm', prompt: 'ok' },
        { provider: ModelProvider.OPENAI, model: 'gpt-4', type: 'llm', prompt: 'fail' },
      ]);

      expect(results).toHaveLength(2);
      expect(results[0].success).toBe(true);
      expect(results[1].success).toBe(false);
      expect(results[1].error).toBeDefined();
      // generateCompletion catches errors and returns MODEL_ADAPTER_ERROR, not BATCH_ERROR
      expect(results[1].error?.code).toBe('MODEL_ADAPTER_ERROR');
    });
  });

  describe('updateConfig / getConfig', () => {
    it('should update config partially', async () => {
      await adapter.updateConfig({ timeout: 5000 });
      expect(adapter.getConfig().timeout).toBe(5000);
      expect(adapter.getConfig().model).toBe('gpt-4');
    });
  });

  describe('warmup', () => {
    it('should call generateCompletion for warmup', async () => {
      adapter.callModelAPIMock.mockResolvedValue({
        raw: {},
        normalized: { success: true, type: 'llm', model: 'gpt-4', provider: ModelProvider.OPENAI, content: '', finishReason: 'stop', usage: { promptTokens: 0, completionTokens: 0, totalTokens: 0 } },
      });

      await adapter.warmup();
      expect(adapter.callModelAPIMock).toHaveBeenCalled();
    });

    it('should not throw if warmup fails', async () => {
      adapter.callModelAPIMock.mockRejectedValue(new Error('Warmup fail'));
      await expect(adapter.warmup()).resolves.toBeUndefined();
    });
  });

  describe('clearCache / optimizeFor', () => {
    it('should resolve clearCache', async () => {
      await expect(adapter.clearCache()).resolves.toBeUndefined();
    });

    it('should resolve optimizeFor', async () => {
      await expect(adapter.optimizeFor(4)).resolves.toBeUndefined();
    });
  });

  describe('getMetrics', () => {
    it('should return tracked metrics', async () => {
      adapter.callModelAPIMock.mockResolvedValue({
        raw: {},
        normalized: { success: true, type: 'llm', model: 'gpt-4', provider: ModelProvider.OPENAI, content: '', finishReason: 'stop', usage: { promptTokens: 5, completionTokens: 5, totalTokens: 10 } },
      });

      await adapter.generateCompletion({
        provider: ModelProvider.OPENAI,
        model: 'gpt-4',
        type: 'llm',
        prompt: 'test',
      });

      const m = adapter.getMetrics();
      expect(m.requestCount).toBe(1);
      expect(m.successCount).toBe(1);
      expect(m.averageLatency).toBeGreaterThanOrEqual(0);
    });
  });

  describe('handleError (protected)', () => {
    it('should detect timeout errors', async () => {
      adapter.callModelAPIMock.mockRejectedValue(new Error('timeout occurred'));
      const response = await adapter.generateCompletion({
        provider: ModelProvider.OPENAI,
        model: 'gpt-4',
        type: 'llm',
        prompt: 'x',
      });
      expect(response.error?.code).toBe('TIMEOUT_ERROR');
      expect(response.error?.retryable).toBe(true);
    });

    it('should detect rate limit errors', async () => {
      adapter.callModelAPIMock.mockRejectedValue(new Error('rate limit exceeded'));
      const response = await adapter.generateCompletion({
        provider: ModelProvider.OPENAI,
        model: 'gpt-4',
        type: 'llm',
        prompt: 'x',
      });
      expect(response.error?.code).toBe('RATE_LIMIT_ERROR');
      expect(response.error?.retryable).toBe(true);
    });
  });
});
