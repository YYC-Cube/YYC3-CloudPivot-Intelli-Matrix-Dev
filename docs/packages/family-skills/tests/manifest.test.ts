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
import { defineSkill } from '../src/registry/SkillManifest.js';

describe('SkillManifest', () => {
  it('defines a skill with execute', async () => {
    const skill = defineSkill(
      {
        id: 'test-skill',
        name: 'Test Skill',
        version: '1.0.0',
        owner: 'qianhang',
        description: 'A test skill',
        category: 'nlu',
        parameters: [{ name: 'input', type: 'string', required: true, description: 'test input' }],
      },
      async (params) => ({ result: `processed: ${params.input}` }),
    );

    expect(skill.id).toBe('test-skill');
    expect(skill.category).toBe('nlu');

    const result = await skill.execute({ params: { input: 'hello' }, memberId: 'qianhang', sessionId: 'test' });
    expect(result.success).toBe(true);
    expect((result.data as any).result).toBe('processed: hello');
  });

  it('wraps execute errors in SkillResult', async () => {
    const skill = defineSkill(
      {
        id: 'failing-skill',
        name: 'Failing Skill',
        version: '1.0.0',
        owner: 'thinker',
        description: 'Always fails',
        category: 'analysis',
        parameters: [],
      },
      async () => { throw new Error('intentional error'); },
    );

    const result = await skill.execute({ params: {}, memberId: 'thinker', sessionId: 'test' });
    expect(result.success).toBe(false);
    expect(result.error).toBe('intentional error');
  });

  it('tracks executionTime', async () => {
    const skill = defineSkill(
      {
        id: 'slow-skill',
        name: 'Slow Skill',
        version: '1.0.0',
        owner: 'prophet',
        description: 'Takes time',
        category: 'prediction',
        parameters: [],
      },
      async () => {
        await new Promise((r) => setTimeout(r, 20));
        return 'done';
      },
    );

    const result = await skill.execute({ params: {}, memberId: 'prophet', sessionId: 'test' });
    expect(result.success).toBe(true);
    expect(result.executionTime).toBeGreaterThanOrEqual(15);
  });

  it('includes validate function when provided', () => {
    const skill = defineSkill(
      {
        id: 'validated-skill',
        name: 'Validated',
        version: '1.0.0',
        owner: 'guardian',
        description: 'Has validation',
        category: 'security',
        parameters: [],
      },
      async () => 'ok',
      (params) => {
        if (!params['required']) return { valid: false, errors: ['required is missing'] };
        return { valid: true };
      },
    );

    expect(skill.validate).toBeDefined();
    const invalid = skill.validate!({});
    expect(invalid.valid).toBe(false);
    expect(invalid.errors).toContain('required is missing');

    const valid = skill.validate!({ required: true });
    expect(valid.valid).toBe(true);
  });

  it('preserves MCP config', () => {
    const skill = defineSkill(
      {
        id: 'mcp-skill',
        name: 'MCP Skill',
        version: '1.0.0',
        owner: 'tianshu',
        description: 'MCP enabled',
        category: 'orchestration',
        parameters: [],
        mcp: { server: 'yyc3-tools', tool: 'orchestrate' },
      },
      async () => 'ok',
    );

    expect(skill.mcp).toEqual({ server: 'yyc3-tools', tool: 'orchestrate' });
  });
});
