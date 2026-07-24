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

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { MemoryStorageAdapter } from '../src/storage/MemoryStorageAdapter';

describe('MemoryStorageAdapter', () => {
  let adapter: MemoryStorageAdapter;

  beforeEach(() => {
    vi.useFakeTimers();
    adapter = new MemoryStorageAdapter();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should set and get values', async () => {
    await adapter.set('key1', 'value1');
    const result = await adapter.get<string>('key1');
    expect(result).toBe('value1');
  });

  it('should return null for missing keys', async () => {
    expect(await adapter.get('nope')).toBeNull();
  });

  it('should check existence', async () => {
    await adapter.set('ex', true);
    expect(await adapter.exists('ex')).toBe(true);
    expect(await adapter.exists('missing')).toBe(false);
  });

  it('should delete keys', async () => {
    await adapter.set('del', 'data');
    expect(await adapter.delete('del')).toBe(true);
    expect(await adapter.get('del')).toBeNull();
    expect(await adapter.delete('nope')).toBe(false);
  });

  it('should handle object values', async () => {
    const obj = { nested: { value: 42 }, arr: [1, 2, 3] };
    await adapter.set('obj', obj);
    const result = await adapter.get<typeof obj>('obj');
    expect(result).toEqual(obj);
  });

  it('should list keys with namespace filtering', async () => {
    await adapter.set('a', 'v1', 'ns1');
    await adapter.set('b', 'v2', 'ns1');
    await adapter.set('c', 'v3', 'ns2');

    const all = await adapter.list();
    expect(all).toHaveLength(3);

    expect(await adapter.list('ns1')).toHaveLength(2);
    expect(await adapter.list('ns2')).toHaveLength(1);
    expect(await adapter.list('nonexistent')).toHaveLength(0);
  });

  it('should clear all or by namespace', async () => {
    await adapter.set('x', 1, 'ns1');
    await adapter.set('y', 2, 'ns2');

    expect(await adapter.clear('ns1')).toBe(1);
    expect(await adapter.get('x')).toBeNull();
    expect(await adapter.get('y')).toBe(2);

    expect(await adapter.clear()).toBe(1);
  });

  it('should get stats', async () => {
    await adapter.set('k1', 'hello');
    await adapter.set('k2', 'world', 'ns2');

    const stats = await adapter.getStats();
    expect(stats.totalKeys).toBe(2);
    expect(stats.totalSizeBytes).toBeGreaterThan(0);
    expect(stats.namespaces).toContain('default');
  });

  describe('TTL support', () => {
    it('should expire keys when TTL is set', async () => {
      const ttlAdapter = new MemoryStorageAdapter({ defaultTTL: 1000 });
      await ttlAdapter.set('ttl-key', 'expires');
      expect(await ttlAdapter.get('ttl-key')).toBe('expires');

      vi.advanceTimersByTime(1500);
      expect(await ttlAdapter.get('ttl-key')).toBeNull();
    });

    it('should treat expired keys as non-existent', async () => {
      const ttlAdapter = new MemoryStorageAdapter({ defaultTTL: 500 });
      await ttlAdapter.set('brief', 'short');
      vi.advanceTimersByTime(1000);
      expect(await ttlAdapter.exists('brief')).toBe(false);
    });

    it('should skip expired entries in list', async () => {
      const ttlAdapter = new MemoryStorageAdapter({ defaultTTL: 500 });
      await ttlAdapter.set('a', '1');
      await ttlAdapter.set('b', '2');
      vi.advanceTimersByTime(1000);
      expect(await ttlAdapter.list()).toHaveLength(0);
    });
  });

  describe('eviction', () => {
    it('should evict oldest entries when exceeding maxKeys', async () => {
      const evictAdapter = new MemoryStorageAdapter({ maxKeys: 5 });
      for (let i = 0; i < 10; i++) {
        await evictAdapter.set(`k${i}`, i);
      }
      // Evicts 20% every time size exceeds maxKeys, leaving ~4 items
      const keys = await evictAdapter.list();
      expect(keys.length).toBeLessThan(10);
      expect(keys.length).toBe(4);
    });
  });

  describe('export / import', () => {
    it('should export data', async () => {
      await adapter.set('e1', 'v1', 'ns1');
      await adapter.set('e2', 'v2', 'ns2');

      const exported = await adapter.export();
      expect(exported.ns1).toBeDefined();
      expect(exported.ns1.e1).toBe('v1');
      expect(exported.ns2.e2).toBe('v2');
    });

    it('should import data', async () => {
      const count = await adapter.import({
        ns1: { k1: 'val1', k2: 'val2' },
        ns2: { k3: 'val3' },
      });
      expect(count).toBe(3);
      expect(await adapter.get('k1')).toBe('val1');
      expect(await adapter.get('k3')).toBe('val3');
    });

    it('should skip expired entries during export', async () => {
      const ttlAdapter = new MemoryStorageAdapter({ defaultTTL: 500 });
      await ttlAdapter.set('a', '1');
      vi.advanceTimersByTime(1000);
      const exported = await ttlAdapter.export();
      expect(Object.keys(exported)).toHaveLength(0);
    });
  });
});
