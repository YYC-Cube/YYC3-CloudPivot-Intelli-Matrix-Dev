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
import { AnthropicAdapter } from '../src/model/AnthropicAdapter';
import { ModelProvider } from '../src/deps/model-types';
import { metrics } from '../src/deps/metrics';

function makeConfig(overrides?: Record<string, unknown>) {
  return {
    provider: ModelProvider.ANTHROPIC,
    model: 'claude-sonnet-4-20250514',
    apiKey: 'sk-ant-test123',
    baseUrl: 'https://api.anthropic.com/v1',
    ...overrides,
  };
}

function makeChatRequest(messages = [{ role: 'user', content: 'Hello' }], overrides?: Record<string, unknown>) {
  return { provider: ModelProvider.ANTHROPIC, model: 'claude-sonnet-4-20250514', messages, maxTokens: 100, temperature: 0.7, ...overrides };
}

function makeCompletionRequest(prompt = 'Say hello') {
  return { provider: ModelProvider.ANTHROPIC, model: 'claude-sonnet-4-20250514', type: 'llm', prompt, maxTokens: 100, temperature: 0.7 };
}

function makeEmbeddingRequest(input = 'Hello world') {
  return { model: 'claude-embedding', input };
}

describe('AnthropicAdapter', () => {
  let fetchSpy: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    fetchSpy = vi.fn();
    (globalThis as any).fetch = fetchSpy;
    metrics.reset();
  });

  describe('constructor & initialize', () => {
    it('should create adapter with config', () => {
      const adapter = new AnthropicAdapter(makeConfig());
      expect(adapter.getConfig().model).toBe('claude-sonnet-4-20250514');
    });

    it('should throw on initialize without API key', async () => {
      const adapter = new AnthropicAdapter(makeConfig({ apiKey: '' }));
      await expect(adapter.initialize()).rejects.toThrow('API key is required');
    });

    it('should initialize with valid API key', async () => {
      const adapter = new AnthropicAdapter(makeConfig());
      await expect(adapter.initialize()).resolves.toBeUndefined();
    });

    it('should use default base URL when not specified', () => {
      const adapter = new AnthropicAdapter(makeConfig({ baseUrl: undefined }));
      expect((adapter as any).baseUrl).toBe('https://api.anthropic.com/v1');
    });

    it('should warn when no API key', () => {
      const warnSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      new AnthropicAdapter(makeConfig({ apiKey: '' }));
      expect(warnSpy).toHaveBeenCalled();
      warnSpy.mockRestore();
    });
  });

  describe('generateChatCompletion', () => {
    it('should call messages endpoint with system message', async () => {
      fetchSpy.mockResolvedValue({
        ok: true,
        json: async () => ({
          id: 'msg_1',
          model: 'claude-sonnet-4-20250514',
          type: 'message',
          role: 'assistant',
          content: [{ type: 'text', text: 'Hi there!' }],
          stop_reason: 'end_turn',
          usage: { input_tokens: 10, output_tokens: 5 },
        }),
      });

      const adapter = new AnthropicAdapter(makeConfig());
      const response = await adapter.generateChatCompletion(
        makeChatRequest([
          { role: 'system', content: 'You are helpful' },
          { role: 'user', content: 'Hello' },
        ])
      );

      expect(response.success).toBe(true);
      expect(response.content).toBe('Hi there!');
      expect(fetchSpy).toHaveBeenCalledTimes(1);
      const callUrl = fetchSpy.mock.calls[0][0] as string;
      expect(callUrl).toContain('/messages');
      const callBody = JSON.parse(fetchSpy.mock.calls[0][1].body);
      expect(callBody.system).toBe('You are helpful');
    });

    it('should include anthropic-version header', async () => {
      fetchSpy.mockResolvedValue({ ok: true, json: async () => ({ id: 'msg_1', content: [{ type: 'text', text: 'ok' }], usage: { input_tokens: 1, output_tokens: 1 } }) });

      const adapter = new AnthropicAdapter(makeConfig());
      await adapter.generateChatCompletion(makeChatRequest());
      const headers = fetchSpy.mock.calls[0][1].headers;
      expect(headers['x-api-key']).toBe('sk-ant-test123');
      expect(headers['anthropic-version']).toBe('2023-06-01');
    });

    it('should handle API error responses', async () => {
      fetchSpy.mockResolvedValue({ ok: false, status: 429, text: async () => 'Rate limited' });
      const adapter = new AnthropicAdapter(makeConfig());
      const response = await adapter.generateChatCompletion(makeChatRequest());
      expect(response.success).toBe(false);
    });

    it('should handle thinking mode with extra header', async () => {
      fetchSpy.mockResolvedValue({ ok: true, json: async () => ({ id: 'msg_1', content: [{ type: 'text', text: 'thinking reply' }], stop_reason: 'end_turn', usage: { input_tokens: 5, output_tokens: 5 } }) });

      const adapter = new AnthropicAdapter(makeConfig());
      await adapter.generateChatCompletion(makeChatRequest([{ role: 'user', content: 'think' }], { thinking: { type: 'enabled', budget_tokens: 1024 } }));
      const body = JSON.parse(fetchSpy.mock.calls[0][1].body);
      expect(body.thinking).toEqual({ type: 'enabled', budget_tokens: 1024 });
      expect(fetchSpy.mock.calls[0][1].headers['anthropic-beta']).toBe('output-128k-2025-02-19');
    });

    it('should handle content blocks with thinking type', async () => {
      fetchSpy.mockResolvedValue({ ok: true, json: async () => ({ id: 'msg_1', content: [{ type: 'thinking', text: 'I am thinking...' }, { type: 'text', text: 'Final answer' }], stop_reason: 'end_turn', usage: { input_tokens: 10, output_tokens: 20 } }) });

      const adapter = new AnthropicAdapter(makeConfig());
      const response = await adapter.generateChatCompletion(makeChatRequest());
      expect(response.content).toBe('Final answer');
      expect((response as any).extra?.thinking).toBe('I am thinking...');
    });
  });

  describe('generateCompletion', () => {
    it('should convert completion to messages request', async () => {
      fetchSpy.mockResolvedValue({ ok: true, json: async () => ({ id: 'msg_1', content: [{ type: 'text', text: 'completion text' }], stop_reason: 'stop', usage: { input_tokens: 3, output_tokens: 3 } }) });

      const adapter = new AnthropicAdapter(makeConfig());
      const response = await adapter.generateCompletion(makeCompletionRequest());
      expect(response.success).toBe(true);
      expect(response.content).toBe('completion text');
    });
  });

  describe('generateEmbedding', () => {
    it('should call embeddings endpoint', async () => {
      fetchSpy.mockResolvedValue({ ok: true, json: async () => ({ data: [{ embedding: [0.1, 0.2], index: 0 }], usage: { input_tokens: 3 } }) });

      const adapter = new AnthropicAdapter(makeConfig());
      const response = await adapter.generateEmbedding(makeEmbeddingRequest());
      expect(response.success).toBe(true);
      const callUrl = fetchSpy.mock.calls[0][0] as string;
      expect(callUrl).toContain('/embeddings');
    });
  });

  describe('healthCheck', () => {
    it('should return healthy when models endpoint responds', async () => {
      fetchSpy.mockResolvedValue({ ok: true });
      const adapter = new AnthropicAdapter(makeConfig());
      const result = await adapter.healthCheck();
      expect(result.status).toBe('healthy');
    });

    it('should return unhealthy when API key missing', async () => {
      const adapter = new AnthropicAdapter(makeConfig({ apiKey: '' }));
      const result = await adapter.healthCheck();
      expect(result.status).toBe('unhealthy');
    });
  });

  describe('caching', () => {
    it('should cache and return cached responses', async () => {
      fetchSpy.mockResolvedValue({ ok: true, json: async () => ({ id: 'msg_1', content: [{ type: 'text', text: 'cached' }], stop_reason: 'stop', usage: { input_tokens: 1, output_tokens: 1 } }) });

      const adapter = new AnthropicAdapter(makeConfig({ cache: { enabled: true } }));
      await adapter.generateChatCompletion(makeChatRequest());
      await adapter.generateChatCompletion(makeChatRequest());
      expect(fetchSpy).toHaveBeenCalledTimes(1);
    });

    it('should clear cache', async () => {
      fetchSpy.mockResolvedValue({ ok: true, json: async () => ({ id: 'msg_1', content: [{ type: 'text', text: 'clear me' }], stop_reason: 'stop', usage: { input_tokens: 1, output_tokens: 1 } }) });

      const adapter = new AnthropicAdapter(makeConfig({ cache: { enabled: true } }));
      await adapter.generateChatCompletion(makeChatRequest());
      await adapter.clearCache();
      await adapter.generateChatCompletion(makeChatRequest());
      expect(fetchSpy).toHaveBeenCalledTimes(2);
    });
  });

  describe('parseStreamChunk', () => {
    let adapter: AnthropicAdapter;
    beforeEach(() => { adapter = new AnthropicAdapter(makeConfig()); });

    it('should parse thinking_delta', () => {
      const result = (adapter as any).parseStreamChunk({ type: 'thinking_delta', delta: { thinking: 'I am reasoning...' } });
      expect(result.thinking).toBe('I am reasoning...');
      expect(result.eventType).toBe('thinking_delta');
    });

    it('should parse signature event', () => {
      const result = (adapter as any).parseStreamChunk({ type: 'signature' });
      expect(result.eventType).toBe('signature');
    });

    it('should parse content_block_delta', () => {
      const result = (adapter as any).parseStreamChunk({ type: 'content_block_delta', delta: { text: 'Hello', tokens: 3 } });
      expect(result.text).toBe('Hello');
      expect(result.tokens).toBe(3);
    });

    it('should parse message_stop', () => {
      const result = (adapter as any).parseStreamChunk({ type: 'message_stop' });
      expect(result.finished).toBe(true);
      expect(result.finishedReason).toBe('stop');
    });

    it('should parse message_delta with stop_reason', () => {
      const result = (adapter as any).parseStreamChunk({ type: 'message_delta', delta: { stop_reason: 'max_tokens' } });
      expect(result.finished).toBe(true);
      expect(result.finishedReason).toBe('max_tokens');
    });

    it('should handle unknown event type', () => {
      const result = (adapter as any).parseStreamChunk({ type: 'ping' });
      expect(result.text).toBe('');
      expect(result.finished).toBe(false);
    });
  });

  describe('streaming (integration via callModelStream)', () => {
    it('should reject streaming for embedding request', async () => {
      fetchSpy.mockRejectedValue(new Error('Should not be called'));
      const adapter = new AnthropicAdapter(makeConfig());
      await expect(async () => {
        for await (const _ of adapter.streamCompletion(makeEmbeddingRequest() as any)) { /* */ }
      }).rejects.toThrow();
    });
  });
});
