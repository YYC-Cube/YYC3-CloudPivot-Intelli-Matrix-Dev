// @vitest-environment node
/**
 * @file: cost-engine.test.ts
 * @description: 成本盈亏引擎测试 — 覆盖场地/设备/运营/盈亏/敏感性
 */

import { describe, expect, it } from "vitest";
import {
  analyzeProfit,
  calcCityCostIndex,
  calcEquipmentCost,
  calcOperationalCost,
  calcTotalCost,
  calcVenueCost,
  forecastRevenue,
  sensitivityAnalysis
} from "./src/cost-engine";
import type { CityData, EquipmentConfig, OperationalParams, VenueConfig } from "./src/types";
import { DECORATION_COSTS } from "./src/types";

// ── 测试数据 ──────────────────────────────────────────

const mockCity: CityData = {
  tier: 1,
  name: "北京",
  disposableIncome: 75000,
  entertainmentRatio: 8.5,
  rentIndex: 12,
  ktvDensity: 2.5,
  consumptionGrade: 1.5,
  regionModifier: 1.1,
};

const mockVenue: VenueConfig = {
  totalArea: 2000,
  rooms: { small: 4, medium: 6, large: 3, vip: 2 },
  decoration: "standard",
  utilizationRate: 85,
};

const mockEquipment: EquipmentConfig = {
  audioSystem: { tier: "professional", investment: 500000 },
  karaokeSystem: { investment: 300000 },
  lightingSystem: { investment: 200000 },
  optionalSystems: { vrEnabled: true, unmannedEnabled: false, additionalInvestment: 100000 },
  depreciationYears: 5,
};

const mockOperational: OperationalParams = {
  staffCount: 20,
  avgSalary: 8000,
  dailyHours: 12,
  powerConsumption: 50,
  electricityPrice: 1.2,
  dailyCustomers: 150,
  perCustomerMaterialCost: 8,
};

describe("CostEngine.calcCityCostIndex — 城市成本指数", () => {
  it("一线城市成本指数正确计算", () => {
    // 12 × 1.5 × 1.1 = 19.8
    const result = calcCityCostIndex(mockCity);
    expect(result).toBe(19.8);
  });

  it("三线城市成本指数较低", () => {
    const city3: CityData = { ...mockCity, rentIndex: 5, consumptionGrade: 0.8, regionModifier: 0.95 };
    // 5 × 0.8 × 0.95 = 3.8
    expect(calcCityCostIndex(city3)).toBe(3.8);
  });

  it("保留两位小数", () => {
    const city: CityData = { ...mockCity, rentIndex: 7.777, consumptionGrade: 1.234, regionModifier: 1.111 };
    const result = calcCityCostIndex(city);
    expect(result.toString().split(".")[1]?.length).toBeLessThanOrEqual(2);
  });
});

describe("CostEngine.calcVenueCost — 场地成本", () => {
  it("月租金 = 面积 × 租金指数 × 利用率", () => {
    // 2000 × 12 × 0.85 = 20400
    const result = calcVenueCost(mockVenue, mockCity);
    expect(result.rent).toBe(20400);
  });

  it("装修摊销 = 面积 × 均价 / 36月", () => {
    const venue: VenueConfig = { ...mockVenue, decoration: "standard" };
    const avgCost = (DECORATION_COSTS.standard.min + DECORATION_COSTS.standard.max) / 2;
    // 2000 × 1600 / 36 = 88888.89
    const expected = Number((2000 * avgCost / 36).toFixed(2));
    const result = calcVenueCost(venue, mockCity);
    expect(result.decorationAmortization).toBe(expected);
  });

  it("场地总成本 = 租金 + 摊销", () => {
    const result = calcVenueCost(mockVenue, mockCity);
    expect(result.total).toBe(Number((result.rent + result.decorationAmortization).toFixed(2)));
  });

  it("经济型装修成本低于豪华型", () => {
    const eco = calcVenueCost({ ...mockVenue, decoration: "economy" }, mockCity);
    const lux = calcVenueCost({ ...mockVenue, decoration: "luxury" }, mockCity);
    expect(eco.decorationAmortization).toBeLessThan(lux.decorationAmortization);
  });
});

