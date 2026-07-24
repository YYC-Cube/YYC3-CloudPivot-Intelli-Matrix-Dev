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

export const threatResponseSkill = defineSkill(
  {
    id: 'guardian:threat-response',
    name: 'Threat Response',
    version: '1.0.0',
    owner: 'guardian',
    description: 'Threat detection and response — analyzes security events, classifies threats, and generates response playbooks.',
    category: 'security',
    parameters: [
      {
        name: 'events',
        type: 'array',
        required: true,
        description: 'Security events to analyze: [{ type, source, data, timestamp }].',
      },
    ],
  },
  async (params) => {
    const events = (params.events as Array<Record<string, unknown>>) ?? [];

    if (events.length === 0) {
      return { threats: [], playbook: [], riskScore: 0, level: 'none' };
    }

    const threatTypes: Record<string, { severity: number; response: string }> = {
      'brute-force': { severity: 0.8, response: 'Block source IP, enable rate limiting, force password reset for affected accounts.' },
      'sql-injection': { severity: 0.9, response: 'Block request, patch vulnerable endpoint, review all SQL queries for parameterization.' },
      'xss': { severity: 0.7, response: 'Sanitize output, implement CSP headers, review all user input rendering.' },
      'ddos': { severity: 0.9, response: 'Enable traffic filtering, scale infrastructure, activate CDN protection.' },
      'data-breach': { severity: 1.0, response: 'Isolate affected systems, notify stakeholders, begin forensic analysis.' },
      'malware': { severity: 0.85, response: 'Quarantine affected systems, scan all endpoints, update security definitions.' },
      'phishing': { severity: 0.6, response: 'Block sender, notify users, update email filters.' },
      'unauthorized-access': { severity: 0.75, response: 'Revoke sessions, rotate credentials, audit access logs.' },
    };

    const threats = events.map((event, idx) => {
      const eventType = String(event.type ?? 'unknown').toLowerCase();
      const threatInfo = Object.entries(threatTypes).find(([key]) => eventType.includes(key));
      const severity = threatInfo?.[1].severity ?? 0.3;

      return {
        id: `threat-${idx}`,
        type: threatInfo?.[0] ?? 'unknown',
        source: String(event.source ?? 'unknown'),
        severity,
        confidence: 0.6 + severity * 0.3,
        timestamp: event.timestamp ?? Date.now(),
        response: threatInfo?.[1].response ?? 'Investigate and monitor. No automated playbook available.',
      };
    });

    threats.sort((a, b) => b.severity - a.severity);

    const maxSeverity = threats.length > 0 ? threats[0]!.severity : 0;
    const riskScore = Math.min(threats.reduce((sum, t) => sum + t.severity, 0) / Math.max(events.length, 1) * 100, 100);

    const playbook = threats.slice(0, 5).map(t => ({
      priority: t.severity > 0.8 ? 'immediate' : t.severity > 0.5 ? 'high' : 'normal',
      action: t.response,
      threatType: t.type,
    }));

    return {
      threats,
      playbook,
      riskScore,
      level: maxSeverity > 0.8 ? 'critical' : maxSeverity > 0.6 ? 'high' : maxSeverity > 0.3 ? 'medium' : 'low',
      eventCount: events.length,
      threatCount: threats.length,
    };
  },
  (params) => {
    const errors: string[] = [];
    if (!Array.isArray(params.events)) {
      errors.push('Parameter "events" is required and must be an array');
    }
    return { valid: errors.length === 0, errors: errors.length > 0 ? errors : undefined };
  },
);
