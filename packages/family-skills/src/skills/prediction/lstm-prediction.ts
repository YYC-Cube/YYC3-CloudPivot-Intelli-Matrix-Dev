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

export const lstmPredictionSkill = defineSkill(
  {
    id: 'prophet:lstm-prediction',
    name: 'LSTM Time-Series Prediction',
    version: '1.0.0',
    owner: 'prophet',
    description: 'Simulated LSTM time-series prediction — applies moving average and trend extrapolation on numeric data series.',
    category: 'prediction',
    parameters: [
      {
        name: 'data',
        type: 'array',
        required: true,
        description: 'Historical numeric data series for prediction.',
      },
      {
        name: 'forecastSteps',
        type: 'number',
        required: false,
        description: 'Number of future steps to forecast.',
        default: 5,
      },
    ],
  },
  async (params) => {
    const data = (params.data as number[]) ?? [];
    const forecastSteps = Number(params.forecastSteps ?? 5);

    if (data.length < 3) {
      return { forecast: [], trend: 'insufficient_data', confidence: 0 };
    }

    const windowSize = Math.min(5, Math.floor(data.length / 2));
    const smoothed = movingAverage(data, windowSize);
    const trend = calculateTrend(smoothed);
    const seasonality = detectSeasonality(data);

    const forecast: number[] = [];
    const lastValue = data[data.length - 1]!;
    for (let i = 1; i <= forecastSteps; i++) {
      const trendComponent = trend * i;
      const seasonalComponent = seasonality > 0
        ? lastValue * Math.sin((2 * Math.PI * i) / seasonality) * 0.05
        : 0;
      forecast.push(lastValue + trendComponent + seasonalComponent);
    }

    const confidence = Math.max(0.1, 1 - (data.length < 10 ? 0.3 : 0.1) - Math.abs(trend) / (lastValue || 1) * 0.2);

    return {
      forecast,
      trend: trend > 0 ? 'upward' : trend < 0 ? 'downward' : 'stable',
      trendSlope: trend,
      confidence: Math.min(confidence, 0.95),
      seasonalityPeriod: seasonality,
      inputLength: data.length,
    };
  },
  (params) => {
    const errors: string[] = [];
    if (!Array.isArray(params.data)) {
      errors.push('Parameter "data" is required and must be an array of numbers');
    } else if ((params.data as number[]).some(v => typeof v !== 'number')) {
      errors.push('All elements in "data" must be numbers');
    }
    return { valid: errors.length === 0, errors: errors.length > 0 ? errors : undefined };
  },
);

function movingAverage(data: number[], window: number): number[] {
  const result: number[] = [];
  for (let i = window - 1; i < data.length; i++) {
    const slice = data.slice(i - window + 1, i + 1);
    result.push(slice.reduce((a, b) => a + b, 0) / window);
  }
  return result;
}

function calculateTrend(smoothed: number[]): number {
  if (smoothed.length < 2) return 0;
  const n = smoothed.length;
  const xMean = (n - 1) / 2;
  const yMean = smoothed.reduce((a, b) => a + b, 0) / n;
  let num = 0;
  let den = 0;
  for (let i = 0; i < n; i++) {
    num += (i - xMean) * (smoothed[i]! - yMean);
    den += (i - xMean) ** 2;
  }
  return den === 0 ? 0 : num / den;
}

function detectSeasonality(data: number[]): number {
  if (data.length < 6) return 0;

  let bestPeriod = 0;
  let bestCorr = 0;

  for (let period = 2; period <= Math.floor(data.length / 2); period++) {
    let corr = 0;
    const count = Math.min(data.length - period, period);
    for (let i = 0; i < count; i++) {
      corr += data[i]! * data[i + period]!;
    }
    corr /= count;
    if (corr > bestCorr) {
      bestCorr = corr;
      bestPeriod = period;
    }
  }

  return bestCorr > 0.5 ? bestPeriod : 0;
}
