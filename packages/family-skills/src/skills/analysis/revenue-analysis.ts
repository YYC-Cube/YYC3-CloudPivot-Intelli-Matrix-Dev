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

export const dataAnalysisSkill = defineSkill(
  {
    id: 'hubu:data-analysis',
    name: 'Revenue Data Analysis',
    version: '1.0.0',
    owner: 'grandmaster',
    description: 'Ministry of Revenue (户部) — data aggregation, trend analysis, and financial reporting.',
    category: 'analysis',
    parameters: [
      {
        name: 'data',
        type: 'array',
        required: true,
        description: 'Financial data records to analyze.',
      },
      {
        name: 'operation',
        type: 'string',
        required: false,
        description: 'Operation: aggregate, trend, comparison, anomaly.',
        default: 'aggregate',
      },
    ],
  },
  async (params) => {
    const data = (params.data as number[]) ?? [];
    const operation = String(params.operation ?? 'aggregate');

    if (data.length === 0) {
      return { result: null, operation, message: 'No data to analyze.' };
    }

    switch (operation) {
      case 'trend': {
        const changes: number[] = [];
        for (let i = 1; i < data.length; i++) changes.push(data[i]! - data[i - 1]!);
        const avgChange = changes.reduce((a, b) => a + b, 0) / changes.length;
        return {
          operation: 'trend',
          trend: avgChange > 0 ? 'upward' : avgChange < 0 ? 'downward' : 'stable',
          avgChange,
          changes,
        };
      }
      case 'comparison': {
        const half = Math.floor(data.length / 2);
        const first = data.slice(0, half);
        const second = data.slice(half);
        return {
          operation: 'comparison',
          firstHalfAvg: first.reduce((a, b) => a + b, 0) / first.length,
          secondHalfAvg: second.reduce((a, b) => a + b, 0) / second.length,
          change: (second.reduce((a, b) => a + b, 0) / second.length) - (first.reduce((a, b) => a + b, 0) / first.length),
        };
      }
      case 'anomaly': {
        const mean = data.reduce((a, b) => a + b, 0) / data.length;
        const std = Math.sqrt(data.reduce((s, v) => s + (v - mean) ** 2, 0) / data.length);
        const outliers = data.filter(v => std > 0 && Math.abs((v - mean) / std) > 2);
        return { operation: 'anomaly', mean, std, outliers, outlierCount: outliers.length };
      }
      default: {
        const sum = data.reduce((a, b) => a + b, 0);
        return {
          operation: 'aggregate',
          sum,
          avg: sum / data.length,
          min: Math.min(...data),
          max: Math.max(...data),
          count: data.length,
        };
      }
    }
  },
  (params) => {
    const errors: string[] = [];
    if (!Array.isArray(params.data)) {
      errors.push('Parameter "data" is required and must be an array');
    }
    return { valid: errors.length === 0, errors: errors.length > 0 ? errors : undefined };
  },
);
