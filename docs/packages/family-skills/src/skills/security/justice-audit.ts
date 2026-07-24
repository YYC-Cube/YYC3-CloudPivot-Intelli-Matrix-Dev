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

export const securityAuditSkill = defineSkill(
  {
    id: 'guardian:security-audit',
    name: 'Justice Security Audit',
    version: '1.0.0',
    owner: 'guardian',
    description: 'Comprehensive security audit with OWASP-based checks.',
    category: 'security',
    parameters: [
      {
        name: 'code',
        type: 'string',
        required: true,
        description: 'Code to audit for security vulnerabilities.',
      },
      {
        name: 'severity',
        type: 'string',
        required: false,
        description: 'Minimum severity to report: low, medium, high, critical.',
        default: 'medium',
      },
    ],
  },
  async (params) => {
    const code = String(params.code ?? '');
    const minSeverity = String(params.severity ?? 'medium');

    const auditRules: Array<{ id: string; category: string; pattern: RegExp; severity: string; description: string; recommendation: string }> = [
      { id: 'OWASP-A01', category: 'access-control', pattern: /admin.*true|isAdmin.*true|role.*['"]admin['"]/gi, severity: 'high', description: 'Hardcoded admin access', recommendation: 'Use role-based access control from authentication.' },
      { id: 'OWASP-A02', category: 'crypto', pattern: /md5|sha1|des\b|rc4\b/gi, severity: 'high', description: 'Weak cryptographic algorithm', recommendation: 'Use AES-256, SHA-256, or stronger.' },
      { id: 'OWASP-A03', category: 'injection', pattern: /\$\{.*\}.*(?:SELECT|INSERT|UPDATE|DELETE|DROP)/gi, severity: 'critical', description: 'SQL injection via template literal', recommendation: 'Use parameterized queries.' },
      { id: 'OWASP-A03-js', category: 'injection', pattern: /exec\s*\(|child_process/g, severity: 'high', description: 'Potential command injection', recommendation: 'Validate and sanitize all inputs to exec().' },
      { id: 'OWASP-A04', category: 'design', pattern: /password.*=.*['"][^'"]{1,8}['"]/g, severity: 'medium', description: 'Weak password policy', recommendation: 'Enforce minimum 12 character passwords.' },
      { id: 'OWASP-A05', category: 'misconfig', pattern: /cors\([^)]*\*\)|Access-Control-Allow-Origin.*\*/g, severity: 'high', description: 'Overly permissive CORS', recommendation: 'Restrict CORS to specific origins.' },
      { id: 'OWASP-A07', category: 'auth', pattern: /jwt\.sign\([^)]*,\s*['"][^'"]{1,10}['"]/g, severity: 'critical', description: 'Weak JWT secret', recommendation: 'Use a strong secret (32+ characters).' },
      { id: 'OWASP-A08', category: 'integrity', pattern: /\.exec\(|\.eval\(/g, severity: 'high', description: 'Dynamic code execution', recommendation: 'Avoid eval/exec. Use safe alternatives.' },
    ];

    const severityOrder = { low: 0, medium: 1, high: 2, critical: 3 };
    const minLevel = severityOrder[minSeverity as keyof typeof severityOrder] ?? 1;

    const findings = auditRules
      .filter(rule => {
        const ruleLevel = severityOrder[rule.severity as keyof typeof severityOrder] ?? 0;
        return ruleLevel >= minLevel;
      })
      .flatMap(rule => {
        const matches = [...code.matchAll(new RegExp(rule.pattern.source, rule.pattern.flags))];
        return matches.map(() => ({
          id: rule.id,
          category: rule.category,
          severity: rule.severity,
          description: rule.description,
          recommendation: rule.recommendation,
        }));
      });

    return {
      findings,
      summary: {
        total: findings.length,
        critical: findings.filter(f => f.severity === 'critical').length,
        high: findings.filter(f => f.severity === 'high').length,
        medium: findings.filter(f => f.severity === 'medium').length,
      },
      passed: findings.filter(f => f.severity === 'critical' || f.severity === 'high').length === 0,
      scannedLength: code.length,
    };
  },
  (params) => {
    const errors: string[] = [];
    if (!params.code || typeof params.code !== 'string') {
      errors.push('Parameter "code" is required and must be a string');
    }
    return { valid: errors.length === 0, errors: errors.length > 0 ? errors : undefined };
  },
);
