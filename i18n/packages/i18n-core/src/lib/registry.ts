/**
 * file: registry.ts
 * description: 语言注册表 — 懒加载 locale 翻译模块的注册与加载管理
 * author: YanYuCloudCube Team <admin@0379.email>
 * version: v2.0.0
 * created: 2026-03-21
 * updated: 2026-06-09
 * status: active
 * tags: [core],[i18n],[locale],[registry]
 *
 * brief: 管理支持语言列表、懒加载语言包及 navigator locale 解析
 *
 * details:
 * - DEFAULT_LOCALE 定义默认语言（en）
 * - LAZY_LOCALES 定义需要动态加载的语言列表（9 种语言）
 * - LAZY_LOCALE_REGISTRY 管理各语言包的动态 import
 * - resolveNavigatorLocale() 解析浏览器语言首选项
 * - loadLazyLocaleTranslation() 按需加载语言包，避免全量引入
 *
 * dependencies: locales/*.ts (dynamic import), types.js
 * exports: DEFAULT_LOCALE, SUPPORTED_LOCALES, LAZY_LOCALES,
 *          isSupportedLocale, loadLazyLocaleTranslation, resolveNavigatorLocale
 * notes: 新增语言需同步更新 LAZY_LOCALES 和 LAZY_LOCALE_REGISTRY
 */

import type { Locale, TranslationMap } from "./types.js";

type LazyLocale = Exclude<Locale, "en">;
type LocaleModule = Record<string, TranslationMap>;

type LazyLocaleRegistration = {
  exportName: string;
  loader: () => Promise<LocaleModule>;
};

export const DEFAULT_LOCALE: Locale = "en";

const LAZY_LOCALES: readonly LazyLocale[] = [
  "zh-CN",
  "zh-TW",
  "ja",
  "ko",
  "fr",
  "de",
  "es",
  "pt-BR",
  "ar",
];

const LAZY_LOCALE_REGISTRY: Record<LazyLocale, LazyLocaleRegistration> = {
  "zh-CN": {
    exportName: "zh_CN",
    loader: () => import("../locales/zh-CN.js"),
  },
  "zh-TW": {
    exportName: "zh_TW",
    loader: () => import("../locales/zh-TW.js"),
  },
  ja: {
    exportName: "ja",
    loader: () => import("../locales/ja.js"),
  },
  ko: {
    exportName: "ko",
    loader: () => import("../locales/ko.js"),
  },
  fr: {
    exportName: "fr",
    loader: () => import("../locales/fr.js"),
  },
  de: {
    exportName: "de",
    loader: () => import("../locales/de.js"),
  },
  es: {
    exportName: "es",
    loader: () => import("../locales/es.js"),
  },
  "pt-BR": {
    exportName: "pt_BR",
    loader: () => import("../locales/pt-BR.js"),
  },
  ar: {
    exportName: "ar",
    loader: () => import("../locales/ar.js"),
  },
};

export const SUPPORTED_LOCALES: ReadonlyArray<Locale> = [DEFAULT_LOCALE, ...LAZY_LOCALES];

export function isSupportedLocale(locale: string): locale is Locale {
  return SUPPORTED_LOCALES.includes(locale as Locale);
}

export async function loadLazyLocaleTranslation(locale: LazyLocale): Promise<TranslationMap> {
  const registration = LAZY_LOCALE_REGISTRY[locale];

  if (!registration) {
    throw new Error(`Unsupported locale: ${locale}`);
  }

  const module = await registration.loader();
  return module[registration.exportName] as TranslationMap;
}

export function resolveNavigatorLocale(): Locale | null {
  if (typeof navigator === 'undefined') return null;

  const browserLocales = navigator.languages || [navigator.language];

  for (const locale of browserLocales) {
    if (isSupportedLocale(locale)) {
      return locale;
    }

    // Try base language (e.g., "zh" from "zh-CN")
    const baseLang = locale.split('-')[0];
    if (baseLang && isSupportedLocale(baseLang as Locale)) {
      return baseLang as Locale;
    }
  }

  return null;
}
