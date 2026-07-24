// @vitest-environment node
/**
 * @file: festival-engine.test.ts
 * @description: 节日营销引擎测试 — 农历转换 + 节日日历 + 阶段归属 + 动作触发
 */

import { describe, expect, it } from "vitest";
import {
  buildFestivalCalendar,
  filterByStage,
  filterByType,
  getDefaultActions,
  getFestivalStage,
  resolveFestivalDate
} from "./src/festival-engine";
import { ALL_FESTIVALS, FOLK_FESTIVALS, LEGAL_FESTIVALS, MARKETING_FESTIVALS } from "./src/festivals";
import {
  formatLunarDay,
  getDaysInMonth,
  getWeekday,
  lunarToSolar,
  solarToLunar
} from "./src/lunar-engine";
import type { Festival } from "./src/types";

// ============================================================
// 农历转换引擎测试
// ============================================================

describe("lunar-engine — 农历转换", () => {
  it("2026年春节（农历正月初一）→ 公历2026-02-17", () => {
    const date = lunarToSolar(2026, 1, 1);
    expect(date.getFullYear()).toBe(2026);
    expect(date.getMonth()).toBe(1); // 0-indexed
    expect(date.getDate()).toBe(17);
  });

  it("2026年中秋节（农历八月十五）→ 公历2026-09-26", () => {
    const date = lunarToSolar(2026, 8, 15);
    expect(date.getFullYear()).toBe(2026);
    expect(date.getMonth()).toBe(8);
    expect(date.getDate()).toBe(26);
  });

  it("2025年端午节（农历五月初五）→ 公历2025-05-31", () => {
    const date = lunarToSolar(2025, 5, 5);
    expect(date.getFullYear()).toBe(2025);
    expect(date.getMonth()).toBe(4);
    expect(date.getDate()).toBe(31);
  });

  it("公历→农历→公历 往返一致性", () => {
    const original = lunarToSolar(2026, 5, 5);
    const lunar = solarToLunar(original);
    expect(lunar.month).toBe(5);
    expect(lunar.day).toBe(5);
  });

  it("formatLunarDay: 初一", () => {
    expect(formatLunarDay(1)).toBe("初一");
  });

  it("formatLunarDay: 十五", () => {
    expect(formatLunarDay(15)).toBe("十五");
  });

  it("formatLunarDay: 三十", () => {
    expect(formatLunarDay(30)).toBe("三十");
  });

  it("getWeekday: 2026-01-01 是星期四", () => {
    expect(getWeekday(new Date(2026, 0, 1))).toBe(4);
  });

  it("getDaysInMonth: 2026年2月有28天", () => {
    expect(getDaysInMonth(2026, 2)).toBe(28);
  });

  it("getDaysInMonth: 2028年2月有29天（闰年）", () => {
    expect(getDaysInMonth(2028, 2)).toBe(29);
  });

  it("不支持年份抛出异常", () => {
    expect(() => lunarToSolar(2020, 1, 1)).toThrow();
  });
});

// ============================================================
// 节日-阶段归属测试
// ============================================================

describe("FestivalEngine.getFestivalStage — 阶段归属", () => {
  it("1月归入旺季", () => {
    expect(getFestivalStage(1)).toBe("peak");
  });

  it("7月归入旺季", () => {
    expect(getFestivalStage(7)).toBe("peak");
  });

  it("10月归入旺季（国庆）", () => {
    expect(getFestivalStage(10)).toBe("peak");
  });

  it("3月归入平季", () => {
    expect(getFestivalStage(3)).toBe("stable");
  });

  it("11月归入淡季", () => {
    expect(getFestivalStage(11)).toBe("off");
  });

  it("12月归入淡季", () => {
    expect(getFestivalStage(12)).toBe("off");
  });
});

// ============================================================
// 节日日期解析测试
// ============================================================

describe("FestivalEngine.resolveFestivalDate — 日期解析", () => {
  it("公历节日直接返回日期", () => {
    const festival: Festival = {
      id: "test1", name: "测试", type: "legal",
      month: 6, day: 18, duration: 1, isLunar: false,
      stage: "stable", region: "national", marketingWeight: 4,
    };
    const date = resolveFestivalDate(festival, 2026);
    expect(date.getMonth()).toBe(5);
    expect(date.getDate()).toBe(18);
  });

  it("农历春节解析正确", () => {
    const springFestival = LEGAL_FESTIVALS.find(f => f.id === "L007")!;
    const date = resolveFestivalDate(springFestival, 2026);
    expect(date.getMonth()).toBe(1);
    expect(date.getDate()).toBe(17);
  });

  it("农历中秋节解析正确", () => {
    const midAutumn = LEGAL_FESTIVALS.find(f => f.id === "L005")!;
    const date = resolveFestivalDate(midAutumn, 2026);
    expect(date.getMonth()).toBe(8);
    expect(date.getDate()).toBe(26);
  });
});

// ============================================================
// 全年节日日历测试
// ============================================================

