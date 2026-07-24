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

import type { StorageAdapter } from '@yyc3/family-core';

const CHAT_KEY_PREFIX = 'yyc3-chat-history';
const I18N_KEY = 'yyc3-i18n-locale';
const ACHIEVEMENTS_KEY = 'yyc3-achievements';
const SETTINGS_KEY = 'yyc3-settings';

export class LocalPersister {
  constructor(private adapter: StorageAdapter) {}

  async saveChatHistory(memberId: string, history: unknown[]): Promise<void> {
    await this.adapter.set(`${CHAT_KEY_PREFIX}:${memberId}`, history, 'chat');
  }

  async loadChatHistory(memberId: string): Promise<unknown[]> {
    const data = await this.adapter.get<unknown[]>(`${CHAT_KEY_PREFIX}:${memberId}`);
    return data ?? [];
  }

  async deleteChatHistory(memberId: string): Promise<boolean> {
    return this.adapter.delete(`${CHAT_KEY_PREFIX}:${memberId}`);
  }

  async saveLocale(locale: string): Promise<void> {
    await this.adapter.set(I18N_KEY, locale, 'settings');
  }

  async loadLocale(): Promise<string | null> {
    return this.adapter.get<string>(I18N_KEY);
  }

  async saveAchievements(achievements: unknown[]): Promise<void> {
    await this.adapter.set(ACHIEVEMENTS_KEY, achievements, 'achievements');
  }

  async loadAchievements(): Promise<unknown[]> {
    const data = await this.adapter.get<unknown[]>(ACHIEVEMENTS_KEY);
    return data ?? [];
  }

  async saveSettings(settings: Record<string, unknown>): Promise<void> {
    await this.adapter.set(SETTINGS_KEY, settings, 'settings');
  }

  async loadSettings(): Promise<Record<string, unknown> | null> {
    return this.adapter.get<Record<string, unknown>>(SETTINGS_KEY);
  }

  async clearAll(): Promise<number> {
    return this.adapter.clear();
  }
}
