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

export const personnelManagementSkill = defineSkill(
  {
    id: 'tianshu:personnel-management',
    name: 'Personnel Management',
    version: '1.0.0',
    owner: 'tianshu',
    description: 'Agent registration, performance assessment, and team management.',
    category: 'orchestration',
    parameters: [
      {
        name: 'action',
        type: 'string',
        required: true,
        description: 'Action: register, assess, report.',
      },
      {
        name: 'agentData',
        type: 'object',
        required: true,
        description: 'Agent data for the action.',
      },
    ],
  },
  async (params) => {
    const action = String(params.action ?? 'report');
    const agentData = (params.agentData as Record<string, unknown>) ?? {};

    switch (action) {
      case 'register': {
        return {
          action: 'register',
          agentId: agentData.id ?? `agent-${Date.now()}`,
          status: 'registered',
          registeredAt: Date.now(),
          permissions: agentData.permissions ?? ['read'],
        };
      }
      case 'assess': {
        const score = Number(agentData.score ?? 0.5);
        return {
          action: 'assess',
          agentId: agentData.id,
          score,
          rating: score >= 0.9 ? 'S' : score >= 0.8 ? 'A' : score >= 0.7 ? 'B' : score >= 0.6 ? 'C' : 'D',
          recommendations: score < 0.7 ? ['Needs improvement in core areas', 'Schedule additional training'] : [],
        };
      }
      default: {
        return {
          action: 'report',
          totalAgents: Number(agentData.totalAgents ?? 0),
          activeAgents: Number(agentData.activeAgents ?? 0),
          avgPerformance: Number(agentData.avgPerformance ?? 0),
          generatedAt: Date.now(),
        };
      }
    }
  },
  (params) => {
    const errors: string[] = [];
    if (!params.action || typeof params.action !== 'string') {
      errors.push('Parameter "action" is required');
    }
    if (!params.agentData || typeof params.agentData !== 'object') {
      errors.push('Parameter "agentData" is required');
    }
    return { valid: errors.length === 0, errors: errors.length > 0 ? errors : undefined };
  },
);
