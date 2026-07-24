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

import { StorageManager } from '../storage/StorageManager.js';
import type { ExportData } from '../storage/types.js';
import { TrustGuard } from '../trust/TrustGuard.js';

export interface SovereigntyReport {
  storageKeys: number;
  namespaces: string[];
  totalSizeBytes: number;
  trustGuardEnabled: boolean;
  trustViolations: number;
  lastExportAt: number | null;
  lastResetAt: number | null;
}

export class UserSovereignty {
  private storage: StorageManager;
  private trustGuard: TrustGuard;
  private lastExportAt: number | null = null;
  private lastResetAt: number | null = null;

  constructor(storage?: StorageManager, trustGuard?: TrustGuard) {
    this.storage = storage ?? new StorageManager();
    this.trustGuard = trustGuard ?? new TrustGuard();
  }

  getStorageManager(): StorageManager {
    return this.storage;
  }

  getTrustGuard(): TrustGuard {
    return this.trustGuard;
  }

  enableProtection(): void {
    this.trustGuard.enable();
  }

  disableProtection(): void {
    this.trustGuard.disable();
  }

  async exportData(): Promise<ExportData> {
    const data = await this.storage.exportAll();
    this.lastExportAt = Date.now();
    return data;
  }

  async importData(json: string): Promise<{ imported: number; skipped: number }> {
    const data = JSON.parse(json) as ExportData;
    return this.storage.importData(data);
  }

  async deleteNamespace(namespace: string): Promise<number> {
    return this.storage.clear(namespace);
  }

  async deleteKey(key: string): Promise<boolean> {
    return this.storage.delete(key);
  }

  async resetAll(): Promise<void> {
    await this.storage.reset();
    this.lastResetAt = Date.now();
  }

  async getReport(): Promise<SovereigntyReport> {
    const stats = await this.storage.getStats();
    const trustReport = this.trustGuard.getReport();
    return {
      storageKeys: stats.totalKeys,
      namespaces: stats.namespaces,
      totalSizeBytes: stats.totalSizeBytes,
      trustGuardEnabled: trustReport.enabled,
      trustViolations: trustReport.totalViolations,
      lastExportAt: this.lastExportAt,
      lastResetAt: this.lastResetAt,
    };
  }

  destroy(): void {
    this.trustGuard.destroy();
  }
}
