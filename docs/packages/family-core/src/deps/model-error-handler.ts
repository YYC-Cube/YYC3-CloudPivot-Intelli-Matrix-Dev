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
 * @file model-error-handler.ts
 * @description 模型调用错误处理工具 — 统一错误分类 + 重试 + fallback 逻辑
 *              替代各 Adapter 中零散的 try-catch 和重试代码
 */

import { logger } from './logger.js';
import { ErrorCategory, ErrorHandler } from './error-handler.js';

// ═══ 共享 ErrorHandler 实例 ═══
const globalErrorHandler = new ErrorHandler({ enableAutoRecovery: true });

export function getGlobalErrorHandler(): ErrorHandler {
  return globalErrorHandler;
}

// ═══ 可重试错误类型 ═══

export enum ModelErrorType {
  RATE_LIMIT = 'rate_limit',
  TIMEOUT = 'timeout',
  AUTH = 'auth',
  SERVER_ERROR = 'server_error',
  NETWORK = 'network',
  BAD_REQUEST = 'bad_request',
  UNKNOWN = 'unknown',
}

/** 判断错误类型 */
export function classifyModelError(error: unknown): ModelErrorType {
  const msg = error instanceof Error ? error.message.toLowerCase() : String(error).toLowerCase();

  if (msg.includes('rate limit') || msg.includes('429') || msg.includes('too many requests')) {
    return ModelErrorType.RATE_LIMIT;
  }
  if (msg.includes('timeout') || msg.includes('timed out')) {
    return ModelErrorType.TIMEOUT;
  }
  if (msg.includes('auth') || msg.includes('api key') || msg.includes('401') || msg.includes('403')) {
    return ModelErrorType.AUTH;
  }
  if (msg.includes('5') && (msg.includes('00') || msg.includes('02') || msg.includes('03'))) {
    return ModelErrorType.SERVER_ERROR;
  }
  if (msg.includes('econnrefused') || msg.includes('econnreset') || msg.includes('enotfound') || msg.includes('network')) {
    return ModelErrorType.NETWORK;
  }
  if (msg.includes('400') || msg.includes('422') || msg.includes('invalid')) {
    return ModelErrorType.BAD_REQUEST;
  }

  // 判断 HTTP 状态码
  if (error && typeof error === 'object' && 'status' in error) {
    const status = (error as { status: number }).status;
    if (status === 429) return ModelErrorType.RATE_LIMIT;
    if (status === 401 || status === 403) return ModelErrorType.AUTH;
    if (status >= 500) return ModelErrorType.SERVER_ERROR;
    if (status >= 400) return ModelErrorType.BAD_REQUEST;
  }

  return ModelErrorType.UNKNOWN;
}

/** 判断错误是否可重试 */
export function isRetryable(error: unknown): boolean {
  const type = classifyModelError(error);
  return type === ModelErrorType.RATE_LIMIT
    || type === ModelErrorType.TIMEOUT
    || type === ModelErrorType.SERVER_ERROR
    || type === ModelErrorType.NETWORK;
}

/** 获取推荐重试延迟（ms）— 速率限制退避更长 */
export function getRetryDelay(error: unknown, attempt: number): number {
  const type = classifyModelError(error);
  const base = type === ModelErrorType.RATE_LIMIT ? 2000 : 500;
  return base * Math.pow(2, attempt);
}

// ═══ 错误上下文构建 ═══

export interface ModelErrorContext {
  provider: string;
  model: string;
  attempt: number;
  type: ModelErrorType;
  durationMs?: number;
}

/**
 * 记录模型调用错误并通过 ErrorHandler 上报
 */
export function reportModelError(
  error: unknown,
  ctx: ModelErrorContext,
): void {
  const err = error instanceof Error ? error : new Error(String(error));

  const errorCategory = ctx.type === ModelErrorType.AUTH
    ? ErrorCategory.SECURITY
    : ctx.type === ModelErrorType.TIMEOUT
      ? ErrorCategory.TIMEOUT
      : ctx.type === ModelErrorType.NETWORK
        ? ErrorCategory.NETWORK
        : ErrorCategory.API;

  globalErrorHandler.emitError(errorCategory, err, {
    provider: ctx.provider,
    model: ctx.model,
    attempt: ctx.attempt,
    errorType: ctx.type,
    durationMs: ctx.durationMs,
  });

  logger.error(`[${ctx.provider}] 模型调用失败: ${err.message}`, 'ModelErrorHandler', {
    provider: ctx.provider,
    model: ctx.model,
    attempt: ctx.attempt,
    type: ctx.type,
  });
}

/**
 * 带重试的模型调用包装器
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  ctx: Omit<ModelErrorContext, 'attempt' | 'type' | 'durationMs'> & { maxRetries?: number },
): Promise<T> {
  const maxRetries = ctx.maxRetries ?? 3;
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    const start = Date.now();
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      const durationMs = Date.now() - start;
      const errorType = classifyModelError(error);

      reportModelError(error, { ...ctx, attempt, type: errorType, durationMs });

      if (attempt >= maxRetries || !isRetryable(error)) {
        throw lastError;
      }

      const delay = getRetryDelay(error, attempt);
      logger.warn(`重试 [${attempt + 1}/${maxRetries}]`, 'ModelErrorHandler', {
        provider: ctx.provider,
        model: ctx.model,
        delay,
        errorType,
      });
      await new Promise(r => setTimeout(r, delay));
    }
  }

  throw lastError ?? new Error('Unknown model error');
}
