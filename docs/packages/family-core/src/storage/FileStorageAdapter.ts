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
 * @file FileStorageAdapter.ts
 * @description 基于 Node.js fs 的 JSON 文件持久化存储适配器
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.0.0
 * @created 2026-06-12
 * @updated 2026-06-12
 * @status stable
 * @license MIT
 */

import type { StorageAdapter, StorageStats } from './types.js';
import { readFile, writeFile, mkdir, access } from 'fs/promises';
import { join } from 'path';

interface FileEntry<T = unknown> {
  value: T;
  namespace: string;
  updatedAt: number;
  createdAt: number;
}

export interface FileStorageConfig {
  baseDir: string;
  pretty?: boolean;
}

export class FileStorageAdapter implements StorageAdapter {
  private baseDir: string;
  private pretty: boolean;
  private memoryCache: Map<string, FileEntry> = new Map();
  private initialized = false;

  constructor(config: FileStorageConfig) {
    this.baseDir = config.baseDir;
    this.pretty = config.pretty ?? false;
  }

  private async ensureInitialized(): Promise<void> {
    if (this.initialized) return;
    await mkdir(this.baseDir, { recursive: true });
    await this.loadFromDisk();
    this.initialized = true;
  }

  private getFilePath(): string {
    return join(this.baseDir, 'storage.json');
  }

  private async loadFromDisk(): Promise<void> {
    try {
      await access(this.getFilePath());
      const raw = await readFile(this.getFilePath(), 'utf-8');
      const data = JSON.parse(raw) as Record<string, FileEntry>;
      this.memoryCache = new Map(Object.entries(data));
    } catch {
      // File doesn't exist or is corrupt — start fresh
      this.memoryCache = new Map();
    }
  }

  private async saveToDisk(): Promise<void> {
    const data = Object.fromEntries(this.memoryCache);
    const json = this.pretty ? JSON.stringify(data, null, 2) : JSON.stringify(data);
    await writeFile(this.getFilePath(), json, 'utf-8');
  }

  async get<T = unknown>(key: string): Promise<T | null> {
    await this.ensureInitialized();
    const entry = this.memoryCache.get(key);
    return entry ? (entry.value as T) : null;
  }

  async set<T = unknown>(key: string, value: T, namespace = 'default'): Promise<void> {
    await this.ensureInitialized();
    const now = Date.now();
    const existing = this.memoryCache.get(key);

    this.memoryCache.set(key, {
      value,
      namespace,
      updatedAt: now,
      createdAt: existing?.createdAt ?? now,
    });

    await this.saveToDisk();
  }

  async delete(key: string): Promise<boolean> {
    await this.ensureInitialized();
    const existed = this.memoryCache.has(key);
    if (existed) {
      this.memoryCache.delete(key);
      await this.saveToDisk();
    }
    return existed;
  }

  async exists(key: string): Promise<boolean> {
    await this.ensureInitialized();
    return this.memoryCache.has(key);
  }

  async list(namespace?: string): Promise<string[]> {
    await this.ensureInitialized();
    const keys: string[] = [];
    for (const [key, entry] of this.memoryCache) {
      if (!namespace || entry.namespace === namespace) {
        keys.push(key);
      }
    }
    return keys;
  }

  async clear(namespace?: string): Promise<number> {
    await this.ensureInitialized();
    if (!namespace) {
      const count = this.memoryCache.size;
      this.memoryCache.clear();
      await this.saveToDisk();
      return count;
    }

    let count = 0;
    for (const [key, entry] of this.memoryCache) {
      if (entry.namespace === namespace) {
        this.memoryCache.delete(key);
        count++;
      }
    }
    await this.saveToDisk();
    return count;
  }

  async getStats(): Promise<StorageStats> {
    await this.ensureInitialized();
    let totalSizeBytes = 0;
    let oldestEntry: number | null = null;
    let newestEntry: number | null = null;
    const namespaces = new Set<string>();

    for (const [key, entry] of this.memoryCache) {
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
      totalKeys: this.memoryCache.size,
      totalSizeBytes,
      namespaces: Array.from(namespaces),
      oldestEntry,
      newestEntry,
    };
  }
}
