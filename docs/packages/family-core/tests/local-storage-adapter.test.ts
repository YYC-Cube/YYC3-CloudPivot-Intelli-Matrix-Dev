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
import { LocalStorageAdapter } from '../src/storage/LocalStorageAdapter.js';

class MockStorage {
  private store: Map<string, string> = new Map();
  length = 0;

  getItem(key: string): string | null {
    return this.store.get(key) ?? null;
  }
  setItem(key: string, value: string): void {
    this.store.set(key, value);
    this.length = this.store.size;
  }
  removeItem(key: string): void {
    this.store.delete(key);
    this.length = this.store.size;
  }
  key(index: number): string | null {
    const keys = Array.from(this.store.keys());
    return keys[index] ?? null;
  }
  clear(): void {
    this.store.clear();
    this.length = 0;
  }
}

describe('LocalStorageAdapter', () => {
  let adapter: LocalStorageAdapter;
  let mockStorage: MockStorage;

  beforeEach(() => {
    mockStorage = new MockStorage();
    (globalThis as any).localStorage = mockStorage;
    adapter = new LocalStorageAdapter();
  });

  afterEach(() => {
    delete (globalThis as any).localStorage;
  });

  it('should set and get values', async () => {
    await adapter.set('key1', 'value1');
    const result = await adapter.get('key1');
    expect(result).toBe('value1');
  });

  it('should return null for missing keys', async () => {
    const result = await adapter.get('nonexistent');
    expect(result).toBeNull();
  });

  it('should handle object values', async () => {
    const obj = { name: 'test', nested: { deep: true } };
    await adapter.set('obj', obj);
    const result = await adapter.get<typeof obj>('obj');
    expect(result).toEqual(obj);
  });

  it('should handle array values', async () => {
    const arr = [1, 2, 'three', true];
    await adapter.set('arr', arr);
    const result = await adapter.get<typeof arr>('arr');
    expect(result).toEqual(arr);
  });

  it('should check existence', async () => {
    await adapter.set('exists', true);
    expect(await adapter.exists('exists')).toBe(true);
    expect(await adapter.exists('missing')).toBe(false);
  });

  it('should delete keys', async () => {
    await adapter.set('del-me', 'data');
    expect(await adapter.delete('del-me')).toBe(true);
    expect(await adapter.get('del-me')).toBeNull();
    expect(await adapter.delete('nonexistent')).toBe(false);
  });

  it('should list keys', async () => {
    await adapter.set('k1', 'v1');
    await adapter.set('k2', 'v2');
    await adapter.set('k3', 'v3');
    const keys = await adapter.list();
    expect(keys).toHaveLength(3);
    expect(keys.sort()).toEqual(['k1', 'k2', 'k3']);
  });

  it('should clear all keys', async () => {
    await adapter.set('a', 1);
    await adapter.set('b', 2);
    const cleared = await adapter.clear();
    expect(cleared).toBe(2);
    expect(await adapter.get('a')).toBeNull();
    expect(await adapter.get('b')).toBeNull();
  });

  it('should preserve createdAt on update', async () => {
    await adapter.set('preserve', 'v1');
    const before = Date.now();
    await new Promise((r) => setTimeout(r, 5));
    await adapter.set('preserve', 'v2');
    const stats = await adapter.getStats();
    expect(stats.oldestEntry).toBeLessThan(before + 100);
  });

  it('should compute stats', async () => {
    await adapter.set('s1', 'v1');
    await adapter.set('s2', { data: 'v2' });
    const stats = await adapter.getStats();
    expect(stats.totalKeys).toBeGreaterThanOrEqual(2);
    expect(stats.totalSizeBytes).toBeGreaterThan(0);
    expect(stats.oldestEntry).toBeGreaterThan(0);
    expect(stats.newestEntry).toBeGreaterThan(0);
  });

  it('should return empty stats when no storage', async () => {
    delete (globalThis as any).localStorage;
    const noStore = new LocalStorageAdapter();
    const stats = await noStore.getStats();
    expect(stats.totalKeys).toBe(0);
    expect(stats.totalSizeBytes).toBe(0);
  });

  it('should return empty list when no storage', async () => {
    delete (globalThis as any).localStorage;
    const noStore = new LocalStorageAdapter();
    const keys = await noStore.list();
    expect(keys).toHaveLength(0);
  });

  it('should handle clear when no storage', async () => {
    delete (globalThis as any).localStorage;
    const noStore = new LocalStorageAdapter();
    const cleared = await noStore.clear();
    expect(cleared).toBe(0);
  });

  it('should use namespace prefix', async () => {
    const ns = new LocalStorageAdapter('myns');
    await ns.set('ns-key', 'ns-value');
    const val = await ns.get('ns-key');
    expect(val).toBe('ns-value');
  });

  it('should handle null/undefined values gracefully', async () => {
    await adapter.set('null-val', null);
    const result = await adapter.get('null-val');
    expect(result).toBeNull();
  });
});
