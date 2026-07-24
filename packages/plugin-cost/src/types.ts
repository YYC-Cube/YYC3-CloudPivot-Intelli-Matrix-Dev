/**
 * @file: types.ts
 * @description: 成本盈亏引擎类型定义 — 对应文档②《My-成本盈亏-计算工具》
 */

// ============================================================
// 城市数据
// ============================================================

export interface CityData {
  tier: number;            // 1-6 线
  name: string;
  /** 人均可支配收入（元/年） */
  disposableIncome: number;
  /** 娱乐消费占比（%） */
  entertainmentRatio: number;
  /** 商业租金指数（元/㎡/月） */
  rentIndex: number;
  /** KTV竞争密度（门店数/万人） */
  ktvDensity: number;
  /** 消费等级系数 */
  consumptionGrade: number;
  /** 区域修正值（华东/华南/华北/华中/西南/西北/东北） */
  regionModifier: number;
}

// ============================================================
// 场地配置
// ============================================================

export type DecorationGrade = "economy" | "standard" | "luxury";

export interface VenueConfig {
  /** 总面积（㎡） */
  totalArea: number;
  /** 包厢数量分布 */
  rooms: {
    small: number;   // 小包 15-20㎡
    medium: number;  // 中包 25-35㎡
    large: number;   // 大包 40-60㎡
    vip: number;     // VIP 80-120㎡
  };
  /** 装修档次 */
  decoration: DecorationGrade;
  /** 场地利用率（%） */
  utilizationRate: number;
}

export const DECORATION_COSTS: Record<DecorationGrade, { min: number; max: number; label: string }> = {
  economy:  { min: 800,  max: 1200, label: "经济型" },
  standard: { min: 1200, max: 2000, label: "标准型" },
  luxury:   { min: 2000, max: 3500, label: "豪华型" },
};

// ============================================================
// 设备配置
// ============================================================

export type EquipmentTier = "economy" | "standard" | "professional";

export interface EquipmentConfig {
  audioSystem: {
    tier: EquipmentTier;
    investment: number;    // 投资额（元）
  };
  karaokeSystem: {
    investment: number;
  };
  lightingSystem: {
    investment: number;
  };
  optionalSystems: {
    vrEnabled: boolean;
    unmannedEnabled: boolean;
    additionalInvestment: number;
  };
  /** 折旧年限 */
  depreciationYears: number;
}

// ============================================================
// 运营成本
// ============================================================

export interface OperationalParams {
  /** 员工数量 */
  staffCount: number;
  /** 平均工资（含社保，元/月） */
  avgSalary: number;
  /** 营业时间（小时/天） */
  dailyHours: number;
  /** 单位能耗（kW） */
  powerConsumption: number;
  /** 电价（元/kWh） */
  electricityPrice: number;
  /** 日均客流量 */
  dailyCustomers: number;
  /** 单客物料消耗（元） */
  perCustomerMaterialCost: number;
}

// ============================================================
// 成本计算结果
// ============================================================

export interface CostBreakdown {
  /** 场地月成本 */
  venue: {
    rent: number;
    decorationAmortization: number;
    total: number;
  };
  /** 设备月成本（折旧） */
  equipment: {
    totalInvestment: number;
    monthlyDepreciation: number;
  };
  /** 运营月成本 */
  operational: {
    labor: number;
    energy: number;
    material: number;
    total: number;
  };
  /** 月总成本 */
  monthlyTotal: number;
  /** 年总成本 */
  annualTotal: number;
  /** 城市成本指数 */
  cityCostIndex: number;
}

// ============================================================
// 盈亏分析
// ============================================================

export interface RevenueForecast {
  /** 包厢收入 */
  roomRevenue: number;
  /** 酒水收入 */
  beverageRevenue: number;
  /** 其他收入 */
  otherRevenue: number;
  /** 月总收入 */
  monthlyTotal: number;
}

export interface ProfitAnalysis {
  revenue: RevenueForecast;
  cost: CostBreakdown;
  /** 月利润 */
  monthlyProfit: number;
  /** 毛利率（%） */
  grossMargin: number;
  /** 净利润率（%） */
  netMargin: number;
  /** 投资回收期（月） */
  paybackPeriod: number;
  /** ROI（%） */
  roi: number;
  /** 盈亏平衡日均客流 */
  breakEvenCustomers: number;
}

// ============================================================
// 敏感性分析
// ============================================================

export interface SensitivityAnalysis {
  /** 客流量 ±10% 对利润的影响 */
  customerSensitivity: { minus10: number; plus10: number };
  /** 人均消费 ±10% 对利润的影响 */
  spendingSensitivity: { minus10: number; plus10: number };
  /** 成本 ±10% 对利润的影响 */
  costSensitivity: { minus10: number; plus10: number };
}
