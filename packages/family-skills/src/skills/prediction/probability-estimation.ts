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

export const probabilityEstimationSkill = defineSkill(
  {
    id: 'prophet:probability-estimation',
    name: 'Probability Estimation',
    version: '1.0.0',
    owner: 'prophet',
    description: 'Probability estimation using Bayesian updating — estimates event likelihood from observed data.',
    category: 'prediction',
    parameters: [
      {
        name: 'observations',
        type: 'array',
        required: true,
        description: 'Array of observation objects with outcome (true/false) and prior.',
      },
      {
        name: 'prior',
        type: 'number',
        required: false,
        description: 'Initial prior probability (0-1).',
        default: 0.5,
      },
    ],
  },
  async (params) => {
    const observations = (params.observations as Array<{ outcome: boolean; evidence?: number }>) ?? [];
    let prior = Number(params.prior ?? 0.5);
    prior = Math.max(0.01, Math.min(0.99, prior));

    const posteriorHistory: number[] = [prior];
    let current = prior;

    for (const obs of observations) {
      const likelihood = obs.outcome ? 0.8 : 0.2;
      const falsePositiveRate = 0.3;
      const numerator = likelihood * current;
      const denominator = numerator + falsePositiveRate * (1 - current);
      current = denominator === 0 ? prior : numerator / denominator;
      current = Math.max(0.01, Math.min(0.99, current));
      posteriorHistory.push(current);
    }

    return {
      posterior: current,
      prior,
      updateCount: observations.length,
      posteriorHistory,
      confidence: Math.min(1 - Math.abs(current - prior), 0.95),
      interpretation: current > 0.7
        ? 'High probability — likely to occur'
        : current > 0.4
          ? 'Moderate probability — uncertain'
          : 'Low probability — unlikely to occur',
    };
  },
  (params) => {
    const errors: string[] = [];
    if (!Array.isArray(params.observations)) {
      errors.push('Parameter "observations" is required and must be an array');
    }
    return { valid: errors.length === 0, errors: errors.length > 0 ? errors : undefined };
  },
);
