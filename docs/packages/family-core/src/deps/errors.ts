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

export class AppError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AppError';
  }
}

export class InternalError extends AppError {
  constructor(message: string, data?: Record<string, unknown>) {
    super(message);
    this.name = 'InternalError';
    if (data) Object.assign(this, data);
  }
}

export class ConflictError extends AppError {
  constructor(message: string) {
    super(message);
    this.name = 'ConflictError';
  }
}

export class TimeoutError extends AppError {
  constructor(message: string, public readonly timeout: number) {
    super(message);
    this.name = 'TimeoutError';
  }
}
