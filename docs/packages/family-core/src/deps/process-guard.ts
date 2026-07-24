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
 * @file process-guard.ts
 * @description 全局进程保护 — 捕获 unhandledRejection 和 uncaughtException
 *              防止 Node.js 进程在未捕获的 Promise 拒绝时崩溃
 */

import { logger } from './logger.js';
import { ErrorCategory } from './error-handler.js';
import { ErrorHandler } from './error-handler.js';

export interface ProcessGuardConfig {
  /** 是否在未捕获异常时退出进程（默认 true） */
  exitOnUncaught?: boolean;
  /** 退出码 */
  exitCode?: number;
  /** 自定义错误处理器（可选） */
  errorHandler?: ErrorHandler;
}

const DEFAULT_CONFIG: Required<ProcessGuardConfig> = {
  exitOnUncaught: true,
  exitCode: 1,
  errorHandler: new ErrorHandler(),
};

/** 安装全局进程保护 */
export function installProcessGuard(config?: ProcessGuardConfig): () => void {
  const cfg: Required<ProcessGuardConfig> = { ...DEFAULT_CONFIG, ...config };

  const unhandledHandler = (reason: unknown, promise: Promise<unknown>) => {
    const error = reason instanceof Error ? reason : new Error(String(reason));
    logger.error(`未捕获的 Promise 拒绝: ${error.message}`, 'ProcessGuard', {
      stack: error.stack,
      promise,
    });
    cfg.errorHandler.emitError(ErrorCategory.INTERNAL, error, {
      type: 'unhandledRejection',
      promise: String(promise),
    });
  };

  const uncaughtHandler = (error: Error) => {
    logger.error(`未捕获的异常: ${error.message}`, 'ProcessGuard', {
      stack: error.stack,
    });
    cfg.errorHandler.emitError(ErrorCategory.INTERNAL, error, {
      type: 'uncaughtException',
    });

    // 给日志一点时间写入
    if (cfg.exitOnUncaught) {
      setTimeout(() => process.exit(cfg.exitCode), 500);
    }
  };

  process.on('unhandledRejection', unhandledHandler);
  process.on('uncaughtException', uncaughtHandler);

  logger.info('进程保护已安装', 'ProcessGuard', {
    exitOnUncaught: cfg.exitOnUncaught,
  });

  // 返回卸载函数
  return () => {
    process.off('unhandledRejection', unhandledHandler);
    process.off('uncaughtException', uncaughtHandler);
    logger.info('进程保护已卸载', 'ProcessGuard');
  };
}
