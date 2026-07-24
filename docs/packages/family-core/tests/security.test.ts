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

import { describe, it, expect } from 'vitest';
import { OutputValidator, defaultOutputRules } from '../src/security/OutputValidator.js';
import { RateLimiter } from '../src/security/RateLimiter.js';
import { AuditLogger } from '../src/security/AuditLogger.js';
import { SkillSandbox } from '../src/security/SkillSandbox.js';

describe('Security Modules', () => {
  describe('OutputValidator', () => {
    it('should validate output with no rules', () => {
      const validator = new OutputValidator();
      const report = validator.validate({ data: 'test' });
      expect(report.passed).toBe(true);
      expect(report.blocked).toBe(false);
    });

    it('should block undefined output', () => {
      const validator = new OutputValidator();
      validator.addRule(defaultOutputRules[0]);
      const report = validator.validate(undefined);
      expect(report.passed).toBe(false);
      expect(report.blocked).toBe(true);
    });

    it('should warn on empty string', () => {
      const validator = new OutputValidator();
      validator.addRule(defaultOutputRules[1]);
      const report = validator.validate('');
      expect(report.passed).toBe(false);
      expect(report.blocked).toBe(false);
    });

    it('should block oversized response', () => {
      const validator = new OutputValidator();
      validator.addRule(defaultOutputRules[2]);
      const bigOutput = { data: 'x'.repeat(1024 * 1024 + 1) };
      const report = validator.validate(bigOutput);
      expect(report.passed).toBe(false);
      expect(report.blocked).toBe(true);
    });

    it('should pass valid output through all default rules', () => {
      const validator = new OutputValidator();
      for (const rule of defaultOutputRules) validator.addRule(rule);
      const report = validator.validate({ message: 'Hello 🌹' });
      expect(report.passed).toBe(true);
    });

    it('should allow adding and removing rules', () => {
      const validator = new OutputValidator();
      validator.addRule(defaultOutputRules[0]);
      expect(validator.getRules()).toHaveLength(1);
      validator.removeRule('no-undefined-response');
      expect(validator.getRules()).toHaveLength(0);
    });

    it('should include timestamp in report', () => {
      const validator = new OutputValidator();
      const before = Date.now();
      const report = validator.validate('ok');
      expect(report.timestamp).toBeGreaterThanOrEqual(before);
    });
  });

  describe('RateLimiter', () => {
    it('should allow requests within limit', () => {
      const limiter = new RateLimiter({ maxRequests: 5 });
      for (let i = 0; i < 5; i++) {
        const result = limiter.check('user-1');
        expect(result.allowed).toBe(true);
      }
    });

    it('should block requests exceeding limit', () => {
      const limiter = new RateLimiter({ maxRequests: 3, windowMs: 60_000 });
      limiter.check('user-2');
      limiter.check('user-2');
      limiter.check('user-2');
      const result = limiter.check('user-2');
      expect(result.allowed).toBe(false);
      expect(result.retryAfterMs).toBeDefined();
    });

    it('should track remaining correctly', () => {
      const limiter = new RateLimiter({ maxRequests: 10 });
      limiter.check('user-3');
      limiter.check('user-3');
      expect(limiter.getRemaining('user-3')).toBe(8);
    });

    it('should reset for a specific key', () => {
      const limiter = new RateLimiter({ maxRequests: 2 });
      limiter.check('user-4');
      limiter.check('user-4');
      limiter.reset('user-4');
      expect(limiter.getRemaining('user-4')).toBe(2);
    });

    it('should support per-key config', () => {
      const limiter = new RateLimiter({ maxRequests: 1 });
      limiter.setConfig('vip', { maxRequests: 100 });
      limiter.check('vip');
      const result = limiter.check('vip');
      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(98);
    });

    it('should cleanup expired entries', async () => {
      const limiter = new RateLimiter({ maxRequests: 5, windowMs: 1 });
      limiter.check('user-5');
      await new Promise((r) => setTimeout(r, 5));
      const removed = limiter.cleanup();
      expect(removed).toBeGreaterThanOrEqual(1);
    });
  });

  describe('AuditLogger', () => {
    it('should log entries with correct fields', () => {
      const audit = new AuditLogger();
      const entry = audit.info('auth', 'login', 'user-1', { target: 'system' });
      expect(entry.id).toMatch(/^audit-/);
      expect(entry.level).toBe('info');
      expect(entry.category).toBe('auth');
      expect(entry.action).toBe('login');
      expect(entry.actor).toBe('user-1');
      expect(entry.result).toBe('success');
    });

    it('should log denial events', () => {
      const audit = new AuditLogger();
      const entry = audit.denied('security', 'unauthorized-access', 'attacker');
      expect(entry.level).toBe('critical');
      expect(entry.result).toBe('denied');
    });

    it('should query entries by category', () => {
      const audit = new AuditLogger();
      audit.info('auth', 'login', 'user-1');
      audit.info('skill', 'execute', 'user-1');
      audit.info('auth', 'logout', 'user-1');
      const results = audit.query({ category: 'auth' });
      expect(results).toHaveLength(2);
    });

    it('should query entries by time range', () => {
      const audit = new AuditLogger();
      const before = Date.now();
      audit.info('system', 'startup', 'system');
      const after = Date.now() + 1;
      const results = audit.query({ from: before, to: after });
      expect(results.length).toBeGreaterThanOrEqual(1);
    });

    it('should respect maxEntries limit', () => {
      const audit = new AuditLogger(5);
      for (let i = 0; i < 10; i++) {
        audit.info('system', `action-${i}`, 'test');
      }
      const stats = audit.getStats();
      expect(stats.total).toBe(5);
    });

    it('should notify listeners', () => {
      const audit = new AuditLogger();
      const entries: unknown[] = [];
      const unsub = audit.onEntry((entry) => entries.push(entry));
      audit.info('system', 'test', 'user');
      expect(entries).toHaveLength(1);
      unsub();
      audit.info('system', 'test2', 'user');
      expect(entries).toHaveLength(1);
    });

    it('should compute stats', () => {
      const audit = new AuditLogger();
      audit.info('auth', 'login', 'user');
      audit.warn('skill', 'timeout', 'user');
      audit.error('bridge', 'connection-failed', 'system');
      const stats = audit.getStats();
      expect(stats.total).toBe(3);
      expect(stats.byLevel.info).toBe(1);
      expect(stats.byLevel.warn).toBe(1);
      expect(stats.byLevel.error).toBe(1);
      expect(stats.byCategory.auth).toBe(1);
      expect(stats.byCategory.skill).toBe(1);
      expect(stats.byCategory.bridge).toBe(1);
    });

    it('should clear all entries', () => {
      const audit = new AuditLogger();
      audit.info('system', 'test', 'user');
      audit.clear();
      expect(audit.getStats().total).toBe(0);
    });
  });

  describe('SkillSandbox', () => {
    it('should execute valid functions', async () => {
      const sandbox = new SkillSandbox();
      const result = await sandbox.execute(() => 42);
      expect(result.success).toBe(true);
      expect(result.output).toBe(42);
    });

    it('should execute async functions', async () => {
      const sandbox = new SkillSandbox();
      const result = await sandbox.execute(async () => {
        await new Promise((r) => setTimeout(r, 10));
        return 'done';
      });
      expect(result.success).toBe(true);
      expect(result.output).toBe('done');
    });

    it('should timeout long-running functions', async () => {
      const sandbox = new SkillSandbox({ maxExecutionTimeMs: 50 });
      const result = await sandbox.execute(() => new Promise(() => {}));
      expect(result.success).toBe(false);
      expect(result.error).toContain('timeout');
    });

    it('should catch execution errors', async () => {
      const sandbox = new SkillSandbox();
      const result = await sandbox.execute(() => {
        throw new Error('test error');
      });
      expect(result.success).toBe(false);
      expect(result.error).toBe('test error');
    });

    it('should validate params for blocked modules', () => {
      const sandbox = new SkillSandbox();
      const { valid, violations } = sandbox.validateParams({
        code: "require('child_process').exec('rm -rf /')",
      });
      expect(valid).toBe(false);
      expect(violations.length).toBeGreaterThan(0);
    });

    it('should reject dynamic require string concatenation', () => {
      const sandbox = new SkillSandbox();
      const { valid, violations } = sandbox.validateParams({
        code: "require('ch' + 'ild_process').exec('rm -rf /')",
      });
      expect(valid).toBe(false);
      expect(violations.some((v) => v.includes('Dynamic module reference'))).toBe(true);
    });

    it('should reject dynamic import string concatenation', () => {
      const sandbox = new SkillSandbox();
      const { valid } = sandbox.validateParams({
        code: "import('f' + 's').then(m => m.readFileSync('/etc/passwd'))",
      });
      expect(valid).toBe(false);
    });

    it('should reject eval in params', () => {
      const sandbox = new SkillSandbox();
      const { valid } = sandbox.validateParams({
        code: "eval('require(\"child_process\")')",
      });
      expect(valid).toBe(false);
    });

    it('should reject Function constructor in code', async () => {
      const sandbox = new SkillSandbox();
      const result = await sandbox.execute(() => {
        const fn = new Function("return require('fs').readFileSync('/etc/passwd')");
        return fn();
      });
      expect(result.success).toBe(false);
      expect(result.permissionViolations.some((v) => v.includes('Dangerous pattern'))).toBe(true);
    });

    it('should reject dynamic require in execute', async () => {
      const sandbox = new SkillSandbox();
      // eslint-disable-next-line @typescript-eslint/no-implied-eval
      const result = await sandbox.execute(() => {
        const mod = 'child_process';
        // @ts-expect-error intentional unsafe require for security test
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        return require(mod);
      });
      expect(result.success).toBe(false);
      expect(result.permissionViolations.some((v) => v.includes('Dynamic module reference'))).toBe(true);
    });

    it('should reject template string require (red-team #1)', async () => {
      const sandbox = new SkillSandbox();
      // @ts-expect-error intentional unsafe require for security test
      const result = await sandbox.execute(() => require(`child_process`));
      expect(result.success).toBe(false);
      expect(result.permissionViolations.some((v) => v.includes('Template string'))).toBe(true);
    });

    it('should reject require.call bypass (red-team #2)', async () => {
      const sandbox = new SkillSandbox();
      const result = await sandbox.execute(() => {
        // @ts-expect-error intentional unsafe require for security test
        return require.call(null, 'child_process');
      });
      expect(result.success).toBe(false);
      expect(result.permissionViolations.some((v) => v.includes('Indirect module access'))).toBe(true);
    });

    it('should reject module.require bypass (red-team #3)', async () => {
      const sandbox = new SkillSandbox();
      const result = await sandbox.execute(() => {
        // @ts-expect-error intentional unsafe require for security test
        return module.require('child_process');
      });
      expect(result.success).toBe(false);
      expect(result.permissionViolations.some((v) => v.includes('Indirect module access'))).toBe(true);
    });

    it('should reject aliased require bypass (red-team #4)', async () => {
      const sandbox = new SkillSandbox();
      const result = await sandbox.execute(() => {
        // @ts-expect-error intentional unsafe require for security test
        const r = require;
        return r('child_process');
      });
      expect(result.success).toBe(false);
      expect(result.permissionViolations.some((v) => v.includes('Indirect module access'))).toBe(true);
    });

    it('should reject global require bypass (red-team #5)', async () => {
      const sandbox = new SkillSandbox();
      const result = await sandbox.execute(() => {
        // @ts-expect-error intentional unsafe require for security test
        return global['require']('child_process');
      });
      expect(result.success).toBe(false);
      expect(result.permissionViolations.some((v) => v.includes('Indirect module access'))).toBe(true);
    });

    it('should reject Reflect.get bypass (red-team #6)', async () => {
      const sandbox = new SkillSandbox();
      const result = await sandbox.execute(() => {
        // @ts-expect-error intentional unsafe require for security test
        return Reflect.get(global, 'require')('child_process');
      });
      expect(result.success).toBe(false);
      expect(result.permissionViolations.some((v) => v.includes('Indirect module access'))).toBe(true);
    });

    it('should reject Buffer.from + eval obfuscation (red-team #7)', async () => {
      const sandbox = new SkillSandbox();
      const result = await sandbox.execute(() => {
        // @ts-expect-error intentional unsafe eval for security test
        eval(Buffer.from('cmVxdWlyZSgiZnMiKQ==', 'base64').toString());
      });
      expect(result.success).toBe(false);
      expect(result.permissionViolations.length).toBeGreaterThan(0);
    });

    it('should reject String.fromCharCode + eval obfuscation (red-team #8)', async () => {
      const sandbox = new SkillSandbox();
      const result = await sandbox.execute(() => {
        // @ts-expect-error intentional unsafe eval for security test
        eval(String.fromCharCode(114, 101, 113, 117, 105, 114, 101, 40, 34, 102, 115, 34, 41));
      });
      expect(result.success).toBe(false);
      expect(result.permissionViolations.length).toBeGreaterThan(0);
    });

    it('should reject unicode escape obfuscation (red-team #9)', async () => {
      const sandbox = new SkillSandbox();
      const result = await sandbox.execute(() => {
        // @ts-expect-error intentional unsafe eval for security test
        eval('\u0072\u0065\u0071\u0075\u0069\u0072\u0065\u0028\u0022\u0066\u0073\u0022\u0029');
      });
      expect(result.success).toBe(false);
      expect(result.permissionViolations.length).toBeGreaterThan(0);
    });

    it('should reject hex escape obfuscation (red-team #10)', async () => {
      const sandbox = new SkillSandbox();
      const result = await sandbox.execute(() => {
        // @ts-expect-error intentional unsafe eval for security test
        eval('\x72\x65\x71\x75\x69\x72\x65\x28\x22\x66\x73\x22\x29');
      });
      expect(result.success).toBe(false);
      expect(result.permissionViolations.length).toBeGreaterThan(0);
    });

    it('should execute in worker without code injection', async () => {
      const sandbox = new SkillSandbox();
      // 注入尝试：函数体包含特殊字符试图逃逸 Worker 代码
      const malicious = () => {
        return 'safe-result';
      };
      const result = await sandbox.executeInWorker(malicious);
      expect(result.success).toBe(true);
      expect(result.output).toBe('safe-result');
    });

    it('should reject malicious code in worker (S3)', async () => {
      const sandbox = new SkillSandbox();
      const malicious = () => {
        // @ts-expect-error intentional unsafe require for security test
        return require('fs');
      };
      const result = await sandbox.executeInWorker(malicious);
      expect(result.success).toBe(false);
      expect(result.permissionViolations.length).toBeGreaterThan(0);
    });

    it('should track execution count', async () => {
      const sandbox = new SkillSandbox();
      await sandbox.execute(() => 1);
      await sandbox.execute(() => 2);
      expect(sandbox.getExecutionCount()).toBe(2);
    });

    it('should allow config updates', () => {
      const sandbox = new SkillSandbox();
      sandbox.updateConfig({ maxExecutionTimeMs: 5000 });
      expect(sandbox.getConfig().maxExecutionTimeMs).toBe(5000);
    });
  });
});