describe("CostEngine.calcEquipmentCost — 设备成本", () => {
  it("设备总投资 = 音响 + 点歌 + 灯光 + 附加", () => {
    const result = calcEquipmentCost(mockEquipment);
    expect(result.totalInvestment).toBe(1100000);
  });

  it("月折旧 = 总投资 / (年限 × 12)", () => {
    const result = calcEquipmentCost(mockEquipment);
    // 1100000 / 60 = 18333.33
    expect(result.monthlyDepreciation).toBeCloseTo(18333.33, 1);
  });

  it("5年折旧下月折旧正确", () => {
    const result = calcEquipmentCost({ ...mockEquipment, depreciationYears: 5 });
    expect(result.monthlyDepreciation).toBeCloseTo(1100000 / 60, 1);
  });

  it("10年折旧月折旧减半", () => {
    const result5 = calcEquipmentCost({ ...mockEquipment, depreciationYears: 5 });
    const result10 = calcEquipmentCost({ ...mockEquipment, depreciationYears: 10 });
    expect(result10.monthlyDepreciation).toBeCloseTo(result5.monthlyDepreciation / 2, 1);
  });
});

describe("CostEngine.calcOperationalCost — 运营成本", () => {
  it("人力成本 = 人数 × 工资", () => {
    const result = calcOperationalCost(mockOperational);
    expect(result.labor).toBe(160000);
  });

  it("能耗成本 = 功率 × 电价 × 时长 × 30天", () => {
    const result = calcOperationalCost(mockOperational);
    // 12 × 50 × 1.2 × 30 = 21600
    expect(result.energy).toBe(21600);
  });

  it("物料成本 = 客流 × 单客成本 × 30天", () => {
    const result = calcOperationalCost(mockOperational);
    // 150 × 8 × 30 = 36000
    expect(result.material).toBe(36000);
  });

  it("运营总成本 = 人力 + 能耗 + 物料", () => {
    const result = calcOperationalCost(mockOperational);
    expect(result.total).toBe(Number((result.labor + result.energy + result.material).toFixed(2)));
  });
});

describe("CostEngine.calcTotalCost — 全成本汇总", () => {
  it("月总成本 = 场地 + 设备折旧 + 运营", () => {
    const result = calcTotalCost(mockVenue, mockEquipment, mockOperational, mockCity);
    const expected = result.venue.total + result.equipment.monthlyDepreciation + result.operational.total;
    expect(result.monthlyTotal).toBe(Number(expected.toFixed(2)));
  });

  it("年总成本 = 月总 × 12", () => {
    const result = calcTotalCost(mockVenue, mockEquipment, mockOperational, mockCity);
    expect(result.annualTotal).toBe(Number((result.monthlyTotal * 12).toFixed(2)));
  });

  it("城市成本指数正确传递", () => {
    const result = calcTotalCost(mockVenue, mockEquipment, mockOperational, mockCity);
    expect(result.cityCostIndex).toBe(19.8);
  });
});

describe("CostEngine.forecastRevenue — 收入预测", () => {
  it("包厢收入基于利用率计算", () => {
    const rooms = mockVenue.rooms;
    const totalRooms = rooms.small + rooms.medium + rooms.large + rooms.vip; // 15
    const revenue = forecastRevenue(rooms, 200, 150, 80);
    // 15 × 0.65 × 6 × 200 × 30 = 351000
    expect(revenue.roomRevenue).toBe(351000);
  });

  it("酒水收入 = 客流 × 均价 × 30", () => {
    const revenue = forecastRevenue(mockVenue.rooms, 200, 150, 80);
    // 150 × 80 × 30 = 360000
    expect(revenue.beverageRevenue).toBe(360000);
  });

  it("其他收入 = 包厢收入 × 5%", () => {
    const revenue = forecastRevenue(mockVenue.rooms, 200, 150, 80);
    expect(revenue.otherRevenue).toBe(Number((revenue.roomRevenue * 0.05).toFixed(2)));
  });

  it("月总收入 = 包厢 + 酒水 + 其他", () => {
    const revenue = forecastRevenue(mockVenue.rooms, 200, 150, 80);
    expect(revenue.monthlyTotal).toBe(Number((revenue.roomRevenue + revenue.beverageRevenue + revenue.otherRevenue).toFixed(2)));
  });
});

