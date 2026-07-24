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

export const performanceBaselineSkill = defineSkill(
  {
    id: 'grandmaster:performance-baseline',
    name: 'Performance Baseline Analysis',
    version: '1.0.0',
    owner: 'grandmaster',
    description: '持续监控 API 和组件性能，建立性能基线，发现性能衰退趋势并生成优化建议。',
    category: 'quality',
    tags: ['performance', 'baseline', 'profiling', 'regression'],
    parameters: [
      {
        name: 'measurements',
        type: 'array',
        required: true,
        description: '性能测量数据 { endpoint, responseTime, timestamp, status }。',
      },
      {
        name: 'baseline',
        type: 'object',
        required: false,
        description: '已有性能基线 { p50, p95, p99, avg }。',
      },
      {
        name: 'sla',
        type: 'object',
        required: false,
        description: 'SLA 目标 { p95, p99 }。',
      },
    ],
  },
  async (params) => {
    const measurements = (params.measurements as Array<{
      endpoint: string;
      responseTime: number;
      timestamp: string;
      status: number;
    }>) ?? [];
    const baseline = params.baseline as { p50: number; p95: number; p99: number; avg: number } | null;
    const sla = params.sla as { p95?: number; p99?: number } | null;

    if (measurements.length === 0) {
      return { result: null, message: 'No performance measurements provided.' };
    }

    // 按 endpoint 分组
    const byEndpoint: Record<string, number[]> = {};
    for (const m of measurements) {
      if (!byEndpoint[m.endpoint]) byEndpoint[m.endpoint] = [];
      byEndpoint[m.endpoint]!.push(m.responseTime);
    }

    const endpointStats = Object.entries(byEndpoint).map(([endpoint, times]) => {
      const sorted = [...times].sort((a, b) => a - b);
      const n = sorted.length;
      const p50 = sorted[Math.floor(n * 0.5)]!;
      const p95 = sorted[Math.floor(n * 0.95)] ?? sorted[n - 1]!;
      const p99 = sorted[Math.floor(n * 0.99)] ?? sorted[n - 1]!;
      const avg = sorted.reduce((a, b) => a + b, 0) / n;
      const errors = measurements.filter((m) => m.endpoint === endpoint && m.status >= 400).length;
      const errorRate = errors / n;

      // 性能评分
      let perfScore = 100;
      if (sla?.p95 && p95 > sla.p95) perfScore -= 20;
      if (sla?.p99 && p99 > sla.p99) perfScore -= 15;
      if (p95 > 1000) perfScore -= 20;
      if (p99 > 2000) perfScore -= 15;
      if (errorRate > 0.01) perfScore -= 20;
      perfScore = Math.max(0, perfScore);

      return {
        endpoint,
        p50,
        p95,
        p99,
        avg,
        errorRate: Number(errorRate.toFixed(4)),
        sampleCount: n,
        perfScore,
        status: perfScore >= 80 ? 'optimal' : perfScore >= 60 ? 'acceptable' : perfScore >= 40 ? 'degraded' : 'critical',
      };
    });

    // 全局基线
    const allTimes = measurements.map((m) => m.responseTime).sort((a, b) => a - b);
    const globalP50 = allTimes[Math.floor(allTimes.length * 0.5)]!;
    const globalP95 = allTimes[Math.floor(allTimes.length * 0.95)] ?? allTimes[allTimes.length - 1]!;
    const globalP99 = allTimes[Math.floor(allTimes.length * 0.99)] ?? allTimes[allTimes.length - 1]!;
    const globalAvg = allTimes.reduce((a, b) => a + b, 0) / allTimes.length;

    // 性能衰退检测
    const regressions: Array<{ endpoint: string; metric: string; baseline: number; current: number; degradationPct: number }> = [];
    if (baseline) {
      for (const stat of endpointStats) {
        if (stat.p95 > baseline.p95 * 1.2) {
          regressions.push({
            endpoint: stat.endpoint,
            metric: 'p95',
            baseline: baseline.p95,
            current: stat.p95,
            degradationPct: Math.round(((stat.p95 / baseline.p95) - 1) * 100),
          });
        }
        if (stat.p99 > baseline.p99 * 1.3) {
          regressions.push({
            endpoint: stat.endpoint,
            metric: 'p99',
            baseline: baseline.p99,
            current: stat.p99,
            degradationPct: Math.round(((stat.p99 / baseline.p99) - 1) * 100),
          });
        }
      }
    }

    const newBaseline = {
      p50: globalP50,
      p95: globalP95,
      p99: globalP99,
      avg: Number(globalAvg.toFixed(2)),
    };

    const overallScore = Math.round(endpointStats.reduce((s, e) => s + e.perfScore, 0) / endpointStats.length);
    const criticalEndpoints = endpointStats.filter((e) => e.status === 'critical');

    return {
      overallScore,
      endpointStats: endpointStats.sort((a, b) => a.perfScore - b.perfScore),
      baseline: newBaseline,
      regressions,
      hasRegression: regressions.length > 0,
      recommendations: [
        ...(criticalEndpoints.length > 0
          ? [`立即优化 ${criticalEndpoints.map((e) => e.endpoint).join(', ')} 的性能（评分低于40）`]
          : []),
        ...(regressions.length > 0
          ? [`调查 ${regressions.length} 处性能衰退，最大衰退 ${Math.max(...regressions.map((r) => r.degradationPct))}%`]
          : []),
        ...(overallScore >= 80
          ? ['整体性能良好，保持当前监控策略']
          : ['建议进行全面的性能优化审查']),
      ],
    };
  },
  (params) => {
    const errors: string[] = [];
    if (!Array.isArray(params.measurements) || params.measurements.length === 0) {
      errors.push('Parameter "measurements" is required and must be a non-empty array');
    }
    return { valid: errors.length === 0, errors: errors.length > 0 ? errors : undefined };
  },
);
