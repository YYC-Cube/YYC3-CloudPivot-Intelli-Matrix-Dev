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

export const comparativeAnalysisSkill = defineSkill(
  {
    id: 'thinker:comparative-analysis',
    name: 'Comparative Analysis',
    version: '1.0.0',
    owner: 'thinker',
    description: 'Comparative analysis — benchmarks multiple datasets or systems against each other with statistical significance testing.',
    category: 'analysis',
    parameters: [
      {
        name: 'datasets',
        type: 'array',
        required: true,
        description: 'Array of named datasets to compare: [{ name, data }].',
      },
      {
        name: 'metric',
        type: 'string',
        required: false,
        description: 'Metric field to compare on.',
        default: 'value',
      },
    ],
  },
  async (params) => {
    const datasets = (params.datasets as Array<{ name: string; data: number[] }>) ?? [];
    const metric = String(params.metric ?? 'value');

    if (datasets.length < 2) {
      return { comparison: [], winner: null, message: 'Need at least 2 datasets for comparison.' };
    }

    const comparison = datasets.map(ds => {
      const data = ds.data;
      const mean = data.reduce((a, b) => a + b, 0) / data.length;
      const std = Math.sqrt(data.reduce((s, v) => s + (v - mean) ** 2, 0) / data.length);
      return {
        name: ds.name,
        mean,
        std,
        min: Math.min(...data),
        max: Math.max(...data),
        count: data.length,
        ci95: std > 0 ? 1.96 * std / Math.sqrt(data.length) : 0,
      };
    });

    comparison.sort((a, b) => b.mean - a.mean);
    const winner = comparison[0];

    return {
      comparison,
      winner: winner?.name ?? null,
      metric,
      significance: comparison.length >= 2
        ? Math.abs(comparison[0]!.mean - comparison[comparison.length - 1]!.mean) > (comparison[0]!.ci95 + comparison[comparison.length - 1]!.ci95)
        : false,
    };
  },
  (params) => {
    const errors: string[] = [];
    if (!Array.isArray(params.datasets) || (params.datasets as unknown[]).length < 2) {
      errors.push('Parameter "datasets" is required and must be an array with at least 2 entries');
    }
    return { valid: errors.length === 0, errors: errors.length > 0 ? errors : undefined };
  },
);