describe("CostEngine.analyzeProfit — 盈亏分析", () => {
  it("月利润 = 收入 - 成本", () => {
    const revenue = forecastRevenue(mockVenue.rooms, 200, 150, 80);
    const cost = calcTotalCost(mockVenue, mockEquipment, mockOperational, mockCity);
    const profit = analyzeProfit(revenue, cost, 1100000, 150);
    expect(profit.monthlyProfit).toBe(Number((revenue.monthlyTotal - cost.monthlyTotal).toFixed(2)));
  });

  it("毛利率 = 利润 / 收入 × 100", () => {
    const revenue = forecastRevenue(mockVenue.rooms, 200, 150, 80);
    const cost = calcTotalCost(mockVenue, mockEquipment, mockOperational, mockCity);
    const profit = analyzeProfit(revenue, cost, 1100000, 150);
    const expectedMargin = Number(((profit.monthlyProfit / revenue.monthlyTotal) * 100).toFixed(1));
    expect(profit.grossMargin).toBe(expectedMargin);
  });

  it("投资回收期 = 总投资 / 月利润", () => {
    const revenue = forecastRevenue(mockVenue.rooms, 200, 150, 80);
    const cost = calcTotalCost(mockVenue, mockEquipment, mockOperational, mockCity);
    const profit = analyzeProfit(revenue, cost, 1100000, 150);
    if (profit.monthlyProfit > 0) {
      expect(profit.paybackPeriod).toBeCloseTo(1100000 / profit.monthlyProfit, 1);
    }
  });

  it("亏损时回收期为Infinity", () => {
    const revenue = forecastRevenue(mockVenue.rooms, 50, 10, 10);
    const cost = calcTotalCost(mockVenue, mockEquipment, mockOperational, mockCity);
    const profit = analyzeProfit(revenue, cost, 1100000, 10);
    if (profit.monthlyProfit < 0) {
      expect(profit.paybackPeriod).toBe(Infinity);
    }
  });

  it("盈亏平衡客流 > 0", () => {
    const revenue = forecastRevenue(mockVenue.rooms, 200, 150, 80);
    const cost = calcTotalCost(mockVenue, mockEquipment, mockOperational, mockCity);
    const profit = analyzeProfit(revenue, cost, 1100000, 150);
    expect(profit.breakEvenCustomers).toBeGreaterThan(0);
  });
});

describe("CostEngine.sensitivityAnalysis — 敏感性分析", () => {
  it("客流减少10%导致利润下降", () => {
    const revenue = forecastRevenue(mockVenue.rooms, 200, 150, 80);
    const cost = calcTotalCost(mockVenue, mockEquipment, mockOperational, mockCity);
    const profit = analyzeProfit(revenue, cost, 1100000, 150);
    const sensitivity = sensitivityAnalysis(profit, 150);
    expect(sensitivity.customerSensitivity.minus10).toBeLessThan(0);
  });

  it("客流增加10%带来利润增长", () => {
    const revenue = forecastRevenue(mockVenue.rooms, 200, 150, 80);
    const cost = calcTotalCost(mockVenue, mockEquipment, mockOperational, mockCity);
    const profit = analyzeProfit(revenue, cost, 1100000, 150);
    const sensitivity = sensitivityAnalysis(profit, 150);
    expect(sensitivity.customerSensitivity.plus10).toBeGreaterThan(0);
  });

  it("成本增加10%导致利润减少", () => {
    const revenue = forecastRevenue(mockVenue.rooms, 200, 150, 80);
    const cost = calcTotalCost(mockVenue, mockEquipment, mockOperational, mockCity);
    const profit = analyzeProfit(revenue, cost, 1100000, 150);
    const sensitivity = sensitivityAnalysis(profit, 150);
    // 成本+10%后利润应低于成本-10%后的利润
    expect(sensitivity.costSensitivity.plus10).toBeLessThan(sensitivity.costSensitivity.minus10);
  });
});
