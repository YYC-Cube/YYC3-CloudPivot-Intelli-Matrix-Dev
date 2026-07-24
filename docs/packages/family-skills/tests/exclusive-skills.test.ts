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

import type { SkillExecutionContext } from '@yyc3/family-agents';
import { describe, expect, it } from 'vitest';
import { skillMatchingSkill, userProfilingSkill } from '../src/skills/exclusive/family/bole-skills.js';
import { contentPolishSkill, multimodalComposeSkill } from '../src/skills/exclusive/family/grace-skills.js';
import { architectureReviewSkill, testStrategySkill } from '../src/skills/exclusive/family/grandmaster-skills.js';
import { incidentTriageSkill, owaspScannerSkill } from '../src/skills/exclusive/family/guardian-skills.js';
import { riskAssessmentSkill, seasonalForecastSkill } from '../src/skills/exclusive/family/prophet-skills.js';
import { dialogueContextSkill, intentEnrichmentSkill } from '../src/skills/exclusive/family/qianhang-skills.js';
import { causalReasoningSkill, knowledgeSynthesisSkill } from '../src/skills/exclusive/family/thinker-skills.js';
import { crisisResponseSkill, workflowComposerSkill } from '../src/skills/exclusive/family/tianshu-skills.js';
import { allExclusiveSkills, familyExclusiveSkills } from '../src/skills/exclusive/index.js';
import { allSkills } from '../src/skills/index.js';

const ctx: SkillExecutionContext = { params: {}, memberId: 'qianhang', sessionId: 'test' };

function makeCtx(params: Record<string, unknown>): SkillExecutionContext {
  return { ...ctx, params };
}

