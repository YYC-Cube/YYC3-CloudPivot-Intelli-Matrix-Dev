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
import { AppError, InternalError, ConflictError, TimeoutError } from '../src/deps/errors';

describe('AppError', () => {
  it('should create basic app error', () => {
    const err = new AppError('Something went wrong');
    expect(err.message).toBe('Something went wrong');
    expect(err.name).toBe('AppError');
    expect(err).toBeInstanceOf(Error);
  });
});

describe('InternalError', () => {
  it('should create internal error with data', () => {
    const err = new InternalError('Internal failure', { code: 500, detail: 'db error' });
    expect(err.message).toBe('Internal failure');
    expect(err.name).toBe('InternalError');
    expect((err as any).code).toBe(500);
    expect((err as any).detail).toBe('db error');
  });

  it('should create internal error without data', () => {
    const err = new InternalError('Simple error');
    expect(err.message).toBe('Simple error');
  });
});

describe('ConflictError', () => {
  it('should create conflict error', () => {
    const err = new ConflictError('Resource already exists');
    expect(err.message).toBe('Resource already exists');
    expect(err.name).toBe('ConflictError');
  });
});

describe('TimeoutError', () => {
  it('should create timeout error with timeout value', () => {
    const err = new TimeoutError('Operation timed out', 5000);
    expect(err.message).toBe('Operation timed out');
    expect(err.name).toBe('TimeoutError');
    expect(err.timeout).toBe(5000);
  });
});
