/**
 * @file: types.ts
 * @description: 目标量化引擎类型定义 — 对应文档①《My-经管运维-目标量化》
 */

// ============================================================
// 城市等级
// ============================================================

export type CityTier =
  | "tier-1"       // 一线城市
  | "new-tier-1"   // 新一线城市
  | "tier-2"       // 二线城市
  | "tier-3"       // 三线城市
  | "tier-4"       // 四线城市
  | "tier-5";      // 五线城市

/** 城市等级系数范围 */
export const CITY_TIER_COEFFICIENTS: Record<CityTier, { min: number; max: number; label: string }> = {
  "tier-1":     { min: 1.2, max: 1.5, label: "一线城市" },
  "new-tier-1": { min: 1.0, max: 1.2, label: "新一线城市" },
  "tier-2":     { min: 0.8, max: 1.0, label: "二线城市" },
  "tier-3":     { min: 0.6, max: 0.8, label: "三线城市" },
  "tier-4":     { min: 0.4, max: 0.6, label: "四线城市" },
  "tier-5":     { min: 0.3, max: 0.4, label: "五线城市" },
};

// ============================================================
// 门店规模
// ============================================================

export type StoreScale =
  | "small"    // 小型 (<1500㎡, 5-8间包厢)
  | "medium"   // 中型 (1500-3000㎡, 9-15间包厢)
  | "large"    // 大型 (>3000㎡, 16间以上包厢)
  | "vip";     // VIP型 (>3000㎡, 含VIP包厢80-120㎡)

export const STORE_SCALE_COEFFICIENTS: Record<StoreScale, { value: number; label: string; areaRange: string }> = {
  small:  { value: 0.9,  label: "小型门店", areaRange: "<1500㎡" },
  medium: { value: 1.0,  label: "中型门店", areaRange: "1500-3000㎡" },
  large:  { value: 1.1,  label: "大型门店", areaRange: ">3000㎡" },
  vip:    { value: 1.2,  label: "VIP型门店", areaRange: ">3000㎡(含VIP)" },
};

// ============================================================
// 目标计算输入参数
// ============================================================

export interface TargetParams {
  /** 基础营收基数（上年度实际营收，单位：万元） */
  baseRevenue: number;
  /** 城市等级 */
  cityTier: CityTier;
  /** 城市等级系数（在对应范围内取值） */
  cityCoefficient: number;
  /** 门店规模 */
  storeScale: StoreScale;
  /** 行业增速系数（2025预测增速5%-10%，对应1.05-1.10） */
  industryGrowthCoefficient: number;
  /** 调整系数（新店0.8-0.9 / 装修升级1.05-1.1 / 高竞争0.95-1.0 / 正常1.0） */
  adjustmentCoefficient: number;
}

// ============================================================
// 目标计算结果
// ============================================================

export interface TargetResult {
  /** 年度营收总目标 X（万元） */
  annualTarget: number;
  /** 目标倍数（相对基础营收） */
  targetMultiplier: number;
  /** 各系数明细 */
  breakdown: {
    baseRevenue: number;
    cityCoefficient: number;
    storeScaleCoefficient: number;
    industryGrowthCoefficient: number;
    adjustmentCoefficient: number;
  };
  /** 计算过程描述 */
  formula: string;
}

// ============================================================
// 三阶段拆分
// ============================================================

export type PhaseName = "peak" | "stable" | "off";

export interface PhaseAllocation {
  /** 旺季攻坚（爆点） */
  peak:   { ratio: number; target: number; days: number; description: string };
  /** 平季深耕（稳点） */
  stable: { ratio: number; target: number; days: number; description: string };
  /** 淡季蓄能（躺平优化） */
  off:    { ratio: number; target: number; days: number; description: string };
}

// ============================================================
// 月度节点拆分
// ============================================================

export type MonthlySlot =
  | "opening"     // 月初开门红
  | "peak"        // 上旬消费高峰
  | "breakthrough" // 中旬突破期
  | "sprint"      // 下旬突破期
  | "closing";    // 月末收官期

export interface MonthlyPlan {
  month: number;
  slots: Record<MonthlySlot, {
    ratio: number;
    target: number;
    dateRange: string;
    description: string;
  }>;
}

// ============================================================
// 校验结果
// ============================================================

export interface ValidationResult {
  isValid: boolean;
  /** 预期月利润率 */
  profitMargin: number;
  /** 盈亏平衡点（月度） */
  breakEvenPoint: number;
  /** 建议信息 */
  suggestion: string;
}

// ============================================================
// 月度时段默认占比
// ============================================================

export const MONTHLY_SLOT_RATIOS: Record<MonthlySlot, { ratio: number; label: string; dateRange: string }> = {
  opening:      { ratio: 0.05, label: "月初开门红",   dateRange: "1-2日" },
  peak:         { ratio: 0.25, label: "上旬消费高峰", dateRange: "3-10日" },
  breakthrough: { ratio: 0.20, label: "中旬突破期",   dateRange: "16-18日" },
  sprint:       { ratio: 0.30, label: "下旬突破期",   dateRange: "25-28日" },
  closing:      { ratio: 0.20, label: "月末收官期",   dateRange: "29日-月末" },
};

// ============================================================
// 三阶段默认配置
// ============================================================

export const PHASE_DEFAULTS = {
  peak:   { ratio: 0.50, days: 102, description: "旺季攻坚（爆点）— 春节/国庆/暑期" },
  stable: { ratio: 0.30, days: 153, description: "平季深耕（稳点）— 清明/端午/520" },
  off:    { ratio: 0.20, days: 110, description: "淡季蓄能（躺平优化）— 双11/双12/元旦" },
} as const;
