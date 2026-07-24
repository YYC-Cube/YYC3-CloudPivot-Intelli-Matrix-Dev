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
import { GeminiAdapter } from '../src/model/GeminiAdapter';
import { ModelProvider } from '../src/deps/model-types';
import { metrics } from '../src/deps/metrics';

function makeConfig(overrides?: Record<string, unknown>) {
  return {
    provider: ModelProvider.GOOGLE,
    model: 'gemini-2.0-flash',
    apiKey: 'test-gemini-key',
    ...overrides,
  };
}

function makeChatRequest(messages = [{ role: 'user', content: 'Hello' }], overrides?: Record<string, unknown>) {
  return { provider: ModelProvider.GOOGLE, model: 'gemini-2.0-flash', messages, maxTokens: 100, temperature: 0.7, ...overrides };
}

function makeCompletionRequest(prompt = 'Say hello') {
  return { provider: ModelProvider.GOOGLE, model: 'gemini-2.0-flash', type: 'llm', prompt, maxTokens: 100, temperature: 0.7 };
}

function makeEmbeddingRequest(input = 'Hello world') {
  return { model: 'text-embedding-004', input };
}

describe('GeminiAdapter', () => {
  let fetchSpy: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    fetchSpy = vi.fn();
    (globalThis as any).fetch = fetchSpy;
    metrics.reset();
  });

  describe('buildGeminiParts', () => {
    it('should convert string to text part', () => {
      const parts = GeminiAdapter.buildGeminiParts('Hello');
      expect(parts).toEqual([{ text: 'Hello' }]);
    });

    it('should convert text block', () => {
      const parts = GeminiAdapter.buildGeminiParts([{ type: 'text', text: 'Hi' }]);
      expect(parts).toEqual([{ text: 'Hi' }]);
    });

    it('should convert image block', () => {
      const parts = GeminiAdapter.buildGeminiParts([{ type: 'image', mimeType: 'image/jpeg', data: 'base64data' }]);
      expect(parts).toEqual([{ inlineData: { mimeType: 'image/jpeg', data: 'base64data' } }]);
    });

    it('should convert file block', () => {
      const parts = GeminiAdapter.buildGeminiParts([{ type: 'file', mimeType: 'application/pdf', fileUri: 'gs://bucket/doc.pdf' }]);
      expect(parts).toEqual([{ fileData: { mimeType: 'application/pdf', fileUri: 'gs://bucket/doc.pdf' } }]);
    });

    it('should handle mixed content', () => {
      const parts = GeminiAdapter.buildGeminiParts([
        { type: 'text', text: 'Describe' },
        { type: 'image', data: 'imgdata' },
      ]);
      expect(parts).toHaveLength(2);
      expect(parts[0]).toEqual({ text: 'Describe' });
      expect(parts[1]).toHaveProperty('inlineData');
    });

    it('should use defaults when mimeType/data missing', () => {
      const parts = GeminiAdapter.buildGeminiParts([{ type: 'image' } as any]);
      expect(parts[0]).toEqual({ inlineData: { mimeType: 'image/png', data: '' } });
    });
  });

  describe('constructor & initialize', () => {
    it('should create adapter with config', () => {
      const adapter = new GeminiAdapter(makeConfig());
      expect(adapter.getConfig().model).toBe('gemini-2.0-flash');
    });

    it('should throw on initialize without API key', async () => {
      const adapter = new GeminiAdapter(makeConfig({ apiKey: '' }));
      await expect(adapter.initialize()).rejects.toThrow('API key is required');
    });

    it('should initialize with valid API key', async () => {
      const adapter = new GeminiAdapter(makeConfig());
      await expect(adapter.initialize()).resolves.toBeUndefined();
    });
  });

  describe('generateChatCompletion', () => {
    it('should call generateContent endpoint with correct body', async () => {
      fetchSpy.mockResolvedValue({
        ok: true,
        json: async () => ({
          candidates: [{ content: { parts: [{ text: 'Gemini reply' }] }, finishReason: 'STOP' }],
          usageMetadata: { promptTokenCount: 10, candidatesTokenCount: 5, totalTokenCount: 15 },
        }),
      });

      const adapter = new GeminiAdapter(makeConfig());
      const response = await adapter.generateChatCompletion(makeChatRequest());

      expect(response.success).toBe(true);
      expect(response.content).toBe('Gemini reply');
      const callUrl = fetchSpy.mock.calls[0][0] as string;
      expect(callUrl).toContain('generateContent');
      expect(callUrl).toContain('key=test-gemini-key');
    });

    it('should map user/model roles', async () => {
      fetchSpy.mockResolvedValue({
        ok: true,
        json: async () => ({ candidates: [{ content: { parts: [{ text: 'ok' }] }, finishReason: 'STOP' }], usageMetadata: {} }),
      });

      const adapter = new GeminiAdapter(makeConfig());
      await adapter.generateChatCompletion(
        makeChatRequest([
          { role: 'system', content: 'Be concise' },
          { role: 'user', content: 'Hi' },
          { role: 'assistant', content: 'Hello' },
        ])
      );

      const body = JSON.parse(fetchSpy.mock.calls[0][1].body);
      expect(body.contents).toHaveLength(2);
      expect(body.contents[0].role).toBe('user');
      expect(body.contents[1].role).toBe('model');
      expect(body.systemInstruction).toBeDefined();
    });

    it('should support safetySettings', async () => {
      fetchSpy.mockResolvedValue({
        ok: true,
        json: async () => ({ candidates: [{ content: { parts: [{ text: 'safe' }] }, finishReason: 'STOP' }], usageMetadata: {} }),
      });

      const adapter = new GeminiAdapter(makeConfig());
      await adapter.generateChatCompletion(makeChatRequest([{ role: 'user', content: 'unsafe' }], {
        safetySettings: [{ category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_ONLY_HIGH' }],
      }));

      const body = JSON.parse(fetchSpy.mock.calls[0][1].body);
      expect(body.safetySettings).toBeDefined();
      expect(body.safetySettings[0].category).toBe('HARM_CATEGORY_HATE_SPEECH');
    });

    it('should handle API errors', async () => {
      fetchSpy.mockResolvedValue({ ok: false, status: 400, text: async () => 'Bad request' });
      const adapter = new GeminiAdapter(makeConfig());
      const response = await adapter.generateChatCompletion(makeChatRequest());
      expect(response.success).toBe(false);
    });
  });

  describe('generateCompletion', () => {
    it('should convert prompt to content request', async () => {
      fetchSpy.mockResolvedValue({
        ok: true,
        json: async () => ({ candidates: [{ content: { parts: [{ text: 'completion text' }] }, finishReason: 'STOP' }], usageMetadata: {} }),
      });

      const adapter = new GeminiAdapter(makeConfig());
      const response = await adapter.generateCompletion(makeCompletionRequest());
      expect(response.success).toBe(true);
      expect(response.content).toBe('completion text');
    });
  });

  describe('generateEmbedding', () => {
    it('should call embedContent endpoint', async () => {
      fetchSpy.mockResolvedValue({
        ok: true,
        json: async () => ({ embedding: { values: [0.1, 0.2, 0.3] } }),
      });

      const adapter = new GeminiAdapter(makeConfig());
      const response = await adapter.generateEmbedding(makeEmbeddingRequest());
      expect(response.success).toBe(true);
      const callUrl = fetchSpy.mock.calls[0][0] as string;
      expect(callUrl).toContain('embedContent');
    });
  });

  describe('healthCheck', () => {
    it('should return healthy when models endpoint responds', async () => {
      fetchSpy.mockResolvedValue({ ok: true, json: async () => ({ models: [] }) });
      const adapter = new GeminiAdapter(makeConfig());
      const result = await adapter.healthCheck();
      expect(result.status).toBe('healthy');
    });

    it('should return unhealthy without API key', async () => {
      const adapter = new GeminiAdapter(makeConfig({ apiKey: '' }));
      const result = await adapter.healthCheck();
      expect(result.status).toBe('unhealthy');
    });
  });

  describe('streaming parseStreamChunk', () => {
    let adapter: GeminiAdapter;
    beforeEach(() => { adapter = new GeminiAdapter(makeConfig()); });

    it('should parse text from candidates', () => {
      const result = (adapter as any).parseStreamChunk({
        candidates: [{ content: { parts: [{ text: 'Hello' }, { text: ' World' }] } }],
      });
      expect(result.text).toBe('Hello World');
      expect(result.finished).toBe(false);
    });

    it('should detect finishReason', () => {
      const result = (adapter as any).parseStreamChunk({
        candidates: [{ content: { parts: [{ text: 'done' }] }, finishReason: 'STOP' }],
      });
      expect(result.finished).toBe(true);
      expect(result.finishedReason).toBe('STOP');
    });

    it('should handle empty candidates', () => {
      const result = (adapter as any).parseStreamChunk({});
      expect(result.text).toBe('');
      expect(result.finished).toBe(false);
    });
  });

  describe('caching', () => {
    it('should return cached response on repeated request', async () => {
      fetchSpy.mockResolvedValue({
        ok: true,
        json: async () => ({ candidates: [{ content: { parts: [{ text: 'cached' }] }, finishReason: 'STOP' }], usageMetadata: {} }),
      });

      const adapter = new GeminiAdapter(makeConfig({ cache: { enabled: true } }));
      await adapter.generateChatCompletion(makeChatRequest());
      await adapter.generateChatCompletion(makeChatRequest());
      expect(fetchSpy).toHaveBeenCalledTimes(1);
    });

    it('should clear cache', async () => {
      fetchSpy.mockResolvedValue({
        ok: true,
        json: async () => ({ candidates: [{ content: { parts: [{ text: 'x' }] }, finishReason: 'STOP' }], usageMetadata: {} }),
      });

      const adapter = new GeminiAdapter(makeConfig({ cache: { enabled: true } }));
      await adapter.generateChatCompletion(makeChatRequest());
      await adapter.clearCache();
      await adapter.generateChatCompletion(makeChatRequest());
      expect(fetchSpy).toHaveBeenCalledTimes(2);
    });
  });
});
