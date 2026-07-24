/**
 * @file index.ts
 * @description @yyc3/ai-assistant 模块导出入口
 * @author YanYuCloudCube Team
 * @version v1.1.0
 */

// 主组件
export { AIAssistant } from "./AIAssistant";

// i18n 系统
export { I18nContext, I18nProvider, useI18n } from "./hooks/useI18n";
export type {
  I18nContextValue,
  Locale,
  LocaleInfo
} from "./hooks/useI18n";
export { createI18nCoreAdapter, enUS, zhCN } from "./i18n";
export type { TranslationKeys } from "./i18n";

// 类型
export type {
  AIAssistantI18nEngine, AIAssistantProps, AIConfigState, AITab,
  ChatMessage, ChatState, CommandCategory,
  FloatingPanelState
} from "./types";

// Hooks（消费者可单独使用）
export {
  HooksProvider, useAIConfig, useChat, useDraggable, useFloatingPanel, useInjectedHooks
} from "./hooks";
export type {
  HooksOverride, Position, UseAIConfigReturn, UseChatOptions,
  UseChatReturn, UseDraggableOptions,
  UseDraggableReturn, UseFloatingPanelOptions,
  UseFloatingPanelReturn
} from "./hooks";

// 常量
export {
  CMD_CATEGORIES,
  PROMPT_PRESETS, SYSTEM_COMMANDS
} from "./constants";
export type { CommandCategoryKey, PromptPreset, SystemCommand } from "./constants";

// 组件（消费者可单独组合）
export {
  ChatPanel,
  CommandsPanel, FloatingButton,
  PanelHeader, PromptsPanel,
  SettingsPanel
} from "./components";

// UI 原子组件
export { Slider, Tabs, TabsContent, TabsList, TabsTrigger } from "./ui";
