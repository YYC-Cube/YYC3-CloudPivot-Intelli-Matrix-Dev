/**
 * @file: index.ts
 * @description: plugin-target 包入口
 */
export { TargetEngine } from "./target-engine";
export { calc, splitPhases, splitMonthly, validate } from "./target-engine";
export { register } from "./register";
export type {
  TargetParams,
  TargetResult,
  PhaseAllocation,
  MonthlyPlan,
  ValidationResult,
  CityTier,
  StoreScale,
  MonthlySlot,
  PhaseName,
} from "./types";
export {
  CITY_TIER_COEFFICIENTS,
  STORE_SCALE_COEFFICIENTS,
  MONTHLY_SLOT_RATIOS,
  PHASE_DEFAULTS,
} from "./types";
