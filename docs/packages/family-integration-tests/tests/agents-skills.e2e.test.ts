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

import { QianHangAgent, TianShuAgent } from '@yyc3/family-agents';
import { defineSkill, FamilySkillRegistry } from '@yyc3/family-skills';
import { describe, expect, it } from 'vitest';

describe('Phase 1 Integration: QianHang → TianShu E2E', () => {
  it('千行分类意图 → 天枢路由', async () => {
    const qianhang = new QianHangAgent();
    const tianshu = new TianShuAgent();

    expect(qianhang.greet()).toContain('千行');
    expect(tianshu.greet()).toContain('天枢');

    const intent = await qianhang.classifyIntent('帮我分析这份数据报表');
    expect(intent.primary).toBe('analysis');
    expect(intent.confidence).toBeGreaterThan(0);

    const route = await tianshu.route(intent);
    expect(route.assignee).toBe('thinker');
    expect(route.reasoning).toContain('analysis');
  });

  it('代码意图路由至宗师', async () => {
    const qianhang = new QianHangAgent();
    const tianshu = new TianShuAgent();

    const intent = await qianhang.classifyIntent('这段代码有bug需要修复');
    expect(intent.primary).toBe('code');

    const route = await tianshu.route(intent);
    expect(route.assignee).toBe('grandmaster');
  });

  it('安全意图路由至守护', async () => {
    const qianhang = new QianHangAgent();
    const tianshu = new TianShuAgent();

    const intent = await qianhang.classifyIntent('进行安全审计检查');
    expect(intent.primary).toBe('security');

    const route = await tianshu.route(intent);
    expect(route.assignee).toBe('guardian');
  });

  it('创意意图路由至灵韵', async () => {
    const qianhang = new QianHangAgent();
    const tianshu = new TianShuAgent();

    const intent = await qianhang.classifyIntent('帮我设计一个创意方案');
    expect(intent.primary).toBe('creative');

    const route = await tianshu.route(intent);
    expect(route.assignee).toBe('grace');
  });

  it('PDA-M-R cycle produces history', async () => {
    const qianhang = new QianHangAgent();
    await qianhang.classifyIntent('测试');

    // 集成测试需断言内部 PDAMR 状态 (protected), 最小化类型断言
    const internals = qianhang as unknown as {
      pdamr: { getState: () => { phase: string; completedAt: number }; getHistory: () => Array<{ phase: string }> };
    };
    const state = internals.pdamr.getState();
    expect(state.phase).toBe('reflect');
    expect(state.completedAt).toBeGreaterThan(0);

    const history = internals.pdamr.getHistory();
    expect(history.length).toBe(5);
    expect(history.map(h => h.phase)).toEqual([
      'perceive', 'decide', 'act', 'memory', 'reflect',
    ]);
  });

  it('FamilySkillRegistry registers and executes skill', async () => {
    const registry = new FamilySkillRegistry();

    const skill = defineSkill(
      {
        id: 'qianhang:intent-classify',
        name: '意图分类',
        version: '1.0.0',
        owner: 'qianhang',
        description: '意图分类',
        category: 'nlu',
        parameters: [],
      },
      async (params) => ({ intent: 'analysis', text: params.text }),
    );

    const result = await registry.register(skill);
    expect(result.success).toBe(true);

    const execResult = await registry.execute('qianhang:intent-classify', {
      params: { text: '测试' },
      memberId: 'qianhang',
      sessionId: 'test-session',
    });
    expect(execResult.success).toBe(true);

    const stats = registry.getStats();
    expect(stats.total).toBe(1);
    expect(stats.byOwner.qianhang).toBe(1);
  });
});
