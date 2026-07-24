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

import { defineSkill } from '../../../registry/SkillManifest.js';

export const architectureReviewSkill = defineSkill(
  {
    id: 'grandmaster:architecture-review',
    name: 'Architecture Review',
    version: '1.0.0',
    owner: 'grandmaster',
    description: 'System architecture quality review — evaluate modularity, coupling, scalability, and resilience patterns.',
    category: 'quality',
    parameters: [
      { name: 'components', type: 'array', required: true, description: 'Architecture components [{ id, type, dependencies[], responsibilities[] }].' },
      { name: 'focusAreas', type: 'array', required: false, description: 'Focus areas: modularity, coupling, scalability, resilience.' },
    ],
  },
  async (params) => {
    const components = (params.components as Array<Record<string, unknown>>) ?? [];
    const focusAreas = (params.focusAreas as string[]) ?? ['modularity', 'coupling', 'scalability', 'resilience'];

    const depGraph: Record<string, string[]> = {};
    for (const comp of components) {
      depGraph[String(comp.id)] = ((comp.dependencies as string[]) ?? []).map(String);
    }

    const scores: Record<string, number> = {};
    const findings: Array<{ area: string; score: number; finding: string; severity: 'info' | 'warning' | 'critical' }> = [];

    if (focusAreas.includes('modularity')) {
      const avgResponsibilities = components.reduce((sum, c) => sum + ((c.responsibilities as string[]) ?? []).length, 0) / Math.max(components.length, 1);
      const score = avgResponsibilities <= 3 ? 0.9 : avgResponsibilities <= 5 ? 0.7 : 0.4;
      scores.modularity = score;
      if (score < 0.6) findings.push({ area: 'modularity', score, finding: `${Math.round(avgResponsibilities)} avg responsibilities per component — consider splitting`, severity: 'warning' });
    }

    if (focusAreas.includes('coupling')) {
      const avgDeps = components.reduce((sum, c) => sum + ((c.dependencies as string[]) ?? []).length, 0) / Math.max(components.length, 1);
      const score = avgDeps <= 2 ? 0.9 : avgDeps <= 4 ? 0.7 : avgDeps <= 6 ? 0.5 : 0.3;
      scores.coupling = score;
      if (avgDeps > 5) findings.push({ area: 'coupling', score, finding: `High coupling: ${avgDeps.toFixed(1)} avg dependencies per component`, severity: 'critical' });

      const cycles = detectCycles(depGraph);
      if (cycles.length > 0) {
        scores.coupling = Math.min(scores.coupling ?? 0.7, 0.3);
        findings.push({ area: 'coupling', score: 0.3, finding: `Circular dependencies detected: ${cycles.length} cycles`, severity: 'critical' });
      }
    }

    if (focusAreas.includes('scalability')) {
      const singlePoints = components.filter(c => { const deps = (c.dependencies as string[]) ?? []; return deps.length === 0 && ((c.responsibilities as string[]) ?? []).length > 3; });
      const score = singlePoints.length === 0 ? 0.85 : singlePoints.length <= 2 ? 0.6 : 0.4;
      scores.scalability = score;
      if (singlePoints.length > 0) findings.push({ area: 'scalability', score, finding: `${singlePoints.length} potential single points of failure`, severity: 'warning' });
    }

    if (focusAreas.includes('resilience')) {
      const hasRedundancy = components.some(c => { const deps = (c.dependencies as string[]) ?? []; return deps.length > 1; });
      const score = hasRedundancy ? 0.8 : 0.5;
      scores.resilience = score;
      if (!hasRedundancy) findings.push({ area: 'resilience', score, finding: 'No redundant paths detected', severity: 'warning' });
    }

    const overall = Object.values(scores).reduce((a, b) => a + b, 0) / Math.max(Object.keys(scores).length, 1);

    return {
      overallScore: Math.round(overall * 100) / 100,
      dimensionScores: scores,
      findings,
      componentCount: components.length,
      grade: overall >= 0.8 ? 'A' : overall >= 0.6 ? 'B' : overall >= 0.4 ? 'C' : 'D',
      recommendation: overall >= 0.7 ? 'Architecture is healthy — focus on identified weak areas' : 'Significant improvements needed — prioritize critical findings',
    };
  },
  (params) => {
    const errors: string[] = [];
    if (!Array.isArray(params.components) || params.components.length === 0) errors.push('Parameter "components" is required and non-empty');
    return { valid: errors.length === 0, errors: errors.length > 0 ? errors : undefined };
  },
);

