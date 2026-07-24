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

import type { StorageAdapter, StorageStats, ExportData } from './types.js';
import { LocalStorageAdapter } from './LocalStorageAdapter.js';
import { IndexedDBAdapter } from './IndexedDBAdapter.js';
import { MemoryStorageAdapter } from './MemoryStorageAdapter.js';
import { FileStorageAdapter } from './FileStorageAdapter.js';
import { RedisAdapter, type RedisAdapterConfig } from './RedisAdapter.js';
import { logger } from '../deps/logger.js';

const VERSION = '1.1.0';

export type StorageTier = 'local' | 'indexed' | 'memory' | 'file' | 'redis';

export interface StorageManagerConfig {
  defaultNamespace?: string;
  defaultTier?: StorageTier;
  fileBaseDir?: string;
  redisConfig?: RedisAdapterConfig;
}

export class StorageManager {
  private localAdapter: LocalStorageAdapter;
  private indexedAdapter: IndexedDBAdapter | null = null;
  private memoryAdapter: MemoryStorageAdapter;
  private fileAdapter: FileStorageAdapter | null = null;
  private redisAdapter: RedisAdapter | null = null;
  private defaultNamespace: string;
  private defaultTier: StorageTier;

  constructor(config: StorageManagerConfig = {}) {
    this.defaultNamespace = config.defaultNamespace ?? 'default';
    this.defaultTier = config.defaultTier ?? 'local';
    this.localAdapter = new LocalStorageAdapter();
    this.memoryAdapter = new MemoryStorageAdapter();
    if (config.fileBaseDir) {
      this.fileAdapter = new FileStorageAdapter({ baseDir: config.fileBaseDir });
    }
    if (config.redisConfig) {
      this.redisAdapter = new RedisAdapter(config.redisConfig);
    }
    try {
      this.indexedAdapter = new IndexedDBAdapter();
    } catch (e) { logger.warn('IndexedDB not available, falling back', 'StorageManager', { error: e instanceof Error ? e.message : String(e) }); }
  }

  async get<T = unknown>(key: string, tier?: StorageTier): Promise<T | null> {
    return this.getAdapter(tier).get<T>(key);
  }

  async set<T = unknown>(key: string, value: T, options?: { namespace?: string; tier?: StorageTier }): Promise<void> {
    const ns = options?.namespace ?? this.defaultNamespace;
    return this.getAdapter(options?.tier).set<T>(key, value, ns);
  }

  async delete(key: string, tier?: StorageTier): Promise<boolean> {
    return this.getAdapter(tier).delete(key);
  }

  async exists(key: string, tier?: StorageTier): Promise<boolean> {
    return this.getAdapter(tier).exists(key);
  }

  async list(namespace?: string, tier?: StorageTier): Promise<string[]> {
    return this.getAdapter(tier).list(namespace);
  }

  async clear(namespace?: string, tier?: StorageTier): Promise<number> {
    return this.getAdapter(tier).clear(namespace);
  }

  async clearAll(): Promise<{ local: number; indexed: number; redis: number }> {
    const local = await this.localAdapter.clear();
    let indexed = 0;
    let redis = 0;
    if (this.indexedAdapter) {
      try {
        indexed = await this.indexedAdapter.clear();
      } catch (e) { logger.warn('Failed to clear IndexedDB', 'StorageManager', { error: e instanceof Error ? e.message : String(e) }); }
    }
    if (this.redisAdapter) {
      try {
        redis = await this.redisAdapter.clear();
      } catch (e) { logger.warn('Failed to clear Redis', 'StorageManager', { error: e instanceof Error ? e.message : String(e) }); }
    }
    return { local, indexed, redis };
  }

  async getStats(tier?: StorageTier): Promise<StorageStats> {
    return this.getAdapter(tier).getStats();
  }

  async exportAll(): Promise<ExportData> {
    const namespaces: Record<string, Record<string, unknown>> = {};
    const allKeys = await this.localAdapter.list();

    for (const key of allKeys) {
      const value = await this.localAdapter.get(key);
      const ns = this.extractNamespace(key) ?? 'default';
      if (!namespaces[ns]) namespaces[ns] = {};
      namespaces[ns][key] = value;
    }

    const totalKeys = allKeys.length;
    const checksum = this.computeChecksum(JSON.stringify(namespaces));

    return {
      version: VERSION,
      exportedAt: Date.now(),
      namespaces,
      metadata: {
        source: 'yyc3-movplug-ai',
        totalKeys,
        checksum,
      },
    };
  }

  async importData(data: ExportData): Promise<{ imported: number; skipped: number }> {
    if (data.metadata.source !== 'yyc3-movplug-ai') {
      throw new Error('Invalid export data source');
    }

    const computedChecksum = this.computeChecksum(JSON.stringify(data.namespaces));
    if (computedChecksum !== data.metadata.checksum) {
      throw new Error('Export data checksum mismatch — data may be corrupted');
    }

    let imported = 0;
    let skipped = 0;

    for (const [, entries] of Object.entries(data.namespaces)) {
      for (const [key, value] of Object.entries(entries)) {
        const existing = await this.localAdapter.get(key);
        if (existing !== null) {
          skipped++;
          continue;
        }
        await this.localAdapter.set(key, value);
        imported++;
      }
    }

    return { imported, skipped };
  }

  async reset(): Promise<void> {
    await this.clearAll();
  }

  private getAdapter(tier?: StorageTier): StorageAdapter {
    const t = tier ?? this.defaultTier;
    if (t === 'indexed' && this.indexedAdapter) return this.indexedAdapter;
    if (t === 'memory') return this.memoryAdapter;
    if (t === 'file' && this.fileAdapter) return this.fileAdapter;
    if (t === 'redis' && this.redisAdapter) return this.redisAdapter;
    return this.localAdapter;
  }

  private extractNamespace(key: string): string | undefined {
    const parts = key.split(':');
    return parts.length >= 2 ? parts[1] : undefined;
  }

  private computeChecksum(data: string): string {
    let hash = 0;
    for (let i = 0; i < data.length; i++) {
      const char = data.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash |= 0;
    }
    return hash.toString(16).padStart(8, '0');
  }

  /** 获取 Redis 适配器实例，用于高级操作 */
  getRedisAdapter(): RedisAdapter | null {
    return this.redisAdapter;
  }
}
