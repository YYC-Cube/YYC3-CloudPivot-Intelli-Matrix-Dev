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

import { describe, it, expect } from 'vitest';
import { QianHangAgent } from '../src/members/QianHangAgent';
import { TianShuAgent } from '../src/members/TianShuAgent';
import { ThinkerAgent } from '../src/members/ThinkerAgent';
import { ProphetAgent } from '../src/members/ProphetAgent';
import { BoleAgent } from '../src/members/BoleAgent';
import { GuardianAgent } from '../src/members/GuardianAgent';
import { GrandmasterAgent } from '../src/members/GrandmasterAgent';
import { GraceAgent } from '../src/members/GraceAgent';
import type { FamilyMemberId } from '../src/base/FamilyTypes';

describe('Phase 2: All 8 Family Members', () => {
  const agents = {
    qianhang: new QianHangAgent(),
    thinker: new ThinkerAgent(),
    prophet: new ProphetAgent(),
    bole: new BoleAgent(),
    tianshu: new TianShuAgent(),
    guardian: new GuardianAgent(),
    grandmaster: new GrandmasterAgent(),
    grace: new GraceAgent(),
  };

  const memberNames: Record<FamilyMemberId, string> = {
    qianhang: '言启·千行',
    thinker: '语枢·万物',
    prophet: '预见·先知',
    bole: '千里·伯乐',
    tianshu: '元启·天枢',
    guardian: '智云·守护',
    grandmaster: '格物·宗师',
    grace: '创想·灵韵',
  };

  it('all 8 agents instantiate with correct identity', () => {
    for (const [id, agent] of Object.entries(agents)) {
      expect(agent.memberId).toBe(id);
      expect(agent.getPersona().config.name).toBe(memberNames[id as FamilyMemberId]);
      expect(agent.greet()).toBeTruthy();
    }
  });

  it('each agent has at least 3 capabilities', () => {
    for (const agent of Object.values(agents)) {
      const caps = agent.getCapabilities();
      expect(caps.length).toBeGreaterThanOrEqual(3);
    }
  });

  it('each agent has PDA-M-R cycle that produces 5 phases', async () => {
    for (const agent of Object.values(agents)) {
      agent.pdamr.reset();
      await agent.pdamr.run('test input');
      const history = agent.pdamr.getHistory();
      expect(history.length).toBe(5);
      expect(history.map(h => h.phase)).toEqual([
        'perceive', 'decide', 'act', 'memory', 'reflect',
      ]);
    }
  });

  it('each agent has emotion state', () => {
    for (const agent of Object.values(agents)) {
      const emotion = agent.getEmotion();
      expect(emotion.memberId).toBe(agent.memberId);
      expect(emotion.tone).toBeTruthy();
      expect(typeof emotion.temperature).toBe('number');
    }
  });
});

describe('Phase 2: Full Family Orchestration E2E', () => {
  it('flow: "分析销售数据并预测趋势" → 千行→天枢→万物+先知', async () => {
    const qianhang = new QianHangAgent();
    const tianshu = new TianShuAgent();
    const thinker = new ThinkerAgent();
    const prophet = new ProphetAgent();

    const intent = await qianhang.classifyIntent('分析销售数据并预测趋势');
    expect(intent.primary).toBe('analysis');
    expect(intent.secondary).toBe('prediction');

    const route = await tianshu.route(intent);
    expect(route.assignee).toBe('thinker');

    const thinkerResult = await thinker.analyzeData({ data: [1, 2, 3] });
    expect(thinkerResult.confidence).toBeGreaterThan(0);

    const prediction = await prophet.predict({ metric: 'sales', data: [100, 120, 140] });
    expect(prediction.metric).toBe('sales');
    expect(prediction.trend).toBeTruthy();
  });

  it('flow: "检查代码质量" → 千行→天枢→宗师', async () => {
    const qianhang = new QianHangAgent();
    const tianshu = new TianShuAgent();
    const grandmaster = new GrandmasterAgent();

    const intent = await qianhang.classifyIntent('检查代码质量，做安全审计');
    expect(['code', 'quality', 'security']).toContain(intent.primary);

    const route = await tianshu.route(intent);
    expect(['grandmaster', 'guardian']).toContain(route.assignee);

    const analysis = await grandmaster.analyzeCode({ code: 'function test() {}' });
    expect(analysis.score).toBeGreaterThan(0);
  });

  it('flow: "设计一个创意方案" → 千行→天枢→灵韵', async () => {
    const qianhang = new QianHangAgent();
    const tianshu = new TianShuAgent();
    const grace = new GraceAgent();

    const intent = await qianhang.classifyIntent('帮我设计一个创意方案');
    expect(intent.primary).toBe('creative');

    const route = await tianshu.route(intent);
    expect(route.assignee).toBe('grace');

    const output = await grace.create({ prompt: '产品设计方案' });
    expect(output.content).toBeTruthy();
    expect(output.type).toBe('text');
  });

  it('flow: "推荐适合我的工具" → 千行→天枢→伯乐', async () => {
    const qianhang = new QianHangAgent();
    const tianshu = new TianShuAgent();
    const bole = new BoleAgent();

    const intent = await qianhang.classifyIntent('推荐适合我的工具');
    expect(intent.primary).toBe('recommendation');

    const route = await tianshu.route(intent);
    expect(route.assignee).toBe('bole');

    const profile = await bole.getProfile('user-001');
    expect(profile.userId).toBe('user-001');
  });

  it('flow: "检测安全威胁" → 千行→天枢→守护', async () => {
    const qianhang = new QianHangAgent();
    const tianshu = new TianShuAgent();
    const guardian = new GuardianAgent();

    const intent = await qianhang.classifyIntent('检测系统安全威胁');
    expect(intent.primary).toBe('security');

    const route = await tianshu.route(intent);
    expect(route.assignee).toBe('guardian');

    const scan = await guardian.scanThreats({ target: 'api-gateway' });
    expect(scan.overallRisk).toBeTruthy();
  });
});
