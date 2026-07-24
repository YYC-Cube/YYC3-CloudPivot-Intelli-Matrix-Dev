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
 * @file AuditLogger.ts
 * @description 审计日志系统 — 支持文件持久化、监听器、查询统计
 * @module security
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import { logger } from '../deps/logger.js';
import { metrics } from '../deps/metrics.js';

export type AuditLogLevel = 'info' | 'warn' | 'error' | 'critical';
export type AuditCategory = 'auth' | 'skill' | 'message' | 'bridge' | 'security' | 'system';

export interface AuditEntry {
  id: string;
  timestamp: number;
  level: AuditLogLevel;
  category: AuditCategory;
  action: string;
  actor: string;
  target?: string;
  details?: Record<string, unknown>;
  result: 'success' | 'failure' | 'denied';
  durationMs?: number;
}

export interface AuditQuery {
  level?: AuditLogLevel;
  category?: AuditCategory;
  actor?: string;
  target?: string;
  result?: AuditEntry['result'];
  from?: number;
  to?: number;
  limit?: number;
}

export interface AuditLoggerConfig {
  /** 内存最大条目数 */
  maxEntries?: number;
  /** 持久化文件路径（可选），启用文件持久化 */
  persistPath?: string;
  /** 是否自动刷新到文件 */
  autoFlush?: boolean;
  /** 刷新间隔（ms） */
  flushInterval?: number;
}

const DEFAULT_CONFIG: Required<AuditLoggerConfig> = {
  maxEntries: 10_000,
  persistPath: '',
  autoFlush: true,
  flushInterval: 5_000,
};

export class AuditLogger {
  private entries: AuditEntry[] = [];
  private maxEntries: number;
  private counter = 0;
  private listeners: Array<(entry: AuditEntry) => void> = [];
  private persistPath: string;
  private autoFlush: boolean;
  private flushTimer: ReturnType<typeof setInterval> | null = null;
  private dirty = false;

  constructor(config: AuditLoggerConfig | number = {}) {
    const cfg = typeof config === 'number'
      ? { ...DEFAULT_CONFIG, maxEntries: config }
      : { ...DEFAULT_CONFIG, ...config };
    this.maxEntries = cfg.maxEntries;
    this.persistPath = cfg.persistPath;
    this.autoFlush = cfg.autoFlush;

    // 从文件恢复持久化数据
    if (this.persistPath) {
      this.loadFromFile();
      if (this.autoFlush) {
        this.flushTimer = setInterval(() => this.flushToFile(), cfg.flushInterval);
      }
    }
  }

  log(
    level: AuditLogLevel,
    category: AuditCategory,
    action: string,
    actor: string,
    result: AuditEntry['result'],
    options?: { target?: string; details?: Record<string, unknown>; durationMs?: number },
  ): AuditEntry {
    const entry: AuditEntry = {
      id: `audit-${Date.now()}-${(++this.counter).toString(36)}`,
      timestamp: Date.now(),
      level,
      category,
      action,
      actor,
      target: options?.target,
      details: options?.details,
      result,
      durationMs: options?.durationMs,
    };

    this.entries.push(entry);
    this.dirty = true;
    metrics.increment('yyc3_audit_log_entries_total', 1, { level: entry.level, category: entry.category });

    // FIFO 裁剪
    if (this.entries.length > this.maxEntries) {
      this.entries.splice(0, this.entries.length - this.maxEntries);
    }

    // 通知监听器
    for (const listener of this.listeners) {
      try { listener(entry); } catch { /* ignore */ }
    }

    return entry;
  }

  info(category: AuditCategory, action: string, actor: string, options?: { target?: string; details?: Record<string, unknown> }): AuditEntry {
    return this.log('info', category, action, actor, 'success', options);
  }

  warn(category: AuditCategory, action: string, actor: string, options?: { target?: string; details?: Record<string, unknown> }): AuditEntry {
    return this.log('warn', category, action, actor, 'failure', options);
  }

  error(category: AuditCategory, action: string, actor: string, options?: { target?: string; details?: Record<string, unknown> }): AuditEntry {
    return this.log('error', category, action, actor, 'failure', options);
  }

