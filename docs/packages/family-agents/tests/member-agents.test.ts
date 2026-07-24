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
import { QianHangAgent } from '../src/members/QianHangAgent.js';
import { TianShuAgent } from '../src/members/TianShuAgent.js';
import { ThinkerAgent } from '../src/members/ThinkerAgent.js';
import { ProphetAgent } from '../src/members/ProphetAgent.js';
import { BoleAgent } from '../src/members/BoleAgent.js';
import { GuardianAgent } from '../src/members/GuardianAgent.js';
import { GrandmasterAgent } from '../src/members/GrandmasterAgent.js';
import { GraceAgent } from '../src/members/GraceAgent.js';
import { FAMILY_PROFILES } from '../src/base/FamilyTypes.js';

describe('QianHangAgent (言启·千行)', () => {
  const agent = new QianHangAgent();

  it('should have correct identity', () => {
    expect(agent.memberId).toBe('qianhang');
    expect(agent.getId()).toBe('family-qianhang');
    expect(agent.getName()).toBe('言启·千行');
  });

  it('should have 3 capabilities', () => {
    const caps = agent.getCapabilities();
    expect(caps).toHaveLength(3);
    expect(caps.map(c => c.id)).toContain('intent-classify');
    expect(caps.map(c => c.id)).toContain('semantic-parse');
    expect(caps.map(c => c.id)).toContain('route-dispatch');
  });

  it('should classify analysis intent', async () => {
    const intent = await agent.classifyIntent('帮我分析上月销售数据');
    expect(intent.primary).toBe('analysis');
    expect(intent.confidence).toBeGreaterThan(0);
  });

  it('should classify code intent', async () => {
    const intent = await agent.classifyIntent('修复这个bug');
    expect(intent.primary).toBe('code');
  });

  it('should classify security intent', async () => {
    const intent = await agent.classifyIntent('检查安全漏洞');
    expect(intent.primary).toBe('security');
  });

  it('should classify creative intent', async () => {
    const intent = await agent.classifyIntent('帮我生成一个创意文案');
    expect(intent.primary).toBe('creative');
  });

  it('should classify prediction intent', async () => {
    const intent = await agent.classifyIntent('预测下月趋势');
    expect(intent.primary).toBe('prediction');
  });

  it('should classify quality intent', async () => {
    const intent = await agent.classifyIntent('代码质量检查');
    expect(intent.primary).toBe('quality');
  });

  it('should classify recommendation intent', async () => {
    const intent = await agent.classifyIntent('推荐合适的方案');
    expect(intent.primary).toBe('recommendation');
  });

  it('should classify orchestrate intent', async () => {
    const intent = await agent.classifyIntent('编排全家协作流程');
    expect(intent.primary).toBe('orchestrate');
  });

  it('should parse semantics', async () => {
    const result = await agent.handleMessage({
      id: 'msg-1', type: 'command', from: 'user', to: 'qianhang', timestamp: Date.now(),
      payload: { action: 'semantic-parse', parameters: { text: '分析本月销售额按地区' } },
    });
    expect(result.success).toBe(true);
  });

  it('should greet with persona', () => {
    const greeting = agent.greet();
    expect(typeof greeting).toBe('string');
    expect(greeting.length).toBeGreaterThan(0);
  });

  it('should track emotion', () => {
    agent.updateEmotion({ engagement: 5 });
    const emotion = agent.getEmotion();
    expect(emotion.memberId).toBe('qianhang');
    expect(emotion.engagement).toBeGreaterThanOrEqual(5);
  });

  it('should handle family message', async () => {
    const result = await agent.handleFamilyMessage({
      id: 'fm-1', type: 'USER_REQUEST', from: 'user', to: 'qianhang', timestamp: Date.now(),
      payload: { text: '分析数据' },
    });
    expect(result.success).toBe(true);
    expect(result.data.intent).toBeTruthy();
  });
});

