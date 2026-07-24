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

export const goldenStandardsSkill = defineSkill(
  {
    id: 'grandmaster:golden-standards',
    name: 'Golden Standards',
    version: '1.0.0',
    owner: 'grandmaster',
    description: 'Golden standards checker — validates code against configurable quality standards and best practices.',
    category: 'quality',
    parameters: [
      {
        name: 'code',
        type: 'string',
        required: true,
        description: 'The code to check against quality standards.',
      },
      {
        name: 'language',
        type: 'string',
        required: false,
        description: 'Programming language.',
        default: 'typescript',
      },
    ],
  },
  async (params) => {
    const code = String(params.code ?? '');
    const language = String(params.language ?? 'typescript');

    const rules: Array<{ id: string; name: string; check: (c: string) => boolean; weight: number }> = [
      { id: 'no-console', name: 'No console.log in production', check: c => !/console\.log/.test(c), weight: 0.5 },
      { id: 'no-any', name: 'No explicit any types', check: c => !/:\s*any\b/.test(c), weight: 1.0 },
      { id: 'no-todo', name: 'No TODO comments', check: c => !/TODO|FIXME|HACK/i.test(c), weight: 0.3 },
      { id: 'error-handling', name: 'Has error handling', check: c => /catch|try|\.catch\(/.test(c), weight: 0.8 },
      { id: 'type-annotations', name: 'Uses type annotations', check: c => /:\s*(string|number|boolean|void)/.test(c), weight: 0.6 },
      { id: 'function-length', name: 'Functions not too long', check: c => !c.split('\n').some((_, i, lines) => {
        const funcStart = i;
        const funcEnd = lines.findIndex((l, j) => j > funcStart && /^\}/.test(l));
        return funcEnd > -1 && funcEnd - funcStart > 50;
      }), weight: 0.4 },
      { id: 'consistent-naming', name: 'Consistent naming (camelCase)', check: c => {
        const funcs = c.match(/(?:function|const|let|var)\s+([a-zA-Z_]\w*)/g) ?? [];
        const violations = funcs.filter(f => /[_]/.test(f.split(/\s+/)[1] ?? ''));
        return violations.length === 0;
      }, weight: 0.3 },
      { id: 'no-hardcoded-urls', name: 'No hardcoded URLs', check: c => !/https?:\/\/[^\s'"]+/.test(c), weight: 0.5 },
    ];

    const results = rules.map(rule => ({
      id: rule.id,
      name: rule.name,
      passed: rule.check(code),
      weight: rule.weight,
    }));

    const totalWeight = results.reduce((sum, r) => sum + r.weight, 0);
    const passedWeight = results.filter(r => r.passed).reduce((sum, r) => sum + r.weight, 0);
    const score = totalWeight > 0 ? passedWeight / totalWeight : 0;

    return {
      score,
      grade: score >= 0.9 ? 'S' : score >= 0.8 ? 'A' : score >= 0.7 ? 'B' : score >= 0.6 ? 'C' : 'D',
      results,
      passedCount: results.filter(r => r.passed).length,
      failedCount: results.filter(r => !r.passed).length,
      language,
      linesOfCode: code.split('\n').length,
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
