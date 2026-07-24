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

export const securityPostureSkill = defineSkill(
  {
    id: 'guardian:security-posture',
    name: 'Security Posture Assessment',
    version: '1.0.0',
    owner: 'guardian',
    description: '构建全局安全态势图，实时评估风险等级，输出多维度安全评分与改进建议。',
    category: 'security',
    tags: ['posture', 'risk-assessment', 'compliance', 'global-security'],
    parameters: [
      {
        name: 'incidents',
        type: 'array',
        required: false,
        description: '近期安全事件列表 { id, type, severity, status, timestamp }。',
      },
      {
        name: 'vulnerabilities',
        type: 'array',
        required: false,
        description: '已知漏洞列表 { id, cvssScore, status }。',
      },
      {
        name: 'complianceStatus',
        type: 'object',
        required: false,
        description: '合规审计状态 { standard, passed, total }。',
      },
      {
        name: 'accessControl',
        type: 'object',
        required: false,
        description: '访问控制状态 { mfaCoverage, activeSessions, privilegedAccounts }。',
      },
    ],
  },
  async (params) => {
    const incidents = (params.incidents as Array<{
      id: string; type: string; severity: string; status: string; timestamp: string;
    }>) ?? [];
    const vulnerabilities = (params.vulnerabilities as Array<{
      id: string; cvssScore: number; status: string;
    }>) ?? [];
    const compliance = params.complianceStatus as {
      standard: string; passed: number; total: number;
    } | null;
    const accessControl = params.accessControl as {
      mfaCoverage?: number; activeSessions?: number; privilegedAccounts?: number;
    } | null;

    // 1. 事件维度评分 (0-100, 越高越安全)
    const openIncidents = incidents.filter((i) => i.status !== 'resolved');
    const criticalIncidents = openIncidents.filter((i) => i.severity === 'critical');
    const highIncidents = openIncidents.filter((i) => i.severity === 'high');
    const incidentScore = Math.max(0, 100 - criticalIncidents.length * 20 - highIncidents.length * 8 - (openIncidents.length - criticalIncidents.length - highIncidents.length) * 2);

    // 2. 漏洞维度评分
    const openVulns = vulnerabilities.filter((v) => v.status !== 'patched');
    const criticalVulns = openVulns.filter((v) => v.cvssScore >= 9);
    const highVulns = openVulns.filter((v) => v.cvssScore >= 7 && v.cvssScore < 9);
    const vulnScore = Math.max(0, 100 - criticalVulns.length * 15 - highVulns.length * 6 - (openVulns.length - criticalVulns.length - highVulns.length) * 1);

    // 3. 合规维度评分
    let complianceScore = 100;
    if (compliance && compliance.total > 0) {
      complianceScore = (compliance.passed / compliance.total) * 100;
    }

    // 4. 访问控制维度评分
    let accessScore = 80;
    if (accessControl) {
      const mfaCoverage = accessControl.mfaCoverage ?? 100;
      accessScore = mfaCoverage * 0.6;
      if (accessControl.privilegedAccounts && accessControl.privilegedAccounts > 10) {
        accessScore -= (accessControl.privilegedAccounts - 10) * 2;
      }
      accessScore = Math.max(0, Math.min(100, accessScore));
    }

    // 5. 综合安全态势评分
    const overallScore = Math.round(
      incidentScore * 0.35 + vulnScore * 0.30 + complianceScore * 0.20 + accessScore * 0.15,
    );

    const posture = overallScore >= 90 ? 'excellent'
      : overallScore >= 75 ? 'good'
        : overallScore >= 60 ? 'fair'
          : overallScore >= 40 ? 'poor'
            : 'critical';

    // 改进建议
    const improvements: Array<{ area: string; action: string; expectedGain: number }> = [];

    if (criticalIncidents.length > 0) {
      improvements.push({ area: '事件响应', action: `立即处理 ${criticalIncidents.length} 个 critical 事件`, expectedGain: criticalIncidents.length * 20 });
    }
    if (criticalVulns.length > 0) {
      improvements.push({ area: '漏洞修复', action: `修补 ${criticalVulns.length} 个 CVSS≥9 的严重漏洞`, expectedGain: criticalVulns.length * 15 });
    }
    if (complianceScore < 100 && compliance) {
      improvements.push({ area: '合规审计', action: `修复 ${compliance.total - compliance.passed} 项不合规项`, expectedGain: (100 - complianceScore) * 0.2 });
    }
    if (accessControl && accessControl.mfaCoverage !== undefined && accessControl.mfaCoverage < 100) {
      improvements.push({ area: '访问控制', action: `将 MFA 覆盖率从 ${accessControl.mfaCoverage}% 提升至 100%`, expectedGain: (100 - accessControl.mfaCoverage) * 0.6 * 0.15 });
    }

    improvements.sort((a, b) => b.expectedGain - a.expectedGain);

    return {
      posture,
      overallScore,
      dimensions: {
        incidents: { score: Math.round(incidentScore), open: openIncidents.length, critical: criticalIncidents.length },
        vulnerabilities: { score: Math.round(vulnScore), open: openVulns.length, critical: criticalVulns.length },
        compliance: { score: Math.round(complianceScore), ...(compliance ?? {}) },
        accessControl: { score: Math.round(accessScore), ...(accessControl ?? {}) },
      },
      improvements,
      maxAchievableScore: Math.min(100, overallScore + improvements.reduce((s, i) => s + i.expectedGain, 0)),
      trend: openIncidents.length === 0 && openVulns.length === 0 ? 'stable' : criticalIncidents.length > 0 ? 'declining' : 'improving',
    };
  },
  (params) => {
    const errors: string[] = [];
    // 至少提供一个维度的数据
    if (!params.incidents && !params.vulnerabilities && !params.complianceStatus && !params.accessControl) {
      errors.push('At least one security dimension data is required');
    }
    return { valid: errors.length === 0, errors: errors.length > 0 ? errors : undefined };
  },
);
