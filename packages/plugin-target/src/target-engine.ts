/**
 * @file: target-engine.ts
 * @description: 目标量化核心计算引擎 — X公式 + 三阶段拆分 + 月度节点
 */

import type {
  TargetParams,
  TargetResult,
  PhaseAllocation,
  MonthlyPlan,
  ValidationResult,
  MonthlySlot,
} from "./types";
import {
  STORE_SCALE_COEFFICIENTS,
  PHASE_DEFAULTS,
  MONTHLY_SLOT_RATIOS,
} from "./types";

// ============================================================
// 核心计算：X = 基础基数 × 城市系数 × 规模系数 × 增速系数 × 调整系数
// ============================================================

export function calc(params: TargetParams): TargetResult {
  const { baseRevenue, cityCoefficient, storeScale, industryGrowthCoefficient, adjustmentCoefficient } = params;

  const storeScaleCoefficient = STORE_SCALE_COEFFICIENTS[storeScale].value;
  const annualTarget = Number((
    baseRevenue *
    cityCoefficient *
    storeScaleCoefficient *
    industryGrowthCoefficient *
    adjustmentCoefficient
  ).toFixed(2));

  const targetMultiplier = Number((annualTarget / baseRevenue).toFixed(3));

  return {
    annualTarget,
    targetMultiplier,
    breakdown: {
      baseRevenue,
      cityCoefficient,
      storeScaleCoefficient,
      industryGrowthCoefficient,
      adjustmentCoefficient,
    },
    formula: `${baseRevenue} × ${cityCoefficient} × ${storeScaleCoefficient} × ${industryGrowthCoefficient} × ${adjustmentCoefficient} = ${annualTarget}`,
  };
}

// ============================================================
// 三阶段拆分：旺季50% / 平季30% / 淡季20%
// ============================================================

export function splitPhases(annualTarget: number): PhaseAllocation {
  return {
    peak: {
      ratio: PHASE_DEFAULTS.peak.ratio,
      target: Number((annualTarget * PHASE_DEFAULTS.peak.ratio).toFixed(2)),
      days: PHASE_DEFAULTS.peak.days,
      description: PHASE_DEFAULTS.peak.description,
    },
    stable: {
      ratio: PHASE_DEFAULTS.stable.ratio,
      target: Number((annualTarget * PHASE_DEFAULTS.stable.ratio).toFixed(2)),
      days: PHASE_DEFAULTS.stable.days,
      description: PHASE_DEFAULTS.stable.description,
    },
    off: {
      ratio: PHASE_DEFAULTS.off.ratio,
      target: Number((annualTarget * PHASE_DEFAULTS.off.ratio).toFixed(2)),
      days: PHASE_DEFAULTS.off.days,
      description: PHASE_DEFAULTS.off.description,
    },
  };
}

// ============================================================
// 月度节点拆分：开门红5% + 高峰25% + 突破20% + 冲刺30% + 收官20%
// ============================================================

export function splitMonthly(monthlyTarget: number, month: number): MonthlyPlan {
  const slots = {} as MonthlyPlan["slots"];

  (Object.keys(MONTHLY_SLOT_RATIOS) as MonthlySlot[]).forEach((key) => {
    const config = MONTHLY_SLOT_RATIOS[key];
    slots[key] = {
      ratio: config.ratio,
      target: Number((monthlyTarget * config.ratio).toFixed(2)),
      dateRange: config.dateRange,
      description: config.label,
    };
  });

  return { month, slots };
}

// ============================================================
// 目标合理性校验：利润率 ≥ 15%
// ============================================================

export function validate(annualTarget: number, monthlyCost: number): ValidationResult {
  const monthlyRevenue = annualTarget / 12;
  const monthlyProfit = monthlyRevenue - monthlyCost;
  const profitMargin = monthlyRevenue > 0 ? Number(((monthlyProfit / monthlyRevenue) * 100).toFixed(1)) : 0;
  const breakEvenPoint = monthlyCost;

  const isValid = profitMargin >= 15;

  let suggestion: string;
  if (profitMargin >= 20) {
    suggestion = "目标设定合理，利润空间充足";
  } else if (profitMargin >= 15) {
    suggestion = "目标达到最低利润率要求，建议关注成本控制";
  } else if (profitMargin >= 0) {
    suggestion = "利润率低于15%阈值，建议调整系数（行业增速+0.03 或 调整系数+0.05）";
  } else {
    suggestion = "目标亏损！必须回调X值：降低基础营收基数或提升城市/规模系数";
  }

  return { isValid, profitMargin, breakEvenPoint, suggestion };
}

// ============================================================
// 导出引擎对象
// ============================================================

export const TargetEngine = {
  calc,
  splitPhases,
  splitMonthly,
  validate,
};
