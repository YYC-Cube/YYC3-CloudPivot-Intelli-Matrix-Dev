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
import { FamilySkillRegistry } from '../src/registry/FamilySkillRegistry.js';
import { MCPSkillBridge } from '../src/registry/MCPSkillBridge.js';
import { allSkills } from '../src/skills/index.js';
import type { SkillExecutionContext } from '@yyc3/family-agents';

function makeCtx(params: Record<string, unknown>): SkillExecutionContext {
  return { params, memberId: 'qianhang', sessionId: 'test-session' };
}

describe('Phase 4 — Skills Ecosystem', () => {

  describe('Skill Registration & Listing', () => {
    it('should have 35+ total skills across all categories', () => {
      expect(allSkills.length).toBeGreaterThanOrEqual(35);
    });

    it('should register all skills into the registry', async () => {
      const registry = new FamilySkillRegistry();
      for (const skill of allSkills) {
        const result = await registry.register(skill);
        expect(result.success).toBe(true);
      }
      expect(registry.list().length).toBe(allSkills.length);
    });

    it('should list skills by owner for each family member', async () => {
      const registry = new FamilySkillRegistry();
      for (const skill of allSkills) await registry.register(skill);

      const members = ['qianhang', 'thinker', 'prophet', 'bole', 'tianshu', 'guardian', 'grandmaster', 'grace'] as const;
      for (const member of members) {
        const skills = registry.listByOwner(member);
        expect(skills.length).toBeGreaterThanOrEqual(3, `${member} should have 3+ skills, got ${skills.length}`);
      }
    });

    it('should list skills by category', async () => {
      const registry = new FamilySkillRegistry();
      for (const skill of allSkills) await registry.register(skill);

      const categories = ['nlu', 'orchestration', 'prediction', 'recommendation', 'analysis', 'security', 'quality', 'creative'] as const;
      for (const cat of categories) {
        const skills = registry.listByCategory(cat);
        expect(skills.length).toBeGreaterThanOrEqual(3, `${cat} should have 3+ skills`);
      }
    });

    it('should provide stats', async () => {
      const registry = new FamilySkillRegistry();
      for (const skill of allSkills) await registry.register(skill);

      const stats = registry.getStats();
      expect(stats.total).toBe(allSkills.length);
      expect(Object.keys(stats.byCategory).length).toBeGreaterThanOrEqual(8);
      expect(Object.keys(stats.byOwner).length).toBeGreaterThanOrEqual(8);
    });
  });

  describe('NLU Skills (QianHang)', () => {
    it('emotion-detect should detect joy', async () => {
      const registry = new FamilySkillRegistry();
      for (const skill of allSkills) await registry.register(skill);
      const result = await registry.execute('qianhang:emotion-detect', makeCtx({ text: '今天太开心了，非常棒！' }));
      expect(result.success).toBe(true);
      const data = result.data as { emotion: string; confidence: number };
      expect(data.emotion).toBe('joy');
      expect(data.confidence).toBeGreaterThan(0);
    });

    it('emotion-detect should detect anger', async () => {
      const registry = new FamilySkillRegistry();
      for (const skill of allSkills) await registry.register(skill);
      const result = await registry.execute('qianhang:emotion-detect', makeCtx({ text: 'I am furious and angry!' }));
      expect(result.success).toBe(true);
      const data = result.data as { emotion: string };
      expect(data.emotion).toBe('anger');
    });

    it('multi-lang-nlu should detect Chinese', async () => {
      const registry = new FamilySkillRegistry();
      for (const skill of allSkills) await registry.register(skill);
      const result = await registry.execute('qianhang:multi-lang-nlu', makeCtx({ text: '这是一个中文句子' }));
      expect(result.success).toBe(true);
      const data = result.data as { language: string; tokens: string[] };
      expect(data.language).toBe('zh');
      expect(data.tokens.length).toBeGreaterThan(0);
    });

    it('multi-lang-nlu should detect English', async () => {
      const registry = new FamilySkillRegistry();
      for (const skill of allSkills) await registry.register(skill);
      const result = await registry.execute('qianhang:multi-lang-nlu', makeCtx({ text: 'This is an English sentence' }));
      expect(result.success).toBe(true);
      const data = result.data as { language: string };
      expect(data.language).toBe('en');
    });

    it('knowledge-graph should extract entities', async () => {
      const registry = new FamilySkillRegistry();
      for (const skill of allSkills) await registry.register(skill);
      const result = await registry.execute('qianhang:knowledge-graph', makeCtx({ text: '张三认为Python是最好的编程语言' }));
      expect(result.success).toBe(true);
      const data = result.data as { entities: Array<{ type: string }>; summary: string };
      expect(data.entities.length).toBeGreaterThan(0);
      expect(data.summary).toBeTruthy();
    });

    it('intent-parse should extract intent', async () => {
      const registry = new FamilySkillRegistry();
      for (const skill of allSkills) await registry.register(skill);
      const result = await registry.execute('qianhang:intent-parse', makeCtx({ text: '创建一个新任务' }));
      expect(result.success).toBe(true);
      const data = result.data as { intent: string; confidence: number };
      expect(data.intent).toBeTruthy();
      expect(data.confidence).toBeGreaterThan(0);
    });

    it('sentiment-analysis should detect positive', async () => {
      const registry = new FamilySkillRegistry();
      for (const skill of allSkills) await registry.register(skill);
      const result = await registry.execute('qianhang:sentiment-analysis', makeCtx({ text: 'This is absolutely great and wonderful!' }));
      expect(result.success).toBe(true);
      const data = result.data as { label: string; polarity: number };
      expect(data.label).toBe('positive');
      expect(data.polarity).toBeGreaterThan(0);
    });
  });

  describe('Orchestration Skills (TianShu)', () => {
    it('task-routing should route to best agent', async () => {
      const registry = new FamilySkillRegistry();
      for (const skill of allSkills) await registry.register(skill);
      const result = await registry.execute('tianshu:task-routing', makeCtx({ task: 'Analyze security vulnerabilities' }));
      expect(result.success).toBe(true);
      const data = result.data as { assignedTo: string; confidence: number };
      expect(data.assignedTo).toBeTruthy();
      expect(data.confidence).toBeGreaterThan(0);
    });

    it('delegation should decompose tasks', async () => {
      const registry = new FamilySkillRegistry();
      for (const skill of allSkills) await registry.register(skill);
      const result = await registry.execute('tianshu:delegation', makeCtx({ task: '分析数据并推荐安全策略' }));
      expect(result.success).toBe(true);
      const data = result.data as { subtaskCount: number; delegationPlan: unknown[] };
      expect(data.subtaskCount).toBeGreaterThan(0);
      expect(data.delegationPlan.length).toBeGreaterThan(0);
    });

    it('workflow-orchestrator should build DAG', async () => {
      const registry = new FamilySkillRegistry();
      for (const skill of allSkills) await registry.register(skill);
      const result = await registry.execute('tianshu:workflow-orchestrator', makeCtx({
        workflow: {
          steps: [
            { id: 's1', agent: 'qianhang', action: 'parse', dependsOn: [] },
            { id: 's2', agent: 'thinker', action: 'analyze', dependsOn: ['s1'] },
            { id: 's3', agent: 'guardian', action: 'secure', dependsOn: ['s2'] },
          ],
        },
      }));
      expect(result.success).toBe(true);
      const data = result.data as { stepCount: number; executionDAG: unknown[] };
      expect(data.stepCount).toBe(3);
      expect(data.executionDAG.length).toBe(3);
    });

    it('conflict-resolution should resolve conflicts', async () => {
      const registry = new FamilySkillRegistry();
      for (const skill of allSkills) await registry.register(skill);
      const result = await registry.execute('tianshu:conflict-resolution', makeCtx({
        results: [
          { success: true, data: 'ok' },
          { success: false, error: 'fail' },
        ],
      }));
      expect(result.success).toBe(true);
      const data = result.data as { conflicts: unknown[]; totalResults: number };
      expect(data.conflicts.length).toBeGreaterThan(0);
      expect(data.totalResults).toBe(2);
    });

    it('resource-optimization should balance loads', async () => {
      const registry = new FamilySkillRegistry();
      for (const skill of allSkills) await registry.register(skill);
      const result = await registry.execute('tianshu:resource-optimization', makeCtx({
        agents: [
          { id: 'a1', currentLoad: 8, maxCapacity: 10 },
          { id: 'a2', currentLoad: 2, maxCapacity: 10 },
        ],
        tasks: [{ id: 't1' }, { id: 't2' }, { id: 't3' }],
      }));
      expect(result.success).toBe(true);
      const data = result.data as { assignments: unknown[]; averageUtilization: number };
      expect(data.assignments.length).toBe(3);
    });
  });

  describe('Prediction Skills (Prophet)', () => {
    it('lstm-prediction should forecast', async () => {
      const registry = new FamilySkillRegistry();
      for (const skill of allSkills) await registry.register(skill);
      const result = await registry.execute('prophet:lstm-prediction', makeCtx({
        data: [10, 12, 14, 16, 18, 20, 22, 24, 26, 28],
        forecastSteps: 3,
      }));
      expect(result.success).toBe(true);
      const data = result.data as { forecast: number[]; trend: string };
      expect(data.forecast.length).toBe(3);
      expect(data.trend).toBeTruthy();
    });

    it('anomaly-detection should find outliers', async () => {
      const registry = new FamilySkillRegistry();
      for (const skill of allSkills) await registry.register(skill);
      const result = await registry.execute('prophet:anomaly-detection', makeCtx({
        data: [10, 12, 11, 13, 100, 12, 11, 10, 14, 12],
        method: 'zscore',
        threshold: 2,
      }));
      expect(result.success).toBe(true);
      const data = result.data as { anomalies: unknown[]; anomalyCount: number };
      expect(data.anomalyCount).toBeGreaterThan(0);
    });

    it('trend-forecast should predict with confidence intervals', async () => {
      const registry = new FamilySkillRegistry();
      for (const skill of allSkills) await registry.register(skill);
      const result = await registry.execute('prophet:trend-forecast', makeCtx({
        data: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
        periods: 5,
        model: 'linear',
      }));
      expect(result.success).toBe(true);
      const data = result.data as { forecast: number[]; r2: number; upperBound: number[]; lowerBound: number[] };
      expect(data.forecast.length).toBe(5);
      expect(data.r2).toBeGreaterThan(0.9);
      expect(data.upperBound.length).toBe(5);
    });
  });

  describe('Recommendation Skills (Bole)', () => {
    it('cold-start should recommend for new users', async () => {
      const registry = new FamilySkillRegistry();
      for (const skill of allSkills) await registry.register(skill);
      const result = await registry.execute('bole:cold-start', makeCtx({
        userProfile: { interests: ['AI', 'security'], level: 3 },
        candidatePool: [
          { id: 'item1', tags: ['AI', 'ML'], popularity: 0.8 },
          { id: 'item2', tags: ['security', 'network'], popularity: 0.6 },
          { id: 'item3', tags: ['design', 'UI'], popularity: 0.9 },
        ],
        topK: 2,
      }));
      expect(result.success).toBe(true);
      const data = result.data as { recommendations: Array<{ item: string; score: number }>[]; strategy: string };
      expect(data.strategy).toBe('cold-start');
    });

    it('collaborative-filter should use user similarity', async () => {
      const registry = new FamilySkillRegistry();
      for (const skill of allSkills) await registry.register(skill);
      const result = await registry.execute('bole:collaborative-filter', makeCtx({
        targetUser: 'user1',
        userItemMatrix: {
          user1: { item1: 5, item2: 3, item3: 4 },
          user2: { item1: 5, item2: 4, item3: 3, item4: 5 },
          user3: { item1: 4, item2: 3, item3: 5, item5: 4 },
        },
        topK: 3,
      }));
      expect(result.success).toBe(true);
      const data = result.data as { similarUsers: unknown[]; recommendations: unknown[] };
      expect(data.similarUsers.length).toBeGreaterThan(0);
    });

    it('diversity-ranking should diversify results', async () => {
      const registry = new FamilySkillRegistry();
      for (const skill of allSkills) await registry.register(skill);
      const result = await registry.execute('bole:diversity-ranking', makeCtx({
        items: [
          { id: 'a', score: 0.9, features: [1, 0, 0] },
          { id: 'b', score: 0.8, features: [0.9, 0, 0] },
          { id: 'c', score: 0.7, features: [0, 1, 0] },
          { id: 'd', score: 0.6, features: [0, 0, 1] },
        ],
        lambda: 0.5,
        topK: 3,
      }));
      expect(result.success).toBe(true);
      const data = result.data as { diversified: Array<{ id: string }>[]; selectedCount: number };
      expect(data.selectedCount).toBe(3);
    });
  });

  describe('Analysis Skills (Thinker)', () => {
    it('deep-analysis should score dimensions', async () => {
      const registry = new FamilySkillRegistry();
      for (const skill of allSkills) await registry.register(skill);
      const result = await registry.execute('thinker:deep-analysis', makeCtx({
        data: { performance: 0.8, reliability: 0.9, usability: 0.6, security: 0.7 },
      }));
      expect(result.success).toBe(true);
      const data = result.data as { overallScore: number; dimensions: unknown[]; rootCauses: unknown[] };
      expect(data.overallScore).toBeGreaterThan(0);
      expect(data.dimensions.length).toBe(4);
    });

    it('data-insight should find correlations', async () => {
      const registry = new FamilySkillRegistry();
      for (const skill of allSkills) await registry.register(skill);
      const dataset = Array.from({ length: 20 }, (_, i) => ({
        x: i,
        y: i * 2 + 1,
        z: Math.random() * 10,
      }));
      const result = await registry.execute('thinker:data-insight', makeCtx({ dataset, fields: ['x', 'y', 'z'] }));
      expect(result.success).toBe(true);
      const data = result.data as { recordCount: number; correlations: Array<{ coefficient: number }>; fieldCount: number };
      expect(data.recordCount).toBe(20);
      expect(data.fieldCount).toBe(3);
      expect(data.correlations.length).toBeGreaterThan(0);
    });

    it('comparative-analysis should compare datasets', async () => {
      const registry = new FamilySkillRegistry();
      for (const skill of allSkills) await registry.register(skill);
      const result = await registry.execute('thinker:comparative-analysis', makeCtx({
        datasets: [
          { name: 'A', data: [10, 12, 14, 16, 18] },
          { name: 'B', data: [5, 6, 7, 8, 9] },
        ],
      }));
      expect(result.success).toBe(true);
      const data = result.data as { comparison: Array<{ name: string; mean: number }>; winner: string };
      expect(data.winner).toBe('A');
      expect(data.comparison.length).toBe(2);
    });
  });

  describe('Security Skills (Guardian)', () => {
    it('auto-remediate should detect vulnerabilities', async () => {
      const registry = new FamilySkillRegistry();
      for (const skill of allSkills) await registry.register(skill);
      const result = await registry.execute('guardian:auto-remediate', makeCtx({
        target: 'eval(userInput); element.innerHTML = data;',
      }));
      expect(result.success).toBe(true);
      const data = result.data as { findings: unknown[]; summary: { total: number }; riskLevel: string };
      expect(data.findings.length).toBeGreaterThan(0);
      expect(data.riskLevel).toBe('critical');
    });

    it('threat-response should classify threats', async () => {
      const registry = new FamilySkillRegistry();
      for (const skill of allSkills) await registry.register(skill);
      const result = await registry.execute('guardian:threat-response', makeCtx({
        events: [
          { type: 'brute-force', source: '192.168.1.100', timestamp: Date.now() },
          { type: 'sql-injection', source: '/api/users', timestamp: Date.now() },
        ],
      }));
      expect(result.success).toBe(true);
      const data = result.data as { threats: unknown[]; level: string; playbook: unknown[] };
      expect(data.threats.length).toBe(2);
      expect(data.level).toBeTruthy();
    });

    it('compliance-check should verify OWASP', async () => {
      const registry = new FamilySkillRegistry();
      for (const skill of allSkills) await registry.register(skill);
      const result = await registry.execute('guardian:compliance-check', makeCtx({
        config: { encryption: 'aes-256', parameterized: true, authMechanism: 'jwt' },
        standard: 'owasp',
      }));
      expect(result.success).toBe(true);
      const data = result.data as { checks: unknown[]; score: number; compliant: boolean };
      expect(data.checks.length).toBeGreaterThan(0);
    });
  });

  describe('Quality Skills (Grandmaster)', () => {
    it('golden-standards should grade code', async () => {
      const registry = new FamilySkillRegistry();
      for (const skill of allSkills) await registry.register(skill);
      const result = await registry.execute('grandmaster:golden-standards', makeCtx({
        code: 'function add(a: number, b: number): number { return a + b; }',
        language: 'typescript',
      }));
      expect(result.success).toBe(true);
      const data = result.data as { score: number; grade: string; results: unknown[] };
      expect(data.score).toBeGreaterThan(0);
      expect(['S', 'A', 'B', 'C', 'D']).toContain(data.grade);
    });

    it('code-review should find issues', async () => {
      const registry = new FamilySkillRegistry();
      for (const skill of allSkills) await registry.register(skill);
      const result = await registry.execute('grandmaster:code-review', makeCtx({
        code: 'var x = 1; if (x == null) { } try { doSomething(); } catch(e) { }',
      }));
      expect(result.success).toBe(true);
      const data = result.data as { score: number; verdict: string; issues: unknown[] };
      expect(['approve', 'request-changes', 'reject']).toContain(data.verdict);
    });

    it('test-generation should create test cases', async () => {
      const registry = new FamilySkillRegistry();
      for (const skill of allSkills) await registry.register(skill);
      const result = await registry.execute('grandmaster:test-generation', makeCtx({
        functionCode: 'async function fetchData(url: string): Promise<number> { return 42; }',
        functionName: 'fetchData',
      }));
      expect(result.success).toBe(true);
      const data = result.data as { testCases: unknown[]; testCaseCount: number; generatedTestCode: string };
      expect(data.testCaseCount).toBeGreaterThan(3);
      expect(data.generatedTestCode).toContain('describe');
    });
  });

  describe('Creative Skills (Grace)', () => {
    it('style-transfer should transform style', async () => {
      const registry = new FamilySkillRegistry();
      for (const skill of allSkills) await registry.register(skill);
      const result = await registry.execute('grace:style-transfer', makeCtx({
        content: '咱们搞定这个项目',
        targetStyle: 'formal',
      }));
      expect(result.success).toBe(true);
      const data = result.data as { transformedContent: string; targetStyle: string };
      expect(data.targetStyle).toBe('formal');
      expect(data.transformedContent).toBeTruthy();
    });

    it('creative-generation should generate copy', async () => {
      const registry = new FamilySkillRegistry();
      for (const skill of allSkills) await registry.register(skill);
      const result = await registry.execute('grace:creative-generation', makeCtx({
        brief: 'AI助手',
        type: 'slogan',
        tone: 'bold',
      }));
      expect(result.success).toBe(true);
      const data = result.data as { options: string[]; optionCount: number };
      expect(data.options.length).toBeGreaterThan(0);
    });

    it('design-suggestion should provide UX advice', async () => {
      const registry = new FamilySkillRegistry();
      for (const skill of allSkills) await registry.register(skill);
      const result = await registry.execute('grace:design-suggestion', makeCtx({
        context: '登录注册表单页面',
        platform: 'mobile',
      }));
      expect(result.success).toBe(true);
      const data = result.data as { suggestions: unknown[]; suggestionCount: number };
      expect(data.suggestionCount).toBeGreaterThan(0);
    });
  });

  describe('MCP Bridge', () => {
    it('should register and unregister endpoints', () => {
      const bridge = new MCPSkillBridge();
      bridge.registerEndpoint('test-server', {
        server: 'test',
        tool: 'test-tool',
        transport: 'http',
        url: 'http://localhost:3000',
      });
      expect(bridge.getEndpoints().size).toBe(1);
      bridge.unregisterEndpoint('test-server');
      expect(bridge.getEndpoints().size).toBe(0);
    });

    it('should register servers with tools', () => {
      const bridge = new MCPSkillBridge();
      bridge.registerServer({
        id: 'weather-server',
        name: 'Weather MCP',
        transport: 'http',
        url: 'http://localhost:3001',
        tools: [
          { name: 'get-weather', description: 'Get weather for a city', parameters: [
            { name: 'city', type: 'string', required: true, description: 'City name' },
          ]},
        ],
      });
      expect(bridge.getServers().size).toBe(1);
      const stats = bridge.getStats();
      expect(stats.totalServers).toBe(1);
      expect(stats.totalTools).toBe(1);
    });

    it('should wrap server tools as skills', () => {
      const bridge = new MCPSkillBridge();
      bridge.registerServer({
        id: 'calc-server',
        name: 'Calculator MCP',
        transport: 'stdio',
        tools: [
          { name: 'add', description: 'Add numbers', parameters: [] },
          { name: 'subtract', description: 'Subtract numbers', parameters: [] },
        ],
      });
      const skills = bridge.wrapServerAsSkills('calc-server', 'qianhang', 'nlu');
      expect(skills.length).toBe(2);
      expect(skills[0].mcp).toBeDefined();
      expect(skills[0].id).toBe('mcp:calc-server:add');
    });

    it('should return error for missing endpoint', async () => {
      const bridge = new MCPSkillBridge();
      const result = await bridge.callMCPTool('nonexistent', { tool: 'test', arguments: {} });
      expect(result.isError).toBe(true);
    });

    it('should provide health status', () => {
      const bridge = new MCPSkillBridge();
      bridge.registerEndpoint('s1', { server: 's1', tool: 't1', transport: 'http' });
      bridge.registerEndpoint('s2', { server: 's2', tool: 't2', transport: 'sse' });
      const health = bridge.getHealthStatus();
      expect(health.length).toBe(2);
    });
  });

  describe('Skill Validation', () => {
    it('should reject invalid parameters', async () => {
      const registry = new FamilySkillRegistry();
      for (const skill of allSkills) await registry.register(skill);
      const result = await registry.execute('qianhang:emotion-detect', makeCtx({ text: '' }));
      expect(result.success).toBe(false);
      expect(result.error).toContain('Validation');
    });

    it('should return error for non-existent skill', async () => {
      const registry = new FamilySkillRegistry();
      const result = await registry.execute('nonexistent:skill', makeCtx({}));
      expect(result.success).toBe(false);
      expect(result.error).toContain('not found');
    });

    it('should prevent duplicate registration', async () => {
      const registry = new FamilySkillRegistry();
      const result1 = await registry.register(allSkills[0]);
      expect(result1.success).toBe(true);
      const result2 = await registry.register(allSkills[0]);
      expect(result2.success).toBe(false);
    });
  });

  describe('Collaborative Skill Chain', () => {
    it('should chain: intent-parse → task-routing → delegation', async () => {
      const registry = new FamilySkillRegistry();
      for (const skill of allSkills) await registry.register(skill);

      const parsed = await registry.execute('qianhang:intent-parse', makeCtx({ text: '分析数据安全' }));
      expect(parsed.success).toBe(true);

      const routed = await registry.execute('tianshu:task-routing', makeCtx({ task: '分析数据安全' }));
      expect(routed.success).toBe(true);

      const delegated = await registry.execute('tianshu:delegation', makeCtx({ task: '分析数据安全' }));
      expect(delegated.success).toBe(true);
      const data = delegated.data as { delegationPlan: unknown[] };
      expect(data.delegationPlan.length).toBeGreaterThan(0);
    });
  });
});
