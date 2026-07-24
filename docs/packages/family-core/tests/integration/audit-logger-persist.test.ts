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
 * @file audit-logger-persist.test.ts
 * @description AuditLogger 文件持久化集成测试
 */

import { describe, it, expect, afterEach } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';
import * as os from 'node:os';
import { AuditLogger } from '../../src/security/AuditLogger.js';

const TEST_DIR = path.join(os.tmpdir(), 'yyc3-audit-test');
const TEST_FILE = path.join(TEST_DIR, 'audit.jsonl');

describe('AuditLogger Persistence', () => {
  afterEach(() => {
    try { fs.rmSync(TEST_DIR, { recursive: true, force: true }); } catch { /* ignore */ }
  });

  it('should persist entries to file', () => {
    const logger = new AuditLogger({ persistPath: TEST_FILE, autoFlush: false });
    logger.info('system', 'test', 'tester', { details: { key: 'val' } });
    logger.warn('security', 'login-failed', 'user1');
    // 手动刷新到文件
    logger.flush();

    expect(fs.existsSync(TEST_FILE)).toBe(true);
    const content = fs.readFileSync(TEST_FILE, 'utf-8');
    const lines = content.split('\n').filter(Boolean);
    expect(lines).toHaveLength(2);

    const parsed = lines.map(l => JSON.parse(l));
    expect(parsed[0].action).toBe('test');
    expect(parsed[1].level).toBe('warn');
    logger.dispose();
  });

  it('should recover entries from file', () => {
    // 先写入
    const writer = new AuditLogger({ persistPath: TEST_FILE, autoFlush: false });
    writer.info('system', 'op1', 'admin');
    writer.error('auth', 'op2', 'bot');
    writer.flush();
    writer.dispose();

    // 从文件恢复
    const reader = new AuditLogger({ persistPath: TEST_FILE, autoFlush: false });
    expect(reader.exportAll()).toHaveLength(2);
    expect(reader.exportAll()[0].action).toBe('op1');
    reader.dispose();
  });

  it('should auto-flush on interval', async () => {
    const logger = new AuditLogger({ persistPath: TEST_FILE, autoFlush: true, flushInterval: 50 });
    logger.info('system', 'auto-flush', 'test');

    await new Promise(r => setTimeout(r, 150));

    expect(fs.existsSync(TEST_FILE)).toBe(true);
    const content = fs.readFileSync(TEST_FILE, 'utf-8');
    expect(content).toContain('auto-flush');
    logger.dispose();
  });
});
