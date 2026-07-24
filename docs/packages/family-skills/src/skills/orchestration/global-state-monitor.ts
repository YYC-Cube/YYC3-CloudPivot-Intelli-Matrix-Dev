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

export const globalStateMonitorSkill = defineSkill(
  {
    id: 'tianshu:global-state-monitor',
    name: 'Global State Monitor',
    version: '1.0.0',
    owner: 'tianshu',
    description: '实时监控所有服务、插件、Agent 和资源的运行状态，构建全局态势图并输出健康评分。',
    category: 'orchestration',
    tags: ['monitoring', 'health-check', 'observability', 'global-state'],
    parameters: [
      {
        name: 'services',
        type: 'array',
        required: true,
        description: '服务状态数组，每个元素为 { id, name, status, latency, errorRate, cpu, memory }。',
      },
      {
        name: 'thresholds',
        type: 'object',
        required: false,
        description: '告警阈值 { latency, errorRate, cpu, memory }。',
      },
    ],
  },
  async (params) => {
    const services = (params.services as Array<{
      id: string;
      name: string;
      status: string;
      latency: number;
      errorRate: number;
      cpu: number;
      memory: number;
    }>) ?? [];
    const thresholds = (params.thresholds as {
      latency?: number;
      errorRate?: number;
      cpu?: number;
      memory?: number;
    }) ?? {};

    if (services.length === 0) {
      return { result: null, message: 'No services to monitor.' };
    }

    const defaultThresholds = {
      latency: thresholds.latency ?? 500,
      errorRate: thresholds.errorRate ?? 0.05,
      cpu: thresholds.cpu ?? 80,
      memory: thresholds.memory ?? 85,
    };

    // 逐服务评估
    const evaluated = services.map((svc) => {
      const alerts: Array<{ level: string; metric: string; value: number; threshold: number }> = [];

      if (svc.latency > defaultThresholds.latency) {
        alerts.push({ level: svc.latency > defaultThresholds.latency * 2 ? 'critical' : 'warning', metric: 'latency', value: svc.latency, threshold: defaultThresholds.latency });
      }
      if (svc.errorRate > defaultThresholds.errorRate) {
        alerts.push({ level: svc.errorRate > defaultThresholds.errorRate * 2 ? 'critical' : 'warning', metric: 'errorRate', value: svc.errorRate, threshold: defaultThresholds.errorRate });
      }
      if (svc.cpu > defaultThresholds.cpu) {
        alerts.push({ level: svc.cpu > 95 ? 'critical' : 'warning', metric: 'cpu', value: svc.cpu, threshold: defaultThresholds.cpu });
      }
      if (svc.memory > defaultThresholds.memory) {
        alerts.push({ level: svc.memory > 95 ? 'critical' : 'warning', metric: 'memory', value: svc.memory, threshold: defaultThresholds.memory });
      }

      // 健康评分 (0-100)
      let healthScore = 100;
      for (const alert of alerts) {
        healthScore -= alert.level === 'critical' ? 25 : 10;
      }
      if (svc.status === 'degraded') healthScore -= 15;
      if (svc.status === 'down') healthScore = 0;
      healthScore = Math.max(0, healthScore);

      return {
        ...svc,
        alerts,
        healthScore,
        status: healthScore === 0 ? 'critical' : healthScore < 50 ? 'unhealthy' : healthScore < 80 ? 'degraded' : 'healthy',
      };
    });

    // 全局态势
    const totalServices = evaluated.length;
    const healthyCount = evaluated.filter((s) => s.status === 'healthy').length;
    const degradedCount = evaluated.filter((s) => s.status === 'degraded').length;
    const unhealthyCount = evaluated.filter((s) => s.status === 'unhealthy').length;
    const criticalCount = evaluated.filter((s) => s.status === 'critical').length;
    const avgHealth = Math.round(evaluated.reduce((sum, s) => sum + s.healthScore, 0) / totalServices);

    const allAlerts = evaluated.flatMap((s) => s.alerts.map((a) => ({ ...a, serviceId: s.id, serviceName: s.name })));
    const criticalAlerts = allAlerts.filter((a) => a.level === 'critical');

    return {
      services: evaluated,
      globalState: {
        overallHealth: avgHealth,
        status: avgHealth >= 90 ? 'optimal' : avgHealth >= 70 ? 'normal' : avgHealth >= 50 ? 'degraded' : 'critical',
        serviceBreakdown: { healthy: healthyCount, degraded: degradedCount, unhealthy: unhealthyCount, critical: criticalCount },
        totalAlerts: allAlerts.length,
        criticalAlerts: criticalAlerts.length,
      },
      recommendations: criticalAlerts.length > 0
        ? [`立即处理 ${criticalAlerts.length} 个 critical 告警`, '考虑启动降级方案或自动扩容']
        : degradedCount > 0
          ? [`关注 ${degradedCount} 个 degraded 服务的性能趋势`]
          : ['所有服务运行正常，保持当前监控策略'],
    };
  },
  (params) => {
    const errors: string[] = [];
    if (!Array.isArray(params.services) || params.services.length === 0) {
      errors.push('Parameter "services" is required and must be a non-empty array');
    }
    return { valid: errors.length === 0, errors: errors.length > 0 ? errors : undefined };
  },
);
