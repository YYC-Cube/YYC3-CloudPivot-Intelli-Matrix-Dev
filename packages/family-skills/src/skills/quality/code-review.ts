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

export const codeReviewSkill = defineSkill(
  {
    id: 'grandmaster:code-review',
    name: 'Code Review',
    version: '1.0.0',
    owner: 'grandmaster',
    description: 'Automated code review — checks for bugs, anti-patterns, maintainability issues, and provides improvement suggestions.',
    category: 'quality',
    parameters: [
      {
        name: 'code',
        type: 'string',
        required: true,
        description: 'The code to review.',
      },
      {
        name: 'context',
        type: 'string',
        required: false,
        description: 'Additional context about what the code should do.',
      },
    ],
  },
  async (params) => {
    const code = String(params.code ?? '');
    const context = String(params.context ?? '');

    const issues: Array<{ severity: string; category: string; message: string; suggestion: string }> = [];

    const patterns: Array<{ regex: RegExp; severity: string; category: string; message: string; suggestion: string }> = [
      { regex: /==\s*(?:null|undefined|true|false|0|['"])/g, severity: 'medium', category: 'bug-risk', message: 'Loose equality comparison', suggestion: 'Use === for strict equality.' },
      { regex: /var\s+/g, severity: 'low', category: 'style', message: 'Uses var instead of let/const', suggestion: 'Use const or let instead of var.' },
      { regex: /callback\s*\([^)]*\)\s*\{[^}]*callback\s*\(/g, severity: 'high', category: 'maintainability', message: 'Nested callbacks (callback hell)', suggestion: 'Refactor to use async/await or Promises.' },
      { regex: /async\s+function\s+\w+\s*\([^)]*\)\s*\{[^}]*await[^}]*await[^}]*await/gs, severity: 'medium', category: 'performance', message: 'Sequential awaits that could be parallel', suggestion: 'Use Promise.all() for independent async operations.' },
      { regex: /catch\s*\([^)]*\)\s*\{\s*\}/g, severity: 'high', category: 'error-handling', message: 'Empty catch block', suggestion: 'Handle the error or at least log it.' },
      { regex: /new\s+Date\(\)\.getTime\(\)/g, severity: 'low', category: 'style', message: 'Verbose date timestamp', suggestion: 'Use Date.now() instead.' },
    ];

    for (const pattern of patterns) {
      const globalPattern = new RegExp(pattern.regex.source, pattern.regex.flags);
      if (globalPattern.test(code)) {
        issues.push({
          severity: pattern.severity,
          category: pattern.category,
          message: pattern.message,
          suggestion: pattern.suggestion,
        });
      }
    }

    const lines = code.split('\n').length;
    if (lines > 300) {
      issues.push({
        severity: 'medium',
        category: 'maintainability',
        message: `File is ${lines} lines long`,
        suggestion: 'Consider breaking into smaller modules.',
      });
    }

    const complexity = calculateComplexity(code);
    if (complexity > 10) {
      issues.push({
        severity: 'high',
        category: 'complexity',
        message: `Cyclomatic complexity: ${complexity}`,
        suggestion: 'Reduce branching complexity. Extract methods.',
      });
    }

    const overallScore = Math.max(0, 1 - issues.filter(i => i.severity === 'high').length * 0.2 - issues.filter(i => i.severity === 'medium').length * 0.1 - issues.filter(i => i.severity === 'low').length * 0.05);

    return {
      score: overallScore,
      verdict: overallScore >= 0.8 ? 'approve' : overallScore >= 0.5 ? 'request-changes' : 'reject',
      issues,
      summary: {
        total: issues.length,
        high: issues.filter(i => i.severity === 'high').length,
        medium: issues.filter(i => i.severity === 'medium').length,
        low: issues.filter(i => i.severity === 'low').length,
      },
      complexity,
      linesOfCode: lines,
      context,
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

function calculateComplexity(code: string): number {
  const branches = (code.match(/if\s*\(/g) ?? []).length;
  const loops = (code.match(/(?:for|while|do)\s*\(/g) ?? []).length;
  const cases = (code.match(/case\s+/g) ?? []).length;
  const catches = (code.match(/catch\s*\(/g) ?? []).length;
  const logicalOps = (code.match(/&&|\|\|/g) ?? []).length;
  return 1 + branches + loops + cases + catches + Math.floor(logicalOps / 2);
}
