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

export interface OutputValidationRule {
  id: string;
  name: string;
  validate: (output: unknown) => OutputValidationResult;
  severity: 'block' | 'warn' | 'log';
}

export interface OutputValidationResult {
  valid: boolean;
  errors?: string[];
  warnings?: string[];
}

export interface OutputValidationReport {
  output: unknown;
  results: Array<{ rule: OutputValidationRule; result: OutputValidationResult }>;
  passed: boolean;
  blocked: boolean;
  timestamp: number;
}

export class OutputValidator {
  private rules: Map<string, OutputValidationRule> = new Map();

  addRule(rule: OutputValidationRule): void {
    this.rules.set(rule.id, rule);
  }

  removeRule(ruleId: string): void {
    this.rules.delete(ruleId);
  }

  getRules(): OutputValidationRule[] {
    return Array.from(this.rules.values());
  }

  validate(output: unknown): OutputValidationReport {
    const results: Array<{ rule: OutputValidationRule; result: OutputValidationResult }> = [];
    let blocked = false;
    let allPassed = true;

    for (const rule of this.rules.values()) {
      const result = rule.validate(output);
      results.push({ rule, result });

      if (!result.valid) {
        allPassed = false;
        if (rule.severity === 'block') {
          blocked = true;
        }
      }
    }

    return {
      output,
      results,
      passed: allPassed,
      blocked,
      timestamp: Date.now(),
    };
  }
}

export const defaultOutputRules: OutputValidationRule[] = [
  {
    id: 'no-undefined-response',
    name: 'Response must not be undefined',
    severity: 'block',
    validate: (output: unknown): OutputValidationResult => {
      if (output === undefined) {
        return { valid: false, errors: ['Agent response is undefined'] };
      }
      return { valid: true };
    },
  },
  {
    id: 'no-empty-string',
    name: 'String responses must not be empty',
    severity: 'warn',
    validate: (output: unknown): OutputValidationResult => {
      if (typeof output === 'string' && output.trim().length === 0) {
        return { valid: false, warnings: ['Agent returned empty string'] };
      }
      return { valid: true };
    },
  },
  {
    id: 'max-response-size',
    name: 'Response must not exceed size limit',
    severity: 'block',
    validate: (output: unknown): OutputValidationResult => {
      const MAX_SIZE = 1024 * 1024;
      try {
        const size = JSON.stringify(output).length;
        if (size > MAX_SIZE) {
          return { valid: false, errors: [`Response size ${size} exceeds limit ${MAX_SIZE}`] };
        }
      } catch {
        return { valid: false, errors: ['Response is not serializable'] };
      }
      return { valid: true };
    },
  },
];
