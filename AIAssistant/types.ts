/**
 * @file: types.ts
 * @description: AIAssistant 所有类型定义
 */
import type React from "react";

/** 聊天消息 */
export interface ChatMessage {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: number;
  personaId?: string;
  emotion?: string;
}

export type CommandCategory = "cluster" | "model" | "data" | "security" | "monitor";

/** 系统命令 */
export interface SystemCommand {
  id: string;
  icon: React.ElementType;
  label: string;
  desc: string;
  category: CommandCategory;
  action: string;
  color: string;
  persona?: string;
}

/** 提示词预设 */
export interface PromptPreset {
  id: string;
  name: string;
  prompt: string;
  category: string;
}

/** 模型选项 */
export interface ModelOption {
  id: string;
  name: string;
  provider: string;
  isLocal: boolean;
}

/** AI Family 家人人格 */
export interface FamilyPersona {
  id: string;
  name: string;
  shortName: string;
  enTitle: string;
  role: string;
  color: string;
  icon: React.ElementType;
  personality: string;
  expertise: string[];
  greeting: string;
  mood: string;
  modelName?: string;
}

/** AI 技能 */
export interface AISkill {
  id: string;
  name: string;
  description: string;
  icon: React.ElementType;
  category: string;
  color: string;
  active: boolean;
}

/** 插件 */
export interface AIPlugin {
  id: string;
  name: string;
  description: string;
  version: string;
  icon: React.ElementType;
  color: string;
  category: string;
  enabled: boolean;
}

/** 模块 */
export interface AIModule {
  id: string;
  name: string;
  description: string;
  size: string;
  icon: React.ElementType;
  color: string;
  loaded: boolean;
}

export type TabKey = "chat" | "commands" | "people" | "skills" | "plugins" | "modules" | "prompts" | "settings";

/** 所有 Tab 配置 */
export interface TabConfig {
  key: TabKey;
  icon: React.ElementType;
  label: string;
}

/** 组件 Props */
export interface AIAssistantProps {
  isMobile?: boolean;
  models?: ModelOption[];
  apiKey?: string;
  baseUrl?: string;
  loading?: boolean;
  /** 渲染模式: floating = 浮动按钮+面板, inline = 内嵌面板 */
  mode?: "floating" | "inline";
  /** inline 模式下是否默认展开 */
  defaultOpen?: boolean;
}
