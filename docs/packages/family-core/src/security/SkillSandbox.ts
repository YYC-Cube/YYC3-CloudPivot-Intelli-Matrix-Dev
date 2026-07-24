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

import type { Worker as NodeWorker } from 'worker_threads';
import { logger } from '../deps/logger';

export type SandboxPermission = 'network' | 'filesystem' | 'compute' | 'memory';

export interface SandboxConfig {
  maxExecutionTimeMs: number;
  maxMemoryMB: number;
  maxOutputSize: number;
  allowedPermissions: SandboxPermission[];
  blockedModules: string[];
  poolSize?: number;
}

export interface SandboxResult {
  success: boolean;
  output?: unknown;
  error?: string;
  executionTimeMs: number;
  memoryUsedMB: number;
  permissionViolations: string[];
}

const DEFAULT_SANDBOX_CONFIG: SandboxConfig = {
  maxExecutionTimeMs: 30_000,
  maxMemoryMB: 128,
  maxOutputSize: 1024 * 512,
  allowedPermissions: ['compute'],
  blockedModules: ['child_process', 'fs', 'net', 'http', 'https', 'os', 'cluster', 'dgram', 'tls'],
};

const PERMISSION_MODULE_MAP: Record<SandboxPermission, string[]> = {
  network: ['net', 'http', 'https', 'dgram', 'tls', 'udp'],
  filesystem: ['fs', 'fs/promises', 'child_process'],
  compute: [],
  memory: [],
};

/** 检测模板字符串形式的模块引用 */
function detectTemplateStringModules(code: string): string[] {
  const violations: string[] = [];
  const templatePattern = /\b(require|import)\s*\(\s*`[\s\S]*?`\s*\)/g;
  let match: RegExpExecArray | null;
  while ((match = templatePattern.exec(code)) !== null) {
    violations.push(`Template string module reference detected: ${match[0]}`);
  }
  return violations;
}

/** 提取 require/import 调用的参数，拒绝动态拼接 */
function extractModuleReferences(code: string): { valid: boolean; modules: string[]; reason?: string } {
  const modules: string[] = [];
  // 匹配 require(...) 或 import(...)
  const pattern = /\b(require|import)\s*\(\s*(.+?)\s*\)/g;
  let match: RegExpExecArray | null;

  while ((match = pattern.exec(code)) !== null) {
    const arg = match[2]?.trim() ?? '';

    // 纯字符串字面量检测：以 ' 或 " 开头和结尾，且中间不包含 +、${、反引号
    const isPureString =
      (arg.startsWith("'") && arg.endsWith("'") && !arg.slice(1, -1).includes("'")) ||
      (arg.startsWith('"') && arg.endsWith('"') && !arg.slice(1, -1).includes('"'));

    if (!isPureString) {
      return { valid: false, modules: [], reason: `Dynamic module reference detected: ${match[1]}(${arg})` };
    }

    // 去掉引号
    const mod = arg.slice(1, -1);
    modules.push(mod);
  }

  return { valid: true, modules };
}

