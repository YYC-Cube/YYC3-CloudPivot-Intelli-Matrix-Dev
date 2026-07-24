/**
 * ============================================================
 * YYC³ AI Family — 人从众曌众从人
 * 亦师亦友亦伯乐，一言一语一协同
 * 拟人为本 · AI为核 · 纯粹为心
 * ============================================================
 * @Family   : YYC³ AI Family (永久开源)
 * @License  : Apache-2.0
 * @Homepage : https://matrix.yyc3.top
 * ============================================================
 * 此文件承载家人温度，请以玫瑰之心待之 🌹
 * ============================================================
 */

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