describe('Family Exclusive Skills', () => {
  describe('QianHang — Intent Enrichment', () => {
    it('enriches intent with entities and sentiment', async () => {
      const result = await intentEnrichmentSkill.execute(makeCtx({
        intent: { primary: 'code', confidence: 0.8, raw: '请帮我修复bug，紧急！' },
        context: { history: [1, 2, 3] },
      }));
      expect(result.success).toBe(true);
      const data = result.data as any;
      expect(data.primary).toBe('code');
      expect(data.confidence).toBeGreaterThan(0.75);
      expect(data.sentiment).toBeDefined();
    });

    it('validates requires intent object', () => {
      const v = intentEnrichmentSkill.validate?.({});
      expect(v?.valid).toBe(false);
    });
  });

  describe('QianHang — Dialogue Context', () => {
    it('manages dialogue context', async () => {
      const result = await dialogueContextSkill.execute(makeCtx({
        messages: [
          { role: 'user', text: '分析数据报表' },
          { role: 'user', text: '推荐合适的数据分析工具' },
        ],
      }));
      expect(result.success).toBe(true);
      const data = result.data as any;
      expect(data.turnCount).toBe(2);
      expect(data.dominantTopic).toBe('data');
    });
  });

  describe('Thinker — Causal Reasoning', () => {
    it('detects causal relationships', async () => {
      const result = await causalReasoningSkill.execute(makeCtx({
        variables: [
          { name: 'temperature', values: [20, 22, 25, 28, 30, 32, 35] },
          { name: 'sales', values: [100, 120, 150, 180, 200, 210, 230] },
        ],
      }));
      expect(result.success).toBe(true);
      const data = result.data as any;
      expect(data.causalPairs.length).toBeGreaterThan(0);
      expect(data.strongestCausal).toBeDefined();
    });
  });

  describe('Thinker — Knowledge Synthesis', () => {
    it('synthesizes insights from multiple sources', async () => {
      const result = await knowledgeSynthesisSkill.execute(makeCtx({
        sources: [
          { id: 's1', findings: ['performance is good', 'memory usage high'], confidence: 0.9, domain: 'monitoring' },
          { id: 's2', findings: ['performance stable', 'latency increasing'], confidence: 0.8, domain: 'analytics' },
        ],
      }));
      expect(result.success).toBe(true);
      const data = result.data as any;
      expect(data.sourceCount).toBe(2);
      expect(data.consensus.length).toBeGreaterThan(0);
    });
  });

  describe('Prophet — Seasonal Forecast', () => {
    it('detects seasonality and forecasts', async () => {
      const data = Array.from({ length: 24 }, (_, i) => 100 + 20 * Math.sin(i * Math.PI / 6));
      const result = await seasonalForecastSkill.execute(makeCtx({ data, forecastSteps: 6 }));
      expect(result.success).toBe(true);
      const r = result.data as any;
      expect(r.forecasts.length).toBe(6);
      expect(r.forecasts[0].value).toBeDefined();
      expect(r.forecasts[0].lower).toBeLessThan(r.forecasts[0].value);
      expect(r.forecasts[0].upper).toBeGreaterThan(r.forecasts[0].value);
    });
  });

  describe('Prophet — Risk Assessment', () => {
    it('assesses and scores risks', async () => {
      const result = await riskAssessmentSkill.execute(makeCtx({
        risks: [
          { id: 'r1', category: 'tech', description: 'Server overload', probability: 0.8, impact: 0.9 },
          { id: 'r2', category: 'security', description: 'Minor XSS', probability: 0.3, impact: 0.2 },
        ],
      }));
      expect(result.success).toBe(true);
      const data = result.data as any;
      expect(data.assessed.length).toBe(2);
      expect(data.topRisk.id).toBe('r1');
    });
  });

  describe('Bole — User Profiling', () => {
    it('builds user profiles', async () => {
      const result = await userProfilingSkill.execute(makeCtx({
        userId: 'user-1',
        behaviors: [
          { action: 'query', target: '代码分析', timestamp: Date.now() },
          { action: 'query', target: '数据分析', timestamp: Date.now() },
          { action: 'click', target: 'security audit', timestamp: Date.now() },
        ],
      }));
      expect(result.success).toBe(true);
      const data = result.data as any;
      expect(data.userId).toBe('user-1');
      expect(data.topInterests.length).toBeGreaterThan(0);
    });
  });

  describe('Bole — Skill Matching', () => {
    it('matches needs to candidates', async () => {
      const result = await skillMatchingSkill.execute(makeCtx({
        needs: [{ keywords: ['data', 'analysis'], priority: 'high', domain: 'analytics' }],
        candidates: [
          { id: 'thinker', capabilities: ['analysis', 'data', 'insight'], domain: 'analytics' },
          { id: 'guardian', capabilities: ['security', 'audit'], domain: 'security' },
        ],
      }));
      expect(result.success).toBe(true);
      const data = result.data as any;
      expect(data.topMatch.candidateId).toBe('thinker');
    });
  });

  describe('TianShu — Workflow Composer', () => {
    it('composes multi-step workflows', async () => {
      const result = await workflowComposerSkill.execute(makeCtx({
        objective: '分析数据并检测安全风险，然后生成报表',
        availableAgents: [
          { id: 'thinker', capabilities: ['analysis'] },
          { id: 'guardian', capabilities: ['security'] },
          { id: 'grace', capabilities: ['creative'] },
        ],
      }));
      expect(result.success).toBe(true);
      const data = result.data as any;
      expect(data.stages.length).toBeGreaterThan(0);
      expect(data.totalStages).toBeGreaterThan(1);
    });
  });

  describe('TianShu — Crisis Response', () => {
    it('assembles crisis response', async () => {
      const result = await crisisResponseSkill.execute(makeCtx({
        incident: { type: 'security-breach', severity: 'critical', description: 'Data breach detected', affectedSystems: ['db-primary'] },
        availableAgents: [{ id: 'guardian' }, { id: 'tianshu' }],
      }));
      expect(result.success).toBe(true);
      const data = result.data as any;
      expect(data.severity).toBe('critical');
      expect(data.playbook.length).toBeGreaterThan(0);
      expect(data.escalation).toBe('escalate-to-tianshu');
    });
  });

  describe('Guardian — OWASP Scanner', () => {
    it('detects OWASP vulnerabilities', async () => {
      const result = await owaspScannerSkill.execute(makeCtx({
        target: 'const password = "hardcoded123";\neval(userInput);\ninnerHTML = data;',
        scanType: 'code',
      }));
      expect(result.success).toBe(true);
      const data = result.data as any;
      expect(data.findings.length).toBeGreaterThan(0);
      expect(data.passed).toBe(false);
    });
  });

  describe('Guardian — Incident Triage', () => {
    it('triages security incidents', async () => {
      const result = await incidentTriageSkill.execute(makeCtx({
        incidents: [
          { type: 'sql-injection', source: 'waf', description: 'SQL injection attempt', indicators: ['DROP TABLE'] },
          { type: 'brute-force', source: 'auth', description: 'Login brute force', indicators: [] },
        ],
      }));
      expect(result.success).toBe(true);
      const data = result.data as any;
      expect(data.triaged.length).toBe(2);
      expect(data.severityCounts.critical).toBeGreaterThan(0);
    });
  });

  describe('Grandmaster — Architecture Review', () => {
    it('reviews architecture quality', async () => {
      const result = await architectureReviewSkill.execute(makeCtx({
        components: [
          { id: 'auth', type: 'service', dependencies: ['db', 'cache'], responsibilities: ['login', 'logout', 'token-refresh'] },
          { id: 'api', type: 'gateway', dependencies: ['auth', 'core'], responsibilities: ['routing', 'validation'] },
        ],
      }));
      expect(result.success).toBe(true);
      const data = result.data as any;
      expect(data.dimensionScores).toBeDefined();
      expect(data.grade).toBeDefined();
    });
  });

  describe('Grandmaster — Test Strategy', () => {
    it('generates test strategies', async () => {
      const result = await testStrategySkill.execute(makeCtx({
        module: 'AuthService',
        requirements: [
          { id: 'r1', description: 'User login', priority: 'critical', risk: 'high' },
          { id: 'r2', description: 'Token refresh', priority: 'high', risk: 'medium' },
        ],
        testTypes: ['unit', 'integration', 'security'],
      }));
      expect(result.success).toBe(true);
      const data = result.data as any;
      expect(data.totalTests).toBeGreaterThan(0);
      expect(data.coverageTargets).toBeDefined();
    });
  });

  describe('Grace — Content Polish', () => {
    it('polishes content and identifies issues', async () => {
      const result = await contentPolishSkill.execute(makeCtx({
        content: '这是一个很长的测试内容。我们需要确保内容质量足够好才能发布。其实总的来说这个问题还是很重要的。',
        tone: 'professional',
        language: 'zh',
      }));
      expect(result.success).toBe(true);
      const data = result.data as any;
      expect(data.polished).toBeDefined();
      expect(data.readabilityScore).toBeGreaterThan(0);
    });
  });

  describe('Grace — Multimodal Compose', () => {
    it('composes multi-format creative content', async () => {
      const result = await multimodalComposeSkill.execute(makeCtx({
        brief: '设计一个AI助手界面',
        formats: ['text', 'image_prompt', 'layout_spec'],
        style: 'minimal',
      }));
      expect(result.success).toBe(true);
      const data = result.data as any;
      expect(data.outputs.text).toBeDefined();
      expect(data.outputs.image_prompt).toBeDefined();
      expect(data.outputs.layout_spec).toBeDefined();
    });
  });
});

describe('Exclusive Skills Exports', () => {
  it('exports 16 family exclusive skills', () => {
    expect(familyExclusiveSkills).toHaveLength(16);
  });

  it('exports 16 total exclusive skills', () => {
    expect(allExclusiveSkills).toHaveLength(16);
  });

  it('allSkills includes exclusive skills', () => {
    expect(allSkills.length).toBeGreaterThanOrEqual(51);
  });

  it('each family exclusive skill has unique id', () => {
    const ids = familyExclusiveSkills.map(s => s.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});
