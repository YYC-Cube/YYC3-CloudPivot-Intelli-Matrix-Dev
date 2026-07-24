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

export const dependencyManagementSkill = defineSkill(
  {
    id: 'grandmaster:dependency-management',
    name: 'Dependency Management',
    version: '1.0.0',
    owner: 'grandmaster',
    description: '监控依赖版本，建议更新策略，管理技术债务，评估安全漏洞与破坏性变更风险。',
    category: 'quality',
    tags: ['dependencies', 'security', 'tech-debt', 'versioning'],
    parameters: [
      {
        name: 'dependencies',
        type: 'array',
        required: true,
        description: '项目依赖列表 { name, currentVersion, latestVersion, type, vulnerabilities }。',
      },
      {
        name: 'policy',
        type: 'object',
        required: false,
        description: '更新策略 { autoPatch, autoMinor, majorReviewThreshold }。',
      },
    ],
  },
  async (params) => {
    const dependencies = (params.dependencies as Array<{
      name: string;
      currentVersion: string;
      latestVersion: string;
      type: 'production' | 'dev' | 'peer';
      vulnerabilities?: Array<{ severity: string; cve?: string }>;
    }>) ?? [];
    const policy = (params.policy as {
      autoPatch?: boolean;
      autoMinor?: boolean;
      majorReviewThreshold?: number;
    }) ?? {};

    if (dependencies.length === 0) {
      return { result: null, message: 'No dependencies to analyze.' };
    }

    // 版本比较工具
    const parseVersion = (v: string): number[] => {
      const parts = v.replace(/^[\^~>=]/, '').split('.').map((p) => parseInt(p, 10) || 0);
      return [parts[0] ?? 0, parts[1] ?? 0, parts[2] ?? 0];
    };

    const compareVersions = (current: string, latest: string): { major: number; minor: number; patch: number; isBehind: boolean } => {
      const c = parseVersion(current);
      const l = parseVersion(latest);
      const majorDiff = (l[0] ?? 0) - (c[0] ?? 0);
      const minorDiff = majorDiff === 0 ? (l[1] ?? 0) - (c[1] ?? 0) : 0;
      const patchDiff = majorDiff === 0 && minorDiff === 0 ? (l[2] ?? 0) - (c[2] ?? 0) : 0;
      return { major: majorDiff, minor: minorDiff, patch: patchDiff, isBehind: majorDiff > 0 || minorDiff > 0 || patchDiff > 0 };
    };

    // 分类分析
    const analyzed = dependencies.map((dep) => {
      const diff = compareVersions(dep.currentVersion, dep.latestVersion);
      const vulns = dep.vulnerabilities ?? [];
      const criticalVulns = vulns.filter((v) => v.severity === 'critical');
      const highVulns = vulns.filter((v) => v.severity === 'high');

      // 优先级评估
      let priority: 'critical' | 'high' | 'medium' | 'low';
      let recommendedAction: string;

      if (criticalVulns.length > 0) {
        priority = 'critical';
        recommendedAction = `立即升级 — 存在 ${criticalVulns.length} 个 critical 漏洞`;
      } else if (highVulns.length > 0) {
        priority = 'high';
        recommendedAction = `尽快升级 — 存在 ${highVulns.length} 个 high 漏洞`;
      } else if (diff.major > 0) {
        priority = 'medium';
        recommendedAction = `跨大版本升级 (v${dep.currentVersion} → v${dep.latestVersion})，需评估 Breaking Changes`;
      } else if (diff.minor > 0 || diff.patch > 0) {
        priority = 'low';
        recommendedAction = diff.minor > 0
          ? `小版本升级 (功能更新)，建议在非高峰期更新`
          : `补丁更新 (Bug修复)，风险极低`;
      } else {
        priority = 'low';
        recommendedAction = '已是最新版本，无需操作';
      }

      // 技术债务分
      let debtScore = 0;
      if (diff.major > 0) debtScore += 30;
      if (diff.minor > 0) debtScore += 10;
      if (diff.patch > 0) debtScore += 3;
      debtScore += vulns.length * 5;
      debtScore += criticalVulns.length * 20;

      // 自动化建议
      let autoUpdate = false;
      if (policy.autoPatch && diff.patch > 0 && diff.major === 0 && diff.minor === 0) autoUpdate = true;
      if (policy.autoMinor && diff.minor > 0 && diff.major === 0 && vulns.length === 0) autoUpdate = true;

      return {
        name: dep.name,
        currentVersion: dep.currentVersion,
        latestVersion: dep.latestVersion,
        type: dep.type,
        versionDiff: diff,
        vulnerabilities: {
          total: vulns.length,
          critical: criticalVulns.length,
          high: highVulns.length,
          list: vulns,
        },
        priority,
        recommendedAction,
        debtScore,
        autoUpdateEligible: autoUpdate,
      };
    });

    // 排序：按优先级和技术债务
    const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
    analyzed.sort((a, b) => {
      if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
        return priorityOrder[a.priority] - priorityOrder[b.priority];
      }
      return b.debtScore - a.debtScore;
    });

    // 汇总
    const outdated = analyzed.filter((d) => d.versionDiff.isBehind);
    const withVulns = analyzed.filter((d) => d.vulnerabilities.total > 0);
    const autoUpdatable = analyzed.filter((d) => d.autoUpdateEligible);
    const totalDebtScore = analyzed.reduce((s, d) => s + d.debtScore, 0);
    const criticalUpdates = analyzed.filter((d) => d.priority === 'critical' || d.priority === 'high');

    return {
      dependencies: analyzed,
      summary: {
        total: analyzed.length,
        upToDate: analyzed.length - outdated.length,
        outdated: outdated.length,
        withVulnerabilities: withVulns.length,
        autoUpdatable: autoUpdatable.length,
        criticalUpdatesNeeded: criticalUpdates.length,
        totalDebtScore,
        debtLevel: totalDebtScore > 200 ? 'high' : totalDebtScore > 100 ? 'medium' : totalDebtScore > 50 ? 'low' : 'minimal',
      },
      batchActions: {
        autoUpdateList: autoUpdatable.map((d) => ({ name: d.name, from: d.currentVersion, to: d.latestVersion })),
        manualReviewList: criticalUpdates.map((d) => ({ name: d.name, reason: d.recommendedAction })),
      },
      recommendation: criticalUpdates.length > 0
        ? `存在 ${criticalUpdates.length} 个需要优先处理的依赖（安全漏洞/严重过时）`
        : outdated.length > 0
          ? `${outdated.length} 个依赖需要更新，无紧急安全风险`
          : '所有依赖均为最新，技术债务状况良好',
    };
  },
  (params) => {
    const errors: string[] = [];
    if (!Array.isArray(params.dependencies) || params.dependencies.length === 0) {
      errors.push('Parameter "dependencies" is required and must be a non-empty array');
    }
    return { valid: errors.length === 0, errors: errors.length > 0 ? errors : undefined };
  },
);
