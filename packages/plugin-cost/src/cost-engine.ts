/**
 * @file: cost-engine.ts
 * @description: 成本盈亏核心计算引擎 — 动态成本核算 + 盈亏分析
 */

import type {
  CityData,
  VenueConfig,
  EquipmentConfig,
  OperationalParams,
  CostBreakdown,
  RevenueForecast,
  ProfitAnalysis,
  SensitivityAnalysis,
} from "./types";
import { DECORATION_COSTS } from "./types";

// ============================================================
// 城市成本指数 = 基础成本 × 消费等级系数 × 区域修正值
// ============================================================

export function calcCityCostIndex(city: CityData): number {
  const baseCost = city.rentIndex;
  return Number((baseCost * city.consumptionGrade * city.regionModifier).toFixed(2));
}

// ============================================================
// 场地成本计算
// ============================================================

export function calcVenueCost(venue: VenueConfig, city: CityData): CostBreakdown["venue"] {
  const monthlyRent = Number((venue.totalArea * city.rentIndex * (venue.utilizationRate / 100)).toFixed(2));

  const decoRange = DECORATION_COSTS[venue.decoration];
  const avgDecoCost = (decoRange.min + decoRange.max) / 2;
  const totalDecoration = venue.totalArea * avgDecoCost;
  const monthlyDecoAmortization = Number((totalDecoration / 36).toFixed(2)); // 3年摊销

  return {
    rent: monthlyRent,
    decorationAmortization: monthlyDecoAmortization,
    total: Number((monthlyRent + monthlyDecoAmortization).toFixed(2)),
  };
}

// ============================================================
// 设备成本计算（月折旧）
// ============================================================

export function calcEquipmentCost(equipment: EquipmentConfig): CostBreakdown["equipment"] {
  const totalInvestment =
    equipment.audioSystem.investment +
    equipment.karaokeSystem.investment +
    equipment.lightingSystem.investment +
    equipment.optionalSystems.additionalInvestment;

  const monthlyDepreciation = Number((totalInvestment / (equipment.depreciationYears * 12)).toFixed(2));

  return { totalInvestment, monthlyDepreciation };
}

// ============================================================
// 运营成本计算
// ============================================================

export function calcOperationalCost(params: OperationalParams): CostBreakdown["operational"] {
  const labor = params.staffCount * params.avgSalary;
  const energy = params.dailyHours * params.powerConsumption * params.electricityPrice * 30;
  const material = params.dailyCustomers * params.perCustomerMaterialCost * 30;

  return {
    labor: Number(labor.toFixed(2)),
    energy: Number(energy.toFixed(2)),
    material: Number(material.toFixed(2)),
    total: Number((labor + energy + material).toFixed(2)),
  };
}

// ============================================================
// 全成本汇总
// ============================================================

export function calcTotalCost(
  venue: VenueConfig,
  equipment: EquipmentConfig,
  operational: OperationalParams,
  city: CityData,
): CostBreakdown {
  const venueCost = calcVenueCost(venue, city);
  const equipmentCost = calcEquipmentCost(equipment);
  const operationalCost = calcOperationalCost(operational);
  const cityCostIndex = calcCityCostIndex(city);

  const monthlyTotal = Number((venueCost.total + equipmentCost.monthlyDepreciation + operationalCost.total).toFixed(2));

  return {
    venue: venueCost,
    equipment: equipmentCost,
    operational: operationalCost,
    monthlyTotal,
    annualTotal: Number((monthlyTotal * 12).toFixed(2)),
    cityCostIndex,
  };
}

// ============================================================
// 收入预测
// ============================================================

export function forecastRevenue(
  rooms: VenueConfig["rooms"],
  avgRoomPrice: number,
  dailyCustomers: number,
  avgBeverageSpending: number,
): RevenueForecast {
  const totalRooms = rooms.small + rooms.medium + rooms.large + rooms.vip;
  const utilizationRate = 0.65; // 默认65%时段利用率
  const avgHoursPerDay = 6;
  const roomRevenue = totalRooms * utilizationRate * avgHoursPerDay * avgRoomPrice * 30;
  const beverageRevenue = dailyCustomers * avgBeverageSpending * 30;
  const otherRevenue = roomRevenue * 0.05; // 其他收入按包厢收入5%

  return {
    roomRevenue: Number(roomRevenue.toFixed(2)),
    beverageRevenue: Number(beverageRevenue.toFixed(2)),
    otherRevenue: Number(otherRevenue.toFixed(2)),
    monthlyTotal: Number((roomRevenue + beverageRevenue + otherRevenue).toFixed(2)),
  };
}

// ============================================================
// 盈亏分析
// ============================================================

export function analyzeProfit(
  revenue: RevenueForecast,
  cost: CostBreakdown,
  totalInvestment: number,
  dailyCustomers: number,
): ProfitAnalysis {
  const monthlyProfit = revenue.monthlyTotal - cost.monthlyTotal;
  const grossMargin = revenue.monthlyTotal > 0 ? (monthlyProfit / revenue.monthlyTotal) * 100 : 0;
  const netMargin = grossMargin; // 简化：净利润率≈毛利率（未含税）
  const paybackPeriod = monthlyProfit > 0 ? totalInvestment / monthlyProfit : Infinity;
  const roi = totalInvestment > 0 ? (monthlyProfit * 12 / totalInvestment) * 100 : 0;

  // 盈亏平衡日均客流 = 月总成本 / (客单价 × 30)
  const avgRevenuePerCustomer = dailyCustomers > 0 ? revenue.monthlyTotal / (dailyCustomers * 30) : 0;
  const breakEvenCustomers = avgRevenuePerCustomer > 0 ? cost.monthlyTotal / (avgRevenuePerCustomer * 30) : 0;

  return {
    revenue,
    cost,
    monthlyProfit: Number(monthlyProfit.toFixed(2)),
    grossMargin: Number(grossMargin.toFixed(1)),
    netMargin: Number(netMargin.toFixed(1)),
    paybackPeriod: paybackPeriod === Infinity ? Infinity : Number(paybackPeriod.toFixed(1)),
    roi: Number(roi.toFixed(1)),
    breakEvenCustomers: Number(breakEvenCustomers.toFixed(0)),
  };
}

// ============================================================
// 敏感性分析
// ============================================================

export function sensitivityAnalysis(
  profit: ProfitAnalysis,
  dailyCustomers: number,
): SensitivityAnalysis {
  const baseProfit = profit.monthlyProfit;
  const baseRevenue = profit.revenue.monthlyTotal;
  const baseCost = profit.cost.monthlyTotal;

  return {
    customerSensitivity: {
      minus10: Number((baseRevenue * 0.9 - baseCost - baseProfit).toFixed(2)),
      plus10: Number((baseRevenue * 1.1 - baseCost - baseProfit).toFixed(2)),
    },
    spendingSensitivity: {
      minus10: Number((baseRevenue * 0.9 - baseCost - baseProfit).toFixed(2)),
      plus10: Number((baseRevenue * 1.1 - baseCost - baseProfit).toFixed(2)),
    },
    costSensitivity: {
      minus10: Number((baseProfit + baseCost * 0.1).toFixed(2)),
      plus10: Number((baseProfit - baseCost * 0.1).toFixed(2)),
    },
  };
}

// ============================================================
// 导出引擎对象
// ============================================================

export const CostEngine = {
  calcCityCostIndex,
  calcVenueCost,
  calcEquipmentCost,
  calcOperationalCost,
  calcTotalCost,
  forecastRevenue,
  analyzeProfit,
  sensitivityAnalysis,
};
