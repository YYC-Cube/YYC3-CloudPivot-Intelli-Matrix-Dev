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

const DB_NAME = 'yyc3-storage';
const DB_VERSION = 1;
const STORE_NAME = 'entries';
const PREFIX = 'yyc3:';

interface StoredEntry {
  key: string;
  value: unknown;
  namespace: string;
  updatedAt: number;
  createdAt: number;
}

export class IndexedDBAdapter implements StorageAdapter {
  private db: IDBDatabase | null = null;
  private initPromise: Promise<IDBDatabase> | null = null;

  private async getDB(): Promise<IDBDatabase> {
    if (this.db) return this.db;
    if (this.initPromise) return this.initPromise;

    this.initPromise = new Promise((resolve, reject) => {
      if (typeof indexedDB === 'undefined') {
        reject(new Error('IndexedDB not available'));
        return;
      }
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          const store = db.createObjectStore(STORE_NAME, { keyPath: 'key' });
          store.createIndex('namespace', 'namespace', { unique: false });
          store.createIndex('updatedAt', 'updatedAt', { unique: false });
        }
      };

      request.onsuccess = () => {
        this.db = request.result;
        resolve(this.db);
      };

      request.onerror = () => {
        this.initPromise = null;
        reject(request.error);
      };
    });

    return this.initPromise;
  }

  async get<T = unknown>(key: string): Promise<T | null> {
    const db = await this.getDB();
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const fullKey = `${PREFIX}${key}`;

    return new Promise((resolve, reject) => {
      const request = store.get(fullKey);
      request.onsuccess = () => {
        const entry = request.result as StoredEntry | undefined;
        resolve(entry ? (entry.value as T) : null);
      };
      request.onerror = () => reject(request.error);
    });
  }

  async set<T = unknown>(key: string, value: T, namespace: string = 'default'): Promise<void> {
    const db = await this.getDB();
    const fullKey = `${PREFIX}${key}`;
    const now = Date.now();

    const existing = await this.getEntry(fullKey);
    const entry: StoredEntry = {
      key: fullKey,
      value,
      namespace,
      updatedAt: now,
      createdAt: existing?.createdAt ?? now,
    };

    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);

    return new Promise((resolve, reject) => {
      const request = store.put(entry);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async delete(key: string): Promise<boolean> {
    const db = await this.getDB();
    const fullKey = `${PREFIX}${key}`;
    const exists = await this.getEntry(fullKey) !== null;

    if (!exists) return false;

    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);

    return new Promise((resolve, reject) => {
      const request = store.delete(fullKey);
      request.onsuccess = () => resolve(true);
      request.onerror = () => reject(request.error);
    });
  }

  async exists(key: string): Promise<boolean> {
    return (await this.get(key)) !== null;
  }

  async list(namespace?: string): Promise<string[]> {
    const db = await this.getDB();
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);

    return new Promise((resolve, reject) => {
      const request = namespace
        ? store.index('namespace').getAllKeys(namespace)
        : store.getAllKeys();

      request.onsuccess = () => {
        const keys = (request.result as string[])
          .map(k => k.startsWith(PREFIX) ? k.slice(PREFIX.length) : k);
        resolve(keys);
      };
      request.onerror = () => reject(request.error);
    });
  }

  async clear(namespace?: string): Promise<number> {
    if (!namespace) {
      const db = await this.getDB();
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);

      return new Promise((resolve, reject) => {
        const countReq = store.count();
        countReq.onsuccess = () => {
          const count = countReq.result;
          const clearReq = store.clear();
          clearReq.onsuccess = () => resolve(count);
          clearReq.onerror = () => reject(clearReq.error);
        };
        countReq.onerror = () => reject(countReq.error);
      });
    }

    const keys = await this.list(namespace);
    const db = await this.getDB();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);

    for (const key of keys) {
      store.delete(`${PREFIX}${key}`);
    }

    return new Promise((resolve, reject) => {
      tx.oncomplete = () => resolve(keys.length);
      tx.onerror = () => reject(tx.error);
    });
  }

  async getStats(): Promise<StorageStats> {
    const db = await this.getDB();
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);

    return new Promise((resolve, reject) => {
      const request = store.getAll();
      request.onsuccess = () => {
        const entries = request.result as StoredEntry[];
        const namespaces = new Set<string>();
        let totalSizeBytes = 0;
        let oldestEntry: number | null = null;
        let newestEntry: number | null = null;

        for (const entry of entries) {
          namespaces.add(entry.namespace);
          totalSizeBytes += JSON.stringify(entry).length * 2;
          if (oldestEntry === null || entry.createdAt < oldestEntry) oldestEntry = entry.createdAt;
          if (newestEntry === null || entry.createdAt > newestEntry) newestEntry = entry.createdAt;
        }

        resolve({
          totalKeys: entries.length,
          totalSizeBytes,
          namespaces: Array.from(namespaces),
          oldestEntry,
          newestEntry,
        });
      };
      request.onerror = () => reject(request.error);
    });
  }

  private async getEntry(fullKey: string): Promise<StoredEntry | null> {
    const db = await this.getDB();
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);

    return new Promise((resolve, reject) => {
      const request = store.get(fullKey);
      request.onsuccess = () => {
        resolve((request.result as StoredEntry) ?? null);
      };
      request.onerror = () => reject(request.error);
    });
  }
}
