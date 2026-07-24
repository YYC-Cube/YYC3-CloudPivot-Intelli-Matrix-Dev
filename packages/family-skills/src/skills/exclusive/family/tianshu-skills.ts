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

import { defineSkill } from '../../../registry/SkillManifest'

export const workflowComposerSkill = defineSkill(
  {
    id: 'tianshu:workflow-composer',
    name: 'Workflow Composer',
    version: '1.0.0',
    owner: 'tianshu',
    description: 'Compose multi-step workflow plans — define stages, dependencies, parallel branches, and rollback strategies.',
    category: 'orchestration',
    parameters: [
      { name: 'objective', type: 'string', required: true, description: 'Workflow objective description.' },
      { name: 'availableAgents', type: 'array', required: true, description: 'Available agents [{ id, capabilities }].' },
      { name: 'constraints', type: 'object', required: false, description: 'Constraints { maxSteps, maxParallel, deadline }.' },
    ],
  },
  async (params) => {
    const objective = String(params.objective ?? '').toLowerCase();
    const agents = (params.availableAgents as Array<Record<string, unknown>>) ?? [];
    const constraints = (params.constraints as Record<string, unknown>) ?? {};
    const maxSteps = Number(constraints.maxSteps) || 10;
    const maxParallel = Number(constraints.maxParallel) || 3;

    const TASK_PATTERNS: Array<{ keywords: string[]; agent: string; stage: string }> = [
      { keywords: ['分析', 'analyze', '数据', 'data'], agent: 'thinker', stage: 'analysis' },
      { keywords: ['预测', 'predict', '趋势', 'trend'], agent: 'prophet', stage: 'prediction' },
      { keywords: ['推荐', 'recommend', '建议', 'suggest'], agent: 'bole', stage: 'recommendation' },
      { keywords: ['安全', 'security', '审计', 'audit'], agent: 'guardian', stage: 'security-check' },
      { keywords: ['代码', 'code', '开发', 'develop'], agent: 'grandmaster', stage: 'code-review' },
      { keywords: ['创意', 'creative', '设计', 'design'], agent: 'grace', stage: 'creative' },
      { keywords: ['编排', 'orchestrate', '流程', 'workflow'], agent: 'tianshu', stage: 'orchestration' },
    ];

    const stages: Array<{ id: string; name: string; agentId: string; dependencies: string[]; parallel: boolean }> = [];
    const matchedAgentIds = new Set<string>();

    let stageIdx = 0;
    for (const pattern of TASK_PATTERNS) {
      if (stageIdx >= maxSteps) break;
      if (pattern.keywords.some(kw => objective.includes(kw))) {
        const agentExists = agents.some(a => String(a.id) === pattern.agent);
        if (!agentExists && agents.length > 0) continue;

        const dep = stages.length > 0 ? [stages[stages.length - 1]!.id] : [];
        stages.push({
          id: `stage-${stageIdx + 1}`,
          name: pattern.stage,
          agentId: pattern.agent,
          dependencies: dep,
          parallel: false,
        });
        matchedAgentIds.add(pattern.agent);
        stageIdx++;
      }
    }

    if (stages.length === 0 && agents.length > 0) {
      stages.push({ id: 'stage-1', name: 'default-processing', agentId: String(agents[0]!.id ?? 'thinker'), dependencies: [], parallel: false });
    }

    for (let i = 1; i < stages.length; i++) {
      const canParallel = i < maxParallel && stages[i]!.dependencies.length <= 1;
      if (canParallel && i + 1 < stages.length) {
        stages[i + 1]!.dependencies = [...stages[i + 1]!.dependencies, stages[i]!.id];
      }
    }

    return {
      objective: String(params.objective),
      stages,
      totalStages: stages.length,
      agentsUsed: [...matchedAgentIds],
      parallelGroups: findParallelGroups(stages),
      estimatedDuration: stages.length * 2000,
      rollbackPlan: stages.length > 2 ? `Rollback to stage-${Math.max(1, stages.length - 2)} on failure` : 'Retry from start on failure',
    };
  },
  (params) => {
    const errors: string[] = [];
    if (!params.objective || typeof params.objective !== 'string') errors.push('Parameter "objective" is required');
    if (!Array.isArray(params.availableAgents)) errors.push('Parameter "availableAgents" is required');
    return { valid: errors.length === 0, errors: errors.length > 0 ? errors : undefined };
  },
);

