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

export const autoRemediateSkill = defineSkill(
  {
    id: 'guardian:auto-remediate',
    name: 'Auto Remediation',
    version: '1.0.0',
    owner: 'guardian',
    description: 'Automated security remediation — detects common vulnerabilities and generates fix recommendations.',
    category: 'security',
    parameters: [
      {
        name: 'target',
        type: 'string',
        required: true,
        description: 'The code or configuration to scan and remediate.',
      },
      {
        name: 'language',
        type: 'string',
        required: false,
        description: 'Programming language of the target.',
        default: 'auto',
      },
    ],
  },
  async (params) => {
    const target = String(params.target ?? '');
    const language = String(params.language ?? 'auto');

    const vulnerabilityPatterns: Array<{ pattern: RegExp; type: string; severity: 'high' | 'medium' | 'low'; fix: string }> = [
      { pattern: /eval\s*\(/g, type: 'code-injection', severity: 'high', fix: 'Replace eval() with safer alternatives (JSON.parse, Function constructor with validation).' },
      { pattern: /innerHTML\s*=/g, type: 'xss', severity: 'high', fix: 'Use textContent or DOMPurify.sanitize() instead of innerHTML.' },
      { pattern: /SELECT\s+\*\s+FROM.*\$\{/gi, type: 'sql-injection', severity: 'high', fix: 'Use parameterized queries or ORM instead of string interpolation.' },
      { pattern: /password\s*[:=]\s*['"][^'"]+['"]/gi, type: 'hardcoded-secret', severity: 'high', fix: 'Move secrets to environment variables or secret manager.' },
      { pattern: /http:\/\//g, type: 'insecure-transport', severity: 'medium', fix: 'Use HTTPS instead of HTTP for all connections.' },
      { pattern: /console\.log\s*\(/g, type: 'debug-leak', severity: 'low', fix: 'Remove debug logging before production deployment.' },
      { pattern: /try\s*\{[^}]*\}\s*catch\s*\(\w*\)\s*\{\s*\}/gs, type: 'empty-catch', severity: 'medium', fix: 'Handle errors properly — log, report, or rethrow.' },
      { pattern: /chmod\s+777/g, type: 'permission-overreach', severity: 'high', fix: 'Use minimal required permissions (e.g., chmod 755 for directories).' },
    ];

    const findings: Array<{ type: string; severity: string; line?: number; fix: string }> = [];

    for (const { pattern, type, severity, fix } of vulnerabilityPatterns) {
      const globalPattern = new RegExp(pattern.source, pattern.flags);
      let match: RegExpExecArray | null;
      while ((match = globalPattern.exec(target)) !== null) {
        const line = target.substring(0, match.index).split('\n').length;
        findings.push({ type, severity, line, fix });
      }
    }

    const highCount = findings.filter(f => f.severity === 'high').length;
    const medCount = findings.filter(f => f.severity === 'medium').length;
    const lowCount = findings.filter(f => f.severity === 'low').length;

    return {
      findings,
      summary: { total: findings.length, high: highCount, medium: medCount, low: lowCount },
      riskLevel: highCount > 0 ? 'critical' : medCount > 0 ? 'warning' : 'safe',
      autoRemediable: findings.filter(f => f.severity !== 'low').map(f => ({
        type: f.type,
        fix: f.fix,
        automated: true,
      })),
      language,
      scannedLength: target.length,
    };
  },
  (params) => {
    const errors: string[] = [];
    if (!params.target || typeof params.target !== 'string') {
      errors.push('Parameter "target" is required and must be a string');
    }
    return { valid: errors.length === 0, errors: errors.length > 0 ? errors : undefined };
  },
);
