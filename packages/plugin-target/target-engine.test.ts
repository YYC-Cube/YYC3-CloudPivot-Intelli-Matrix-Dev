// @vitest-environment node
/**
 * @file: target-engine.test.ts
 * @description: 目标量化引擎测试 — 20+测试用例覆盖正常/边界/异常
 */

import { describe, expect, it } from "vitest";
import { calc, splitMonthly, splitPhases, validate } from "./src/target-engine";
import type { TargetParams } from "./src/types";
import { CITY_TIER_COEFFICIENTS, MONTHLY_SLOT_RATIOS, PHASE_DEFAULTS, STORE_SCALE_COEFFICIENTS } from "./src/types";

describe("TargetEngine.calc — X公式计算", () => {
  // ── 正常值 ──────────────────────────────────────────
  it("一线城市中型门店正常增速", () => {
    const params: TargetParams = {
      baseRevenue: 500,
      cityTier: "tier-1",
      cityCoefficient: 1.3,
      storeScale: "medium",
      industryGrowthCoefficient: 1.08,
      adjustmentCoefficient: 1.0,
    };
    const result = calc(params);
    // 500 × 1.3 × 1.0 × 1.08 × 1.0 = 702
    expect(result.annualTarget).toBe(702);
    expect(result.targetMultiplier).toBe(1.404);
    expect(result.breakdown.storeScaleCoefficient).toBe(1.0);
  });

  it("新一线城市大型门店新店开业", () => {
    const params: TargetParams = {
      baseRevenue: 300,
      cityTier: "new-tier-1",
      cityCoefficient: 1.1,
      storeScale: "large",
      industryGrowthCoefficient: 1.05,
      adjustmentCoefficient: 0.85,
    };
    const result = calc(params);
    // 300 × 1.1 × 1.1 × 1.05 × 0.85 = 323.98
    expect(result.annualTarget).toBeCloseTo(323.98, 1);
    expect(result.targetMultiplier).toBeGreaterThan(1.0);
  });

  it("三线城市VIP型门店装修升级", () => {
    const params: TargetParams = {
      baseRevenue: 200,
      cityTier: "tier-3",
      cityCoefficient: 0.7,
      storeScale: "vip",
      industryGrowthCoefficient: 1.10,
      adjustmentCoefficient: 1.08,
    };
    const result = calc(params);
    // 200 × 0.7 × 1.2 × 1.10 × 1.08 = 199.58
    expect(result.annualTarget).toBeCloseTo(199.58, 1);
  });

  // ── 精度验证 ──────────────────────────────────────────
  it("结果保留两位小数", () => {
    const params: TargetParams = {
      baseRevenue: 123.456,
      cityTier: "tier-2",
      cityCoefficient: 0.9,
      storeScale: "medium",
      industryGrowthCoefficient: 1.07,
      adjustmentCoefficient: 1.0,
    };
    const result = calc(params);
    expect(result.annualTarget.toString().split(".")[1]?.length).toBeLessThanOrEqual(2);
  });

  // ── 边界值 ──────────────────────────────────────────
  it("基础营收为0时结果为0", () => {
    const params: TargetParams = {
      baseRevenue: 0,
      cityTier: "tier-1",
      cityCoefficient: 1.5,
      storeScale: "large",
      industryGrowthCoefficient: 1.10,
      adjustmentCoefficient: 1.0,
    };
    expect(calc(params).annualTarget).toBe(0);
  });

  it("所有系数取最大值", () => {
    const params: TargetParams = {
      baseRevenue: 1000,
      cityTier: "tier-1",
      cityCoefficient: 1.5,
      storeScale: "vip",
      industryGrowthCoefficient: 1.10,
      adjustmentCoefficient: 1.1,
    };
    const result = calc(params);
    // 1000 × 1.5 × 1.2 × 1.10 × 1.1 = 2178
    expect(result.annualTarget).toBeCloseTo(2178, 0);
  });

  it("所有系数取最小值", () => {
    const params: TargetParams = {
      baseRevenue: 100,
      cityTier: "tier-5",
      cityCoefficient: 0.3,
      storeScale: "small",
      industryGrowthCoefficient: 1.05,
      adjustmentCoefficient: 0.8,
    };
    const result = calc(params);
    // 100 × 0.3 × 0.9 × 1.05 × 0.8 = 22.68
    expect(result.annualTarget).toBeCloseTo(22.68, 1);
  });

  // ── 公式验证 ──────────────────────────────────────────
  it("formula字符串包含所有系数", () => {
    const params: TargetParams = {
      baseRevenue: 500,
      cityTier: "tier-1",
      cityCoefficient: 1.3,
      storeScale: "medium",
      industryGrowthCoefficient: 1.08,
      adjustmentCoefficient: 1.0,
    };
    const result = calc(params);
    expect(result.formula).toContain("500");
    expect(result.formula).toContain("1.3");
    expect(result.formula).toContain("1.0");
    expect(result.formula).toContain("1.08");
    expect(result.formula).toContain("702");
  });
});

