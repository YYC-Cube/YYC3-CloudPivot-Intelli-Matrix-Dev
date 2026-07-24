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
 * @file MemoryStorageAdapter.ts
 * @description 服务端内存存储适配器（带 TTL 与命名空间隔离）
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.0.0
 * @created 2026-06-12
 * @updated 2026-06-12
 * @status stable
 * @license MIT
 */

import type { StorageAdapter, StorageStats } from './types.js';

interface MemoryEntry<T = unknown> {
  value: T;
  namespace: string;
  updatedAt: number;
  createdAt: number;
  expiry?: number;
}

export interface MemoryStorageConfig {
  defaultTTL?: number;
  maxKeys?: number;
}

export class MemoryStorageAdapter implements StorageAdapter {
  private store: Map<string, MemoryEntry> = new Map();
  private config: MemoryStorageConfig;

  constructor(config: MemoryStorageConfig = {}) {
    this.config = {
      defaultTTL: config.defaultTTL ?? 0, // 0 = no TTL
      maxKeys: config.maxKeys ?? 10000,
    };
  }

  async get<T = unknown>(key: string): Promise<T | null> {
    const entry = this.store.get(key);
    if (!entry) return null;

    if (entry.expiry && Date.now() > entry.expiry) {
      this.store.delete(key);
      return null;
    }

    return entry.value as T;
  }

  async set<T = unknown>(key: string, value: T, namespace = 'default'): Promise<void> {
    const now = Date.now();
    const existing = this.store.get(key);

    this.store.set(key, {
      value,
      namespace,
      updatedAt: now,
      createdAt: existing?.createdAt ?? now,
      expiry: this.config.defaultTTL ? now + this.config.defaultTTL : undefined,
    });

    this.evictIfNeeded();
  }

  async delete(key: string): Promise<boolean> {
    return this.store.delete(key);
  }

  async exists(key: string): Promise<boolean> {
    const entry = this.store.get(key);
    if (!entry) return false;
    if (entry.expiry && Date.now() > entry.expiry) {
      this.store.delete(key);
      return false;
    }
    return true;
  }

  async list(namespace?: string): Promise<string[]> {
    const keys: string[] = [];
    const now = Date.now();

    for (const [key, entry] of this.store) {
      if (entry.expiry && now > entry.expiry) {
        this.store.delete(key);
        continue;
      }
      if (!namespace || entry.namespace === namespace) {
        keys.push(key);
      }
    }

    return keys;
  }

  async clear(namespace?: string): Promise<number> {
    if (!namespace) {
      const count = this.store.size;
      this.store.clear();
      return count;
    }

    let count = 0;
    for (const [key, entry] of this.store) {
      if (entry.namespace === namespace) {
        this.store.delete(key);
        count++;
      }
    }
    return count;
  }

  async getStats(): Promise<StorageStats> {
    const now = Date.now();
    let totalSizeBytes = 0;
    let oldestEntry: number | null = null;
    let newestEntry: number | null = null;
    const namespaces = new Set<string>();

    for (const [key, entry] of this.store) {
      if (entry.expiry && now > entry.expiry) {
        this.store.delete(key);
        continue;
      }

      namespaces.add(entry.namespace);
      totalSizeBytes += JSON.stringify(entry.value).length + key.length;

      if (oldestEntry === null || entry.createdAt < oldestEntry) {
        oldestEntry = entry.createdAt;
      }
      if (newestEntry === null || entry.createdAt > newestEntry) {
        newestEntry = entry.createdAt;
      }
    }

    return {
      totalKeys: this.store.size,
      totalSizeBytes,
      namespaces: Array.from(namespaces),
      oldestEntry,
      newestEntry,
    };
  }

  async export(): Promise<Record<string, Record<string, unknown>>> {
    const result: Record<string, Record<string, unknown>> = {};
    const now = Date.now();

    for (const [key, entry] of this.store) {
      if (entry.expiry && now > entry.expiry) continue;
      const ns = entry.namespace ?? 'default';
      if (!result[ns]) result[ns] = {};
      result[ns][key] = entry.value;
    }

    return result;
  }

  async import(data: Record<string, Record<string, unknown>>): Promise<number> {
    let count = 0;
    const now = Date.now();

    for (const [namespace, entries] of Object.entries(data)) {
      for (const [key, value] of Object.entries(entries)) {
        this.store.set(key, {
          value,
          namespace,
          updatedAt: now,
          createdAt: now,
          expiry: this.config.defaultTTL ? now + this.config.defaultTTL : undefined,
        });
        count++;
      }
    }

    this.evictIfNeeded();
    return count;
  }

  private evictIfNeeded(): void {
    if (this.store.size <= (this.config.maxKeys ?? 10000)) return;

    // Evict oldest entries by creation time
    const entries = Array.from(this.store.entries());
    entries.sort((a, b) => (a[1].createdAt ?? 0) - (b[1].createdAt ?? 0));

    const toEvict = Math.ceil(entries.length * 0.2); // Evict 20% oldest
    for (let i = 0; i < toEvict; i++) {
      const key = entries[i]?.[0];
      if (key) this.store.delete(key);
    }
  }
}
