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

export const behavioralBaselineSkill = defineSkill(
  {
    id: 'guardian:behavioral-baseline',
    name: 'Behavioral Baseline Learning',
    version: '1.0.0',
    owner: 'guardian',
    description: 'UEBA 核心能力：为每个用户和 API 建立正常行为基线，持续学习演进并检测行为偏差。',
    category: 'security',
    tags: ['ueba', 'baseline', 'anomaly', 'behavioral-analysis'],
    parameters: [
      {
        name: 'subjectId',
        type: 'string',
        required: true,
        description: '监控对象 ID（用户 ID 或 API Key）。',
      },
      {
        name: 'currentBehavior',
        type: 'object',
        required: true,
        description: '当前行为快照 { loginTime, accessPattern, requestRate, geoLocation, deviceFingerprint, apiEndpoints }。',
      },
      {
        name: 'baseline',
        type: 'object',
        required: false,
        description: '历史行为基线（如已有）。',
      },
    ],
  },
  async (params) => {
    const subjectId = String(params.subjectId ?? '');
    const current = params.currentBehavior as {
      loginTime: string;
      accessPattern: string[];
      requestRate: number;
      geoLocation: string;
      deviceFingerprint: string;
      apiEndpoints: string[];
    };
    const baseline = params.baseline as {
      avgLoginHour: number;
      loginHourStd: number;
      commonLocations: string[];
      knownDevices: string[];
      avgRequestRate: number;
      requestRateStd: number;
      commonEndpoints: string[];
      totalObservations: number;
    } | null;

    if (!subjectId || !current) {
      return { result: null, message: 'Missing subjectId or currentBehavior.' };
    }

    // 首次观察：建立初始基线
    if (!baseline) {
      const loginHour = new Date(current.loginTime).getHours();
      return {
        subjectId,
        action: 'baseline-init',
        newBaseline: {
          avgLoginHour: loginHour,
          loginHourStd: 0,
          commonLocations: [current.geoLocation],
          knownDevices: [current.deviceFingerprint],
          avgRequestRate: current.requestRate,
          requestRateStd: 0,
          commonEndpoints: current.apiEndpoints,
          totalObservations: 1,
        },
        anomalies: [],
        riskLevel: 'unknown',
        message: 'Initial baseline created. Risk assessment will be available after more observations.',
      };
    }

    // 行为偏差检测
    const anomalies: Array<{ type: string; severity: string; detail: string; score: number }> = [];

    // 1. 登录时间偏差
    const currentLoginHour = new Date(current.loginTime).getHours();
    const hourDeviation = Math.abs(currentLoginHour - baseline.avgLoginHour);
    if (hourDeviation > baseline.loginHourStd * 2 + 2) {
      const score = Math.min(hourDeviation / 12, 1);
      anomalies.push({
        type: 'unusual-login-time',
        severity: score > 0.7 ? 'high' : 'medium',
        detail: `登录时间 ${currentLoginHour}:00 偏离基线 ${baseline.avgLoginHour}:00 (±${baseline.loginHourStd.toFixed(1)}h)`,
        score,
      });
    }

    // 2. 地理位置偏差
    if (!baseline.commonLocations.includes(current.geoLocation)) {
      anomalies.push({
        type: 'new-geo-location',
        severity: 'medium',
        detail: `新地理位置：${current.geoLocation}（已知：${baseline.commonLocations.join(', ')}）`,
        score: 0.5,
      });
    }

    // 3. 设备指纹偏差
    if (!baseline.knownDevices.includes(current.deviceFingerprint)) {
      anomalies.push({
        type: 'new-device',
        severity: 'medium',
        detail: `未知设备指纹：${current.deviceFingerprint.substring(0, 16)}...`,
        score: 0.6,
      });
    }

    // 4. 请求频率偏差
    const rateDeviation = Math.abs(current.requestRate - baseline.avgRequestRate);
    if (baseline.requestRateStd > 0 && rateDeviation > baseline.requestRateStd * 3) {
      const score = Math.min(rateDeviation / (baseline.avgRequestRate + 1), 1);
      anomalies.push({
        type: 'abnormal-request-rate',
        severity: score > 0.7 ? 'high' : 'medium',
        detail: `请求频率 ${current.requestRate}/min 远超基线 ${baseline.avgRequestRate.toFixed(1)}/min (±${baseline.requestRateStd.toFixed(1)})`,
        score,
      });
    }

    // 5. 异常端点访问
    const newEndpoints = current.apiEndpoints.filter((e) => !baseline.commonEndpoints.includes(e));
    if (newEndpoints.length > 0) {
      const score = Math.min(newEndpoints.length / 5, 1);
      anomalies.push({
        type: 'new-api-endpoints',
        severity: score > 0.6 ? 'medium' : 'low',
        detail: `访问了 ${newEndpoints.length} 个新端点：${newEndpoints.slice(0, 3).join(', ')}${newEndpoints.length > 3 ? '...' : ''}`,
        score,
      });
    }

    // 综合风险评估
    const totalRiskScore = anomalies.reduce((sum, a) => sum + a.score, 0) / Math.max(anomalies.length, 1);
    const maxScore = Math.max(...anomalies.map((a) => a.score), 0);
    const riskLevel = maxScore > 0.7 || anomalies.length >= 4 ? 'critical'
      : maxScore > 0.5 || anomalies.length >= 2 ? 'high'
        : maxScore > 0.3 ? 'medium'
          : 'low';

    // 更新基线（增量学习）
    const n = baseline.totalObservations;
    const updatedBaseline = {
      avgLoginHour: (baseline.avgLoginHour * n + currentLoginHour) / (n + 1),
      loginHourStd: Math.sqrt(((baseline.loginHourStd ** 2 * n) + (currentLoginHour - baseline.avgLoginHour) ** 2) / (n + 1)),
      commonLocations: Array.from(new Set([...baseline.commonLocations, current.geoLocation])).slice(0, 10),
      knownDevices: Array.from(new Set([...baseline.knownDevices, current.deviceFingerprint])).slice(0, 10),
      avgRequestRate: (baseline.avgRequestRate * n + current.requestRate) / (n + 1),
      requestRateStd: Math.sqrt(((baseline.requestRateStd ** 2 * n) + (current.requestRate - baseline.avgRequestRate) ** 2) / (n + 1)),
      commonEndpoints: Array.from(new Set([...baseline.commonEndpoints, ...current.apiEndpoints])).slice(0, 50),
      totalObservations: n + 1,
    };

    return {
      subjectId,
      action: anomalies.length > 0 ? 'anomaly-detected' : 'normal',
      anomalies,
      riskLevel,
      riskScore: Number(totalRiskScore.toFixed(3)),
      maxAnomalyScore: Number(maxScore.toFixed(3)),
      updatedBaseline,
      recommendation: riskLevel === 'critical'
        ? '建议立即冻结账户并触发二次验证'
        : riskLevel === 'high'
          ? '建议发送安全告警并要求 MFA 验证'
          : riskLevel === 'medium'
            ? '记录异常行为，提升监控频率'
            : '行为正常，继续常规监控',
    };
  },
  (params) => {
    const errors: string[] = [];
    if (!params.subjectId || typeof params.subjectId !== 'string') {
      errors.push('Parameter "subjectId" is required');
    }
    if (!params.currentBehavior || typeof params.currentBehavior !== 'object') {
      errors.push('Parameter "currentBehavior" is required and must be an object');
    }
    return { valid: errors.length === 0, errors: errors.length > 0 ? errors : undefined };
  },
);
