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
 * @file RedisAdapter.ts
 * @description Redis 存储适配器，实现 StorageAdapter 接口
 * @module storage
 * @author YanYuCloudCube Team
 * @version v1.0.0
 * @created 2026-06-12
 * @status stable
 * @license MIT
 */

import Redis from 'ioredis';
import type { StorageAdapter, StorageStats } from './types.js';
import { logger } from '../deps/logger.js';

export interface RedisAdapterConfig {
  /** Redis 连接 URL，默认 redis://localhost:6379 */
  url?: string;
  /** 键前缀，用于区分不同应用 */
  prefix?: string;
  /** 默认过期时间（秒），0 表示永不过期 */
  defaultTTL?: number;
  /** 最大重试次数 */
  maxRetries?: number;
}

const DEFAULT_CONFIG: RedisAdapterConfig = {
  url: 'redis://localhost:6379',
  prefix: 'yyc3:',
  defaultTTL: 0,
  maxRetries: 3,
};

export class RedisAdapter implements StorageAdapter {
  private client: Redis;
  private config: RedisAdapterConfig;
  private connected = false;

  constructor(config: RedisAdapterConfig = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.client = new Redis(this.config.url!, {
      maxRetriesPerRequest: this.config.maxRetries,
      lazyConnect: true,
      retryStrategy: (times: number) => {
        if (times > (this.config.maxRetries ?? 3)) return null;
        return Math.min(times * 200, 2000);
      },
    });

    this.client.on('connect', () => {
      this.connected = true;
    });

    this.client.on('close', () => {
      this.connected = false;
    });

    this.client.on('error', (err) => {
      logger.error(`Redis 连接错误: ${err instanceof Error ? err.message : String(err)}`, 'RedisAdapter');
    });
  }

  /** 确保连接可用 */
  private async ensureConnected(): Promise<void> {
    if (!this.connected) {
      await this.client.connect();
    }
  }

  /** 构建带前缀的完整键名 */
  private buildKey(key: string, namespace?: string): string {
    const ns = namespace ? `${namespace}:` : '';
    return `${this.config.prefix}${ns}${key}`;
  }

  async get<T = unknown>(key: string): Promise<T | null> {
    try {
      await this.ensureConnected();
      const value = await this.client.get(this.buildKey(key));
      if (value === null) return null;
      return JSON.parse(value) as T;
    } catch (err) {
      logger.error(`Redis get 失败: ${err instanceof Error ? err.message : String(err)}`, 'RedisAdapter', { key });
      return null;
    }
  }

  async set<T = unknown>(key: string, value: T, namespace?: string): Promise<void> {
    try {
      await this.ensureConnected();
      const serialized = JSON.stringify(value);
      const fullKey = this.buildKey(key, namespace);

      if (this.config.defaultTTL && this.config.defaultTTL > 0) {
        await this.client.setex(fullKey, this.config.defaultTTL, serialized);
      } else {
        await this.client.set(fullKey, serialized);
      }
    } catch (err) {
      logger.error(`Redis set 失败: ${err instanceof Error ? err.message : String(err)}`, 'RedisAdapter', { key, namespace });
    }
  }

  async delete(key: string): Promise<boolean> {
    try {
      await this.ensureConnected();
      const result = await this.client.del(this.buildKey(key));
      return result > 0;
    } catch (err) {
      logger.error(`Redis delete 失败: ${err instanceof Error ? err.message : String(err)}`, 'RedisAdapter', { key });
      return false;
    }
  }

  async exists(key: string): Promise<boolean> {
    try {
      await this.ensureConnected();
      const result = await this.client.exists(this.buildKey(key));
      return result > 0;
    } catch (err) {
      logger.error(`Redis exists 失败: ${err instanceof Error ? err.message : String(err)}`, 'RedisAdapter', { key });
      return false;
    }
  }

  async list(namespace?: string): Promise<string[]> {
    try {
      await this.ensureConnected();
      const pattern = namespace
        ? `${this.config.prefix}${namespace}:*`
        : `${this.config.prefix}*`;
      const keys = await this.client.keys(pattern);
      return keys.map((k) => k.replace(this.config.prefix!, ''));
    } catch (err) {
      logger.error(`Redis list 失败: ${err instanceof Error ? err.message : String(err)}`, 'RedisAdapter', { namespace });
      return [];
    }
  }

  async clear(namespace?: string): Promise<number> {
    try {
      await this.ensureConnected();
      const keys = await this.list(namespace);
      if (keys.length === 0) return 0;
      const fullKeys = keys.map((k) => `${this.config.prefix}${k}`);
      const deleted = await this.client.del(...fullKeys);
      return deleted;
    } catch (err) {
      logger.error(`Redis clear 失败: ${err instanceof Error ? err.message : String(err)}`, 'RedisAdapter', { namespace });
      return 0;
    }
  }

  async getStats(): Promise<StorageStats> {
    try {
      await this.ensureConnected();
      const keys = await this.client.keys(`${this.config.prefix}*`);
      const namespaces = new Set<string>();

      for (const key of keys) {
        const stripped = key.replace(this.config.prefix!, '');
        const parts = stripped.split(':');
        if (parts.length > 1) namespaces.add(parts[0]!);
      }

      return {
        totalKeys: keys.length,
        totalSizeBytes: keys.length * 128, // 估算每键~128字节
        namespaces: Array.from(namespaces),
        oldestEntry: null,
        newestEntry: null,
      };
    } catch (err) {
      logger.error(`Redis getStats 失败: ${err instanceof Error ? err.message : String(err)}`, 'RedisAdapter');
      return { totalKeys: 0, totalSizeBytes: 0, namespaces: [], oldestEntry: null, newestEntry: null };
    }
  }

  /** 获取原生 Redis 客户端，用于高级操作 */
  getClient(): Redis {
    return this.client;
  }

  /** 检查连接状态 */
  isConnected(): boolean {
    return this.connected;
  }

  /** 断开连接 */
  async disconnect(): Promise<void> {
    try {
      await this.client.quit();
    } catch (err) {
      logger.error(`Redis disconnect 失败: ${err instanceof Error ? err.message : String(err)}`, 'RedisAdapter');
      this.client.disconnect();
    }
  }
}
