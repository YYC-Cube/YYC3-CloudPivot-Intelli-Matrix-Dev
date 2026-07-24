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

import { defineSkill } from '../../../registry/SkillManifest.js';

export const owaspScannerSkill = defineSkill(
  {
    id: 'guardian:owasp-scanner',
    name: 'OWASP Scanner',
    version: '1.0.0',
    owner: 'guardian',
    description: 'OWASP Top 10 vulnerability scanner — scan code, configs, and API endpoints for common web security risks.',
    category: 'security',
    parameters: [
      { name: 'target', type: 'string', required: true, description: 'Code snippet, config, or URL to scan.' },
      { name: 'scanType', type: 'string', required: false, description: 'Scan type: code, config, api.', default: 'code' },
    ],
  },
  async (params) => {
    const target = String(params.target ?? '');
    const scanType = String(params.scanType ?? 'code');
    const lowerTarget = target.toLowerCase();

    const RULES: Array<{ id: string; category: string; severity: 'critical' | 'high' | 'medium' | 'low'; patterns: RegExp[]; description: string; fix: string }> = [
      { id: 'A01', category: 'Broken Access Control', severity: 'high', patterns: [/isAdmin\s*=\s*true/, /role\s*===?\s*['"]admin['"]/], description: 'Hardcoded admin check detected', fix: 'Use proper RBAC with server-side validation' },
      { id: 'A02', category: 'Cryptographic Failures', severity: 'critical', patterns: [/password\s*=\s*['"]/, /api_key\s*=\s*['"]/, /secret\s*=\s*['"]/, /md5\(/, /sha1\(/], description: 'Hardcoded secrets or weak crypto detected', fix: 'Use environment variables and strong encryption (bcrypt, argon2)' },
      { id: 'A03', category: 'Injection', severity: 'critical', patterns: [/\$\{.*\}.*query/, /eval\(/, /innerHTML\s*=/, /\.exec\(/], description: 'Potential injection vulnerability', fix: 'Use parameterized queries and input sanitization' },
      { id: 'A04', category: 'Insecure Design', severity: 'medium', patterns: [/catch\s*\(\s*\)/, /\.catch\(\s*\(\s*\)\s*=>\s*\{\s*\}/], description: 'Empty error handling — potential insecure design', fix: 'Implement proper error handling and logging' },
      { id: 'A05', category: 'Security Misconfiguration', severity: 'high', patterns: [/cors.*\*/, /access-control.*\*/, /ssl.*false/, /tls.*false/], description: 'Permissive CORS or disabled TLS detected', fix: 'Restrict CORS origins and enforce TLS' },
      { id: 'A07', category: 'Auth Failures', severity: 'high', patterns: [/password.*length\s*<\s*8/, /login.*without.*2fa/], description: 'Weak authentication detected', fix: 'Enforce strong passwords and MFA' },
      { id: 'A08', category: 'Data Integrity', severity: 'medium', patterns: [/npm\s+install\s+-g/, /pip\s+install\s+--user/], description: 'Unsafe package installation', fix: 'Use lockfiles and verify package integrity' },
      { id: 'A09', category: 'Logging Failures', severity: 'medium', patterns: [/console\.log\(.*password/, /console\.log\(.*token/], description: 'Sensitive data in logs', fix: 'Redact sensitive fields before logging' },
    ];

    const findings: Array<{ ruleId: string; category: string; severity: string; description: string; fix: string; line?: number }> = [];
    const lines = target.split('\n');

    for (const rule of RULES) {
      for (const pattern of rule.patterns) {
        const match = target.match(pattern);
        if (match) {
          const lineNum = lines.findIndex(l => pattern.test(l)) + 1;
          findings.push({ ruleId: rule.id, category: rule.category, severity: rule.severity, description: rule.description, fix: rule.fix, line: lineNum > 0 ? lineNum : undefined });
        }
      }
    }

    const severityCounts = { critical: 0, high: 0, medium: 0, low: 0 };
    for (const f of findings) severityCounts[f.severity as keyof typeof severityCounts]++;

    return {
      scanType,
      targetPreview: target.substring(0, 100),
      findings,
      summary: { total: findings.length, ...severityCounts },
      riskLevel: severityCounts.critical > 0 ? 'critical' : severityCounts.high > 0 ? 'high' : severityCounts.medium > 0 ? 'medium' : 'low',
      passed: severityCounts.critical === 0 && severityCounts.high === 0,
    };
  },
  (params) => {
    const errors: string[] = [];
    if (!params.target || typeof params.target !== 'string') errors.push('Parameter "target" is required');
    return { valid: errors.length === 0, errors: errors.length > 0 ? errors : undefined };
  },
);

export const incidentTriageSkill = defineSkill(
  {
    id: 'guardian:incident-triage',
    name: 'Incident Triage',
    version: '1.0.0',
    owner: 'guardian',
    description: 'Security incident classification and prioritization — categorize, assign severity, and generate response timeline.',
    category: 'security',
    parameters: [
      { name: 'incidents', type: 'array', required: true, description: 'Incident reports [{ type, source, description, timestamp, indicators }].' },
    ],
  },
  async (params) => {
    const incidents = (params.incidents as Array<Record<string, unknown>>) ?? [];

    const triaged = incidents.map((inc, idx) => {
      const type = String(inc.type ?? 'unknown').toLowerCase();
      const desc = String(inc.description ?? '').toLowerCase();
      const source = String(inc.source ?? 'unknown');

      const SEVERITY_RULES: Array<{ keywords: string[]; severity: 'critical' | 'high' | 'medium' | 'low'; sla: string }> = [
        { keywords: ['data breach', '数据泄露', 'rce', 'remote code'], severity: 'critical', sla: '15min' },
        { keywords: ['sql injection', 'xss', 'ddos', 'ransomware', '勒索'], severity: 'critical', sla: '30min' },
        { keywords: ['brute force', 'unauthorized', '未授权', 'phishing'], severity: 'high', sla: '2h' },
        { keywords: ['misconfig', '配置错误', 'missing patch'], severity: 'medium', sla: '24h' },
        { keywords: ['info', 'scan', 'recon'], severity: 'low', sla: '72h' },
      ];

      let severity: 'critical' | 'high' | 'medium' | 'low' = 'medium';
      let sla = '24h';
      for (const rule of SEVERITY_RULES) {
        if (rule.keywords.some(kw => type.includes(kw) || desc.includes(kw))) {
          severity = rule.severity;
          sla = rule.sla;
          break;
        }
      }

      const categories: Record<string, string> = {
        'brute-force': 'Authentication Attack',
        'sql-injection': 'Injection Attack',
        'xss': 'Injection Attack',
        'ddos': 'Availability Attack',
        'phishing': 'Social Engineering',
        'malware': 'Malware',
        'data-breach': 'Data Breach',
      };
      const category = Object.entries(categories).find(([kw]) => type.includes(kw))?.[1] ?? 'Unknown';

      return {
        id: `INC-${Date.now()}-${idx}`,
        originalType: type,
        category,
        severity,
        source,
        sla,
        responseTeam: severity === 'critical' ? ['guardian', 'tianshu'] : severity === 'high' ? ['guardian', 'tianshu'] : ['guardian'],
        indicators: (inc.indicators as string[]) ?? [],
      };
    });

    triaged.sort((a, b) => {
      const order = { critical: 0, high: 1, medium: 2, low: 3 };
      return order[a.severity] - order[b.severity];
    });

    const counts = { critical: 0, high: 0, medium: 0, low: 0 };
    for (const t of triaged) counts[t.severity]++;

    return {
      totalIncidents: incidents.length,
      triaged,
      severityCounts: counts,
      immediateAction: counts.critical > 0 ? `${counts.critical} critical incidents require immediate response` : 'No critical incidents',
      avgResponseTime: triaged.length > 0 ? triaged.reduce((sum, t) => sum + parseSlaMinutes(t.sla), 0) / triaged.length : 0,
    };
  },
  (params) => {
    const errors: string[] = [];
    if (!Array.isArray(params.incidents)) errors.push('Parameter "incidents" is required and must be an array');
    return { valid: errors.length === 0, errors: errors.length > 0 ? errors : undefined };
  },
);

function parseSlaMinutes(sla: string): number {
  const match = sla.match(/(\d+)(min|h)/);
  if (!match) return 60;
  const val = Number(match[1]);
  return match[2] === 'h' ? val * 60 : val;
}
