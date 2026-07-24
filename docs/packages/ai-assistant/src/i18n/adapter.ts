/**
 * @file i18n/adapter.ts
 * @description @yyc3/i18n-core 桥接适配器
 *
 * 当主项目已集成 @yyc3/i18n-core 时，使用此适配器可将全局语言切换
 * 自动同步到 AIAssistant，并让 t() 走 i18n-core 的引擎（含缓存、
 * ICU、AI 翻译、插件链等所有能力）。
 *
 * 使用示例：
 *   import { i18n } from "@yyc3/i18n-core";
 *   import { AIAssistant, createI18nCoreAdapter } from "@yyc3/ai-assistant";
 *
 *   <AIAssistant i18nEngine={createI18nCoreAdapter(i18n)} />
 *
 * @author YanYuCloudCube Team
 * @version v1.0.0
 */

import type { AIAssistantI18nEngine } from "../types";

/**
 * i18n-core I18nEngine 的最小兼容接口
 * （避免在 peer optional 模式下硬依赖 i18n-core 的具体类）
 */
interface I18nCoreEngineLike {
  locale: string;
  t: (key: string, vars?: Record<string, string | number>) => string;
  subscribe?: (listener: (locale: string) => void) => () => void;
}

/**
 * 创建 i18n-core 桥接适配器
 *
 * @param engine @yyc3/i18n-core 的 I18nEngine 实例（通常从 `i18n` 单例导入）
 * @returns AIAssistant 可识别的 i18n 引擎对象
 */
export function createI18nCoreAdapter(engine: I18nCoreEngineLike): AIAssistantI18nEngine {
  return {
    locale: engine.locale,
    t: engine.t,
    subscribe: engine.subscribe
  };
}
