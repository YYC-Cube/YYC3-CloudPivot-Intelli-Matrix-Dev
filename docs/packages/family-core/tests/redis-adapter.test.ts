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

import { describe, it, expect, vi, afterEach } from 'vitest';
import { RedisAdapter } from '../src/storage/RedisAdapter.js';

// 模拟 ioredis — 使用 class 确保可被 new 调用
const mockRedisInstance = vi.fn() as any;
const mockRedisProps = {
  get: vi.fn(),
  set: vi.fn(),
  setex: vi.fn(),
  del: vi.fn(),
  exists: vi.fn(),
  keys: vi.fn(),
  on: vi.fn(),
  connect: vi.fn(),
  quit: vi.fn(),
  disconnect: vi.fn(),
};
Object.assign(mockRedisInstance, mockRedisProps);

vi.mock('ioredis', () => ({
  default: class MockRedis {
    constructor() { return mockRedisInstance; }
  },
}));

describe('RedisAdapter', () => {
  let adapter: RedisAdapter;
  let mockClient: any;

  afterEach(() => {
    vi.clearAllMocks();
  });

  function createAdapter(config?: any): RedisAdapter {
    const a = new RedisAdapter({ url: 'redis://localhost:6379', ...config });
    // 使用共享的 mockRedisInstance
    mockClient = mockRedisInstance;
    return a;
  }

  describe('basic operations', () => {
    it('should set and get values', async () => {
      adapter = createAdapter();
      mockClient.set.mockResolvedValue('OK');
      mockClient.get.mockResolvedValue(JSON.stringify('value1'));

      await adapter.set('key1', 'value1');
      const result = await adapter.get('key1');

      expect(result).toBe('value1');
      expect(mockClient.set).toHaveBeenCalledWith('yyc3:key1', '"value1"');
    });

    it('should return null for missing keys', async () => {
      adapter = createAdapter();
      mockClient.get.mockResolvedValue(null);

      const result = await adapter.get('nonexistent');
      expect(result).toBeNull();
    });

    it('should handle object values', async () => {
      adapter = createAdapter();
      mockClient.set.mockResolvedValue('OK');
      mockClient.get.mockResolvedValue(JSON.stringify({ name: 'test', count: 42 }));

      const obj = { name: 'test', count: 42 };
      await adapter.set('obj', obj);
      const result = await adapter.get<{ name: string; count: number }>('obj');

      expect(result).toEqual(obj);
    });

    it('should handle array values', async () => {
      adapter = createAdapter();
      mockClient.set.mockResolvedValue('OK');
      mockClient.get.mockResolvedValue(JSON.stringify([1, 2, 3]));

      await adapter.set('arr', [1, 2, 3]);
      const result = await adapter.get<number[]>('arr');
      expect(result).toEqual([1, 2, 3]);
    });

    it('should check existence', async () => {
      adapter = createAdapter();
      mockClient.exists.mockResolvedValueOnce(1).mockResolvedValueOnce(0);

      expect(await adapter.exists('exists-key')).toBe(true);
      expect(await adapter.exists('missing-key')).toBe(false);
    });

    it('should delete keys', async () => {
      adapter = createAdapter();
      mockClient.del.mockResolvedValueOnce(1).mockResolvedValueOnce(0);

      expect(await adapter.delete('del-me')).toBe(true);
      expect(await adapter.delete('nonexistent')).toBe(false);
    });

    it('should use namespace in key', async () => {
      adapter = createAdapter();
      mockClient.set.mockResolvedValue('OK');

      await adapter.set('key', 'val', 'ns1');
      expect(mockClient.set).toHaveBeenCalledWith('yyc3:ns1:key', '"val"');
    });

    it('should use TTL when configured', async () => {
      adapter = createAdapter({ defaultTTL: 3600 });
      mockClient.setex.mockResolvedValue('OK');

      await adapter.set('ttl-key', 'expiring-value');
      expect(mockClient.setex).toHaveBeenCalledWith('yyc3:ttl-key', 3600, '"expiring-value"');
    });

    it('should not use TTL when not configured', async () => {
      adapter = createAdapter();
      mockClient.set.mockResolvedValue('OK');

      await adapter.set('nottl-key', 'persistent-value');
      expect(mockClient.set).toHaveBeenCalledWith('yyc3:nottl-key', '"persistent-value"');
      expect(mockClient.setex).not.toHaveBeenCalled();
    });
  });

  describe('list and clear', () => {
    it('should list keys', async () => {
      adapter = createAdapter();
      mockClient.keys.mockResolvedValue(['yyc3:k1', 'yyc3:k2', 'yyc3:k3']);

      const keys = await adapter.list();
      expect(keys).toHaveLength(3);
      expect(keys).toEqual(['k1', 'k2', 'k3']);
    });

    it('should list keys with namespace', async () => {
      adapter = createAdapter();
      mockClient.keys.mockResolvedValue(['yyc3:ns:a', 'yyc3:ns:b']);

      const keys = await adapter.list('ns');
      expect(mockClient.keys).toHaveBeenCalledWith('yyc3:ns:*');
      expect(keys).toHaveLength(2);
    });

    it('should clear keys', async () => {
      adapter = createAdapter();
      mockClient.keys.mockResolvedValue(['yyc3:k1', 'yyc3:k2']);
      mockClient.del.mockResolvedValue(2);

      const cleared = await adapter.clear();
      expect(cleared).toBe(2);
      expect(mockClient.del).toHaveBeenCalledWith('yyc3:k1', 'yyc3:k2');
    });
  });

  describe('stats and connectivity', () => {
    it('should provide stats', async () => {
      adapter = createAdapter();
      mockClient.keys.mockResolvedValue(['yyc3:s1', 'yyc3:s2']);

      const stats = await adapter.getStats();
      expect(stats.totalKeys).toBe(2);
      expect(stats.totalSizeBytes).toBeGreaterThan(0);
      expect(Array.isArray(stats.namespaces)).toBe(true);
    });

    it('should return empty stats on error', async () => {
      adapter = createAdapter();
      mockClient.keys.mockRejectedValue(new Error('Connection refused'));

      const stats = await adapter.getStats();
      expect(stats.totalKeys).toBe(0);
    });

    it('should handle connection errors gracefully on get', async () => {
      adapter = createAdapter();
      mockClient.get.mockRejectedValue(new Error('Connection refused'));

      const result = await adapter.get('any-key');
      expect(result).toBeNull();
    });

    it('should handle connection errors gracefully on set', async () => {
      adapter = createAdapter();
      mockClient.set.mockRejectedValue(new Error('Connection refused'));

      // Should not throw
      await expect(adapter.set('key', 'value')).resolves.toBeUndefined();
    });

    it('should report connection status', () => {
      adapter = createAdapter();
      expect(adapter.isConnected()).toBe(false);

      // 模拟连接事件
      const onHandler = (mockClient.on as any).mock.calls.find((c: any) => c[0] === 'connect');
      if (onHandler) onHandler[1]();

      expect(adapter.isConnected()).toBe(true);
    });
  });

  describe('disconnect', () => {
    it('should disconnect gracefully', async () => {
      adapter = createAdapter();
      mockClient.quit.mockResolvedValue('OK');

      await adapter.disconnect();
      expect(mockClient.quit).toHaveBeenCalled();
    });

    it('should handle disconnect errors gracefully', async () => {
      adapter = createAdapter();
      mockClient.quit.mockRejectedValue(new Error('Already disconnected'));

      // Should not throw
      await expect(adapter.disconnect()).resolves.toBeUndefined();
    });
  });
});