export const crisisResponseSkill = defineSkill(
  {
    id: 'tianshu:crisis-response',
    name: 'Crisis Response',
    version: '1.0.0',
    owner: 'tianshu',
    description: 'Automated crisis detection and response — classify severity, assemble response team, and execute emergency protocol.',
    category: 'orchestration',
    parameters: [
      { name: 'incident', type: 'object', required: true, description: 'Incident details { type, severity, description, affectedSystems }.' },
      { name: 'availableAgents', type: 'array', required: false, description: 'Available agents for response team assembly.' },
    ],
  },
  async (params) => {
    const incident = (params.incident as Record<string, unknown>) ?? {};
    const agents = (params.availableAgents as Array<Record<string, unknown>>) ?? [];

    const type = String(incident.type ?? 'unknown').toLowerCase();
    const severity = String(incident.severity ?? 'medium') as 'low' | 'medium' | 'high' | 'critical';
    const description = String(incident.description ?? '');
    const affectedSystems = (incident.affectedSystems as string[]) ?? [];

    const severityScore: Record<string, number> = { low: 0.2, medium: 0.5, high: 0.8, critical: 1.0 };
    const score = severityScore[severity] ?? 0.5;

    const RESPONSE_ROLES: Record<string, string[]> = {
      security: ['guardian', 'xingbu'],
      performance: ['thinker', 'prophet'],
      data_loss: ['guardian', 'hubu'],
      service_down: ['tianshu', 'gongbu'],
      code_bug: ['grandmaster', 'bingbu'],
      default: ['tianshu', 'guardian'],
    };

    const responseType = Object.keys(RESPONSE_ROLES).find(k => type.includes(k)) ?? 'default';
    const requiredRoles = RESPONSE_ROLES[responseType] ?? RESPONSE_ROLES['default']!;

    const responseTeam = agents
      .filter(a => requiredRoles.includes(String(a.id)))
      .map(a => ({ agentId: String(a.id), role: 'responder' }));

    const playbook: Array<{ step: number; action: string; assignee: string; deadline: number }> = [];
    playbook.push({ step: 1, action: 'Acknowledge incident and assess blast radius', assignee: 'tianshu', deadline: 5 * 60 * 1000 });
    if (severity === 'critical' || severity === 'high') {
      playbook.push({ step: 2, action: 'Isolate affected systems', assignee: 'guardian', deadline: 10 * 60 * 1000 });
    }
    playbook.push({ step: playbook.length + 1, action: `Diagnose root cause: ${description}`, assignee: responseTeam[0]?.agentId ?? 'thinker', deadline: 30 * 60 * 1000 });
    playbook.push({ step: playbook.length + 1, action: 'Execute fix and verify', assignee: responseTeam[1]?.agentId ?? 'grandmaster', deadline: 60 * 60 * 1000 });
    playbook.push({ step: playbook.length + 1, action: 'Post-incident review', assignee: 'tianshu', deadline: 24 * 60 * 60 * 1000 });

    return {
      incidentId: `incident-${Date.now()}`,
      severity,
      severityScore: score,
      type: responseType,
      responseTeam,
      playbook,
      affectedSystems,
      status: 'active',
      escalation: score >= 0.8 ? 'escalate-to-emperor' : 'standard-response',
    };
  },
  (params) => {
    const errors: string[] = [];
    if (!params.incident || typeof params.incident !== 'object') errors.push('Parameter "incident" is required');
    return { valid: errors.length === 0, errors: errors.length > 0 ? errors : undefined };
  },
);

function findParallelGroups(stages: Array<{ id: string; dependencies: string[] }>): string[][] {
  const groups: string[][] = [];
  const visited = new Set<string>();
  for (const stage of stages) {
    if (stage.dependencies.length === 0 && !visited.has(stage.id)) {
      const group = stages.filter(s => s.dependencies.length === 0 && !visited.has(s.id)).map(s => s.id);
      if (group.length > 0) { groups.push(group); group.forEach(id => visited.add(id)); }
      break;
    }
  }
  for (const stage of stages) {
    if (!visited.has(stage.id)) { groups.push([stage.id]); visited.add(stage.id); }
  }
  return groups;
}
