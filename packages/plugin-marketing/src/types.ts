/**
 * @file: types.ts
 * @description: 节日营销引擎类型定义 — 对应文档③《My-营销工具-构建方案》
 */

// ============================================================
// 节日类型（6类）
// ============================================================

export type FestivalType =
  | "legal"        // 法定节假日
  | "folk"         // 民俗节假日
  | "marketing"    // 网络营销日
  | "local"        // 地方特殊假日
  | "brand"        // 品牌庆典日
  | "store";       // 门店活动日

export const FESTIVAL_TYPE_LABELS: Record<FestivalType, string> = {
  legal:     "法定节假日",
  folk:      "民俗节假日",
  marketing: "网络营销日",
  local:     "地方特殊假日",
  brand:     "品牌庆典日",
  store:     "门店活动日",
};

// ============================================================
// 节日归属阶段
// ============================================================

export type FestivalStage = "peak" | "stable" | "off";

export const STAGE_LABELS: Record<FestivalStage, string> = {
  peak:   "旺季攻坚",
  stable: "平季深耕",
  off:    "淡季蓄能",
};

// ============================================================
// 节日数据结构
// ============================================================

export interface Festival {
  /** 节日ID */
  id: string;
  /** 节日名称 */
  name: string;
  /** 节日类型 */
  type: FestivalType;
  /** 公历日期（月，1-12） */
  month: number;
  /** 公历日期（日） */
  day: number;
  /** 持续天数（默认1天） */
  duration: number;
  /** 是否农历节日 */
  isLunar: boolean;
  /** 农历月（仅 isLunar=true 时有效） */
  lunarMonth?: number;
  /** 农历日（仅 isLunar=true 时有效） */
  lunarDay?: number;
  /** 归属阶段 */
  stage: FestivalStage;
  /** 区域适配性 */
  region: "national" | "regional" | "city" | "store";
  /** 营销力度权重（1-5，5为最高） */
  marketingWeight: number;
}

// ============================================================
// 营销动作
// ============================================================

export type ActionType = "prepare" | "execute" | "review";

export interface FestivalAction {
  /** 动作类型 */
  type: ActionType;
  /** 触发时间（相对节日：负数=节前，0=节日当天，正数=节后） */
  triggerOffset: number;
  /** 动作描述 */
  description: string;
  /** 关联YYC³系统模块 */
  modules: string[];
}

// ============================================================
// 营销动作模板
// ============================================================

export interface ActionTemplate {
  /** 适配节日类型 */
  festivalType: FestivalType;
  /** 动作列表 */
  actions: FestivalAction[];
}

// ============================================================
// 节日计算结果
// ============================================================

export interface FestivalCalendarEntry {
  festival: Festival;
  /** 公历日期对象 */
  solarDate: Date;
  /** 日期字符串 YYYY-MM-DD */
  dateStr: string;
  /** 星期几（0=日, 1=一, ..., 6=六） */
  weekday: number;
  /** 关联的营销动作 */
  actions: FestivalAction[];
}

// ============================================================
// 资源预配置
// ============================================================

export interface ResourceAllocation {
  /** 资源类型 */
  type: "rooms" | "beverage" | "staff";
  /** 配置依据 */
  basis: string;
  /** 自动化动作 */
  action: string;
  /** 示例 */
  example: string;
}
