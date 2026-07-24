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

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { UserSovereignty } from '../src/sovereignty/UserSovereignty.js';

class MockStorage {
  private store: Map<string, string> = new Map();
  length = 0;
  getItem(key: string): string | null { return this.store.get(key) ?? null; }
  setItem(key: string, value: string): void { this.store.set(key, value); this.length = this.store.size; }
  removeItem(key: string): void { this.store.delete(key); this.length = this.store.size; }
  key(index: number): string | null { const k = Array.from(this.store.keys()); return k[index] ?? null; }
  clear(): void { this.store.clear(); this.length = 0; }
}

describe('UserSovereignty', () => {
  let sovereignty: UserSovereignty;
  let mockLS: MockStorage;

  beforeEach(() => {
    mockLS = new MockStorage();
    (globalThis as any).localStorage = mockLS;
    sovereignty = new UserSovereignty();
  });

  afterEach(() => {
    sovereignty.destroy();
    delete (globalThis as any).localStorage;
  });

  it('should provide access to storage manager', () => {
    expect(sovereignty.getStorageManager()).toBeTruthy();
  });

  it('should provide access to trust guard', () => {
    expect(sovereignty.getTrustGuard()).toBeTruthy();
  });

  it('should enable and disable protection', () => {
    sovereignty.enableProtection();
    expect(sovereignty.getTrustGuard().isEnabled()).toBe(true);
    sovereignty.disableProtection();
    expect(sovereignty.getTrustGuard().isEnabled()).toBe(false);
  });

  it('should export data', async () => {
    await sovereignty.getStorageManager().set('test', 'data');
    const exported = await sovereignty.exportData();
    expect(exported.version).toBe('1.1.0');
    expect(exported.metadata.source).toBe('yyc3-movplug-ai');
    expect(exported.exportedAt).toBeGreaterThan(0);
  });

  it('should reset all data', async () => {
    await sovereignty.getStorageManager().set('will-delete', 'value');
    await sovereignty.resetAll();
    const data = await sovereignty.getStorageManager().get('will-delete');
    expect(data).toBeNull();
  });

  it('should produce sovereignty report', async () => {
    await sovereignty.getStorageManager().set('report-key', 'val');
    const report = await sovereignty.getReport();
    expect(report.storageKeys).toBeGreaterThanOrEqual(1);
    expect(report.trustGuardEnabled).toBe(false);
    expect(report.trustViolations).toBe(0);
  });

  it('should track last export and reset times', async () => {
    const report0 = await sovereignty.getReport();
    expect(report0.lastExportAt).toBeNull();
    expect(report0.lastResetAt).toBeNull();

    await sovereignty.exportData();
    const report1 = await sovereignty.getReport();
    expect(report1.lastExportAt).toBeGreaterThan(0);

    await sovereignty.resetAll();
    const report2 = await sovereignty.getReport();
    expect(report2.lastResetAt).toBeGreaterThan(0);
  });

  it('should delete specific keys', async () => {
    await sovereignty.getStorageManager().set('del-me', 'value');
    const result = await sovereignty.deleteKey('del-me');
    expect(result).toBe(true);
    const data = await sovereignty.getStorageManager().get('del-me');
    expect(data).toBeNull();
  });

  it('should destroy cleanly', () => {
    sovereignty.destroy();
    expect(sovereignty.getTrustGuard().isEnabled()).toBe(false);
  });
});