export const testStrategySkill = defineSkill(
  {
    id: 'grandmaster:test-strategy',
    name: 'Test Strategy Generator',
    version: '1.0.0',
    owner: 'grandmaster',
    description: 'Generate comprehensive test strategies — create test plans with coverage targets, priority matrix, and risk-based test selection.',
    category: 'quality',
    parameters: [
      { name: 'module', type: 'string', required: true, description: 'Module or feature name to test.' },
      { name: 'requirements', type: 'array', required: true, description: 'Requirements [{ id, description, priority, risk }].' },
      { name: 'testTypes', type: 'array', required: false, description: 'Test types to include: unit, integration, e2e, security, performance.' },
    ],
  },
  async (params) => {
    const module = String(params.module ?? '');
    const requirements = (params.requirements as Array<Record<string, unknown>>) ?? [];
    const testTypes = (params.testTypes as string[]) ?? ['unit', 'integration', 'e2e'];

    const testPlan: Array<{ requirementId: string; testType: string; testName: string; priority: string; estimate: string }> = [];
    const coverageTargets: Record<string, number> = {};

    for (const req of requirements) {
      const id = String(req.id ?? 'unknown');
      const desc = String(req.description ?? '');
      const priority = String(req.priority ?? 'medium');
      const risk = String(req.risk ?? 'low');

      if (testTypes.includes('unit')) {
        testPlan.push({ requirementId: id, testType: 'unit', testName: `${module}: ${desc.substring(0, 50)} — unit`, priority, estimate: '30min' });
      }
      if (testTypes.includes('integration') && (priority === 'high' || priority === 'critical' || risk === 'high')) {
        testPlan.push({ requirementId: id, testType: 'integration', testName: `${module}: ${desc.substring(0, 50)} — integration`, priority, estimate: '1h' });
      }
      if (testTypes.includes('e2e') && (priority === 'critical' || risk === 'high')) {
        testPlan.push({ requirementId: id, testType: 'e2e', testName: `${module}: ${desc.substring(0, 50)} — e2e`, priority, estimate: '2h' });
      }
      if (testTypes.includes('security') && (risk === 'high' || desc.toLowerCase().includes('auth') || desc.toLowerCase().includes('数据'))) {
        testPlan.push({ requirementId: id, testType: 'security', testName: `${module}: ${desc.substring(0, 50)} — security`, priority, estimate: '1.5h' });
      }
      if (testTypes.includes('performance') && priority === 'critical') {
        testPlan.push({ requirementId: id, testType: 'performance', testName: `${module}: ${desc.substring(0, 50)} — perf`, priority, estimate: '2h' });
      }
    }

    for (const tt of testTypes) {
      const count = testPlan.filter(t => t.testType === tt).length;
      coverageTargets[tt] = count > 0 ? Math.min(80 + count * 2, 95) : 0;
    }

    const totalEstimate = testPlan.reduce((sum, t) => sum + parseEstimate(t.estimate), 0);

    return {
      module,
      testPlan,
      totalTests: testPlan.length,
      coverageTargets,
      totalEstimateMinutes: totalEstimate,
      riskMatrix: { critical: requirements.filter(r => String(r.risk) === 'high').length, high: requirements.filter(r => String(r.priority) === 'high').length, total: requirements.length },
      testDistribution: testTypes.reduce((acc, tt) => { acc[tt] = testPlan.filter(t => t.testType === tt).length; return acc; }, {} as Record<string, number>),
    };
  },
  (params) => {
    const errors: string[] = [];
    if (!params.module || typeof params.module !== 'string') errors.push('Parameter "module" is required');
    if (!Array.isArray(params.requirements) || params.requirements.length === 0) errors.push('Parameter "requirements" is required and non-empty');
    return { valid: errors.length === 0, errors: errors.length > 0 ? errors : undefined };
  },
);

function detectCycles(graph: Record<string, string[]>): string[][] {
  const cycles: string[][] = [];
  const visited = new Set<string>();
  const stack = new Set<string>();

  function dfs(node: string, path: string[]) {
    if (stack.has(node)) {
      const cycleStart = path.indexOf(node);
      if (cycleStart >= 0) cycles.push(path.slice(cycleStart));
      return;
    }
    if (visited.has(node)) return;
    visited.add(node);
    stack.add(node);
    path.push(node);
    for (const dep of graph[node] ?? []) {
      dfs(dep, [...path]);
    }
    stack.delete(node);
  }

  for (const node of Object.keys(graph)) dfs(node, []);
  return cycles;
}

function parseEstimate(estimate: string): number {
  const match = estimate.match(/(\d+)(min|h)/);
  if (!match) return 30;
  return match[2] === 'h' ? Number(match[1]) * 60 : Number(match[1]);
}
