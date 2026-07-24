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
 * @file nvidia-skills.test.ts
 * @description NVIDIA AI Enterprise 技能单元测试
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { nimChatSkill, nemoGuardrailsSkill, rivaTTSSkill } from '../src/skills/nvidia/index.js';
import type { SkillExecutionContext } from '@yyc3/family-agents';

function makeCtx(params: Record<string, unknown>): SkillExecutionContext {
  return { params, memberId: 'tianshu', sessionId: 'test-session' };
}

// ═══ NIM Chat Skill ═══

describe('nimChatSkill', () => {
  beforeEach(() => {
    vi.spyOn(globalThis, 'fetch').mockReset();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should have correct metadata', () => {
    expect(nimChatSkill.id).toBe('nim-llm-chat');
    expect(nimChatSkill.category).toBe('nvidia');
    expect(nimChatSkill.tags).toContain('nim');
  });

  it('should return success with chat result on valid response', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        choices: [{ message: { content: 'Hello from NIM!' } }],
        usage: { prompt_tokens: 10, completion_tokens: 5, total_tokens: 15 },
      }),
    } as Response);

    const result = await nimChatSkill.execute(
      makeCtx({ messages: [{ role: 'user', content: 'Hi' }] }),
    );

    expect(result.success).toBe(true);
    expect((result.data as any).text).toBe('Hello from NIM!');
    expect((result.data as any).usage.totalTokens).toBe(15);
    expect(result.executionTime).toBeGreaterThanOrEqual(0);
  });

  it('should return error on API failure', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: false,
      status: 401,
      statusText: 'Unauthorized',
    } as Response);

    const result = await nimChatSkill.execute(
      makeCtx({ messages: [{ role: 'user', content: 'test' }] }),
    );

    expect(result.success).toBe(false);
    expect(result.error).toContain('401');
  });

  it('should handle network errors gracefully', async () => {
    vi.mocked(fetch).mockRejectedValueOnce(new Error('ECONNREFUSED'));

    const result = await nimChatSkill.execute(
      makeCtx({ messages: [] }),
    );

    expect(result.success).toBe(false);
    expect(result.error).toContain('ECONNREFUSED');
  });
});

// ═══ NeMo Guardrails Skill ═══

describe('nemoGuardrailsSkill', () => {
  beforeEach(() => {
    vi.spyOn(globalThis, 'fetch').mockReset();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should have correct metadata', () => {
    expect(nemoGuardrailsSkill.id).toBe('nemo-guardrails');
    expect(nemoGuardrailsSkill.category).toBe('nvidia');
    expect(nemoGuardrailsSkill.tags).toContain('guardrails');
  });

  it('should return passed=true when content is safe', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ passed: true, violations: [] }),
    } as Response);

    const result = await nemoGuardrailsSkill.execute(
      makeCtx({ text: 'Safe content' }),
    );

    expect(result.success).toBe(true);
    expect((result.data as any).passed).toBe(true);
  });

  it('should return violations when content is blocked', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        passed: false,
        violations: [{ topic: 'hate_speech', severity: 0.9, action: 'block' }],
      }),
    } as Response);

    const result = await nemoGuardrailsSkill.execute(
      makeCtx({ text: 'Harmful content' }),
    );

    expect(result.success).toBe(true);
    expect((result.data as any).passed).toBe(false);
    expect((result.data as any).violations).toHaveLength(1);
  });
});

// ═══ RIVA TTS Skill ═══

describe('rivaTTSSkill', () => {
  beforeEach(() => {
    vi.spyOn(globalThis, 'fetch').mockReset();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should have correct metadata', () => {
    expect(rivaTTSSkill.id).toBe('riva-tts');
    expect(rivaTTSSkill.category).toBe('nvidia');
    expect(rivaTTSSkill.tags).toContain('tts');
  });

  it('should return audio data on successful TTS', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        audioBase64: 'dGVzdCBhdWRpbw==',
        audioFormat: 'wav',
        durationMs: 1500,
      }),
    } as Response);

    const result = await rivaTTSSkill.execute(
      makeCtx({ text: 'Hello world' }),
    );

    expect(result.success).toBe(true);
    expect((result.data as any).audioBase64).toBe('dGVzdCBhdWRpbw==');
    expect((result.data as any).audioFormat).toBe('wav');
  });
});