describe("FestivalEngine.buildFestivalCalendar — 全年日历", () => {
  const calendar2026 = buildFestivalCalendar(2026);

  it("2026年日历包含节日", () => {
    expect(calendar2026.length).toBeGreaterThan(15);
  });

  it("2026年日历按日期排序", () => {
    for (let i = 1; i < calendar2026.length; i++) {
      expect(calendar2026[i].solarDate.getTime()).toBeGreaterThanOrEqual(
        calendar2026[i - 1].solarDate.getTime()
      );
    }
  });

  it("每个日历条目包含有效日期字符串", () => {
    for (const entry of calendar2026) {
      expect(entry.dateStr).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    }
  });

  it("每个日历条目包含营销动作", () => {
    for (const entry of calendar2026) {
      expect(entry.actions.length).toBeGreaterThan(0);
    }
  });

  it("2026年日历所有日期都在2026年内", () => {
    for (const entry of calendar2026) {
      expect(entry.solarDate.getFullYear()).toBe(2026);
    }
  });
});

// ============================================================
// 节日筛选测试
// ============================================================

describe("FestivalEngine.filterByStage — 按阶段筛选", () => {
  const calendar2026 = buildFestivalCalendar(2026);

  it("旺季节日数量 > 0", () => {
    expect(filterByStage(calendar2026, "peak").length).toBeGreaterThan(0);
  });

  it("平季节日数量 > 0", () => {
    expect(filterByStage(calendar2026, "stable").length).toBeGreaterThan(0);
  });

  it("筛选结果只包含指定阶段的节日", () => {
    const peakFestivals = filterByStage(calendar2026, "peak");
    for (const entry of peakFestivals) {
      expect(entry.festival.stage).toBe("peak");
    }
  });
});

describe("FestivalEngine.filterByType — 按类型筛选", () => {
  const calendar2026 = buildFestivalCalendar(2026);

  it("法定节假日筛选正确", () => {
    const legal = filterByType(calendar2026, "legal");
    for (const entry of legal) {
      expect(entry.festival.type).toBe("legal");
    }
  });

  it("网络营销日筛选正确", () => {
    const marketing = filterByType(calendar2026, "marketing");
    for (const entry of marketing) {
      expect(entry.festival.type).toBe("marketing");
    }
  });
});

// ============================================================
// 营销动作触发测试
// ============================================================

describe("FestivalEngine.getDefaultActions — 默认动作", () => {
  it("法定节假日包含准备+执行+复盘三阶段", () => {
    const actions = getDefaultActions(LEGAL_FESTIVALS[0]);
    const types = actions.map(a => a.type);
    expect(types).toContain("prepare");
    expect(types).toContain("execute");
    expect(types).toContain("review");
  });

  it("节前准备动作触发时间为负数", () => {
    const actions = getDefaultActions(LEGAL_FESTIVALS[0]);
    const prepare = actions.find(a => a.type === "prepare");
    expect(prepare!.triggerOffset).toBeLessThan(0);
  });

  it("执行动作触发时间为0（当天）", () => {
    const actions = getDefaultActions(MARKETING_FESTIVALS[0]);
    const execute = actions.find(a => a.type === "execute");
    expect(execute!.triggerOffset).toBe(0);
  });

  it("动作关联至少一个YYC³系统模块", () => {
    const actions = getDefaultActions(LEGAL_FESTIVALS[0]);
    for (const action of actions) {
      expect(action.modules.length).toBeGreaterThan(0);
    }
  });
});

// ============================================================
// 节日数据库完整性测试
// ============================================================

describe("节日数据库完整性", () => {
  it("总节日数 ≥ 25", () => {
    expect(ALL_FESTIVALS.length).toBeGreaterThanOrEqual(25);
  });

  it("法定节假日 ≥ 7", () => {
    expect(LEGAL_FESTIVALS.length).toBeGreaterThanOrEqual(7);
  });

  it("民俗节假日 ≥ 5", () => {
    expect(FOLK_FESTIVALS.length).toBeGreaterThanOrEqual(5);
  });

  it("网络营销日 ≥ 10", () => {
    expect(MARKETING_FESTIVALS.length).toBeGreaterThanOrEqual(10);
  });

  it("所有农历节日都有 lunarMonth 和 lunarDay", () => {
    const lunarFestivals = ALL_FESTIVALS.filter(f => f.isLunar);
    for (const f of lunarFestivals) {
      expect(f.lunarMonth).toBeDefined();
      expect(f.lunarDay).toBeDefined();
    }
  });

  it("所有公历节日都有 month 和 day", () => {
    const solarFestivals = ALL_FESTIVALS.filter(f => !f.isLunar);
    for (const f of solarFestivals) {
      expect(f.month).toBeGreaterThan(0);
      expect(f.day).toBeGreaterThan(0);
    }
  });

  it("营销力度权重在1-5范围内", () => {
    for (const f of ALL_FESTIVALS) {
      expect(f.marketingWeight).toBeGreaterThanOrEqual(1);
      expect(f.marketingWeight).toBeLessThanOrEqual(5);
    }
  });
});
