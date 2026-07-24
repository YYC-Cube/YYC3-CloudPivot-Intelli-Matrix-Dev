/**
 * @file hooks/useI18n.ts
 * @description 国际化 Hook · 内置 zh-CN/en-US fallback + 桥接 @yyc3/i18n-core
 *
 * 设计要点：
 * 1. 独立可用 — 未注入 i18n-core 时使用内置字典 + localStorage 持久化
 * 2. 全局统一 — 消费者注入 i18n-core I18nEngine 后，语言随主项目切换
 * 3. API 兼容 — 暴露 t(key, vars) 签名，与 i18n-core 一致
 *
 * @author YanYuCloudCube Team
 * @version v1.0.0
 */

import { useState, useCallback, useMemo, createContext, useContext, useEffect } from "react";
import { zhCN, enUS } from "../i18n";
import type { TranslationKeys } from "../i18n";
import type { AIAssistantI18nEngine } from "../types";

export type Locale = "zh-CN" | "en-US";

export interface LocaleInfo {
  code: Locale;
  label: string;
  nativeLabel: string;
}

export interface I18nContextValue {
  locale: string;
  setLocale: (locale: Locale) => void;
  t: (key: string, vars?: Record<string, string | number>) => string;
  locales: LocaleInfo[];
}

const SUPPORTED_LOCALES: LocaleInfo[] = [
  { code: "zh-CN", label: "简体中文", nativeLabel: "简体中文" },
  { code: "en-US", label: "English", nativeLabel: "English" }
];

const STORAGE_KEY = "yyc3_ai_assistant_locale";

const localeMap: Record<Locale, TranslationKeys> = {
  "zh-CN": zhCN,
  "en-US": enUS
};

function getNestedValue(obj: Record<string, unknown>, path: string): string {
  const keys = path.split(".");
  let result: unknown = obj;
  for (const k of keys) {
    if (result === null || result === undefined || typeof result !== "object") {
      return path;
    }
    result = (result as Record<string, unknown>)[k];
  }
  return typeof result === "string" ? result : path;
}

function interpolate(template: string, vars?: Record<string, string | number>): string {
  if (!vars) {
    return template;
  }
  return template.replace(/\{(\w+)\}/g, (_, key) =>
    vars[key] !== null && vars[key] !== undefined ? String(vars[key]) : `{${key}}`
  );
}

/** 默认 Context（未挂载 Provider 时的兜底） */
export const I18nContext = createContext<I18nContextValue>({
  locale: "zh-CN",
  setLocale: () => {},
  t: (key, vars) => {
    const raw = getNestedValue(zhCN as Record<string, unknown>, key);
    return vars ? interpolate(raw, vars) : raw;
  },
  locales: SUPPORTED_LOCALES
});

interface I18nProviderProps {
  children: React.ReactNode;
  /** 外部 i18n-core 引擎（可选） */
  engine?: AIAssistantI18nEngine;
  /** 初始语言（仅当未注入 engine 且 localStorage 无记录时生效） */
  defaultLocale?: Locale;
}

/**
 * I18nProvider — 应当包裹在 AIAssistant 根节点外层
 *
 * 当传入 engine 时（推荐），所有 key 将通过 i18n-core 翻译，但 fallback
 * 仍走内置字典，避免 i18n-core 未注册 ai-assistant 命名空间时显示裸 key。
 */
export function I18nProvider({ children, engine, defaultLocale = "zh-CN" }: I18nProviderProps) {
  const [internalLocale, setInternalLocale] = useState<Locale>(() => {
    if (typeof window === "undefined") {
      return defaultLocale;
    }
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (saved === "en-US" || saved === "zh-CN") {
      return saved;
    }
    return defaultLocale;
  });

  // 订阅外部 engine 语言切换
  useEffect(() => {
    if (!engine?.subscribe) {
      return;
    }
    const unsubscribe = engine.subscribe((newLocale) => {
      if (newLocale === "en-US" || newLocale === "zh-CN" || newLocale === "en") {
        const normalized: Locale = newLocale === "en" ? "en-US" : (newLocale as Locale);
        setInternalLocale(normalized);
        try {
          window.localStorage.setItem(STORAGE_KEY, normalized);
        } catch {
          // storage unavailable
        }
      }
    });
    return unsubscribe;
  }, [engine]);

  const setLocale = useCallback((newLocale: Locale) => {
    setInternalLocale(newLocale);
    try {
      window.localStorage.setItem(STORAGE_KEY, newLocale);
    } catch {
      // storage unavailable
    }
  }, []);

  const translations = useMemo(() => localeMap[internalLocale], [internalLocale]);

  const t = useCallback(
    (key: string, vars?: Record<string, string | number>): string => {
      // 1. 优先：外部 engine 翻译（消费者可通过 i18n-core 注册 ai-assistant.* 命名空间）
      if (engine) {
        const externalRaw = engine.t(key, vars);
        // i18n-core 未命中会返回 key 本身，此时回退到内置字典
        if (externalRaw && externalRaw !== key) {
          return externalRaw;
        }
      }
      // 2. Fallback：内置字典
      const raw = getNestedValue(translations as Record<string, unknown>, key);
      return interpolate(raw, vars);
    },
    [engine, translations]
  );

  const value = useMemo<I18nContextValue>(
    () => ({
      locale: engine?.locale ?? internalLocale,
      setLocale,
      t,
      locales: SUPPORTED_LOCALES
    }),
    [engine, internalLocale, setLocale, t]
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

/** 消费 i18n 上下文的快捷 Hook */
export function useI18n(): I18nContextValue {
  return useContext(I18nContext);
}
