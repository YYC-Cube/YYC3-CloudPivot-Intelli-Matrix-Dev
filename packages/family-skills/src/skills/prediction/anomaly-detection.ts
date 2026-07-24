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

export const anomalyDetectionSkill = defineSkill(
  {
    id: 'prophet:anomaly-detection',
    name: 'Anomaly Detection',
    version: '1.0.0',
    owner: 'prophet',
    description: 'Statistical anomaly detection — identifies outliers using z-score and IQR methods on numeric data.',
    category: 'prediction',
    parameters: [
      {
        name: 'data',
        type: 'array',
        required: true,
        description: 'Numeric data series to check for anomalies.',
      },
      {
        name: 'method',
        type: 'string',
        required: false,
        description: 'Detection method: zscore (default) or iqr.',
        default: 'zscore',
      },
      {
        name: 'threshold',
        type: 'number',
        required: false,
        description: 'Anomaly threshold (zscore: default 2, iqr: default 1.5).',
      },
    ],
  },
  async (params) => {
    const data = (params.data as number[]) ?? [];
    const method = String(params.method ?? 'zscore');
    const threshold = Number(params.threshold ?? (method === 'iqr' ? 1.5 : 2));

    if (data.length < 3) {
      return { anomalies: [], anomalyCount: 0, method, message: 'Insufficient data for anomaly detection.' };
    }

    let anomalies: Array<{ index: number; value: number; score: number }>;

    if (method === 'iqr') {
      anomalies = detectIQR(data, threshold);
    } else {
      anomalies = detectZScore(data, threshold);
    }

    const stats = calculateStats(data);

    return {
      anomalies,
      anomalyCount: anomalies.length,
      anomalyRatio: anomalies.length / data.length,
      method,
      threshold,
      stats,
    };
  },
  (params) => {
    const errors: string[] = [];
    if (!Array.isArray(params.data)) {
      errors.push('Parameter "data" is required and must be an array');
    }
    return { valid: errors.length === 0, errors: errors.length > 0 ? errors : undefined };
  },
);

function detectZScore(data: number[], threshold: number): Array<{ index: number; value: number; score: number }> {
  const mean = data.reduce((a, b) => a + b, 0) / data.length;
  const std = Math.sqrt(data.reduce((sum, v) => sum + (v - mean) ** 2, 0) / data.length);
  if (std === 0) return [];

  return data
    .map((value, index) => ({ index, value, score: Math.abs((value - mean) / std) }))
    .filter(item => item.score > threshold);
}

function detectIQR(data: number[], threshold: number): Array<{ index: number; value: number; score: number }> {
  const sorted = [...data].sort((a, b) => a - b);
  const q1 = sorted[Math.floor(sorted.length * 0.25)]!;
  const q3 = sorted[Math.floor(sorted.length * 0.75)]!;
  const iqr = q3 - q1;
  if (iqr === 0) return [];

  const lower = q1 - threshold * iqr;
  const upper = q3 + threshold * iqr;

  return data
    .map((value, index) => ({
      index,
      value,
      score: value < lower ? (lower - value) / iqr : value > upper ? (value - upper) / iqr : 0,
    }))
    .filter(item => item.score > 0);
}

function calculateStats(data: number[]) {
  const mean = data.reduce((a, b) => a + b, 0) / data.length;
  const std = Math.sqrt(data.reduce((sum, v) => sum + (v - mean) ** 2, 0) / data.length);
  const sorted = [...data].sort((a, b) => a - b);
  return {
    mean,
    std,
    min: sorted[0],
    max: sorted[sorted.length - 1],
    median: sorted[Math.floor(sorted.length / 2)],
    count: data.length,
  };
}
