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

export const testGenerationSkill = defineSkill(
  {
    id: 'grandmaster:test-generation',
    name: 'Test Generation',
    version: '1.0.0',
    owner: 'grandmaster',
    description: 'Automated test case generation — analyzes functions and generates test scenarios covering happy path, edge cases, and error conditions.',
    category: 'quality',
    parameters: [
      {
        name: 'functionCode',
        type: 'string',
        required: true,
        description: 'The function code to generate tests for.',
      },
      {
        name: 'functionName',
        type: 'string',
        required: false,
        description: 'Name of the function.',
      },
    ],
  },
  async (params) => {
    const functionCode = String(params.functionCode ?? '');
    const functionName = String(params.functionName ?? 'targetFunction');

    const testCases: Array<{ name: string; type: string; input: string; expected: string }> = [];

    testCases.push({
      name: `${functionName} - happy path`,
      type: 'unit',
      input: '// Provide valid input matching function signature',
      expected: '// Expected successful return value',
    });

    testCases.push({
      name: `${functionName} - null input`,
      type: 'edge-case',
      input: 'null',
      expected: '// Should handle null gracefully',
    });

    testCases.push({
      name: `${functionName} - undefined input`,
      type: 'edge-case',
      input: 'undefined',
      expected: '// Should handle undefined gracefully',
    });

    testCases.push({
      name: `${functionName} - empty string`,
      type: 'edge-case',
      input: "''",
      expected: '// Should handle empty string',
    });

    if (/\bnumber\b/.test(functionCode)) {
      testCases.push(
        { name: `${functionName} - zero`, type: 'edge-case', input: '0', expected: '// Should handle zero' },
        { name: `${functionName} - negative`, type: 'edge-case', input: '-1', expected: '// Should handle negative values' },
        { name: `${functionName} - very large`, type: 'edge-case', input: 'Number.MAX_SAFE_INTEGER', expected: '// Should handle large numbers' },
      );
    }

    if (/array|Array|\[\]/.test(functionCode)) {
      testCases.push(
        { name: `${functionName} - empty array`, type: 'edge-case', input: '[]', expected: '// Should handle empty array' },
        { name: `${functionName} - single element`, type: 'edge-case', input: '[1]', expected: '// Should handle single element' },
      );
    }

    if (/async|await|Promise/.test(functionCode)) {
      testCases.push(
        { name: `${functionName} - async rejection`, type: 'error', input: '// Trigger rejection', expected: '// Should catch rejection' },
        { name: `${functionName} - timeout`, type: 'error', input: '// Trigger timeout', expected: '// Should handle timeout' },
      );
    }

    testCases.push({
      name: `${functionName} - throws error`,
      type: 'error',
      input: '// Provide input that triggers error',
      expected: '// Should throw or return error',
    });

    const testCode = `describe('${functionName}', () => {\n${testCases.map(tc =>
      `  it('${tc.name}', () => {\n    // ${tc.type}\n    const result = ${functionName}(${tc.input});\n    // expect(result).${tc.expected};\n  });`
    ).join('\n\n')}\n});`;

    return {
      testCases,
      testCaseCount: testCases.length,
      coverage: {
        unit: testCases.filter(t => t.type === 'unit').length,
        edgeCase: testCases.filter(t => t.type === 'edge-case').length,
        error: testCases.filter(t => t.type === 'error').length,
      },
      generatedTestCode: testCode,
      functionName,
    };
  },
  (params) => {
    const errors: string[] = [];
    if (!params.functionCode || typeof params.functionCode !== 'string') {
      errors.push('Parameter "functionCode" is required and must be a string');
    }
    return { valid: errors.length === 0, errors: errors.length > 0 ? errors : undefined };
  },
);
