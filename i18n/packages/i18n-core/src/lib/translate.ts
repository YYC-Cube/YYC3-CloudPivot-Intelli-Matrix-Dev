/**
 * file: translate.ts
 * description: 翻译引擎入口 — I18nManager 核心类 + 便捷 API（i18n/t）
 * author: YanYuCloudCube Team <admin@0379.email>
 * version: v2.0.0
 * created: 2026-03-21
 * updated: 2026-06-09
 * status: active
 * tags: [core],[i18n],[translate],[engine]
 *
 * brief: I18nManager 翻译引擎核心，提供语言切换、翻译与订阅机制
 *
 * details:
 * - I18nManager 单例模式管理全局语言状态
 * - setLocale() 触发所有订阅者更新
 * - t() 函数支持嵌套 key（点号分隔）和模板变量
 * - localStorage 持久化语言偏好（安全包装）
 * - subscribe() 支持 React 等框架的响应式更新
 *
 * dependencies: local-storage.js, locales/en.js, registry.js, types.js
 * exports: SUPPORTED_LOCALES, isSupportedLocale, i18n, t
 * notes: t() 函数为模块级导出，使用默认 I18nManager 实例
 */

import { getSafeLocalStorage } from "./local-storage.js";
import { en } from "../locales/en.js";
import {
  DEFAULT_LOCALE,
  SUPPORTED_LOCALES,
  isSupportedLocale,
  loadLazyLocaleTranslation,
  resolveNavigatorLocale,
} from "./registry.js";
import type { Locale, TranslationMap } from "./types.js";

type Subscriber = (locale: Locale) => void;

export { SUPPORTED_LOCALES, isSupportedLocale };

class I18nManager {
  private locale: Locale = DEFAULT_LOCALE;
  private translations: Partial<Record<Locale, TranslationMap>> = { [DEFAULT_LOCALE]: en };
  private subscribers: Set<Subscriber> = new Set();

  constructor() {
    this.loadLocale();
  }

  private readStoredLocale(): string | null {
    const storage = getSafeLocalStorage();
    if (!storage) {
      return null;
    }
    try {
      return storage.getItem("openclaw.i18n.locale");
    } catch {
      return null;
    }
  }

  private persistLocale(locale: Locale) {
    const storage = getSafeLocalStorage();
    if (!storage) {
      return;
    }
    try {
      storage.setItem("openclaw.i18n.locale", locale);
    } catch {
      // Ignore storage write failures in private/blocked contexts.
    }
  }

  private resolveInitialLocale(): Locale {
    const saved = this.readStoredLocale();
    if (saved && isSupportedLocale(saved)) {
      return saved;
    }

    const detected = resolveNavigatorLocale();

    return detected ?? DEFAULT_LOCALE;
  }

  private loadLocale() {
    const initialLocale = this.resolveInitialLocale();
    if (initialLocale === DEFAULT_LOCALE) {
      this.locale = DEFAULT_LOCALE;
      return;
    }
    // Use the normal locale setter so startup locale loading follows the same
    // translation-loading + notify path as manual locale changes.
    void this.setLocale(initialLocale);
  }

  public getLocale(): Locale {
    return this.locale;
  }

  public async setLocale(locale: Locale) {
    const needsTranslationLoad = locale !== DEFAULT_LOCALE && !this.translations[locale];
    if (this.locale === locale && !needsTranslationLoad) {
      return;
    }

    if (needsTranslationLoad) {
      try {
        const translation = await loadLazyLocaleTranslation(locale as Exclude<Locale, "en">);
        if (!translation) {
          return;
        }
        this.translations[locale] = translation;
      } catch (e) {
        console.error(`Failed to load locale: ${locale}`, e);
        return;
      }
    }

    this.locale = locale;
    this.persistLocale(locale);
    this.notify();
  }

  public registerTranslation(locale: Locale, map: TranslationMap) {
    this.translations[locale] = map;
  }

  public subscribe(sub: Subscriber) {
    this.subscribers.add(sub);
    return () => this.subscribers.delete(sub);
  }

  private notify() {
    this.subscribers.forEach((sub) => sub(this.locale));
  }

  public t(key: string, params?: Record<string, string>): string {
    const keys = key.split(".");
    let value: unknown = this.translations[this.locale] || this.translations[DEFAULT_LOCALE];

    for (const k of keys) {
      if (value && typeof value === "object") {
        value = (value as Record<string, unknown>)[k];
      } else {
        value = undefined;
        break;
      }
    }

    // Fallback to English.
    if (value === undefined && this.locale !== DEFAULT_LOCALE) {
      value = this.translations[DEFAULT_LOCALE];
      for (const k of keys) {
        if (value && typeof value === "object") {
          value = (value as Record<string, unknown>)[k];
        } else {
          value = undefined;
          break;
        }
      }
    }

    if (typeof value !== "string") {
      return key;
    }

    if (params) {
      return value.replace(/\{(\w+)\}/g, (_, k) => params[k] || `{${k}}`);
    }

    return value;
  }
}

export const i18n = new I18nManager();
export const t = (key: string, params?: Record<string, string>) => i18n.t(key, params);
