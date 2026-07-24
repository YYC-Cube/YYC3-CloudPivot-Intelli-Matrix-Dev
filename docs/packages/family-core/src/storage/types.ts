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

export interface StorageEntry<T = unknown> {
  key: string;
  value: T;
  namespace: string;
  updatedAt: number;
  createdAt: number;
}

export interface StorageQuery {
  namespace?: string;
  prefix?: string;
  since?: number;
  limit?: number;
}

export interface StorageStats {
  totalKeys: number;
  totalSizeBytes: number;
  namespaces: string[];
  oldestEntry: number | null;
  newestEntry: number | null;
}

export interface StorageAdapter {
  get<T = unknown>(key: string): Promise<T | null>;
  set<T = unknown>(key: string, value: T, namespace?: string): Promise<void>;
  delete(key: string): Promise<boolean>;
  exists(key: string): Promise<boolean>;
  list(namespace?: string): Promise<string[]>;
  clear(namespace?: string): Promise<number>;
  getStats(): Promise<StorageStats>;
}

export interface ExportData {
  version: string;
  exportedAt: number;
  namespaces: Record<string, Record<string, unknown>>;
  metadata: {
    source: string;
    totalKeys: number;
    checksum: string;
  };
}
