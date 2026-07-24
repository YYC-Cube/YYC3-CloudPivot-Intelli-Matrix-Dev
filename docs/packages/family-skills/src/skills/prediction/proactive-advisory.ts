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

export const proactiveAdvisorySkill = defineSkill(
  {
    id: 'prophet:proactive-advisory',
    name: 'Proactive Advisory',
    version: '1.0.0',
    owner: 'prophet',
    description: '基于预测结果，提出主动的、预防性的行动建议，包含优先级排序与时间窗口。',
    category: 'prediction',
    tags: ['advisory', 'proactive', 'prevention', 'recommendation'],
    parameters: [
      {
        name: 'predictions',
        type: 'array',
        required: true,
        description: '预测结果数组，每个元素为 { metric, trend, confidence, anomaly }。',
      },
      {
        name: 'riskTolerance',
        type: 'string',
        required: false,
        description: '风险容忍度：low | medium | high',
        default: 'medium',
      },
    ],
  },
  async (params) => {
    const predictions = (params.predictions as Array<{
      metric: string;
      trend: string;
      confidence: number;
      anomaly?: boolean;
    }>) ?? [];
    const riskTolerance = String(params.riskTolerance ?? 'medium');

    if (predictions.length === 0) {
      return { result: null, message: 'No predictions to advise on.' };
    }

    // 风险权重映射
    const riskWeight = { low: 0.6, medium: 1.0, high: 1.5 };
    const toleranceFactor = riskWeight[riskTolerance as keyof typeof riskWeight] ?? 1.0;

    const advisories = predictions.map((p) => {
      const isAtRisk = p.trend === 'downward' || p.anomaly === true;
      const urgencyScore = (isAtRisk ? 1 : 0) * p.confidence * toleranceFactor;

      let priority: 'P0' | 'P1' | 'P2' | 'P3';
      if (urgencyScore > 1.2) priority = 'P0';
      else if (urgencyScore > 0.8) priority = 'P1';
      else if (urgencyScore > 0.4) priority = 'P2';
      else priority = 'P3';

      const actions: string[] = [];
      if (p.anomaly) {
        actions.push('立即检查异常来源，确认是否为系统故障或外部攻击');
        actions.push('启用应急监控通道，15 分钟内汇报状态');
      }
      if (p.trend === 'downward' && p.confidence > 0.7) {
        actions.push(`分析「${p.metric}」下降根因，制定回升方案`);
        actions.push('检查相关依赖服务是否存在性能瓶颈');
      }
      if (p.trend === 'upward' && !p.anomaly) {
        actions.push(`确认「${p.metric}」增长是否可持续，评估资源扩容需求`);
      }
      if (actions.length === 0) {
        actions.push('持续监控，保持当前策略');
      }

      const timeWindow = priority === 'P0' ? '1h' : priority === 'P1' ? '4h' : priority === 'P2' ? '24h' : '7d';

      return {
        metric: p.metric,
        priority,
        urgencyScore: Number(urgencyScore.toFixed(3)),
        actions,
        timeWindow,
        proactive: true,
      };
    });

    // 按优先级排序
    const priorityOrder = { P0: 0, P1: 1, P2: 2, P3: 3 };
    advisories.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);

    const p0Count = advisories.filter((a) => a.priority === 'P0').length;
    const p1Count = advisories.filter((a) => a.priority === 'P1').length;

    return {
      advisories,
      summary: {
        total: advisories.length,
        critical: p0Count,
        warning: p1Count,
        overallRisk: p0Count > 0 ? 'critical' : p1Count > 0 ? 'elevated' : 'normal',
      },
      recommendation: p0Count > 0
        ? '存在 P0 级风险，建议立即启动应急响应预案'
        : p1Count > 0
          ? '存在 P1 级风险，建议在 4 小时内制定应对方案'
          : '当前态势平稳，维持常规监控即可',
    };
  },
  (params) => {
    const errors: string[] = [];
    if (!Array.isArray(params.predictions) || params.predictions.length === 0) {
      errors.push('Parameter "predictions" is required and must be a non-empty array');
    }
    return { valid: errors.length === 0, errors: errors.length > 0 ? errors : undefined };
  },
);
