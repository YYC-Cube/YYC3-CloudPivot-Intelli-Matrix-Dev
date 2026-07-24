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

export interface RateLimitEntry {
  count: number;
  resetAt: number;
}

export interface RateLimiterConfig {
  maxRequests: number;
  windowMs: number;
  blockDurationMs: number;
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;
  retryAfterMs?: number;
}

export class RateLimiter {
  private entries: Map<string, RateLimitEntry> = new Map();
  private configs: Map<string, RateLimiterConfig> = new Map();
  private defaultConfig: RateLimiterConfig;

  constructor(defaultConfig?: Partial<RateLimiterConfig>) {
    this.defaultConfig = {
      maxRequests: defaultConfig?.maxRequests ?? 100,
      windowMs: defaultConfig?.windowMs ?? 60_000,
      blockDurationMs: defaultConfig?.blockDurationMs ?? 5_000,
    };
  }

  setConfig(key: string, config: Partial<RateLimiterConfig>): void {
    this.configs.set(key, {
      maxRequests: config.maxRequests ?? this.defaultConfig.maxRequests,
      windowMs: config.windowMs ?? this.defaultConfig.windowMs,
      blockDurationMs: config.blockDurationMs ?? this.defaultConfig.blockDurationMs,
    });
  }

  check(key: string): RateLimitResult {
    const config = this.configs.get(key) ?? this.defaultConfig;
    const now = Date.now();
    let entry = this.entries.get(key);

    if (!entry || now >= entry.resetAt) {
      entry = { count: 0, resetAt: now + config.windowMs };
      this.entries.set(key, entry);
    }

    if (entry.count >= config.maxRequests) {
      return {
        allowed: false,
        remaining: 0,
        resetAt: entry.resetAt,
        retryAfterMs: entry.resetAt - now + config.blockDurationMs,
      };
    }

    entry.count++;
    return {
      allowed: true,
      remaining: config.maxRequests - entry.count,
      resetAt: entry.resetAt,
    };
  }

  reset(key: string): void {
    this.entries.delete(key);
  }

  getRemaining(key: string): number {
    const config = this.configs.get(key) ?? this.defaultConfig;
    const entry = this.entries.get(key);
    if (!entry) return config.maxRequests;
    return Math.max(0, config.maxRequests - entry.count);
  }

  cleanup(): number {
    const now = Date.now();
    let removed = 0;
    for (const [key, entry] of this.entries) {
      if (now >= entry.resetAt) {
        this.entries.delete(key);
        removed++;
      }
    }
    return removed;
  }
}
