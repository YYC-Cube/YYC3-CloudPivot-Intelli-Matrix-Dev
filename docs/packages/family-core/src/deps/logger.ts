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

/* eslint-disable no-console */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

const LOG_LEVELS: Record<LogLevel, number> = { debug: 0, info: 1, warn: 2, error: 3 };

class Logger {
  private level: LogLevel;
  private useJson: boolean;

  constructor() {
    // 从环境变量读取配置
    const envLevel = typeof process !== 'undefined' ? (process.env.LOG_LEVEL ?? 'info') : 'info';
    this.level = envLevel in LOG_LEVELS ? (envLevel as LogLevel) : 'info';
    this.useJson = typeof process !== 'undefined' && process.env.LOG_FORMAT === 'json';
  }

  private log(level: LogLevel, message: string, module: string, data?: Record<string, unknown>, error?: Error): void {
    if (LOG_LEVELS[level] < LOG_LEVELS[this.level]) return; // 级别过滤

    const timestamp = new Date().toISOString();

    if (this.useJson) {
      // JSON 格式输出（适合生产环境集中式日志）
      const entry: Record<string, unknown> = {
        timestamp, level, module, message, ...(data ?? {}),
      };
      if (error) {
        entry.error = error.message;
        entry.stack = error.stack;
      }
      const output = JSON.stringify(entry);
      if (level === 'error') {
        console.error(output);
      } else {
        console.log(output);
      }
    } else {
      // 可读格式输出（适合开发环境）
      const prefix = `[${timestamp}] [${level.toUpperCase()}] [${module}]`;
      if (error) {
        console.error(prefix, message, data ?? '', error.stack ?? error.message);
      } else if (level === 'error') {
        console.error(prefix, message, data ?? '');
      } else {
        console.log(prefix, message, data ?? '');
      }
    }
  }

  setLevel(level: LogLevel): void {
    this.level = level;
  }

  setJsonMode(enabled: boolean): void {
    this.useJson = enabled;
  }

  info(message: string, module: string, data?: Record<string, unknown>): void {
    this.log('info', message, module, data);
  }

  warn(message: string, module: string, data?: Record<string, unknown>): void {
    this.log('warn', message, module, data);
  }

  error(message: string, module: string, data?: Record<string, unknown>, error?: Error): void {
    this.log('error', message, module, data, error);
  }

  debug(message: string, module: string, data?: Record<string, unknown>): void {
    this.log('debug', message, module, data);
  }
}

export const logger = new Logger();
