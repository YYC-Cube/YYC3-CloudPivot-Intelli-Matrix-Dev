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

import { defineSkill } from '../../registry/SkillManifest.js';

export const resourceOptimizationSkill = defineSkill(
  {
    id: 'tianshu:resource-optimization',
    name: 'Resource Optimization',
    version: '1.0.0',
    owner: 'tianshu',
    description: 'Optimizes resource allocation across agents — balances workload, prevents bottlenecks.',
    category: 'orchestration',
    parameters: [
      {
        name: 'agents',
        type: 'array',
        required: true,
        description: 'Agent workload information for optimization.',
      },
      {
        name: 'tasks',
        type: 'array',
        required: false,
        description: 'Pending tasks to assign.',
      },
    ],
  },
  async (params) => {
    const agents = (params.agents as Array<Record<string, unknown>>) ?? [];
    const tasks = (params.tasks as Array<Record<string, unknown>>) ?? [];

    const agentLoads = agents.map((a, i) => ({
      id: String(a.id ?? `agent-${i}`),
      currentLoad: Number(a.currentLoad ?? 0),
      maxCapacity: Number(a.maxCapacity ?? 10),
      utilization: Number(a.currentLoad ?? 0) / Number(a.maxCapacity ?? 10),
    }));

    agentLoads.sort((a, b) => a.utilization - b.utilization);

    const assignments = tasks.map((task, i) => {
      const targetAgent = agentLoads[i % agentLoads.length];
      return {
        taskId: String(task.id ?? `task-${i}`),
        assignedTo: targetAgent?.id ?? 'unassigned',
        reason: targetAgent ? `Lowest utilization at ${(targetAgent.utilization * 100).toFixed(1)}%` : 'No agent available',
      };
    });

    const avgUtilization = agentLoads.length > 0
      ? agentLoads.reduce((sum, a) => sum + a.utilization, 0) / agentLoads.length
      : 0;

    return {
      assignments,
      agentLoads,
      averageUtilization: avgUtilization,
      recommendation: avgUtilization > 0.8
        ? 'System under high load. Consider scaling.'
        : avgUtilization > 0.5
          ? 'Moderate load. Resources well-balanced.'
          : 'Low load. System has spare capacity.',
    };
  },
  (params) => {
    const errors: string[] = [];
    if (!Array.isArray(params.agents)) {
      errors.push('Parameter "agents" is required and must be an array');
    }
    return { valid: errors.length === 0, errors: errors.length > 0 ? errors : undefined };
  },
);