describe('TianShuAgent (元启·天枢)', () => {
  const agent = new TianShuAgent();

  it('should have correct identity', () => {
    expect(agent.memberId).toBe('tianshu');
    expect(agent.getName()).toBe('元启·天枢');
  });

  it('should have 3 capabilities', () => {
    expect(agent.getCapabilities()).toHaveLength(3);
  });

  it('should route analysis intent to thinker', async () => {
    const result = await agent.route({ primary: 'analysis', confidence: 0.9, raw: 'test' });
    expect(result.assignee).toBe('thinker');
  });

  it('should route code intent to grandmaster', async () => {
    const result = await agent.route({ primary: 'code', confidence: 0.9, raw: 'test' });
    expect(result.assignee).toBe('grandmaster');
  });

  it('should route security intent to guardian', async () => {
    const result = await agent.route({ primary: 'security', confidence: 0.9, raw: 'test' });
    expect(result.assignee).toBe('guardian');
  });

  it('should route creative intent to grace', async () => {
    const result = await agent.route({ primary: 'creative', confidence: 0.9, raw: 'test' });
    expect(result.assignee).toBe('grace');
  });

  it('should decompose multi-intent tasks', async () => {
    const result = await agent.decompose({ primary: 'analysis', secondary: 'prediction', confidence: 0.9, raw: '分析并预测' });
    expect(result.tasks).toHaveLength(2);
    expect(result.orchestrationId).toBeTruthy();
  });

  it('should produce single task for single intent', async () => {
    const result = await agent.decompose({ primary: 'code', confidence: 0.9, raw: 'fix bug' });
    expect(result.tasks).toHaveLength(1);
  });
});

describe('ThinkerAgent (语枢·万物)', () => {
  const agent = new ThinkerAgent();

  it('should have correct identity', () => {
    expect(agent.memberId).toBe('thinker');
    expect(agent.getName()).toBe('语枢·万物');
  });

  it('should have 3 capabilities', () => {
    expect(agent.getCapabilities()).toHaveLength(3);
  });

  it('should analyze data', async () => {
    const insight = await agent.analyzeData({ data: [1, 2, 3] });
    expect(insight).toBeTruthy();
    expect(typeof insight.confidence).toBe('number');
  });

  it('should summarize text', async () => {
    const summary = await agent.summarize('这是一段很长的文本内容需要被摘要处理');
    expect(summary).toContain('摘要:');
  });

  it('should truncate long summaries', async () => {
    const longText = 'a'.repeat(200);
    const summary = await agent.summarize(longText);
    expect(summary.length).toBeLessThan(longText.length + 20);
  });
});

describe('ProphetAgent (预见·先知)', () => {
  const agent = new ProphetAgent();

  it('should have correct identity', () => {
    expect(agent.memberId).toBe('prophet');
    expect(agent.getName()).toBe('预见·先知');
  });

  it('should have 3 capabilities', () => {
    expect(agent.getCapabilities()).toHaveLength(3);
  });

  it('should predict time series', async () => {
    const prediction = await agent.predict({ metric: 'revenue', data: [100, 110, 120] });
    expect(prediction).toBeTruthy();
    expect(prediction.metric).toBe('revenue');
    expect(['up', 'down', 'stable']).toContain(prediction.trend);
  });

  it('should detect anomalies', async () => {
    const report = await agent.detectAnomalies({ values: [1, 2, 100] });
    expect(report).toBeTruthy();
    expect(['low', 'medium', 'high', 'critical']).toContain(report.riskLevel);
  });
});

