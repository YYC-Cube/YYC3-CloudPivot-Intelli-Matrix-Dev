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
import type { FamilyMemberId } from '@yyc3/family-agents';

const MEMBER_CAPABILITIES: Record<FamilyMemberId, string[]> = {
  qianhang: ['nlu', 'intent', 'emotion', 'language', 'dialogue'],
  thinker: ['analysis', 'data', 'insight', 'reasoning', 'logic'],
  prophet: ['prediction', 'forecast', 'trend', 'anomaly', 'time-series'],
  bole: ['recommendation', 'matching', 'ranking', 'personalization'],
  tianshu: ['orchestration', 'routing', 'coordination', 'planning'],
  guardian: ['security', 'audit', 'threat', 'protection', 'compliance'],
  grandmaster: ['quality', 'review', 'standard', 'best-practice', 'testing'],
  grace: ['creative', 'design', 'style', 'generation', 'aesthetic'],
};

export const taskRoutingSkill = defineSkill(
  {
    id: 'tianshu:task-routing',
    name: 'Task Routing',
    version: '1.0.0',
    owner: 'tianshu',
    description: 'Intelligent task routing — analyzes task requirements and routes to the best-fit family member.',
    category: 'orchestration',
    parameters: [
      {
        name: 'task',
        type: 'string',
        required: true,
        description: 'The task description to route.',
      },
      {
        name: 'priority',
        type: 'string',
        required: false,
        description: 'Task priority: low, normal, high, critical.',
        default: 'normal',
      },
    ],
  },
  async (params) => {
    const task = String(params.task ?? '').toLowerCase();
    const priority = String(params.priority ?? 'normal');

    const scores: Record<string, number> = {};

    for (const [member, capabilities] of Object.entries(MEMBER_CAPABILITIES)) {
      let score = 0;
      for (const cap of capabilities) {
        if (task.includes(cap)) score += 2;
      }

      const taskWords = task.split(/\s+/);
      for (const word of taskWords) {
        if (word.length > 2) {
          for (const cap of capabilities) {
            if (cap.includes(word) || word.includes(cap)) score += 1;
          }
        }
      }

      scores[member] = score;
    }

    const maxScore = Math.max(...Object.values(scores));
    const candidates: Array<{ memberId: FamilyMemberId; score: number; capabilities: string[] }> = [];

    for (const [member, score] of Object.entries(scores)) {
      if (score > 0) {
        candidates.push({
          memberId: member as FamilyMemberId,
          score,
          capabilities: MEMBER_CAPABILITIES[member as FamilyMemberId],
        });
      }
    }

    candidates.sort((a, b) => b.score - a.score);

    const best = candidates[0];
    const fallback: FamilyMemberId = 'tianshu';

    return {
      assignedTo: best?.memberId ?? fallback,
      confidence: best ? Math.min(best.score / 5, 1.0) : 0.1,
      candidates: candidates.slice(0, 3),
      fallback,
      priority,
      task: String(params.task),
      reason: best
        ? `Best match: ${best.memberId} (score: ${best.score}, capabilities: ${best.capabilities.join(', ')})`
        : `No strong match found, routing to ${fallback} for further analysis.`,
    };
  },
  (params) => {
    const errors: string[] = [];
    if (!params.task || typeof params.task !== 'string') {
      errors.push('Parameter "task" is required and must be a string');
    }
    return { valid: errors.length === 0, errors: errors.length > 0 ? errors : undefined };
  },
);
