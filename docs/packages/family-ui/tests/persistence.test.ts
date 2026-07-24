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

import { describe, it, expect, beforeEach } from 'vitest';
import { LocalPersister } from '../src/persistence/LocalPersister.js';
import type { StorageAdapter } from '@yyc3/family-core';

class MockAdapter implements StorageAdapter {
  private store: Map<string, unknown> = new Map();
  private namespace: Map<string, string> = new Map();

  async get<T = unknown>(key: string): Promise<T | null> {
    return (this.store.get(key) as T) ?? null;
  }
  async set<T = unknown>(key: string, value: T, namespace?: string): Promise<void> {
    this.store.set(key, value);
    if (namespace) this.namespace.set(key, namespace);
  }
  async delete(key: string): Promise<boolean> {
    return this.store.delete(key);
  }
  async exists(key: string): Promise<boolean> {
    return this.store.has(key);
  }
  async list(_namespace?: string): Promise<string[]> {
    return Array.from(this.store.keys());
  }
  async clear(_namespace?: string): Promise<number> {
    const size = this.store.size;
    this.store.clear();
    return size;
  }
  async getStats(): Promise<any> {
    return { totalKeys: this.store.size, totalSizeBytes: 0, namespaces: [], oldestEntry: null, newestEntry: null };
  }
}

describe('LocalPersister', () => {
  let persister: LocalPersister;
  let adapter: MockAdapter;

  beforeEach(() => {
    adapter = new MockAdapter();
    persister = new LocalPersister(adapter);
  });

  it('should save and load chat history', async () => {
    const history = [
      { role: 'user', content: 'Hello' },
      { role: 'assistant', content: 'Hi!' },
    ];
    await persister.saveChatHistory('qianhang', history);
    const loaded = await persister.loadChatHistory('qianhang');
    expect(loaded).toEqual(history);
  });

  it('should return empty array for missing chat history', async () => {
    const loaded = await persister.loadChatHistory('qianhang');
    expect(loaded).toEqual([]);
  });

  it('should delete chat history', async () => {
    await persister.saveChatHistory('qianhang', [{ msg: 'test' }]);
    const deleted = await persister.deleteChatHistory('qianhang');
    expect(deleted).toBe(true);
    const loaded = await persister.loadChatHistory('qianhang');
    expect(loaded).toEqual([]);
  });

  it('should save and load locale', async () => {
    await persister.saveLocale('zh-CN');
    const locale = await persister.loadLocale();
    expect(locale).toBe('zh-CN');
  });

  it('should return null for missing locale', async () => {
    const locale = await persister.loadLocale();
    expect(locale).toBeNull();
  });

  it('should save and load achievements', async () => {
    const achievements = [
      { id: 'first-chat', unlockedAt: Date.now() },
      { id: 'power-user', unlockedAt: Date.now() },
    ];
    await persister.saveAchievements(achievements);
    const loaded = await persister.loadAchievements();
    expect(loaded).toEqual(achievements);
  });

  it('should return empty array for missing achievements', async () => {
    const loaded = await persister.loadAchievements();
    expect(loaded).toEqual([]);
  });

  it('should save and load settings', async () => {
    const settings = { theme: 'dark', fontSize: 14, notifications: true };
    await persister.saveSettings(settings);
    const loaded = await persister.loadSettings();
    expect(loaded).toEqual(settings);
  });

  it('should return null for missing settings', async () => {
    const loaded = await persister.loadSettings();
    expect(loaded).toBeNull();
  });

  it('should clear all data', async () => {
    await persister.saveChatHistory('qianhang', [{ msg: 'hi' }]);
    await persister.saveLocale('en-US');
    await persister.saveAchievements([{ id: 'a1' }]);
    await persister.saveSettings({ theme: 'light' });
    const cleared = await persister.clearAll();
    expect(cleared).toBeGreaterThanOrEqual(4);
  });

  it('should handle separate chat histories per member', async () => {
    await persister.saveChatHistory('qianhang', [{ msg: 'nav' }]);
    await persister.saveChatHistory('tianshu', [{ msg: 'orchestrate' }]);
    expect(await persister.loadChatHistory('qianhang')).toEqual([{ msg: 'nav' }]);
    expect(await persister.loadChatHistory('tianshu')).toEqual([{ msg: 'orchestrate' }]);
  });

  it('should overwrite existing data', async () => {
    await persister.saveLocale('en-US');
    await persister.saveLocale('zh-CN');
    expect(await persister.loadLocale()).toBe('zh-CN');
  });
});
