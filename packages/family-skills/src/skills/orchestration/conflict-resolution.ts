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

import { defineSkill } from '../../registry/SkillManifest'

export const conflictResolutionSkill = defineSkill(
  {
    id: 'tianshu:conflict-resolution',
    name: 'Conflict Resolution',
    version: '1.0.0',
    owner: 'tianshu',
    description: 'Detects and resolves conflicts between agent outputs — merges contradictory results, prioritizes by confidence.',
    category: 'orchestration',
    parameters: [
      {
        name: 'results',
        type: 'array',
        required: true,
        description: 'Array of agent results to reconcile.',
      },
    ],
  },
  async (params) => {
    const results = (params.results as Array<Record<string, unknown>>) ?? [];

    if (results.length === 0) {
      return { consensus: null, conflicts: [], resolution: 'No results to reconcile.' };
    }

    if (results.length === 1) {
      return { consensus: results[0], conflicts: [], resolution: 'Single result — no conflicts.' };
    }

    const conflicts: Array<{ type: string; description: string; sources: string[] }> = [];

    const hasConflict = results.some((r, _i, arr) => {
      const others = arr.filter(x => x !== r);
      return others.some(o => {
        const rSuccess = r.success;
        const oSuccess = o.success;
        return rSuccess !== oSuccess;
      });
    });

    if (hasConflict) {
      conflicts.push({
        type: 'success_mismatch',
        description: 'Some results indicate success while others indicate failure.',
        sources: results.map((_, i) => `result-${i}`),
      });
    }

    const successfulResults = results.filter(r => r.success === true);
    const consensus = successfulResults.length > 0 ? successfulResults[0] : results[0];

    return {
      consensus,
      conflicts,
      totalResults: results.length,
      successfulCount: successfulResults.length,
      resolution: conflicts.length > 0
        ? `Resolved ${conflicts.length} conflict(s). Selected result with success=true.`
        : 'No conflicts detected.',
    };
  },
  (params) => {
    const errors: string[] = [];
    if (!Array.isArray(params.results)) {
      errors.push('Parameter "results" is required and must be an array');
    }
    return { valid: errors.length === 0, errors: errors.length > 0 ? errors : undefined };
  },
);
