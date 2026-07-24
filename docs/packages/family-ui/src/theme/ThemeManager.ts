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

import { EventEmitter } from 'eventemitter3';
import type { ThemeConfig } from './ThemeConfig.js';
import { LIGHT_THEME, BUILT_IN_THEMES } from './ThemeConfig.js';

const STORAGE_KEY = 'yyc3-theme-current';
const CUSTOM_PREFIX = 'yyc3-theme-custom-';

export type ThemeChangeCallback = (theme: ThemeConfig) => void;

export class ThemeManager extends EventEmitter {
  private current: ThemeConfig;
  private customThemes: Map<string, ThemeConfig> = new Map();

  constructor(initialThemeId?: string) {
    super();
    this.loadCustomThemes();
    const savedId = initialThemeId ?? this.loadSavedThemeId();
    this.current = this.resolveTheme(savedId) ?? LIGHT_THEME;
  }

  getTheme(): ThemeConfig {
    return { ...this.current };
  }

  setTheme(themeId: string): void {
    const theme = this.resolveTheme(themeId);
    if (theme) {
      this.current = theme;
      this.saveThemeId(themeId);
      this.emit('theme:change', this.getTheme());
    }
  }

  setCustomTheme(theme: ThemeConfig): void {
    this.customThemes.set(theme.id, theme);
    this.saveCustomTheme(theme);
    if (this.current.id === theme.id) {
      this.current = theme;
      this.emit('theme:change', this.getTheme());
    }
  }

  deleteCustomTheme(themeId: string): boolean {
    if (!this.customThemes.has(themeId)) return false;
    if (this.current.id === themeId) {
      this.current = LIGHT_THEME;
      this.emit('theme:change', this.getTheme());
    }
    this.customThemes.delete(themeId);
    this.removeCustomThemeStorage(themeId);
    return true;
  }

  getCustomThemes(): ThemeConfig[] {
    return Array.from(this.customThemes.values());
  }

  getAllThemes(): ThemeConfig[] {
    return [...Object.values(BUILT_IN_THEMES), ...this.getCustomThemes()];
  }

  getBuiltInThemes(): ThemeConfig[] {
    return Object.values(BUILT_IN_THEMES);
  }

  updateVariable<K extends keyof ThemeConfig>(key: K, value: ThemeConfig[K]): void {
    (this.current as any)[key] = value;
    if (this.customThemes.has(this.current.id)) {
      this.saveCustomTheme(this.current);
    }
    this.emit('theme:variable', { key, value });
    this.emit('theme:change', this.getTheme());
  }

  updateMemberColor(memberId: string, color: string): void {
    this.current.memberColors[memberId] = color;
    if (this.customThemes.has(this.current.id)) {
      this.saveCustomTheme(this.current);
    }
    this.emit('theme:member-color', { memberId, color });
    this.emit('theme:change', this.getTheme());
  }

  exportTheme(theme?: ThemeConfig): string {
    return JSON.stringify(theme ?? this.current, null, 2);
  }

  importTheme(json: string): ThemeConfig {
    const theme = JSON.parse(json) as ThemeConfig;
    if (!theme.id || !theme.name || !theme.colors) {
      throw new Error('Invalid theme format');
    }
    if (BUILT_IN_THEMES[theme.id]) {
      theme.id = `custom-${theme.id}`;
    }
    this.setCustomTheme(theme);
    return theme;
  }

  onThemeChange(callback: ThemeChangeCallback): () => void {
    this.on('theme:change', callback);
    return () => this.off('theme:change', callback);
  }

  resetToDefault(): void {
    this.setTheme('light');
  }

  private resolveTheme(id: string | undefined): ThemeConfig | undefined {
    if (!id) return undefined;
    if (BUILT_IN_THEMES[id]) return BUILT_IN_THEMES[id];
    if (this.customThemes.has(id)) return this.customThemes.get(id);
    return undefined;
  }

  private loadSavedThemeId(): string | undefined {
    try {
      if (typeof localStorage === 'undefined') return undefined;
      return localStorage.getItem(STORAGE_KEY) ?? undefined;
    } catch {
      return undefined;
    }
  }

  private saveThemeId(id: string): void {
    try {
      if (typeof localStorage === 'undefined') return;
      localStorage.setItem(STORAGE_KEY, id);
    } catch { /* storage unavailable */ }
  }

  private loadCustomThemes(): void {
    try {
      if (typeof localStorage === 'undefined') return;
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(CUSTOM_PREFIX)) {
          const raw = localStorage.getItem(key);
          if (raw) {
            try {
              const theme = JSON.parse(raw) as ThemeConfig;
              this.customThemes.set(theme.id, theme);
            } catch { /* skip corrupt */ }
          }
        }
      }
    } catch { /* storage unavailable */ }
  }

  private saveCustomTheme(theme: ThemeConfig): void {
    try {
      if (typeof localStorage === 'undefined') return;
      localStorage.setItem(`${CUSTOM_PREFIX}${theme.id}`, JSON.stringify(theme));
    } catch { /* storage unavailable */ }
  }

  private removeCustomThemeStorage(themeId: string): void {
    try {
      if (typeof localStorage === 'undefined') return;
      localStorage.removeItem(`${CUSTOM_PREFIX}${themeId}`);
    } catch { /* storage unavailable */ }
  }

  destroy(): void {
    this.removeAllListeners();
  }
}
