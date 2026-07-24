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
import { FileStorageAdapter } from '../src/storage/FileStorageAdapter';
import { mkdtempSync, existsSync, rmSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';

describe('FileStorageAdapter', () => {
  let adapter: FileStorageAdapter;
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = mkdtempSync(join(tmpdir(), 'yyc3-test-'));
    adapter = new FileStorageAdapter({ baseDir: tmpDir });
  });

  afterEach(() => {
    rmSync(tmpDir, { recursive: true, force: true });
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

  it('should persist to disk between operations', async () => {
    await adapter.set('persist', 'disk-data');
    const adapter2 = new FileStorageAdapter({ baseDir: tmpDir });
    const result = await adapter2.get<string>('persist');
    expect(result).toBe('disk-data');
  });

  it('should handle object values', async () => {
    const obj = { hello: 'world', num: 42 };
    await adapter.set('obj', obj);
    const result = await adapter.get<typeof obj>('obj');
    expect(result).toEqual(obj);
  });

  it('should list keys with namespace filtering', async () => {
    await adapter.set('a1', 'v1', 'ns1');
    await adapter.set('a2', 'v2', 'ns1');
    await adapter.set('b1', 'v3', 'ns2');

    const allKeys = await adapter.list();
    expect(allKeys).toHaveLength(3);

    const ns1Keys = await adapter.list('ns1');
    expect(ns1Keys).toHaveLength(2);

    const ns2Keys = await adapter.list('ns2');
    expect(ns2Keys).toHaveLength(1);
  });

  it('should clear all or by namespace', async () => {
    await adapter.set('x', 1, 'ns1');
    await adapter.set('y', 2, 'ns2');

    const ns1Cleared = await adapter.clear('ns1');
    expect(ns1Cleared).toBe(1);
    expect(await adapter.get('x')).toBeNull();
    expect(await adapter.get('y')).toBe(2);

    const totalCleared = await adapter.clear();
    expect(totalCleared).toBe(1);
  });

  it('should get stats', async () => {
    await adapter.set('s1', 'hello', 'ns1');
    await adapter.set('s2', 'world', 'ns2');

    const stats = await adapter.getStats();
    expect(stats.totalKeys).toBe(2);
    expect(stats.namespaces).toContain('ns1');
    expect(stats.namespaces).toContain('ns2');
  });

  it('should create storage file with pretty option', async () => {
    const prettyAdapter = new FileStorageAdapter({ baseDir: tmpDir, pretty: true });
    await prettyAdapter.set('key', 'val');
    const stats = await prettyAdapter.getStats();
    expect(stats.totalKeys).toBe(1);
  });

  it('should handle sequential operations correctly', async () => {
    // File adapter uses async disk writes, sequential is the expected pattern
    await adapter.set('k1', 'v1');
    await adapter.set('k2', 'v2');
    await adapter.set('k3', 'v3');

    expect(await adapter.get('k1')).toBe('v1');
    expect(await adapter.get('k2')).toBe('v2');
    expect(await adapter.get('k3')).toBe('v3');
  });
});
