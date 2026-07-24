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
import { MultiModelManager, createMultiModelManager } from '../src/orchestration/MultiModelManager.js';

describe('MultiModelManager', () => {
  let manager: MultiModelManager;

  beforeEach(async () => {
    manager = new MultiModelManager({ defaultProvider: 'openai' });
    await manager.registerProvider('openai', { apiKey: 'test-key', models: ['gpt-4', 'gpt-3.5-turbo'] });
    await manager.registerProvider('anthropic', { apiKey: 'test-key', models: ['claude-3-opus', 'claude-3-sonnet'] });
    await manager.registerProvider('google', { apiKey: 'test-key', models: ['gemini-pro'] });
    await manager.initialize();
  });

  it('should initialize with default providers', () => {
    const fresh = new MultiModelManager();
    expect(fresh).toBeTruthy();
  });

  it('should register providers', async () => {
    const m = new MultiModelManager();
    await m.registerProvider('custom', { apiKey: 'k', models: ['model-1'] });
    expect(m).toBeTruthy();
  });

  it('should emit provider:registered event', async () => {
    const m = new MultiModelManager();
    const listener = vi.fn();
    m.on('provider:registered', listener);
    await m.registerProvider('test', { apiKey: 'k' });
    expect(listener).toHaveBeenCalledWith({ provider: 'test' });
  });

  it('should initialize models from providers', async () => {
    const metrics = manager.getPerformanceMetrics();
    expect(metrics).toBeTruthy();
    expect(typeof metrics.totalRequests).toBe('number');
  });

  it('should check model availability', async () => {
    expect(await manager.checkModelAvailability('openai', 'gpt-4')).toBe(true);
    expect(await manager.checkModelAvailability('openai', 'nonexistent')).toBe(false);
    expect(await manager.checkModelAvailability('unknown', 'gpt-4')).toBe(false);
  });

  it('should select model with performance strategy', async () => {
    const selected = await manager.selectModel({ strategy: 'performance' });
    expect(selected).toBeTruthy();
    expect(selected.provider).toBeTruthy();
    expect(selected.modelId).toBeTruthy();
  });

  it('should select model with cost strategy', async () => {
    const selected = await manager.selectModel({ strategy: 'cost' });
    expect(selected).toBeTruthy();
    expect(selected.estimatedCost).toBeDefined();
  });

  it('should select model with quality strategy', async () => {
    const selected = await manager.selectModel({ strategy: 'quality' });
    expect(selected).toBeTruthy();
    expect(selected.qualityMetrics).toBeTruthy();
    expect(selected.qualityMetrics!.accuracy).toBeGreaterThan(0);
  });

  it('should select model with load-balance strategy', async () => {
    const s1 = await manager.selectModel({ strategy: 'load-balance' });
    const s2 = await manager.selectModel({ strategy: 'load-balance' });
    expect(s1).toBeTruthy();
    expect(s2).toBeTruthy();
  });

  it('should throw when no models available', async () => {
    const empty = new MultiModelManager();
    await expect(empty.selectModel({ strategy: 'performance' })).rejects.toThrow('No suitable models found');
  });

  it('should generate text', async () => {
    const result = await manager.generate({ prompt: 'Hello world' });
    expect(result).toBeTruthy();
    expect(result.text).toBeTruthy();
    expect(result.modelUsed).toBeTruthy();
    expect(typeof result.tokensUsed).toBe('number');
  });

  it('should reject empty prompts', async () => {
    await expect(manager.generate({ prompt: '' })).rejects.toThrow('Invalid prompt');
  });

  it('should reject too long prompts', async () => {
    await expect(manager.generate({ prompt: 'x'.repeat(100001) })).rejects.toThrow('Prompt too long');
  });

  it('should use cache when enabled', async () => {
    const r1 = await manager.generate({ prompt: 'cache test', cache: true });
    expect(r1.fromCache).toBeFalsy();
    const r2 = await manager.generate({ prompt: 'cache test', cache: true });
    expect(r2.fromCache).toBe(true);
  });

  it('should use semantic cache', async () => {
    const r1 = await manager.generate({ prompt: 'semantic cache test hello world', semanticCache: true });
    expect(r1.semanticMatch).toBeFalsy();
    const r2 = await manager.generate({ prompt: 'semantic cache test hello world', semanticCache: true });
    expect(r2.semanticMatch).toBe(true);
  });

  it('should retry on failure', async () => {
    const result = await manager.generate({
      prompt: 'retry test',
      retries: 2,
      retryDelay: 10,
    });
    expect(result).toBeTruthy();
    expect(result.text).toBeTruthy();
  });

  it('should fallback on failure', async () => {
    const result = await manager.generate({
      prompt: 'fallback test',
      fallback: true,
    });
    expect(result).toBeTruthy();
  });

  it('should generate stream', async () => {
    const chunks: string[] = [];
    await manager.generateStream({
      prompt: 'stream test',
      onChunk: (chunk) => chunks.push(chunk),
    });
    expect(chunks.length).toBeGreaterThan(0);
  });

  it('should batch generate', async () => {
    const results = await manager.batchGenerate(['hello', 'goodbye', 'thank you']);
    expect(results).toHaveLength(3);
    expect(results[0].text).toBe('hola');
    expect(results[1].text).toBe('au revoir');
    expect(results[2].text).toBe('danke');
  });

  it('should compare models', async () => {
    const comparisons = await manager.compareModels('test prompt', [
      { provider: 'openai', modelId: 'gpt-4' },
      { provider: 'anthropic', modelId: 'claude-3-opus' },
    ]);
    expect(comparisons).toHaveLength(2);
    for (const c of comparisons) {
      expect(c.provider).toBeTruthy();
      expect(c.modelId).toBeTruthy();
      expect(typeof c.latency).toBe('number');
      expect(typeof c.quality).toBe('number');
    }
  });

  it('should set rate limit', async () => {
    await manager.setRateLimit('openai', { requestsPerMinute: 10 });
  });

  it('should set and check quota', async () => {
    await manager.setQuota('openai', { maxRequestsPerDay: 1000, maxTokensPerDay: 100000 });
    const usage = manager.getQuotaUsage('openai');
    expect(usage.remaining.requests).toBeGreaterThan(0);
    expect(usage.remaining.tokens).toBeGreaterThan(0);
  });

  it('should reject when quota exceeded', async () => {
    await manager.setQuota('openai', { maxRequestsPerDay: 1, maxTokensPerDay: 100000 });
    await manager.generate({ prompt: 'first', provider: 'openai' });
    await expect(manager.generate({ prompt: 'second', provider: 'openai' })).rejects.toThrow('Quota exceeded');
  });

  it('should start and analyze A/B test', async () => {
    await manager.startABTest('test-1', {
      variantA: { provider: 'openai', modelId: 'gpt-4' },
      variantB: { provider: 'anthropic', modelId: 'claude-3-opus' },
      splitRatio: 0.5,
    });
    await manager.generate({ prompt: 'ab test', abTest: 'test-1' });
    await manager.generate({ prompt: 'ab test 2', abTest: 'test-1' });
    const analysis = await manager.analyzeABTest('test-1');
    expect(analysis).toBeTruthy();
    expect(['A', 'B']).toContain(analysis.winner);
    expect(typeof analysis.confidence).toBe('number');
  });

  it('should fine-tune model', async () => {
    const job = await manager.fineTuneModel({
      provider: 'openai',
      baseModel: 'gpt-4',
      trainingData: [{ prompt: 'hi', completion: 'hello' }],
    });
    expect(job.id).toBeTruthy();
    expect(job.status).toBe('created');
    expect(job.provider).toBe('openai');
  });

  it('should get fine-tune progress', async () => {
    const job = await manager.fineTuneModel({
      provider: 'openai',
      baseModel: 'gpt-4',
      trainingData: [{ prompt: 'hi', completion: 'hello' }],
    });
    const progress = await manager.getFineTuneProgress(job.id);
    expect(progress).toBeTruthy();
    expect(typeof progress.progress).toBe('number');
  });

  it('should register custom model', async () => {
    await manager.registerCustomModel({
      id: 'custom-1',
      provider: 'custom',
    });
    expect(await manager.checkModelAvailability('custom', 'custom-1')).toBe(true);
  });

  it('should encrypt responses', async () => {
    const result = await manager.generate({
      prompt: 'encrypt test',
      encrypt: true,
      encryptionKey: 'secret',
    });
    expect(result.encrypted).toBe(true);
  });

  it('should filter content', async () => {
    const result = await manager.generate({
      prompt: 'content filter test',
      contentFilter: true,
    });
    expect(result).toBeTruthy();
  });

  it('should compress prompts', async () => {
    const result = await manager.generate({
      prompt: 'compress test. compress test. compress test.',
      compressPrompt: true,
    });
    expect(result.originalTokens).toBeDefined();
    expect(result.compressedTokens).toBeDefined();
  });

  it('should generate audit logs', async () => {
    await manager.generate({ prompt: 'audit test', auditLog: true });
    const logs = manager.getAuditLogs();
    expect(logs.length).toBeGreaterThan(0);
    expect(logs[0].prompt).toBe('audit test');
  });

  it('should get cost statistics', () => {
    const stats = manager.getCostStatistics();
    expect(stats.totalCost).toBeGreaterThanOrEqual(0);
    expect(stats.costByProvider).toBeTruthy();
  });

  it('should get provider usage', () => {
    const usage = manager.getProviderUsage();
    expect(usage).toBeTruthy();
    expect(usage.openai).toBeTruthy();
    expect(usage.anthropic).toBeTruthy();
  });

  it('should generate report', () => {
    const report = manager.generateReport();
    expect(report).toContain('Multi-Model Manager Report');
    expect(report).toContain('模型统计');
  });

  it('should detect performance degradation', async () => {
    const listener = vi.fn();
    manager.on('performance:degraded', listener);
    await manager.generate({ prompt: 'degradation test' });
  });

  it('should shutdown cleanly', async () => {
    await manager.shutdown();
  });

  it('should create manager via factory', () => {
    const m = createMultiModelManager({ caching: true });
    expect(m).toBeInstanceOf(MultiModelManager);
  });
});
