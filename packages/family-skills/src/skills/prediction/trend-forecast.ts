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

export const trendForecastSkill = defineSkill(
  {
    id: 'prophet:trend-forecast',
    name: 'Trend Forecast',
    version: '1.0.0',
    owner: 'prophet',
    description: 'Trend forecasting with linear and exponential regression — predicts future values with confidence intervals.',
    category: 'prediction',
    parameters: [
      {
        name: 'data',
        type: 'array',
        required: true,
        description: 'Historical numeric data series.',
      },
      {
        name: 'periods',
        type: 'number',
        required: false,
        description: 'Number of periods to forecast.',
        default: 10,
      },
      {
        name: 'model',
        type: 'string',
        required: false,
        description: 'Regression model: linear (default) or exponential.',
        default: 'linear',
      },
    ],
  },
  async (params) => {
    const data = (params.data as number[]) ?? [];
    const periods = Number(params.periods ?? 10);
    const model = String(params.model ?? 'linear');

    if (data.length < 2) {
      return { forecast: [], model, message: 'Insufficient data for forecasting.' };
    }

    const n = data.length;
    const x = Array.from({ length: n }, (_, i) => i);

    let forecast: number[];
    let r2: number;
    let coefficients: { slope: number; intercept: number };

    if (model === 'exponential') {
      const logData = data.map(v => Math.log(Math.max(v, 0.001)));
      const linResult = linearRegression(x, logData);
      coefficients = { slope: Math.exp(linResult.slope), intercept: Math.exp(linResult.intercept) };
      forecast = Array.from({ length: periods }, (_, i) =>
        coefficients.intercept * Math.pow(coefficients.slope, n + i),
      );
      r2 = calculateR2(logData, linResult.predicted);
    } else {
      const linResult = linearRegression(x, data);
      coefficients = linResult;
      forecast = Array.from({ length: periods }, (_, i) =>
        coefficients.slope * (n + i) + coefficients.intercept,
      );
      r2 = calculateR2(data, linResult.predicted);
    }

    const residuals = model === 'exponential'
      ? data.map((v, i) => v - coefficients.intercept * Math.pow(coefficients.slope, i))
      : data.map((v, i) => v - (coefficients.slope * i + coefficients.intercept));
    const residualStd = Math.sqrt(residuals.reduce((s, r) => s + r * r, 0) / residuals.length);

    const upper = forecast.map(v => v + 1.96 * residualStd);
    const lower = forecast.map(v => v - 1.96 * residualStd);

    return {
      forecast,
      upperBound: upper,
      lowerBound: lower,
      model,
      coefficients,
      r2,
      confidence: Math.max(0.1, Math.min(r2, 0.95)),
      periods,
      inputDataPoints: n,
    };
  },
  (params) => {
    const errors: string[] = [];
    if (!Array.isArray(params.data)) {
      errors.push('Parameter "data" is required and must be an array of numbers');
    }
    return { valid: errors.length === 0, errors: errors.length > 0 ? errors : undefined };
  },
);

function linearRegression(x: number[], y: number[]) {
  const n = x.length;
  const xMean = x.reduce((a, b) => a + b, 0) / n;
  const yMean = y.reduce((a, b) => a + b, 0) / n;
  let num = 0;
  let den = 0;
  for (let i = 0; i < n; i++) {
    num += (x[i]! - xMean) * (y[i]! - yMean);
    den += (x[i]! - xMean) ** 2;
  }
  const slope = den === 0 ? 0 : num / den;
  const intercept = yMean - slope * xMean;
  const predicted = x.map(xi => slope * xi + intercept);
  return { slope, intercept, predicted };
}

function calculateR2(actual: number[], predicted: number[]): number {
  const mean = actual.reduce((a, b) => a + b, 0) / actual.length;
  const ssRes = actual.reduce((sum, v, i) => sum + (v - predicted[i]!) ** 2, 0);
  const ssTot = actual.reduce((sum, v) => sum + (v - mean) ** 2, 0);
  return ssTot === 0 ? 0 : 1 - ssRes / ssTot;
}
