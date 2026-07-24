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

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { logger } from '../src/deps/logger';

describe('Logger', () => {
  let consoleLogSpy: ReturnType<typeof vi.spyOn>;
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
    consoleErrorSpy.mockRestore();
  });

  it('should log info messages', () => {
    logger.info('System started', 'TestModule', { version: '1.0' });
    expect(consoleLogSpy).toHaveBeenCalledTimes(1);
    const call = consoleLogSpy.mock.calls[0];
    expect(call[0]).toContain('[INFO]');
    expect(call[0]).toContain('[TestModule]');
    expect(call[1]).toBe('System started');
    expect(call[2]).toEqual({ version: '1.0' });
  });

  it('should log info without data', () => {
    logger.info('Simple message', 'Core');
    expect(consoleLogSpy).toHaveBeenCalledTimes(1);
    expect(consoleLogSpy.mock.calls[0][1]).toBe('Simple message');
  });

  it('should log warn messages', () => {
    logger.warn('Warning: resource low', 'Monitor', { cpu: 90 });
    expect(consoleLogSpy).toHaveBeenCalledTimes(1);
    expect(consoleLogSpy.mock.calls[0][0]).toContain('[WARN]');
    expect(consoleLogSpy.mock.calls[0][0]).toContain('[Monitor]');
    expect(consoleLogSpy.mock.calls[0][1]).toContain('Warning');
  });

  it('should log error messages to console.error', () => {
    logger.error('Something failed', 'Engine', { attempt: 3 });
    expect(consoleErrorSpy).toHaveBeenCalledTimes(1);
    expect(consoleErrorSpy.mock.calls[0][0]).toContain('[ERROR]');
    expect(consoleErrorSpy.mock.calls[0][0]).toContain('[Engine]');
    expect(consoleErrorSpy.mock.calls[0][1]).toBe('Something failed');
  });

  it('should log error with Error object', () => {
    const error = new Error('Connection lost');
    logger.error('Network error', 'Network', { retry: 2 }, error);
    expect(consoleErrorSpy).toHaveBeenCalledTimes(1);
    expect(consoleErrorSpy.mock.calls[0][0]).toContain('[ERROR]');
    expect(consoleErrorSpy.mock.calls[0][1]).toBe('Network error');
    // args[3] is error stack string, should contain the message
    expect(consoleErrorSpy.mock.calls[0][3]).toContain('Connection lost');
  });

  it('should log debug messages', () => {
    // debug 级别默认被过滤，需要临时启用
    logger.setLevel('debug');
    logger.debug('Debug info', 'Debugger', { detail: 'xyz' });
    expect(consoleLogSpy).toHaveBeenCalledTimes(1);
    expect(consoleLogSpy.mock.calls[0][0]).toContain('[DEBUG]');
    expect(consoleLogSpy.mock.calls[0][1]).toBe('Debug info');
    logger.setLevel('info');
  });

  it('should include ISO timestamp in log output', () => {
    logger.info('Timed', 'Test');
    const log = consoleLogSpy.mock.calls[0][0] as string;
    // Extract timestamp between brackets
    const match = log.match(/\[(.*?)\]/);
    expect(match).not.toBeNull();
    const timestamp = new Date(match![1]);
    expect(timestamp.getTime()).not.toBeNaN();
  });
});
