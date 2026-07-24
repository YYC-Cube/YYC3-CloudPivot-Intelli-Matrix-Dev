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

export const dataInsightSkill = defineSkill(
  {
    id: 'thinker:data-insight',
    name: 'Data Insight',
    version: '1.0.0',
    owner: 'thinker',
    description: 'Automated data insight generation — discovers patterns, correlations, and statistical summaries from datasets.',
    category: 'analysis',
    parameters: [
      {
        name: 'dataset',
        type: 'array',
        required: true,
        description: 'Array of data records to analyze.',
      },
      {
        name: 'fields',
        type: 'array',
        required: false,
        description: 'Specific fields to focus analysis on.',
      },
    ],
  },
  async (params) => {
    const dataset = (params.dataset as Array<Record<string, unknown>>) ?? [];
    const fields = (params.fields as string[]) ?? [];

    if (dataset.length === 0) {
      return { insights: [], summary: 'Empty dataset — no insights to generate.' };
    }

    const allFields = fields.length > 0 ? fields : [...new Set(dataset.flatMap(Object.keys))];
    const summary = generateSummary(dataset, allFields);
    const correlations = findCorrelations(dataset, allFields);
    const patterns = findPatterns(dataset, allFields);
    const outliers = findOutliers(dataset, allFields);

    return {
      insights: [...patterns, ...correlations.map(c => `Correlation: ${c.field1} ↔ ${c.field2} (r=${c.coefficient.toFixed(3)})`)],
      summary,
      correlations,
      patterns,
      outliers,
      recordCount: dataset.length,
      fieldCount: allFields.length,
    };
  },
  (params) => {
    const errors: string[] = [];
    if (!Array.isArray(params.dataset)) {
      errors.push('Parameter "dataset" is required and must be an array');
    }
    return { valid: errors.length === 0, errors: errors.length > 0 ? errors : undefined };
  },
);

function generateSummary(dataset: Array<Record<string, unknown>>, fields: string[]) {
  const fieldStats: Record<string, { type: string; count: number; unique: number; nulls: number }> = {};

  for (const field of fields) {
    const values = dataset.map(r => r[field]);
    const nonNull = values.filter(v => v !== null && v !== undefined);
    const unique = new Set(nonNull).size;

    const numericCount = nonNull.filter(v => typeof v === 'number' || !isNaN(Number(v))).length;
    const type = numericCount > nonNull.length * 0.5 ? 'numeric' : 'categorical';

    fieldStats[field] = {
      type,
      count: nonNull.length,
      unique,
      nulls: values.length - nonNull.length,
    };
  }

  return { totalRecords: dataset.length, fields: fieldStats };
}

function findCorrelations(dataset: Array<Record<string, unknown>>, fields: string[]): Array<{ field1: string; field2: string; coefficient: number }> {
  const numericFields = fields.filter(f => {
    const values = dataset.map(r => Number(r[f]));
    return values.filter(v => !isNaN(v)).length > dataset.length * 0.5;
  });

  const correlations: Array<{ field1: string; field2: string; coefficient: number }> = [];

  for (let i = 0; i < numericFields.length; i++) {
    for (let j = i + 1; j < numericFields.length; j++) {
      const f1 = numericFields[i]!;
      const f2 = numericFields[j]!;

      const pairs = dataset
        .map(r => [Number(r[f1]), Number(r[f2])])
        .filter(([a, b]) => !isNaN(a as number) && !isNaN(b as number)) as [number, number][];

      if (pairs.length < 3) continue;

      const corr = pearsonCorrelation(pairs.map(p => p[0]!), pairs.map(p => p[1]!));
      if (Math.abs(corr) > 0.3) {
        correlations.push({ field1: f1!, field2: f2!, coefficient: corr });
      }
    }
  }

  return correlations.sort((a, b) => Math.abs(b.coefficient) - Math.abs(a.coefficient));
}

function pearsonCorrelation(x: number[], y: number[]): number {
  const n = x.length;
  const xMean = x.reduce((a, b) => a + b, 0) / n;
  const yMean = y.reduce((a, b) => a + b, 0) / n;
  let num = 0;
  let denX = 0;
  let denY = 0;
  for (let i = 0; i < n; i++) {
    num += (x[i]! - xMean) * (y[i]! - yMean);
    denX += (x[i]! - xMean) ** 2;
    denY += (y[i]! - yMean) ** 2;
  }
  const den = Math.sqrt(denX) * Math.sqrt(denY);
  return den === 0 ? 0 : num / den;
}

function findPatterns(dataset: Array<Record<string, unknown>>, fields: string[]): string[] {
  const patterns: string[] = [];

  for (const field of fields) {
    const values = dataset.map(r => r[field]).filter(v => v !== null && v !== undefined);
    const uniqueRatio = new Set(values).size / values.length;

    if (uniqueRatio === 1) {
      patterns.push(`Field "${field}" has all unique values — likely an identifier.`);
    } else if (uniqueRatio < 0.05) {
      patterns.push(`Field "${field}" has very low cardinality (${(uniqueRatio * 100).toFixed(1)}%) — likely a category/flag.`);
    }
  }

  return patterns;
}

function findOutliers(dataset: Array<Record<string, unknown>>, fields: string[]): Array<{ field: string; count: number; threshold: number }> {
  const outliers: Array<{ field: string; count: number; threshold: number }> = [];

  for (const field of fields) {
    const values = dataset.map(r => Number(r[field])).filter(v => !isNaN(v));
    if (values.length < 4) continue;

    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const std = Math.sqrt(values.reduce((s, v) => s + (v - mean) ** 2, 0) / values.length);
    if (std === 0) continue;

    const count = values.filter(v => Math.abs((v - mean) / std) > 2).length;
    if (count > 0) {
      outliers.push({ field, count, threshold: 2 });
    }
  }

  return outliers;
}
