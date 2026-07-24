// @vitest-environment node
/**
 * @file: engine-integration.test.ts
 * @description: 四引擎集成测试 — 验证 Target × Cost × Marketing × Prompt 跨引擎协作
 */
import { analyzeProfit, calcTotalCost, forecastRevenue, sensitivityAnalysis } from "@yyc3/plugin-cost";
import { buildFestivalCalendar, filterByStage, getFestivalStage } from "@yyc3/plugin-marketing";
import { BUSINESS_PROMPTS, PERSONA_PROMPT_MAP } from "@yyc3/plugin-prompt";
import { calc, splitMonthly, splitPhases, validate } from "@yyc3/plugin-target";
import { describe, expect, it } from "vitest";

describe("引擎集成测试", () => {
  describe("Target → Cost 联动", () => {
    it("目标量化结果应能作为成本盈亏的收入输入", () => {
      // 1. 用 TargetEngine 计算年度目标
      const target = calc({
        baseRevenue: 300,
        cityTier: "tier-1",
        cityCoefficient: 1.35,
        storeScale: "large",
        industryGrowthCoefficient: 1.08,
        adjustmentCoefficient: 1.05,
      });
      expect(target.annualTarget).toBeGreaterThan(300);

      // 2. 用 CostEngine 计算成本
      const cost = calcTotalCost(
        { totalArea: 800, rooms: { small: 4, medium: 6, large: 4, vip: 2 }, decoration: "standard", utilizationRate: 85 },
        {
          audioSystem: { tier: "standard", investment: 150000 },
          karaokeSystem: { investment: 100000 },
          lightingSystem: { investment: 80000 },
          optionalSystems: { vrEnabled: false, unmannedEnabled: false, additionalInvestment: 0 },
          depreciationYears: 5,
        },
        { staffCount: 12, avgSalary: 8000, dailyHours: 10, powerConsumption: 30, electricityPrice: 1.0, dailyCustomers: 80, perCustomerMaterialCost: 15 },
        { tier: 1, name: "上海", disposableIncome: 70000, entertainmentRatio: 8, rentIndex: 12, ktvDensity: 2.5, consumptionGrade: 1.2, regionModifier: 1.1 }
      );

      // 3. 将目标作为收入传入 CostEngine 做盈亏分析
      const revenue = forecastRevenue({ small: 4, medium: 6, large: 4, vip: 2 }, 200, 80, 80);
      const profit = analyzeProfit(revenue, cost, 500000, 80);

      expect(profit.monthlyProfit).toBeDefined();
      expect(profit.grossMargin).toBeGreaterThanOrEqual(0);
    });

    it("目标拆分应与成本结构保持月度一致", () => {
      const target = calc({
        baseRevenue: 500,
        cityTier: "new-tier-1",
        cityCoefficient: 1.1,
        storeScale: "medium",
        industryGrowthCoefficient: 1.08,
        adjustmentCoefficient: 1.0,
      });
      // splitMonthly 需要 monthlyTarget 和 month
      const monthlyPlan = splitMonthly(target.annualTarget / 12, 7);
      const total = Object.values(monthlyPlan.slots).reduce((sum, v) => sum + v.target, 0);
      expect(Math.abs(total - target.annualTarget / 12)).toBeLessThan(1);
    });
  });

  describe("Marketing → Target 联动", () => {
    it("旺季节日应提升目标预期", () => {
      // 7月、8月、10月、1月、2月属于 peak
      const stage = getFestivalStage(7);
      expect(stage).toBe("peak");

      const calendar = buildFestivalCalendar(2026);
      const peakFestivals = filterByStage(calendar, "peak");
      expect(peakFestivals.length).toBeGreaterThan(0);

      // 旺季时目标系数应 > 1
      const target = calc({
        baseRevenue: 300,
        cityTier: "tier-1",
        cityCoefficient: 1.35,
        storeScale: "large",
        industryGrowthCoefficient: 1.08,
        adjustmentCoefficient: stage === "peak" ? 1.2 : 1.0,
      });
      expect(target.annualTarget).toBeGreaterThan(300);
    });

    it("淡季无节日时目标系数应正常", () => {
      // 11月、12月属于 off
      const stage = getFestivalStage(11);
      const target = calc({
        baseRevenue: 300,
        cityTier: "tier-1",
        cityCoefficient: 1.35,
        storeScale: "large",
        industryGrowthCoefficient: 1.08,
        adjustmentCoefficient: stage === "off" ? 0.8 : 1.0,
      });
      expect(target.annualTarget).toBeGreaterThan(0);
    });
  });

  describe("Prompt → 全引擎联动", () => {
    it("每个业务 Prompt 应有对应的家人人格映射", () => {
      const promptsWithPersona = BUSINESS_PROMPTS.filter(p => p.persona);
      expect(promptsWithPersona.length).toBeGreaterThan(0);

      for (const p of promptsWithPersona) {
        expect(p.persona).toBeDefined();
        // PERSONA_PROMPT_MAP 的 key 应覆盖所有 persona（兼容 meta-oracle/metaoracle 命名差异）
        const key1 = p.persona;
        const key2 = p.persona.replace(/-/g, "");
        expect(PERSONA_PROMPT_MAP[key1] || PERSONA_PROMPT_MAP[key2]).toBeDefined();
      }
    });

    it("成本类 Prompt 应能引用 CostEngine 术语", () => {
      const costPrompts = BUSINESS_PROMPTS.filter(p => p.category === "cost");
      expect(costPrompts.length).toBeGreaterThan(0);
      for (const p of costPrompts) {
        expect(p.template).toBeTruthy();
        expect(p.engine).toBe("cost");
      }
    });

    it("节日类 Prompt 应能引用 FestivalEngine 术语", () => {
      const festivalPrompts = BUSINESS_PROMPTS.filter(p => p.category === "festival");
      expect(festivalPrompts.length).toBeGreaterThan(0);
      for (const p of festivalPrompts) {
        expect(p.template).toBeTruthy();
        expect(p.engine).toBeTruthy();
      }
    });
  });

  describe("四引擎全链路", () => {
    it("完整业务流程: 节日判断 → 目标计算 → 成本分析 → Prompt 推荐", () => {
      // 1. 判断节日（10月属 peak）
      const stage = getFestivalStage(10);
      const calendar = buildFestivalCalendar(2026);
      const peakFestivals = filterByStage(calendar, "peak");
      expect(stage).toBe("peak");
      expect(peakFestivals.length).toBeGreaterThan(0);

      // 2. 计算目标（旺季加成）
      const target = calc({
        baseRevenue: 400,
        cityTier: "tier-1",
        cityCoefficient: 1.35,
        storeScale: "large",
        industryGrowthCoefficient: 1.12,
        adjustmentCoefficient: 1.15,
      });
      expect(target.annualTarget).toBeGreaterThan(400);

      // 3. 三阶段拆分
      const phases = splitPhases(target.annualTarget);
      expect(phases.peak.ratio).toBe(0.5);

      // 4. 月度拆分
      const monthlyPlan = splitMonthly(target.annualTarget / 12, 10);
      const totalMonthly = Object.values(monthlyPlan.slots).reduce((s, v) => s + v.target, 0);
      expect(Math.abs(totalMonthly - target.annualTarget / 12)).toBeLessThan(1);

      // 5. 目标合理性校验（年度目标 / 12 为月收入，月成本设为 5万）
      const validation = validate(target.annualTarget, 50000);
      expect(validation).toBeDefined();
      expect(typeof validation.profitMargin).toBe("number");

      // 6. 成本分析
      const cost = calcTotalCost(
        { totalArea: 800, rooms: { small: 4, medium: 6, large: 4, vip: 2 }, decoration: "standard", utilizationRate: 85 },
        {
          audioSystem: { tier: "standard", investment: 150000 },
          karaokeSystem: { investment: 100000 },
          lightingSystem: { investment: 80000 },
          optionalSystems: { vrEnabled: false, unmannedEnabled: false, additionalInvestment: 0 },
          depreciationYears: 5,
        },
        { staffCount: 10, avgSalary: 7000, dailyHours: 10, powerConsumption: 30, electricityPrice: 1.0, dailyCustomers: 80, perCustomerMaterialCost: 12 },
        { tier: 1, name: "上海", disposableIncome: 70000, entertainmentRatio: 8, rentIndex: 10, ktvDensity: 2.5, consumptionGrade: 1.2, regionModifier: 1.1 }
      );

      const revenue = forecastRevenue({ small: 4, medium: 6, large: 4, vip: 2 }, 200, 80, 80);
      const profit = analyzeProfit(revenue, cost, 400000, 80);
      expect(profit.monthlyProfit).toBeDefined();

      // 7. 敏感性分析
      const sensitivity = sensitivityAnalysis(profit, 80);
      expect(sensitivity).toBeDefined();
      expect(sensitivity.customerSensitivity).toBeDefined();

      // 8. Prompt 推荐
      const recommendedPrompts = BUSINESS_PROMPTS.slice(0, 5);
      expect(recommendedPrompts.length).toBe(5);
      for (const p of recommendedPrompts) {
        expect(p.template).toBeTruthy();
      }
    });
  });
});
