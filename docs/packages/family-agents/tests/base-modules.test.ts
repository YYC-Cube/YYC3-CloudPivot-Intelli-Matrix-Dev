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

import { describe, it, expect, vi } from 'vitest';
import { PDAMRCycle } from '../src/base/PDAMRCycle.js';
import type { PerceptionResult, DecisionResult, ActionResult, MemoryEntry, ReflectionResult } from '../src/base/PDAMRCycle.js';
import { AgentPersona } from '../src/base/AgentPersona.js';
import { FAMILY_PROFILES } from '../src/base/FamilyTypes.js';
import type { FamilyMemberId } from '../src/base/FamilyTypes.js';

class TestPDAMRCycle extends PDAMRCycle {
  async perceive(input: unknown): Promise<PerceptionResult> {
    return { raw: input, filtered: `perceived: ${input}` };
  }

  async decide(perception: PerceptionResult): Promise<DecisionResult> {
    return {
      action: 'respond',
      parameters: { data: perception.filtered },
      confidence: 0.9,
      reasoning: 'Test decision',
    };
  }

  async act(decision: DecisionResult): Promise<ActionResult> {
    return {
      success: true,
      data: `acted on: ${decision.action}`,
      executionTime: 5,
    };
  }

  remember(entry: Omit<MemoryEntry, 'timestamp'>): void {
    this.memory.push({ ...entry, timestamp: Date.now() });
  }

  async reflect(memory: MemoryEntry[]): Promise<ReflectionResult> {
    return {
      score: 0.85,
      observations: ['Performed well'],
      improvements: ['Could be faster'],
    };
  }
}

describe('PDAMRCycle', () => {
  it('runs full cycle through all 5 phases', async () => {
    const cycle = new TestPDAMRCycle('qianhang');
    const result = await cycle.run('test input');

    expect(result.score).toBe(0.85);
    expect(result.observations).toContain('Performed well');
    expect(result.improvements).toContain('Could be faster');
  });

  it('tracks state through phases', async () => {
    const cycle = new TestPDAMRCycle('thinker');
    const state = cycle.getState();
    expect(state.phase).toBe('perceive');

    await cycle.run('input');

    const finalState = cycle.getState();
    expect(finalState.phase).toBe('reflect');
    expect(finalState.completedAt).toBeDefined();
  });

  it('maintains history of all phases', async () => {
    const cycle = new TestPDAMRCycle('prophet');
    await cycle.run('input');
    const history = cycle.getHistory();
    expect(history.length).toBeGreaterThanOrEqual(5);
    const phases = history.map(h => h.phase);
    expect(phases).toContain('perceive');
    expect(phases).toContain('decide');
    expect(phases).toContain('act');
    expect(phases).toContain('memory');
    expect(phases).toContain('reflect');
  });

  it('stores memory entries', async () => {
    const cycle = new TestPDAMRCycle('bole');
    await cycle.run('input');
    const memory = cycle.getMemory();
    expect(memory.length).toBe(1);
    expect(memory[0].perception.filtered).toContain('perceived');
  });

  it('resets state and history', async () => {
    const cycle = new TestPDAMRCycle('grace');
    await cycle.run('input');
    expect(cycle.getHistory().length).toBeGreaterThan(0);

    cycle.reset();
    expect(cycle.getHistory()).toHaveLength(0);
    expect(cycle.getState().phase).toBe('perceive');
  });
});

describe('AgentPersona', () => {
  it('creates persona from profile', () => {
    const profile = FAMILY_PROFILES.qianhang;
    const persona = new AgentPersona(profile);
    expect(persona.config.memberId).toBe('qianhang');
    expect(persona.config.name).toBe('言启·千行');
    expect(persona.config.emotionTone).toBe('warm');
  });

  it('applies emotion tone to traits', () => {
    const warmPersona = new AgentPersona(FAMILY_PROFILES.qianhang);
    expect(warmPersona.config.traits.warmth).toBeGreaterThan(0.5);

    const sternPersona = new AgentPersona(FAMILY_PROFILES.guardian);
    expect(sternPersona.config.traits.formality).toBeGreaterThan(0.5);
  });

  it('picks phrases from tone patterns', () => {
    const persona = new AgentPersona(FAMILY_PROFILES.qianhang);
    const greeting = persona.pickPhrase('greeting');
    expect(typeof greeting).toBe('string');
    expect(greeting.length).toBeGreaterThan(0);
  });

  it('formats response with icon', () => {
    const persona = new AgentPersona(FAMILY_PROFILES.grace);
    const formatted = persona.formatResponse('Hello');
    expect(formatted).toContain('🎨');
    expect(formatted).toContain('Hello');
  });

  it('generates system prompt from profile', () => {
    const persona = new AgentPersona(FAMILY_PROFILES.tianshu);
    expect(persona.config.systemPrompt).toContain('天枢');
    expect(persona.config.systemPrompt).toContain('motto' in FAMILY_PROFILES.tianshu ? '' : '');
  });

  it('allows overrides', () => {
    const persona = new AgentPersona(FAMILY_PROFILES.thinker, {
      traits: { formality: 1.0, warmth: 0, directness: 0.5, creativity: 0.5, precision: 0.5, humor: 0 },
    });
    expect(persona.config.traits.formality).toBe(1.0);
    expect(persona.config.traits.warmth).toBe(0);
  });

  it('all 8 members have valid personas', () => {
    const members: FamilyMemberId[] = ['qianhang', 'thinker', 'prophet', 'bole', 'tianshu', 'guardian', 'grandmaster', 'grace'];
    for (const memberId of members) {
      const persona = new AgentPersona(FAMILY_PROFILES[memberId]);
      expect(persona.config.memberId).toBe(memberId);
      expect(persona.config.tonePatterns.greeting.length).toBeGreaterThan(0);
    }
  });
});
