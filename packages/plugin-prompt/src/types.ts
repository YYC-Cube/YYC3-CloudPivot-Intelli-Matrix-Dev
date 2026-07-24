/**
 * @file: types.ts
 * @description: 提示词库类型定义 — 对应文档④《My-经管运维工具提示词》
 */

export type PromptCategory =
  | "cost"          // 成本盈亏
  | "festival"      // 节日管理
  | "marketing"     // 营销策划
  | "diagnosis"     // 综合诊断
  | "fullpipeline"; // 全链路

export type PersonaId =
  | "navigator"     // 言启·千行
  | "thinker"       // 语枢·万物
  | "prophet"       // 预见·先知
  | "bolero"        // 千里·伯乐
  | "meta-oracle"   // 元启·天枢
  | "sentinel"      // 智云·守护
  | "master"        // 格物·宗师
  | "creative";     // 创想·灵韵

export interface BusinessPrompt {
  /** Prompt ID */
  id: string;
  /** 名称 */
  name: string;
  /** 对应文档编号（如 1.1, 2.3, 3.1） */
  docRef: string;
  /** 分类 */
  category: PromptCategory;
  /** 绑定的家人人格 */
  persona: PersonaId;
  /** Prompt 模板内容 */
  template: string;
  /** 输入参数描述 */
  inputs: string[];
  /** 输出格式描述 */
  outputFormat: string;
  /** 关联的引擎 */
  engine?: "target" | "cost" | "marketing";
}

export interface PersonaMapping {
  persona: PersonaId;
  personaName: string;
  promptIds: string[];
}
