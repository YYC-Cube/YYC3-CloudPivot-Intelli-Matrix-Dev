/**
 * @file types.ts
 * @description AI 助手类型定义（共用包版本）
 * @author YanYuCloudCube Team
 * @version v1.2.0
 */

/** AI 助理聊天消息 */
export interface ChatMessage {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: number;
}

/** AI 助理系统命令类别 */
export type CommandCategory = "cluster" | "model" | "data" | "security" | "monitor";

export type AITab = "chat" | "commands" | "prompts" | "settings";

export interface FloatingPanelState {
  isOpen: boolean;
  isMaximized: boolean;
  activeTab: AITab;
}

export interface ChatState {
  messages: ChatMessage[];
  inputValue: string;
  isTyping: boolean;
  systemPrompt: string;
}

export interface AIConfigState {
  apiKey: string;
  selectedModel: string;
  temperature: number;
  topP: number;
  maxTokens: number;
}

export interface AIAssistantProps {
  isMobile?: boolean;
  /** 可选注入外部 i18n 引擎（来自 @yyc3/i18n-core），未注入时使用内置 zh-CN/en-US */
  i18nEngine?: AIAssistantI18nEngine;
}

/**
 * 外部 i18n 引擎接口（与 @yyc3/i18n-core 的 I18nEngine 子集兼容）
 * 消费者可传入 i18n-core 实例以统一全局语言切换。
 */
export interface AIAssistantI18nEngine {
  locale: string;
  t: (key: string, vars?: Record<string, string | number>) => string;
  subscribe?: (listener: (locale: string) => void) => () => void;
}