describe('BoleAgent (千里·伯乐)', () => {
  const agent = new BoleAgent();

  it('should have correct identity', () => {
    expect(agent.memberId).toBe('bole');
    expect(agent.getName()).toBe('千里·伯乐');
  });

  it('should have 3 capabilities', () => {
    expect(agent.getCapabilities()).toHaveLength(3);
  });

  it('should create user profile on first access', async () => {
    const profile = await agent.getProfile('user-1');
    expect(profile.userId).toBe('user-1');
    expect(profile.interests).toEqual([]);
    expect(profile.lastActive).toBeGreaterThan(0);
  });

  it('should return existing profile', async () => {
    await agent.getProfile('user-2');
    const profile = await agent.getProfile('user-2');
    expect(profile.userId).toBe('user-2');
  });

  it('should recommend with hybrid strategy', async () => {
    const rec = await agent.recommend('user-1', { context: 'test' });
    expect(rec).toBeTruthy();
    expect(rec.strategy).toBe('hybrid');
    expect(typeof rec.confidence).toBe('number');
  });
});

describe('GuardianAgent (智云·守护)', () => {
  const agent = new GuardianAgent();

  it('should have correct identity', () => {
    expect(agent.memberId).toBe('guardian');
    expect(agent.getName()).toBe('智云·守护');
  });

  it('should have 3 capabilities', () => {
    expect(agent.getCapabilities()).toHaveLength(3);
  });

  it('should scan threats', async () => {
    const detection = await agent.scanThreats({ target: 'api-endpoint' });
    expect(detection).toBeTruthy();
    expect(['low', 'medium', 'high', 'critical']).toContain(detection.overallRisk);
    expect(Array.isArray(detection.threats)).toBe(true);
    expect(Array.isArray(detection.recommendations)).toBe(true);
  });

  it('should update security baseline', async () => {
    const baseline = await agent.updateBaseline('user-1', { loginTime: '09:00', ip: '192.168.1.1' });
    expect(baseline.userId).toBe('user-1');
    expect(baseline.normalPatterns).toBeTruthy();
    expect(baseline.lastUpdated).toBeGreaterThan(0);
  });
});

describe('GrandmasterAgent (格物·宗师)', () => {
  const agent = new GrandmasterAgent();

  it('should have correct identity', () => {
    expect(agent.memberId).toBe('grandmaster');
    expect(agent.getName()).toBe('格物·宗师');
  });

  it('should have 3 capabilities', () => {
    expect(agent.getCapabilities()).toHaveLength(3);
  });

  it('should analyze code', async () => {
    const analysis = await agent.analyzeCode({ code: 'function test() {}', path: 'test.ts' });
    expect(analysis.path).toBe('test.ts');
    expect(typeof analysis.score).toBe('number');
    expect(Array.isArray(analysis.issues)).toBe(true);
    expect(Array.isArray(analysis.suggestions)).toBe(true);
  });

  it('should run quality gate', async () => {
    const result = await agent.qualityGate({ checks: ['lint', 'test', 'coverage'] });
    expect(typeof result.passed).toBe('boolean');
    expect(typeof result.score).toBe('number');
    expect(Array.isArray(result.checks)).toBe(true);
  });
});

describe('GraceAgent (创想·灵韵)', () => {
  const agent = new GraceAgent();

  it('should have correct identity', () => {
    expect(agent.memberId).toBe('grace');
    expect(agent.getName()).toBe('创想·灵韵');
  });

  it('should have 3 capabilities', () => {
    expect(agent.getCapabilities()).toHaveLength(3);
  });

  it('should create creative output', async () => {
    const output = await agent.create({ prompt: '春季促销海报', type: 'text', style: 'elegant' });
    expect(output.content).toContain('春季促销海报');
    expect(output.type).toBe('text');
    expect(output.style).toBe('elegant');
  });

  it('should default to inspiring mood', async () => {
    const output = await agent.create({ prompt: 'test' });
    expect(output.mood).toBe('inspiring');
  });

  it('should provide design suggestions', async () => {
    const suggestion = await agent.designSuggest({ aspect: 'color', context: 'landing page' });
    expect(suggestion.aspect).toBe('color');
    expect(suggestion.suggestion).toBeTruthy();
    expect(suggestion.rationale).toBeTruthy();
    expect(['low', 'medium', 'high']).toContain(suggestion.priority);
  });
});
