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

import { defineSkill } from '../../../registry/SkillManifest'

export const seasonalForecastSkill = defineSkill(
  {
    id: 'prophet:seasonal-forecast',
    name: 'Seasonal Forecast',
    version: '1.0.0',
    owner: 'prophet',
    description: 'Detect seasonal patterns in time-series data and generate period-aware forecasts with confidence intervals.',
    category: 'prediction',
    parameters: [
      { name: 'data', type: 'array', required: true, description: 'Time-series data points (numeric array).' },
      { name: 'forecastSteps', type: 'number', required: false, description: 'Number of future steps to forecast.', default: 7 },
      { name: 'minCycles', type: 'number', required: false, description: 'Minimum complete cycles required for seasonality detection.', default: 2 },
    ],
  },
  async (params) => {
    const data = (params.data as number[]) ?? [];
    const forecastSteps = Number(params.forecastSteps) || 7;
    const minCycles = Number(params.minCycles) || 2;

    if (data.length < 4) {
      return { forecasts: [], seasonality: null, confidence: 0, message: 'Insufficient data for seasonal analysis' };
    }

    const mean = data.reduce((a, b) => a + b, 0) / data.length;
    const centered = data.map(v => v - mean);

    let bestPeriod = 0;
    let bestAutocorr = 0;
    const maxLag = Math.floor(data.length / minCycles);
    for (let lag = 2; lag <= maxLag; lag++) {
      let sum = 0;
      const count = data.length - lag;
      for (let i = 0; i < count; i++) {
        sum += centered[i]! * centered[i + lag]!;
      }
      const autocorr = count > 0 ? sum / count : 0;
      if (autocorr > bestAutocorr) {
        bestAutocorr = autocorr;
        bestPeriod = lag;
      }
    }

    const hasSeasonality = bestPeriod >= 2 && bestAutocorr > 0.3;

    const forecasts: Array<{ step: number; value: number; lower: number; upper: number }> = [];
    if (hasSeasonality) {
      for (let s = 0; s < forecastSteps; s++) {
        const baseIdx = (data.length - bestPeriod + s) % bestPeriod;
        const seasonalValue = data[data.length - bestPeriod + (baseIdx >= 0 ? baseIdx : baseIdx + bestPeriod)] ?? mean;
        const trend = (data[data.length - 1]! - data[0]!) / data.length;
        const forecast = seasonalValue + trend * s;
        const margin = Math.abs(forecast) * 0.15 * (1 + s * 0.05);
        forecasts.push({ step: s + 1, value: Math.round(forecast * 100) / 100, lower: Math.round((forecast - margin) * 100) / 100, upper: Math.round((forecast + margin) * 100) / 100 });
      }
    } else {
      const trend = (data[data.length - 1]! - data[0]!) / data.length;
      for (let s = 0; s < forecastSteps; s++) {
        const forecast = data[data.length - 1]! + trend * (s + 1);
        const margin = Math.abs(forecast) * 0.2 * (1 + s * 0.1);
        forecasts.push({ step: s + 1, value: Math.round(forecast * 100) / 100, lower: Math.round((forecast - margin) * 100) / 100, upper: Math.round((forecast + margin) * 100) / 100 });
      }
    }

    return {
      forecasts,
      seasonality: hasSeasonality ? { period: bestPeriod, autocorrelation: Math.round(bestAutocorr * 1000) / 1000, cyclesFound: Math.floor(data.length / bestPeriod) } : null,
      trend: data.length >= 2 ? (data[data.length - 1]! > data[0]! ? 'upward' : data[data.length - 1]! < data[0]! ? 'downward' : 'flat') : 'flat',
      confidence: hasSeasonality ? Math.min(0.5 + bestAutocorr * 0.4, 0.95) : 0.4,
      dataPoints: data.length,
    };
  },
  (params) => {
    const errors: string[] = [];
    if (!Array.isArray(params.data)) errors.push('Parameter "data" is required and must be an array');
    return { valid: errors.length === 0, errors: errors.length > 0 ? errors : undefined };
  },
);

export const riskAssessmentSkill = defineSkill(
  {
    id: 'prophet:risk-assessment',
    name: 'Risk Assessment',
    version: '1.0.0',
    owner: 'prophet',
    description: 'Assess and score risk factors — compute risk matrix, impact probability, and generate mitigation strategies.',
    category: 'prediction',
    parameters: [
      { name: 'risks', type: 'array', required: true, description: 'Risk items [{ id, category, description, probability, impact }].' },
      { name: 'threshold', type: 'number', required: false, description: 'Risk score threshold for flagging (0-1).', default: 0.6 },
    ],
  },
  async (params) => {
    const risks = (params.risks as Array<Record<string, unknown>>) ?? [];
    const threshold = Number(params.threshold) || 0.6;

    const assessed = risks.map(risk => {
      const probability = Number(risk.probability) || 0.5;
      const impact = Number(risk.impact) || 0.5;
      const score = probability * impact;
      return {
        id: String(risk.id ?? 'unknown'),
        category: String(risk.category ?? 'general'),
        description: String(risk.description ?? ''),
        probability,
        impact,
        score,
        level: score >= 0.7 ? 'critical' : score >= 0.4 ? 'high' : score >= 0.2 ? 'medium' : 'low',
        flagged: score >= threshold,
      };
    });

    assessed.sort((a, b) => b.score - a.score);

    const critical = assessed.filter(r => r.level === 'critical');
    const high = assessed.filter(r => r.level === 'high');
    const overallScore = assessed.length > 0 ? assessed.reduce((sum, r) => sum + r.score, 0) / assessed.length : 0;

    const mitigations = assessed.filter(r => r.flagged).map(r => ({
      riskId: r.id,
      strategy: r.level === 'critical' ? 'Immediate mitigation required — escalate to crisis protocol' : r.level === 'high' ? 'Priority mitigation — assign owner and deadline' : 'Monitor and prepare contingency',
      priority: r.level === 'critical' ? 'P0' : r.level === 'high' ? 'P1' : 'P2',
    }));

    return {
      overallRisk: overallScore >= 0.6 ? 'critical' : overallScore >= 0.4 ? 'high' : overallScore >= 0.2 ? 'medium' : 'low',
      overallScore: Math.round(overallScore * 1000) / 1000,
      riskMatrix: { critical: critical.length, high: high.length, medium: assessed.filter(r => r.level === 'medium').length, low: assessed.filter(r => r.level === 'low').length },
      assessed,
      mitigations,
      topRisk: assessed[0] ?? null,
      threshold,
    };
  },
  (params) => {
    const errors: string[] = [];
    if (!Array.isArray(params.risks)) errors.push('Parameter "risks" is required and must be an array');
    return { valid: errors.length === 0, errors: errors.length > 0 ? errors : undefined };
  },
);
