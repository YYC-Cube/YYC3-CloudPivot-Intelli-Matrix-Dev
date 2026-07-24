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
import { StorageManager } from '../src/storage/StorageManager.js';
import type { ExportData } from '../src/storage/types.js';

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

describe('StorageManager', () => {
  let storage: StorageManager;
  let mockLS: MockStorage;

  beforeEach(() => {
    mockLS = new MockStorage();
    (globalThis as any).localStorage = mockLS;
    storage = new StorageManager({ defaultNamespace: 'test' });
  });

  afterEach(() => {
    delete (globalThis as any).localStorage;
  });

  it('should set and get values', async () => {
    await storage.set('key1', 'value1');
    const result = await storage.get('key1');
    expect(result).toBe('value1');
  });

  it('should return null for missing keys', async () => {
    const result = await storage.get('nonexistent');
    expect(result).toBeNull();
  });

  it('should check existence', async () => {
    await storage.set('exists', true);
    expect(await storage.exists('exists')).toBe(true);
    expect(await storage.exists('missing')).toBe(false);
  });

  it('should delete keys', async () => {
    await storage.set('to-delete', 'data');
    expect(await storage.delete('to-delete')).toBe(true);
    expect(await storage.get('to-delete')).toBeNull();
    expect(await storage.delete('nonexistent')).toBe(false);
  });

  it('should handle object values', async () => {
    const obj = { name: 'test', nested: { deep: true } };
    await storage.set('obj', obj);
    const result = await storage.get<typeof obj>('obj');
    expect(result).toEqual(obj);
  });

  it('should handle array values', async () => {
    const arr = [1, 2, 3, 'four'];
    await storage.set('arr', arr);
    const result = await storage.get<typeof arr>('arr');
    expect(result).toEqual(arr);
  });

  it('should list keys', async () => {
    await storage.set('k1', 'v1');
    await storage.set('k2', 'v2');
    await storage.set('k3', 'v3');
    const keys = await storage.list();
    expect(keys).toHaveLength(3);
    expect(keys.sort()).toEqual(['k1', 'k2', 'k3']);
  });

  it('should clear all keys', async () => {
    await storage.set('a', 1);
    await storage.set('b', 2);
    const { local } = await storage.clearAll();
    expect(local).toBe(2);
    expect(await storage.get('a')).toBeNull();
    expect(await storage.get('b')).toBeNull();
  });

  it('should export all data', async () => {
    await storage.set('exp1', 'val1');
    await storage.set('exp2', { nested: true });
    const exported = await storage.exportAll();
    expect(exported.version).toBe('1.1.0');
    expect(exported.metadata.source).toBe('yyc3-movplug-ai');
    expect(exported.metadata.totalKeys).toBe(2);
    expect(exported.metadata.checksum).toBeTruthy();
  });

  it('should import data', async () => {
    await storage.set('original', 'keep');
    const data: ExportData = {
      version: '1.0.0',
      exportedAt: Date.now(),
      namespaces: { default: { imported_key: 'imported_value' } },
      metadata: { source: 'yyc3-movplug-ai', totalKeys: 1, checksum: '00000000' },
    };
    const checksum = (() => {
      let h = 0;
      const s = JSON.stringify(data.namespaces);
      for (let i = 0; i < s.length; i++) { h = ((h << 5) - h) + s.charCodeAt(i); h |= 0; }
      return h.toString(16).padStart(8, '0');
    })();
    data.metadata.checksum = checksum;
    const result = await storage.importData(data);
    expect(result.imported).toBe(1);
  });

  it('should reject invalid import source', async () => {
    const data: ExportData = {
      version: '1.0.0',
      exportedAt: Date.now(),
      namespaces: {},
      metadata: { source: 'unknown', totalKeys: 0, checksum: '00000000' },
    };
    await expect(storage.importData(data)).rejects.toThrow('Invalid export data source');
  });

  it('should reset all data', async () => {
    await storage.set('x', 1);
    await storage.set('y', 2);
    await storage.reset();
    expect(await storage.get('x')).toBeNull();
    expect(await storage.get('y')).toBeNull();
  });

  it('should get stats', async () => {
    await storage.set('s1', 'v1');
    await storage.set('s2', 'v2');
    const stats = await storage.getStats();
    expect(stats.totalKeys).toBeGreaterThanOrEqual(2);
  });
});
