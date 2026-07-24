/**
 * @file: index.ts
 * @description: AIAssistant 模块化版本导出入口 v3.0
 *
 * 导出:
 *   AIAssistant     - 主组件 (默认 floating 模式)
 *   AIAssistantProps - 组件 Props 类型
 *
 * 使用:
 *   <AIAssistant />                    ← 浮动按钮+面板 (默认)
 *   <AIAssistant mode="inline" />      ← 内嵌面板 (嵌入其他页面)
 */
export { AIAssistant, default } from "./AIAssistant";
export type { AIAssistantProps } from "./types";
