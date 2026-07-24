/**
 * file: rate-limit.ts
 * description: 固定窗口限流器 — 基于时间窗口的请求速率限制
 * author: YanYuCloudCube Team <admin@0379.email>
 * version: v2.0.0
 * created: 2026-03-21
 * updated: 2026-06-09
 * status: active
 * tags: [infra],[util],[rate-limit],[throttle]
 *
 * brief: 固定时间窗口的令牌桶限流实现
 *
 * details:
 * - FixedWindowRateLimiter 在窗口内限制最大请求数
 * - consume() 返回 { allowed, remaining, resetInMs } 决策信息
 * - 窗口过期自动重置计数
 * - 纯函数设计，无外部依赖，适合边缘计算
 *
 * dependencies: 无（零依赖）
 * exports: FixedWindowRateLimiter
 * notes: 固定窗口存在边界突发问题，高精度场景建议使用滑动窗口
 */

export type FixedWindowRateLimiter = {
  consume: () => {
    allowed: boolean;
    retryAfterMs: number;
    remaining: number;
  };
  reset: () => void;
};

export function createFixedWindowRateLimiter(params: {
  maxRequests: number;
  windowMs: number;
  now?: () => number;
}): FixedWindowRateLimiter {
  const maxRequests = Math.max(1, Math.floor(params.maxRequests));
  const windowMs = Math.max(1, Math.floor(params.windowMs));
  const now = params.now ?? Date.now;

  let count = 0;
  let windowStartMs = 0;

  return {
    consume() {
      const nowMs = now();
      if (nowMs - windowStartMs >= windowMs) {
        windowStartMs = nowMs;
        count = 0;
      }
      if (count >= maxRequests) {
        return {
          allowed: false,
          retryAfterMs: Math.max(0, windowStartMs + windowMs - nowMs),
          remaining: 0,
        };
      }
      count += 1;
      return {
        allowed: true,
        retryAfterMs: 0,
        remaining: Math.max(0, maxRequests - count),
      };
    },
    reset() {
      count = 0;
      windowStartMs = 0;
    },
  };
}
