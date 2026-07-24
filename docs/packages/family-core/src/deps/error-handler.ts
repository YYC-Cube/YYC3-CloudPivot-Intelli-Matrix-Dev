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

/**
 * @file error-handler.ts
 * @description 生产级错误处理与恢复 — ErrorHandler + ErrorBoundary
 *              ErrorHandler: 错误事件总线，支持分类、统计和自动恢复
 *              ErrorBoundary: 重试/回退/熔断逻辑
 */

import EventEmitter from 'eventemitter3';
import { InternalError, ConflictError, TimeoutError } from './errors.js';
import { logger } from './logger.js';

export { InternalError, ConflictError, TimeoutError };

/** 扩展的 InternalError（带附加数据） */
export class InternalErrorExtended extends Error {
  constructor(message: string, data?: Record<string, unknown>) {
    super(message);
    this.name = 'InternalError';
    if (data) Object.assign(this, data);
  }
}

// ═══ 错误分类 ═══

export enum ErrorCategory {
  NETWORK      = 'network',
  API          = 'api',
  VALIDATION   = 'validation',
  TIMEOUT      = 'timeout',
  INTERNAL     = 'internal',
  SECURITY     = 'security',
  RESOURCE     = 'resource',
  UNKNOWN      = 'unknown',
}

export interface ErrorEvent {
  id: string;
  category: ErrorCategory;
  timestamp: number;
  error: Error;
  context?: Record<string, unknown>;
  recovered?: boolean;
  retryCount?: number;
}

// ═══ ErrorHandler — 错误事件总线 ═══

export interface ErrorHandlerConfig {
  enableAutoRecovery?: boolean;
  /** 错误采样率（0-1），1=记录所有 */
  sampleRate?: number;
  /** 相同错误去重窗口（ms） */
  dedupWindow?: number;
}

const DEFAULT_HANDLER_CONFIG: Required<ErrorHandlerConfig> = {
  enableAutoRecovery: true,
  sampleRate: 1,
  dedupWindow: 5_000,
};

export class ErrorHandler extends EventEmitter {
  private config: Required<ErrorHandlerConfig>;
  private errorCounts: Map<string, number> = new Map();
  private lastErrors: Map<string, number> = new Map(); // error msg hash -> timestamp
  private totalErrors = 0;

  constructor(config?: ErrorHandlerConfig) {
    super();
    this.config = { ...DEFAULT_HANDLER_CONFIG, ...config };

    // 自动恢复处理器：监听 error 事件尝试恢复
    if (this.config.enableAutoRecovery) {
      this.on('error', this.autoRecover.bind(this));
    }
  }

  /** 注册错误监听器 */
  override on(event: string | symbol, listener: (...args: any[]) => void): this {
    return super.on(event, listener);
  }

  /**
   * 上报错误 — 核心入口
   */
  emitError(category: ErrorCategory, error: Error, context?: Record<string, unknown>): ErrorEvent {
    this.totalErrors++;

    // 去重检测
    const key = this.getErrorKey(error, category);
    const lastTime = this.lastErrors.get(key) ?? 0;
    const now = Date.now();

    if (now - lastTime < this.config.dedupWindow) {
      // 同类型错误在窗口期内，仅递增计数
      this.errorCounts.set(key, (this.errorCounts.get(key) ?? 0) + 1);
      this.lastErrors.set(key, now);
      return { id: key, category, timestamp: now, error, context };
    }

    this.errorCounts.set(key, (this.errorCounts.get(key) ?? 0) + 1);
    this.lastErrors.set(key, now);

    const errorEvent: ErrorEvent = {
      id: key,
      category,
      timestamp: now,
      error,
      context,
      retryCount: this.errorCounts.get(key),
    };

    // 采样
    if (Math.random() < this.config.sampleRate) {
      const level = category === ErrorCategory.INTERNAL || category === ErrorCategory.SECURITY ? 'error' : 'warn';
      logger[level](`[${category}] ${error.message}`, 'ErrorHandler', { errorId: key, context });
    }

    // 触发事件
    this.emit('error', errorEvent);
    return errorEvent;
  }

  /** 获取错误统计 */
  getStats() {
    return {
      totalErrors: this.totalErrors,
      uniqueErrors: this.errorCounts.size,
      errors: Array.from(this.errorCounts.entries()).map(([k, v]) => ({ key: k, count: v })),
    };
  }

  /** 重置统计 */
  resetStats(): void {
    this.errorCounts.clear();
    this.lastErrors.clear();
    this.totalErrors = 0;
  }

