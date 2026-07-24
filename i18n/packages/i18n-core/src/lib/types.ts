/**
 * file: types.ts
 * description: 核心类型定义 — Locale、TranslationMap 及引擎配置接口
 * author: YanYuCloudCube Team <admin@0379.email>
 * version: v2.0.0
 * created: 2026-03-21
 * updated: 2026-06-09
 * status: active
 * tags: [type],[i18n],[locale],[translation]
 *
 * brief: i18n-core 的全部 TypeScript 类型导出
 *
 * details:
 * - Locale 联合类型定义所有支持语言（en | zh-CN | zh-TW | ja | ko | fr | de | es | pt-BR | ar）
 * - TranslationMap 递归嵌套翻译字典类型
 * - 所有接口均为纯类型，不含实现代码
 *
 * dependencies: 无
 * exports: Locale, TranslationMap
 * notes: 新增语言时需同步更新 Locale 联合类型
 */

export type TranslationMap = { [key: string]: string | TranslationMap };

export type Locale =
    | "en"
    | "zh-CN"
    | "zh-TW"
    | "ja"
    | "ko"
    | "fr"
    | "de"
    | "es"
    | "pt-BR"
    | "ar";

export type RTLLocale = Extract<Locale, "ar">;

export interface I18nConfig {
    locale: Locale;
    fallbackLocale: Locale;
    translations: Partial<Record<Locale, TranslationMap>>;
    rtlSupport?: boolean;
}

// Patch: Intl.getCanonicalLocales added in ES2020 — not included in ES2022 lib
declare global {
    namespace Intl {
        function getCanonicalLocales(locales: readonly string[]): string[];
    }
}