describe("TargetEngine.splitPhases — 三阶段拆分", () => {
  it("旺季占比50%", () => {
    const phases = splitPhases(1000);
    expect(phases.peak.ratio).toBe(0.5);
    expect(phases.peak.target).toBe(500);
  });

  it("平季占比30%", () => {
    const phases = splitPhases(1000);
    expect(phases.stable.ratio).toBe(0.3);
    expect(phases.stable.target).toBe(300);
  });

  it("淡季占比20%", () => {
    const phases = splitPhases(1000);
    expect(phases.off.ratio).toBe(0.2);
    expect(phases.off.target).toBe(200);
  });

  it("三阶段目标之和等于年度目标", () => {
    const phases = splitPhases(777.77);
    const total = phases.peak.target + phases.stable.target + phases.off.target;
    expect(total).toBeCloseTo(777.77, 1);
  });

  it("阶段天数之和约等于365天", () => {
    const phases = splitPhases(1000);
    expect(phases.peak.days + phases.stable.days + phases.off.days).toBe(365);
  });
});

describe("TargetEngine.splitMonthly — 月度节点拆分", () => {
  it("5个时段占比之和等于1", () => {
    const plan = splitMonthly(100, 1);
    const totalRatio =
      plan.slots.opening.ratio +
      plan.slots.peak.ratio +
      plan.slots.breakthrough.ratio +
      plan.slots.sprint.ratio +
      plan.slots.closing.ratio;
    expect(totalRatio).toBeCloseTo(1.0, 2);
  });

  it("月初开门红占比5%", () => {
    const plan = splitMonthly(1000, 3);
    expect(plan.slots.opening.ratio).toBe(0.05);
    expect(plan.slots.opening.target).toBe(50);
  });

  it("下旬冲刺期占比30%为最大时段", () => {
    const plan = splitMonthly(1000, 6);
    const maxSlot = Object.values(plan.slots).reduce((max, s) => (s.ratio > max.ratio ? s : max));
    expect(maxSlot.ratio).toBe(0.30);
    expect(maxSlot).toBe(plan.slots.sprint);
  });

  it("5个时段目标之和等于月度目标", () => {
    const plan = splitMonthly(333.33, 9);
    const total = plan.slots.opening.target + plan.slots.peak.target + plan.slots.breakthrough.target + plan.slots.sprint.target + plan.slots.closing.target;
    expect(total).toBeCloseTo(333.33, 1);
  });

  it("月份正确返回", () => {
    const plan = splitMonthly(100, 7);
    expect(plan.month).toBe(7);
  });
});

describe("TargetEngine.validate — 目标校验", () => {
  it("利润率≥20%判定为合理", () => {
    // 年目标1200万，月成本50万 → 月收入100万，利润50万，利润率50%
    const result = validate(1200, 50);
    expect(result.isValid).toBe(true);
    expect(result.profitMargin).toBeGreaterThanOrEqual(20);
    expect(result.suggestion).toContain("充足");
  });

  it("利润率15%-20%判定为达标", () => {
    // 年目标600万，月成本42.5万 → 月收入50万，利润7.5万，利润率15%
    const result = validate(600, 42.5);
    expect(result.isValid).toBe(true);
    expect(result.profitMargin).toBeGreaterThanOrEqual(15);
    expect(result.suggestion).toContain("成本控制");
  });

  it("利润率0%-15%判定为需调整", () => {
    // 年目标480万，月成本40万 → 月收入40万，利润0万，利润率0%
    const result = validate(480, 40);
    expect(result.isValid).toBe(false);
    expect(result.suggestion).toContain("调整系数");
  });

  it("亏损状态触发回调预警", () => {
    // 年目标360万，月成本40万 → 月收入30万，利润-10万，利润率-33.3%
    const result = validate(360, 40);
    expect(result.isValid).toBe(false);
    expect(result.profitMargin).toBeLessThan(0);
    expect(result.suggestion).toContain("回调");
  });

  it("盈亏平衡点等于月成本", () => {
    const result = validate(1200, 50);
    expect(result.breakEvenPoint).toBe(50);
  });
});

describe("TargetEngine — 常量验证", () => {
  it("城市等级系数6个等级全覆盖", () => {
    expect(Object.keys(CITY_TIER_COEFFICIENTS)).toHaveLength(6);
  });

  it("门店规模系数4种全覆盖", () => {
    expect(Object.keys(STORE_SCALE_COEFFICIENTS)).toHaveLength(4);
  });

  it("月度时段5个全覆盖", () => {
    expect(Object.keys(MONTHLY_SLOT_RATIOS)).toHaveLength(5);
  });

  it("三阶段默认天数之和为365", () => {
    expect(PHASE_DEFAULTS.peak.days + PHASE_DEFAULTS.stable.days + PHASE_DEFAULTS.off.days).toBe(365);
  });
});