  /** 自动恢复 — 尝试从错误中恢复 */
  private async autoRecover(event: ErrorEvent): Promise<void> {
    if (event.category === ErrorCategory.NETWORK || event.category === ErrorCategory.TIMEOUT) {
      // 网络/超时类错误可恢复：通知监听器
      this.emit('recovery', { ...event, recovered: true });
    }
  }

  private getErrorKey(error: Error, category: string): string {
    return `${category}:${error.message.substring(0, 80)}`;
  }

  /** 清理资源 */
  dispose(): void {
    this.errorCounts.clear();
    this.lastErrors.clear();
    this.removeAllListeners();
  }
}

// ═══ ErrorBoundary — 重试 + 熔断 + 回退 ═══

export interface ErrorBoundaryConfig {
  enableRecovery: boolean;
  maxRetries: number;
  retryDelay: number;
  /** 指数退避系数 */
  backoffFactor?: number;
}

const DEFAULT_BOUNDARY_CONFIG: Required<ErrorBoundaryConfig> = {
  enableRecovery: true,
  maxRetries: 3,
  retryDelay: 1_000,
  backoffFactor: 2,
};

export class ErrorBoundary extends EventEmitter {
  private handler: ErrorHandler;
  private config: Required<ErrorBoundaryConfig>;
  private circuitState: 'closed' | 'open' | 'half_open' = 'closed';
  private failureCount = 0;
  private lastFailureTime = 0;
  /** 熔断阈值：连续失败次数 */
  private circuitThreshold = 5;
  /** 熔断重置时间（ms） */
  private circuitResetTimeout = 30_000;

  constructor(handler: ErrorHandler, config: ErrorBoundaryConfig) {
    super();
    this.handler = handler;
    this.config = { ...DEFAULT_BOUNDARY_CONFIG, ...config };
  }

  /** 注册事件监听器 */
  override on(event: string | symbol, listener: (...args: any[]) => void): this {
    return super.on(event, listener);
  }

  /**
   * 尝试执行异步操作，自动重试 + 熔断
   */
  async try<T>(
    fn: () => Promise<T>,
    context?: Record<string, unknown>,
  ): Promise<{ success: true; data: T } | { success: false; error: ErrorEvent }> {
    // 熔断检查
    if (this.circuitState === 'open') {
      const elapsed = Date.now() - this.lastFailureTime;
      if (elapsed > this.circuitResetTimeout) {
        this.circuitState = 'half_open';
        logger.info('熔断器半开，允许试探请求', 'ErrorBoundary', { context });
      } else {
        const error = new Error('Circuit breaker is OPEN');
        return {
          success: false,
          error: this.handler.emitError(ErrorCategory.RESOURCE, error, {
            ...context,
            circuitState: 'open',
          }),
        };
      }
    }

    let lastError: Error | null = null;
    const maxRetries = this.config.enableRecovery ? this.config.maxRetries : 0;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const result = await fn();
        // 成功时重置熔断
        if (this.circuitState !== 'closed') {
          this.circuitState = 'closed';
          this.failureCount = 0;
          logger.info('熔断器已关闭', 'ErrorBoundary');
        }
        if (attempt > 0) {
          this.emit('recovery', {
            id: `recovery-${Date.now()}`,
            category: ErrorCategory.UNKNOWN,
            timestamp: Date.now(),
            error: lastError!,
            context,
            recovered: true,
            retryCount: attempt,
          });
        }
        return { success: true, data: result };
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));

        this.failureCount++;
        this.lastFailureTime = Date.now();

        // 熔断阈值检查
        if (this.failureCount >= this.circuitThreshold) {
          this.circuitState = 'open';
          logger.error('熔断器已打开', 'ErrorBoundary', {
            failureCount: this.failureCount,
            context,
          });
        }

        const event = this.handler.emitError(ErrorCategory.INTERNAL, lastError, {
          ...context,
          attempt,
          maxRetries,
          circuitState: this.circuitState,
        });

        this.emit('error', event);

        // 最后一次尝试失败，不重试
        if (attempt >= maxRetries) {
          return { success: false, error: event };
        }

        // 指数退避等待
        const delay = this.config.retryDelay * Math.pow(this.config.backoffFactor, attempt);
        await new Promise(r => setTimeout(r, delay));
      }
    }

    // 不应到达这里
    const err = lastError ?? new Error('Unknown error');
    return {
      success: false,
      error: this.handler.emitError(ErrorCategory.UNKNOWN, err, context),
    };
  }

  /** 获取熔断状态 */
  getCircuitState(): 'closed' | 'open' | 'half_open' {
    return this.circuitState;
  }

  /** 清理资源 */
  dispose(): void {
    this.handler.dispose();
    this.removeAllListeners();
  }
}
