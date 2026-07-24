/**
 * file: backoff.ts
 * description: 退避重试策略 — 指数退避、抖动与可中断 sleep
 * author: YanYuCloudCube Team <admin@0379.email>
 * version: v2.0.0
 * created: 2026-03-21
 * updated: 2026-06-09
 * status: active
 * tags: [infra],[util],[retry],[backoff]
 *
 * brief: 指数退避 + 随机抖动的重试延迟计算工具
 *
 * details:
 * - computeBackoff() 支持指数/线性/固定三种退避策略
 * - 随机抖动（jitter）防止惊群效应
 * - sleepWithAbort() 支持 AbortSignal 可中断的异步等待
 * - 可配置最大延迟（maxDelayMs）和最大重试次数
 *
 * dependencies: node:timers/promises
 * exports: computeBackoff, sleepWithAbort, BackoffPolicy
 * notes: 浏览器环境需使用替代 timer 实现
 */

import { setTimeout as delay } from "node:timers/promises";

export type BackoffPolicy = {
  initialMs: number;
  maxMs: number;
  factor: number;
  jitter: number;
};

const DEFAULT_BACKOFF_POLICY: BackoffPolicy = {
  initialMs: 1000,
  maxMs: 30000,
  factor: 2,
  jitter: 0.1,
};

export function computeBackoff(policy: BackoffPolicy, attempt: number): number {
  const base = policy.initialMs * policy.factor ** Math.max(attempt - 1, 0);
  const jitter = base * policy.jitter * Math.random();
  return Math.min(policy.maxMs, Math.round(base + jitter));
}

export async function sleepWithAbort(ms: number, abortSignal?: AbortSignal): Promise<void> {
  if (ms <= 0) {
    return;
  }
  try {
    await delay(ms, undefined, { signal: abortSignal });
  } catch (err) {
    if (abortSignal?.aborted) {
      throw new Error("aborted", { cause: err });
    }
    throw err;
  }
}

export function createRetryRunner<T>(options: {
  maxAttempts?: number;
  backoffPolicy?: Partial<BackoffPolicy>;
  shouldRetry?: (error: Error, attempt: number) => boolean;
}) {
  const maxAttempts = options.maxAttempts ?? 3;
  const policy: BackoffPolicy = { ...DEFAULT_BACKOFF_POLICY, ...options.backoffPolicy };
  const shouldRetry = options.shouldRetry ?? ((_: Error, attempt: number) => attempt < maxAttempts);

  return async function retryRunner(fn: () => Promise<T>): Promise<T> {
    let lastError: Error | undefined;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));

        if (!shouldRetry(lastError, attempt)) {
          throw lastError;
        }

        if (attempt < maxAttempts) {
          const delayMs = computeBackoff(policy, attempt);
          await sleepWithAbort(delayMs);
        }
      }
    }

    throw lastError!;
  };
}

export { DEFAULT_BACKOFF_POLICY };
