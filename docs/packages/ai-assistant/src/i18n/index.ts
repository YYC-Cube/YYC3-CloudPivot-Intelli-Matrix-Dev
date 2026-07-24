/**
 * @file i18n/index.ts
 * @description i18n 入口 · 内置 zh-CN/en-US + 可桥接 @yyc3/i18n-core
 * @author YanYuCloudCube Team
 * @version v1.1.0
 */

export { zhCN } from "./zh-CN";
export type { TranslationKeys } from "./zh-CN";
export { enUS } from "./en-US";
export { createI18nCoreAdapter } from "./adapter";