  denied(category: AuditCategory, action: string, actor: string, options?: { target?: string; details?: Record<string, unknown> }): AuditEntry {
    return this.log('critical', category, action, actor, 'denied', options);
  }

  query(query: AuditQuery): AuditEntry[] {
    let results = this.entries;
    if (query.level) results = results.filter(e => e.level === query.level);
    if (query.category) results = results.filter(e => e.category === query.category);
    if (query.actor) results = results.filter(e => e.actor === query.actor);
    if (query.target) results = results.filter(e => e.target === query.target);
    if (query.result) results = results.filter(e => e.result === query.result);
    if (query.from) results = results.filter(e => e.timestamp >= query.from!);
    if (query.to) results = results.filter(e => e.timestamp <= query.to!);
    results.sort((a, b) => b.timestamp - a.timestamp);
    if (query.limit) results = results.slice(0, query.limit);
    return results;
  }

  getStats(): { total: number; byLevel: Record<AuditLogLevel, number>; byCategory: Record<AuditCategory, number> } {
    const byLevel = { info: 0, warn: 0, error: 0, critical: 0 };
    const byCategory = { auth: 0, skill: 0, message: 0, bridge: 0, security: 0, system: 0 };
    for (const entry of this.entries) { byLevel[entry.level]++; byCategory[entry.category]++; }
    return { total: this.entries.length, byLevel, byCategory };
  }

  onEntry(listener: (entry: AuditEntry) => void): () => void {
    this.listeners.push(listener);
    return () => {
      const idx = this.listeners.indexOf(listener);
      if (idx >= 0) this.listeners.splice(idx, 1);
    };
  }

  /** 手动刷新到文件（同步写入确保立即持久化） */
  flush(): void {
    if (!this.persistPath || !this.dirty) return;
    this.flushToFileSync();
  }

  /** 同步写入到文件 */
  private flushToFileSync(): void {
    try {
      const dir = path.dirname(this.persistPath);
      if (!fs.existsSync(dir)) { fs.mkdirSync(dir, { recursive: true }); }
      const lines = this.entries.map(e => JSON.stringify(e)).join('\n') + '\n';
      fs.writeFileSync(this.persistPath, lines, 'utf-8');
      this.dirty = false;
    } catch (err) {
      logger.error(`审计日志同步写入失败: ${err}`, 'AuditLogger');
    }
  }

  /** 导出全量审计条目（用于备份 / 迁移） */
  exportAll(): AuditEntry[] {
    return [...this.entries];
  }

  /** 导入审计条目 */
  importAll(entries: AuditEntry[]): void {
    this.entries.push(...entries);
    this.dirty = true;
  }

  clear(): void {
    this.entries = [];
    this.dirty = true;
  }

  /** 销毁定时器，释放资源 */
  dispose(): void {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
      this.flushTimer = null;
    }
    if (this.persistPath && this.dirty) {
      this.flushToFileSync();
    }
    this.listeners = [];
  }

  // ═══ 文件持久化 ═══

  private loadFromFile(): void {
    if (!this.persistPath || !fs.existsSync(this.persistPath)) return;
    try {
      const data = fs.readFileSync(this.persistPath, 'utf-8');
      const lines = data.split('\n').filter(Boolean);
      this.entries = lines.map(line => {
        try { return JSON.parse(line) as AuditEntry; } catch { return null; }
      }).filter(Boolean) as AuditEntry[];
      logger.info(`审计日志已从 ${this.persistPath} 恢复 ${this.entries.length} 条`, 'AuditLogger');
    } catch (err) {
      logger.error(`审计日志恢复失败: ${err}`, 'AuditLogger');
    }
  }

  private flushToFile(): void {
    if (!this.persistPath || !this.dirty) return;
    try {
      const dir = path.dirname(this.persistPath);
      if (!fs.existsSync(dir)) { fs.mkdirSync(dir, { recursive: true }); }
      const stream = fs.createWriteStream(this.persistPath, { flags: 'w' });
      for (const entry of this.entries) {
        stream.write(JSON.stringify(entry) + '\n');
      }
      stream.end();
      this.dirty = false;
    } catch (err) {
      logger.error(`审计日志写入失败: ${err}`, 'AuditLogger');
    }
  }
}