/** 检测危险的动态代码执行模式 */
function detectDangerousPatterns(code: string): string[] {
  const violations: string[] = [];
  const dangerous = [
    /\beval\s*\(/,
    /\bFunction\s*\(/,
    /\bnew\s+Function\s*\(/,
    /\bsetTimeout\s*\(\s*['"`]/,
    /\bsetInterval\s*\(\s*['"`]/,
  ];
  for (const p of dangerous) {
    if (p.test(code)) {
      violations.push(`Dangerous pattern detected: ${p.source}`);
    }
  }
  return violations;
}

/** 检测间接 require/import 访问 */
function detectIndirectAccess(code: string): string[] {
  const violations: string[] = [];
  const patterns = [
    // require.call(null, 'module') / require.apply(null, ['module'])
    /\brequire\s*\.\s*(call|apply)\s*\(/,
    // module.require('module')
    /\bmodule\s*\.\s*require\s*\(/,
    // process.mainModule.require
    /\bprocess\s*\.\s*mainModule\s*\.\s*require\b/,
    // global['require'] / this['require']
    /\b(?:global|this|window|self)\s*\[\s*['"`]require['"`]\s*\]/,
    // const r = require; r('module') — 跨行支持
    /\b(?:const|let|var)\s+\w+\s*=\s*require[\s\S]*?\b\w+\s*\(/,
    // Reflect.get(global, 'require')
    /\bReflect\s*\.\s*get\s*\([^)]*require/,
    // import().call / import().apply
    /\bimport\s*\.\s*(call|apply)\s*\(/,
  ];
  for (const p of patterns) {
    if (p.test(code)) {
      violations.push('Indirect module access detected');
    }
  }
  return violations;
}

/** 检测混淆代码 */
function detectObfuscation(code: string): string[] {
  const violations: string[] = [];
  const patterns = [
    // Base64 / hex decode + eval/Function
    /\b(?:atob|btoa|Buffer\.from)\s*\([^)]+\)[\s\S]{0,50}?\b(?:eval|Function)\s*\(/,
    // String.fromCharCode with eval/Function
    /\bString\.fromCharCode\s*\([^)]+\)[\s\S]{0,50}?\b(?:eval|Function)\s*\(/,
    // Unicode escape sequences for 'require' / 'import'
    /\\u00(?:72|65|71|75|69|6d|70|6f|72|74)/i,
    // Hex escape sequences
    /\\x(?:72|65|71|75|69|6d|70|6f|72|74)/i,
  ];
  for (const p of patterns) {
    if (p.test(code)) {
      violations.push('Obfuscated code pattern detected');
    }
  }
  return violations;
}

export class SkillSandbox {
  private config: SandboxConfig;
  private executionCount = 0;
  private workerPool: NodeWorker[] = [];
  private poolSize: number;

  constructor(config?: Partial<SandboxConfig>) {
    this.config = { ...DEFAULT_SANDBOX_CONFIG, ...config };
    this.poolSize = config?.poolSize ?? Math.min(typeof navigator !== 'undefined' ? navigator.hardwareConcurrency ?? 2 : 2, 4);
  }

  getConfig(): SandboxConfig {
    return { ...this.config };
  }

  updateConfig(updates: Partial<SandboxConfig>): void {
    this.config = { ...this.config, ...updates };
  }

  validateParams(params: Record<string, unknown>): { valid: boolean; violations: string[] } {
    const violations: string[] = [];

    const serialized = JSON.stringify(params);
    if (serialized.length > this.config.maxOutputSize) {
      violations.push(`Params size ${serialized.length} exceeds limit ${this.config.maxOutputSize}`);
    }

    for (const key of Object.keys(params)) {
      const value = params[key];
      if (typeof value === 'string') {
        const dangerous = detectDangerousPatterns(value);
        violations.push(...dangerous.map(d => `Param "${key}" ${d}`));

        const refs = extractModuleReferences(value);
        if (!refs.valid) {
          violations.push(`Param "${key}" ${refs.reason}`);
          continue;
        }
        for (const blocked of this.config.blockedModules) {
          if (refs.modules.includes(blocked)) {
            violations.push(`Param "${key}" contains blocked module reference: ${blocked}`);
          }
        }
      }
    }

    return { valid: violations.length === 0, violations };
  }

  private checkPermissions(code: string): string[] {
    const violations: string[] = [];
    const allowed = new Set(this.config.allowedPermissions);

    // 1. 拒绝所有危险模式
    const dangerous = detectDangerousPatterns(code);
    violations.push(...dangerous);

    // 2. 拒绝模板字符串模块引用
    const templateRefs = detectTemplateStringModules(code);
    violations.push(...templateRefs);

    // 3. 拒绝间接模块访问
    const indirect = detectIndirectAccess(code);
    violations.push(...indirect);

    // 4. 拒绝混淆代码
    const obfuscated = detectObfuscation(code);
    violations.push(...obfuscated);

    // 5. 提取模块引用，拒绝动态拼接
    const refs = extractModuleReferences(code);
    if (!refs.valid) {
      violations.push(refs.reason!);
      return violations;
    }

    for (const [perm, modules] of Object.entries(PERMISSION_MODULE_MAP)) {
      if (allowed.has(perm as SandboxPermission)) continue;
      for (const mod of modules) {
        if (refs.modules.includes(mod)) {
          violations.push(`Permission denied: ${perm} (module ${mod})`);
        }
      }
    }

    for (const blocked of this.config.blockedModules) {
      if (refs.modules.includes(blocked)) {
        if (!violations.some(v => v.includes(blocked))) {
          violations.push(`Blocked module: ${blocked}`);
        }
      }
    }

    return violations;
  }

  private estimateMemoryMB(): number {
    try {
      if (typeof performance !== 'undefined' && 'measureUserAgentSpecificMemory' in performance) {
        return 0;
      }
    } catch { logger.warn('Performance API not available for memory estimation', 'SkillSandbox'); }
    const usage = process.memoryUsage?.();
    return usage ? usage.heapUsed / (1024 * 1024) : 0;
  }

  async execute<T>(
    fn: () => T | Promise<T>,
    options?: { timeoutMs?: number },
  ): Promise<SandboxResult> {
    const startTime = Date.now();
    const timeout = options?.timeoutMs ?? this.config.maxExecutionTimeMs;
    this.executionCount++;

    const fnSource = fn.toString();
    const permissionViolations = this.checkPermissions(fnSource);

    if (permissionViolations.length > 0) {
      return {
        success: false,
        error: `Permission violations: ${permissionViolations.join('; ')}`,
        executionTimeMs: Date.now() - startTime,
        memoryUsedMB: 0,
        permissionViolations,
      };
    }

    const memBefore = this.estimateMemoryMB();

    try {
      const result = await Promise.race([
        Promise.resolve(fn()),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error(`Sandbox timeout after ${timeout}ms`)), timeout),
        ),
      ]);

      const executionTimeMs = Date.now() - startTime;
      const memAfter = this.estimateMemoryMB();
      const memoryUsedMB = Math.max(0, memAfter - memBefore);

      const serialized = JSON.stringify(result);
      if (serialized && serialized.length > this.config.maxOutputSize) {
        return {
          success: false,
          error: `Output size ${serialized.length} exceeds limit ${this.config.maxOutputSize}`,
          executionTimeMs,
          memoryUsedMB,
          permissionViolations,
        };
      }

      return {
        success: true,
        output: result,
        executionTimeMs,
        memoryUsedMB: Math.round(memoryUsedMB * 100) / 100,
        permissionViolations,
      };
    } catch (error) {
      const memAfter = this.estimateMemoryMB();
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
        executionTimeMs: Date.now() - startTime,
        memoryUsedMB: Math.round(Math.max(0, memAfter - memBefore) * 100) / 100,
        permissionViolations,
      };
    }
  }

  async executeInWorker<T>(
    fn: () => T | Promise<T>,
    options?: { timeoutMs?: number },
  ): Promise<SandboxResult> {
    const startTime = Date.now();
    const timeout = options?.timeoutMs ?? this.config.maxExecutionTimeMs;
    this.executionCount++;

    const fnSource = fn.toString();
    const permissionViolations = this.checkPermissions(fnSource);

    if (permissionViolations.length > 0) {
      return {
        success: false,
        error: `Permission violations: ${permissionViolations.join('; ')}`,
        executionTimeMs: Date.now() - startTime,
        memoryUsedMB: 0,
        permissionViolations,
      };
    }

    // Worker 池大小上限检查
    if (this.workerPool.length >= (this.config.poolSize ?? 4)) {
      return this.execute(fn, options);
    }

    try {
      const { Worker } = await import('worker_threads');
      const serializedFn = JSON.stringify(fnSource);
      const workerCode = `
        const { parentPort } = require('worker_threads');
        const { runInNewContext } = require('vm');
        const fn = runInNewContext('(' + ${serializedFn} + ')', Object.create(null), { timeout: ${timeout} });
        Promise.resolve(fn())
          .then(result => parentPort.postMessage({ success: true, output: result }))
          .catch(error => parentPort.postMessage({ success: false, error: error.message }));
      `;

      const result = await new Promise<SandboxResult>((resolve, _reject) => {
        const worker = new Worker(workerCode, { eval: true });
        this.workerPool.push(worker);

        // 统一清理函数：移除 + 终止
        const cleanup = () => {
          const idx = this.workerPool.indexOf(worker);
          if (idx > -1) this.workerPool.splice(idx, 1);
          worker.terminate().catch(() => {});
        };

        const timeoutId = setTimeout(() => {
          cleanup();
          resolve({
            success: false,
            error: `Sandbox timeout after ${timeout}ms`,
            executionTimeMs: Date.now() - startTime,
            memoryUsedMB: 0,
            permissionViolations: [],
          });
        }, timeout);

        worker.on('message', (msg) => {
          clearTimeout(timeoutId);
          cleanup();

          const executionTimeMs = Date.now() - startTime;
          if (msg.success) {
            const serialized = JSON.stringify(msg.output);
            if (serialized && serialized.length > this.config.maxOutputSize) {
              resolve({
                success: false,
                error: `Output size ${serialized.length} exceeds limit ${this.config.maxOutputSize}`,
                executionTimeMs, memoryUsedMB: 0, permissionViolations: [],
              });
            } else {
              resolve({
                success: true, output: msg.output,
                executionTimeMs, memoryUsedMB: 0, permissionViolations: [],
              });
            }
          } else {
            resolve({
              success: false, error: msg.error,
              executionTimeMs, memoryUsedMB: 0, permissionViolations: [],
            });
          }
        });

        worker.on('error', (error: unknown) => {
          clearTimeout(timeoutId);
          cleanup();
          resolve({
            success: false,
            error: error instanceof Error ? error.message : String(error),
            executionTimeMs: Date.now() - startTime,
            memoryUsedMB: 0,
            permissionViolations: [],
          });
        });
      });

      return result;
    } catch (error) {
      if (error instanceof Error && error.message.includes('timeout')) {
        return {
          success: false, error: error.message,
          executionTimeMs: Date.now() - startTime, memoryUsedMB: 0, permissionViolations,
        };
      }
      return this.execute(fn, options);
    }
  }

  getExecutionCount(): number {
    return this.executionCount;
  }

  getPoolSize(): number {
    return this.workerPool.length;
  }

  reset(): void {
    this.executionCount = 0;
    for (const worker of this.workerPool) {
      try { worker.terminate(); } catch (e) { logger.warn('Worker terminate failed during reset', 'SkillSandbox', { error: e instanceof Error ? e.message : String(e) }); }
    }
    this.workerPool = [];
  }
}
