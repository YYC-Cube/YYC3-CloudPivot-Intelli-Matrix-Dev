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

export const evolutionDecisionSkill = defineSkill(
  {
    id: 'tianshu:evolution-decision',
    name: 'Self-Evolution Decision',
    version: '1.0.0',
    owner: 'tianshu',
    description: '分析系统瓶颈，触发自动扩缩容、灰度发布、标准演进等高级自我进化操作。',
    category: 'orchestration',
    tags: ['auto-scaling', 'canary-release', 'self-healing', 'evolution'],
    parameters: [
      {
        name: 'metrics',
        type: 'object',
        required: true,
        description: '系统指标快照 { cpu, memory, latency, errorRate, throughput, queueDepth }。',
      },
      {
        name: 'capabilities',
        type: 'object',
        required: false,
        description: '当前可用能力 { maxReplicas, canaryEnabled, autoScaleEnabled }。',
      },
      {
        name: 'history',
        type: 'array',
        required: false,
        description: '近期进化决策历史记录。',
      },
    ],
  },
  async (params) => {
    const metrics = params.metrics as {
      cpu: number;
      memory: number;
      latency: number;
      errorRate: number;
      throughput: number;
      queueDepth: number;
    };
    const capabilities = (params.capabilities as {
      maxReplicas?: number;
      canaryEnabled?: boolean;
      autoScaleEnabled?: boolean;
    }) ?? {};

    if (!metrics) {
      return { result: null, message: 'No metrics provided.' };
    }

    const decisions: Array<{
      action: string;
      reason: string;
      urgency: 'immediate' | 'short-term' | 'scheduled';
      estimatedImpact: string;
    }> = [];

    // 1. 自动扩缩容判断
    const maxReps = capabilities.maxReplicas ?? 10;
    if (capabilities.autoScaleEnabled !== false) {
      if (metrics.cpu > 75 || metrics.memory > 80) {
        decisions.push({
          action: 'scale-out',
          reason: `CPU=${metrics.cpu}% / MEM=${metrics.memory}% 超过扩容阈值，建议增加实例`,
          urgency: 'immediate',
          estimatedImpact: `降低单实例负载约 ${(100 / Math.min(maxReps, 5)).toFixed(0)}%`,
        });
      } else if (metrics.cpu < 20 && metrics.memory < 30 && metrics.queueDepth < 10) {
        decisions.push({
          action: 'scale-in',
          reason: `CPU=${metrics.cpu}% / MEM=${metrics.memory}% 资源利用率低，建议缩减实例以节约成本`,
          urgency: 'short-term',
          estimatedImpact: `节约约 ${(100 - metrics.cpu).toFixed(0)}% 的闲置资源成本`,
        });
      }
    }

    // 2. 灰度发布判断
    if (capabilities.canaryEnabled && metrics.errorRate > 0.02 && metrics.errorRate < 0.05) {
      decisions.push({
        action: 'canary-pause',
        reason: `错误率 ${metrics.errorRate * 100}% 略高于安全阈值 (2%)，建议暂停灰度并排查`,
        urgency: 'immediate',
        estimatedImpact: '防止错误扩散到全量用户',
      });
    } else if (capabilities.canaryEnabled && metrics.errorRate >= 0.05) {
      decisions.push({
        action: 'canary-rollback',
        reason: `错误率 ${metrics.errorRate * 100}% 严重超标，建议立即回滚到上一稳定版本`,
        urgency: 'immediate',
        estimatedImpact: '恢复服务稳定性，影响范围：已灰度用户',
      });
    }

    // 3. 标准演进判断
    if (metrics.latency > 1000) {
      decisions.push({
        action: 'standard-evolution',
        reason: `P99 延迟 ${metrics.latency}ms 远超 SLA 目标，建议触发性能标准演进`,
        urgency: 'short-term',
        estimatedImpact: '通过优化基线标准，系统性降低延迟',
      });
    }

    // 4. 队列积压判断
    if (metrics.queueDepth > 100) {
      decisions.push({
        action: 'queue-expansion',
        reason: `队列深度 ${metrics.queueDepth} 积压严重，建议扩容消费者或调整处理策略`,
        urgency: metrics.queueDepth > 500 ? 'immediate' : 'short-term',
        estimatedImpact: `预计 ${Math.ceil(metrics.queueDepth / 50)} 分钟内消化积压`,
      });
    }

    // 5. 吞吐量趋势判断
    if (metrics.throughput < 100 && metrics.errorRate < 0.01) {
      decisions.push({
        action: 'capacity-review',
        reason: '吞吐量偏低且无错误，建议评估是否为业务低谷期或容量过剩',
        urgency: 'scheduled',
        estimatedImpact: '优化资源配置，可能节约 20-30% 运营成本',
      });
    }

    // 决策汇总
    const immediateActions = decisions.filter((d) => d.urgency === 'immediate');
    const systemBottleneck = immediateActions.length > 0
      ? '存在即时瓶颈，需要立即执行进化决策'
      : decisions.length > 0
        ? '系统存在优化空间，建议在非高峰期执行演进'
        : '系统运行良好，无需进化操作';

    return {
      decisions,
      summary: {
        total: decisions.length,
        immediate: immediateActions.length,
        bottleneck: systemBottleneck,
        evolutionReady: decisions.length > 0,
      },
      nextStep: immediateActions.length > 0
        ? `立即执行 ${immediateActions.map((d) => d.action).join('、')}`
        : '保持当前配置，持续监控',
    };
  },
  (params) => {
    const errors: string[] = [];
    if (!params.metrics || typeof params.metrics !== 'object') {
      errors.push('Parameter "metrics" is required and must be an object');
    }
    return { valid: errors.length === 0, errors: errors.length > 0 ? errors : undefined };
  },
);
