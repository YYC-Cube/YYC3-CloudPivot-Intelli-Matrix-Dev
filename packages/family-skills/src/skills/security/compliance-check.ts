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

export const complianceCheckSkill = defineSkill(
  {
    id: 'guardian:compliance-check',
    name: 'Compliance Check',
    version: '1.0.0',
    owner: 'guardian',
    description: 'Compliance verification — checks configurations and code against security standards (OWASP, CIS).',
    category: 'security',
    parameters: [
      {
        name: 'config',
        type: 'object',
        required: true,
        description: 'Configuration or code to check for compliance.',
      },
      {
        name: 'standard',
        type: 'string',
        required: false,
        description: 'Compliance standard: owasp (default), cis, gdpr.',
        default: 'owasp',
      },
    ],
  },
  async (params) => {
    const config = (params.config as Record<string, unknown>) ?? {};
    const standard = String(params.standard ?? 'owasp');

    const checks: Array<{ rule: string; passed: boolean; severity: string; description: string }> = [];

    const owaspChecks: Array<{ rule: string; check: (c: Record<string, unknown>) => boolean; severity: string; description: string }> = [
      { rule: 'A01-access-control', check: c => !c.publicAccess, severity: 'high', description: 'Resources should not be publicly accessible by default.' },
      { rule: 'A02-crypto', check: c => c.encryption !== 'none' && c.encryption !== false, severity: 'high', description: 'Data should be encrypted at rest and in transit.' },
      { rule: 'A03-injection', check: c => c.parameterized === true, severity: 'high', description: 'Use parameterized queries to prevent injection.' },
      { rule: 'A04-design', check: c => c.authMechanism !== 'none', severity: 'medium', description: 'Implement secure authentication.' },
      { rule: 'A05-misconfig', check: c => c.debug !== true, severity: 'medium', description: 'Debug mode should be disabled in production.' },
      { rule: 'A06-dependencies', check: c => c.dependencyAudit !== false, severity: 'medium', description: 'Dependencies should be regularly audited.' },
      { rule: 'A07-auth', check: c => c.sessionTimeout !== 'none' && c.sessionTimeout !== false, severity: 'medium', description: 'Sessions should have reasonable timeouts.' },
      { rule: 'A08-data-integrity', check: c => c.inputValidation !== false, severity: 'high', description: 'Validate all input data.' },
    ];

    for (const check of owaspChecks) {
      checks.push({
        rule: check.rule,
        passed: check.check(config),
        severity: check.severity,
        description: check.description,
      });
    }

    const passed = checks.filter(c => c.passed).length;
    const failed = checks.filter(c => !c.passed);
    const score = checks.length > 0 ? passed / checks.length : 0;

    return {
      standard,
      checks,
      passedCount: passed,
      failedCount: failed.length,
      score,
      compliant: score >= 0.8,
      criticalFailures: failed.filter(c => c.severity === 'high'),
    };
  },
  (params) => {
    const errors: string[] = [];
    if (!params.config || typeof params.config !== 'object') {
      errors.push('Parameter "config" is required and must be an object');
    }
    return { valid: errors.length === 0, errors: errors.length > 0 ? errors : undefined };
  },
);
