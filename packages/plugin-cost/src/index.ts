/**
 * @file: index.ts
 * @description: plugin-cost 包入口
 */
export { CostEngine } from "./cost-engine";
export {
  calcCityCostIndex, calcVenueCost, calcEquipmentCost,
  calcOperationalCost, calcTotalCost,
  forecastRevenue, analyzeProfit, sensitivityAnalysis,
} from "./cost-engine";
export { register } from "./register";
export type {
  CityData, VenueConfig, EquipmentConfig, OperationalParams,
  CostBreakdown, RevenueForecast, ProfitAnalysis, SensitivityAnalysis,
  DecorationGrade, EquipmentTier,
} from "./types";
export { DECORATION_COSTS } from "./types";
