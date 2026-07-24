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
import { SkillSandbox } from '../src/security/SkillSandbox.js';

describe('SkillSandbox — Permission & Worker Isolation', () => {
  describe('checkPermissions (via execute)', () => {
    it('should block network modules in function source', async () => {
      const sandbox = new SkillSandbox({ allowedPermissions: ['compute'] });
      const result = await sandbox.execute(() => {
        require('net');
      });
      expect(result.success).toBe(false);
      expect(result.permissionViolations.length).toBeGreaterThan(0);
      expect(result.permissionViolations[0]).toContain('network');
    });

    it('should block filesystem modules in function source', async () => {
      const sandbox = new SkillSandbox({ allowedPermissions: ['compute'] });
      const result = await sandbox.execute(() => {
        require('fs');
      });
      expect(result.success).toBe(false);
      expect(result.permissionViolations.length).toBeGreaterThan(0);
      expect(result.permissionViolations[0]).toContain('filesystem');
    });

    it('should block modules via require syntax in source', async () => {
      const sandbox = new SkillSandbox({ allowedPermissions: ['compute'] });
      const result = await sandbox.execute(() => {
        require("http");
      });
      expect(result.success).toBe(false);
      expect(result.permissionViolations.length).toBeGreaterThan(0);
    });

    it('should allow compute-only functions', async () => {
      const sandbox = new SkillSandbox({ allowedPermissions: ['compute'] });
      const result = await sandbox.execute(() => {
        return 1 + 1;
      });
      expect(result.success).toBe(true);
      expect(result.output).toBe(2);
      expect(result.permissionViolations.length).toBe(0);
    });

    it('should allow function with no permission-requiring modules', async () => {
      const sandbox = new SkillSandbox();
      const result = await sandbox.execute(() => {
        const arr = [1, 2, 3].map(x => x * 2);
        return arr;
      });
      expect(result.success).toBe(true);
      expect(result.output).toEqual([2, 4, 6]);
    });

    it('should respect blockedModules config', async () => {
      const sandbox = new SkillSandbox({
        blockedModules: ['child_process', 'fs', 'net', 'http', 'https', 'os', 'cluster', 'dgram', 'tls', 'crypto'],
      });
      const result = await sandbox.execute(() => {
        require('crypto');
      });
      expect(result.success).toBe(false);
      expect(result.permissionViolations.some(v => v.includes('crypto'))).toBe(true);
    });
  });

  describe('validateParams', () => {
    it('should detect blocked module refs in string params', () => {
      const sandbox = new SkillSandbox();
      const { valid, violations } = sandbox.validateParams({
        code: "require('child_process').exec('rm -rf /')",
      });
      expect(valid).toBe(false);
      expect(violations.length).toBeGreaterThan(0);
    });

    it('should detect import() in params', () => {
      const sandbox = new SkillSandbox();
      const { valid, violations } = sandbox.validateParams({
        code: 'import("fs")',
      });
      expect(valid).toBe(false);
    });

    it('should pass safe params', () => {
      const sandbox = new SkillSandbox();
      const { valid, violations } = sandbox.validateParams({
        name: 'test',
        count: 42,
      });
      expect(valid).toBe(true);
      expect(violations.length).toBe(0);
    });

    it('should reject oversized params', () => {
      const sandbox = new SkillSandbox({ maxOutputSize: 100 });
      const { valid, violations } = sandbox.validateParams({
        data: 'x'.repeat(200),
      });
      expect(valid).toBe(false);
      expect(violations[0]).toContain('exceeds limit');
    });
  });

  describe('output size limit', () => {
    it('should block oversized output', async () => {
      const sandbox = new SkillSandbox({ maxOutputSize: 100 });
      const result = await sandbox.execute(() => 'x'.repeat(200));
      expect(result.success).toBe(false);
      expect(result.error).toContain('exceeds limit');
    });

    it('should allow output within limit', async () => {
      const sandbox = new SkillSandbox({ maxOutputSize: 1000 });
      const result = await sandbox.execute(() => 'x'.repeat(50));
      expect(result.success).toBe(true);
      expect(result.output).toBe('x'.repeat(50));
    });
  });

  describe('memory estimation', () => {
    it('should report memoryUsedMB >= 0', async () => {
      const sandbox = new SkillSandbox();
      const result = await sandbox.execute(() => {
        const arr = new Array(10000).fill('test');
        return arr.length;
      });
      expect(result.success).toBe(true);
      expect(result.memoryUsedMB).toBeGreaterThanOrEqual(0);
    });
  });

  describe('execution count & config', () => {
    it('should increment execution count per call', async () => {
      const sandbox = new SkillSandbox();
      await sandbox.execute(() => 1);
      await sandbox.execute(() => 2);
      await sandbox.execute(() => 3);
      expect(sandbox.getExecutionCount()).toBe(3);
    });

    it('should update config', () => {
      const sandbox = new SkillSandbox();
      sandbox.updateConfig({ maxExecutionTimeMs: 999 });
      expect(sandbox.getConfig().maxExecutionTimeMs).toBe(999);
    });

    it('should return defensive copy of config', () => {
      const sandbox = new SkillSandbox();
      const cfg = sandbox.getConfig();
      cfg.maxExecutionTimeMs = 0;
      expect(sandbox.getConfig().maxExecutionTimeMs).not.toBe(0);
    });

    it('should reset execution count', async () => {
      const sandbox = new SkillSandbox();
      await sandbox.execute(() => 1);
      expect(sandbox.getExecutionCount()).toBe(1);
      sandbox.reset();
      expect(sandbox.getExecutionCount()).toBe(0);
    });
  });

  describe('executeInWorker', () => {
    it('should execute simple function in worker', async () => {
      const sandbox = new SkillSandbox();
      const result = await sandbox.executeInWorker(() => 42);
      expect(result.success).toBe(true);
      expect(result.output).toBe(42);
    });

    it('should reject permission-violating function in worker', async () => {
      const sandbox = new SkillSandbox({ allowedPermissions: ['compute'] });
      const result = await sandbox.executeInWorker(() => {
        require('fs');
      });
      expect(result.success).toBe(false);
      expect(result.permissionViolations.length).toBeGreaterThan(0);
    });

    it('should increment execution count for worker execution', async () => {
      const sandbox = new SkillSandbox();
      await sandbox.executeInWorker(() => 'hello');
      expect(sandbox.getExecutionCount()).toBe(1);
    });
  });
});
