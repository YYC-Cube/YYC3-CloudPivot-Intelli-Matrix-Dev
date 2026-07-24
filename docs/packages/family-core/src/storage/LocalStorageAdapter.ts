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

import type { StorageAdapter, StorageStats } from './types.js';

const PREFIX = 'yyc3:';

export class LocalStorageAdapter implements StorageAdapter {
  private prefix: string;

  constructor(namespace?: string) {
    this.prefix = namespace ? `${PREFIX}${namespace}:` : PREFIX;
  }

  async get<T = unknown>(key: string): Promise<T | null> {
    const raw = this.rawGet(this.fullKey(key));
    if (raw === null) return null;
    try {
      const entry = JSON.parse(raw);
      return entry.value as T;
    } catch {
      return null;
    }
  }

  async set<T = unknown>(key: string, value: T, _namespace?: string): Promise<void> {
    const entry = { value, updatedAt: Date.now(), createdAt: Date.now() };
    const existing = this.rawGet(this.fullKey(key));
    if (existing) {
      try {
        const prev = JSON.parse(existing);
        entry.createdAt = prev.createdAt;
      } catch { /* keep current createdAt */ }
    }
    this.rawSet(this.fullKey(key), JSON.stringify(entry));
  }

  async delete(key: string): Promise<boolean> {
    const fullKey = this.fullKey(key);
    const exists = this.rawGet(fullKey) !== null;
    if (exists) {
      this.rawRemove(fullKey);
    }
    return exists;
  }

  async exists(key: string): Promise<boolean> {
    return this.rawGet(this.fullKey(key)) !== null;
  }

  async list(namespace?: string): Promise<string[]> {
    const prefix = namespace ? `${PREFIX}${namespace}:` : this.prefix;
    const keys: string[] = [];
    const storage = this.getStorage();
    if (!storage) return keys;
    for (let i = 0; i < storage.length; i++) {
      const k = storage.key(i);
      if (k && k.startsWith(prefix)) {
        keys.push(k.slice(prefix.length));
      }
    }
    return keys;
  }

  async clear(namespace?: string): Promise<number> {
    const prefix = namespace ? `${PREFIX}${namespace}:` : this.prefix;
    const storage = this.getStorage();
    if (!storage) return 0;
    const keysToRemove: string[] = [];
    for (let i = 0; i < storage.length; i++) {
      const k = storage.key(i);
      if (k && k.startsWith(prefix)) {
        keysToRemove.push(k);
      }
    }
    for (const k of keysToRemove) {
      storage.removeItem(k);
    }
    return keysToRemove.length;
  }

  async getStats(): Promise<StorageStats> {
    const storage = this.getStorage();
    if (!storage) {
      return { totalKeys: 0, totalSizeBytes: 0, namespaces: [], oldestEntry: null, newestEntry: null };
    }

    const namespaces = new Set<string>();
    let totalSizeBytes = 0;
    let oldestEntry: number | null = null;
    let newestEntry: number | null = null;

    for (let i = 0; i < storage.length; i++) {
      const k = storage.key(i);
      if (k && k.startsWith(PREFIX)) {
        const raw = storage.getItem(k);
        totalSizeBytes += (raw?.length ?? 0) * 2;
        const parts = k.split(':');
        if (parts.length >= 2) namespaces.add(parts[1]!);
        if (raw) {
          try {
            const entry = JSON.parse(raw);
            if (entry.createdAt) {
              if (oldestEntry === null || entry.createdAt < oldestEntry) oldestEntry = entry.createdAt;
              if (newestEntry === null || entry.createdAt > newestEntry) newestEntry = entry.createdAt;
            }
          } catch { /* skip */ }
        }
      }
    }

    return {
      totalKeys: this.countYyc3Keys(storage),
      totalSizeBytes,
      namespaces: Array.from(namespaces),
      oldestEntry,
      newestEntry,
    };
  }

  private fullKey(key: string): string {
    return `${this.prefix}${key}`;
  }

  private getStorage(): Storage | null {
    if (typeof localStorage === 'undefined') return null;
    return localStorage;
  }

  private rawGet(key: string): string | null {
    const storage = this.getStorage();
    return storage ? storage.getItem(key) : null;
  }

  private rawSet(key: string, value: string): void {
    const storage = this.getStorage();
    if (storage) storage.setItem(key, value);
  }

  private rawRemove(key: string): void {
    const storage = this.getStorage();
    if (storage) storage.removeItem(key);
  }

  private countYyc3Keys(storage: Storage): number {
    let count = 0;
    for (let i = 0; i < storage.length; i++) {
      const k = storage.key(i);
      if (k && k.startsWith(PREFIX)) count++;
    }
    return count;
  }
}
