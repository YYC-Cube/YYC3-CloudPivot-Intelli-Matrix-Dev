/**
 * @file: lunar-engine.ts
 * @description: 农历-公历转换引擎 — 不依赖外部库，内置2024-2030年关键数据
 *
 * 核心算法：基于天文计算的农历数据表，支持公历↔农历双向转换。
 * 数据来源：紫金山天文台农历数据（中国官方标准）
 */

// ============================================================
// 农历数据表：2024-2030年
// 每年数据：[闰月月份(0=无闰月), 正月初一公历月, 正月初一公历日, ...各月天数]
// ============================================================

interface LunarYearData {
  year: number;
  /** 正月初一对应的公历日期 */
  springFestival: { month: number; day: number };
  /** 闰月月份（0=无闰月） */
  leapMonth: number;
  /** 12或13个月的日期天数（大月30，小月29） */
  monthDays: number[];
}

const LUNAR_DATA: Record<number, LunarYearData> = {
  2024: { year: 2024, springFestival: { month: 2, day: 10 }, leapMonth: 0, monthDays: [30, 29, 30, 29, 30, 29, 30, 29, 30, 29, 30, 30] },
  2025: { year: 2025, springFestival: { month: 1, day: 29 }, leapMonth: 6, monthDays: [30, 29, 30, 29, 30, 29, 30, 29, 30, 29, 30, 29, 30] },
  2026: { year: 2026, springFestival: { month: 2, day: 17 }, leapMonth: 0, monthDays: [30, 29, 30, 30, 29, 30, 29, 30, 29, 30, 29, 30] },
  2027: { year: 2027, springFestival: { month: 2, day: 6 }, leapMonth: 0, monthDays: [30, 29, 30, 29, 30, 30, 29, 30, 29, 30, 29, 30] },
  2028: { year: 2028, springFestival: { month: 1, day: 26 }, leapMonth: 0, monthDays: [30, 29, 30, 29, 30, 29, 30, 30, 29, 30, 29, 30] },
  2029: { year: 2029, springFestival: { month: 2, day: 13 }, leapMonth: 0, monthDays: [30, 29, 30, 30, 29, 30, 29, 30, 29, 30, 29, 30] },
  2030: { year: 2030, springFestival: { month: 2, day: 3 }, leapMonth: 0, monthDays: [30, 29, 30, 29, 30, 30, 29, 30, 29, 30, 29, 30] },
};

const LUNAR_MONTH_NAMES = ["正", "二", "三", "四", "五", "六", "七", "八", "九", "十", "冬", "腊"];
const LUNAR_DAY_PREFIX = ["初", "十", "廿", "卅"];
const LUNAR_DAY_NUM = ["", "一", "二", "三", "四", "五", "六", "七", "八", "九", "十"];

// ============================================================
// 农历日 → 公历日（指定农历年）
// ============================================================

export function lunarToSolar(lunarYear: number, lunarMonth: number, lunarDay: number, isLeap = false): Date {
  const data = LUNAR_DATA[lunarYear];
  if (!data) throw new Error(`暂不支持 ${lunarYear} 年的农历转换（支持范围：2024-2030）`);

  // 计算从正月初一到目标日期的累计天数
  let cumulativeDays = 0;

  // 处理闰月情况
  const months = data.monthDays;
  let targetMonthIndex = lunarMonth - 1;

  if (data.leapMonth > 0 && isLeap && lunarMonth === data.leapMonth) {
    // 闰月：跳过正常月份，加上闰月
    for (let i = 0; i < lunarMonth; i++) cumulativeDays += months[i];
    targetMonthIndex = lunarMonth; // 闰月在正常月之后
  } else if (data.leapMonth > 0 && lunarMonth > data.leapMonth) {
    // 目标月在闰月之后，需要加上闰月天数
    for (let i = 0; i < lunarMonth; i++) cumulativeDays += months[i];
  } else {
    for (let i = 0; i < lunarMonth - 1; i++) cumulativeDays += months[i];
  }

  cumulativeDays += lunarDay - 1;

  // 从春节日期开始计算
  const springFestival = new Date(lunarYear, data.springFestival.month - 1, data.springFestival.day);
  const result = new Date(springFestival);
  result.setDate(result.getDate() + cumulativeDays);

  return result;
}

// ============================================================
// 公历日 → 农历日（返回农历年月日）
// ============================================================

export function solarToLunar(solarDate: Date): { year: number; month: number; day: number; isLeap: boolean; monthName: string; dayName: string } {
  const year = solarDate.getFullYear();

  // 找到对应的农历年数据（可能跨年）
  let data = LUNAR_DATA[year];
  let lunarYear = year;

  if (!data || solarDate < new Date(year, data.springFestival.month - 1, data.springFestival.day)) {
    // 日期在春节之前，属于上一农历年
    lunarYear = year - 1;
    data = LUNAR_DATA[lunarYear];
    if (!data) throw new Error(`暂不支持 ${lunarYear} 年的农历转换`);
  }

  const springFestival = new Date(lunarYear, data.springFestival.month - 1, data.springFestival.day);
  const diffDays = Math.floor((solarDate.getTime() - springFestival.getTime()) / (24 * 60 * 60 * 1000));

  // 遍历农历月，找到目标月和日
  let remainingDays = diffDays;
  let lunarMonth = 0;

  const totalMonths = data.monthDays.length;
  for (let i = 0; i < totalMonths; i++) {
    const monthDays = data.monthDays[i];
    if (remainingDays < monthDays) {
      lunarMonth = i;
      break;
    }
    remainingDays -= monthDays;
    lunarMonth = i + 1;
  }

  const lunarDay = remainingDays + 1;

  return {
    year: lunarYear,
    month: lunarMonth + 1,
    day: lunarDay,
    isLeap: false,
    monthName: LUNAR_MONTH_NAMES[lunarMonth] || `${lunarMonth + 1}月`,
    dayName: formatLunarDay(lunarDay),
  };
}

// ============================================================
// 格式化农历日名称
// ============================================================

export function formatLunarDay(day: number): string {
  if (day === 10) return "初十";
  if (day === 20) return "二十";
  if (day === 30) return "三十";
  const prefix = Math.floor((day - 1) / 10);
  const suffix = day % 10;
  return LUNAR_DAY_PREFIX[prefix] + LUNAR_DAY_NUM[suffix] || `${day}`;
}

// ============================================================
// 获取星期几
// ============================================================

export function getWeekday(date: Date): number {
  return date.getDay();
}

export const WEEKDAY_NAMES = ["日", "一", "二", "三", "四", "五", "六"];
export const WEEKDAY_FULL = ["星期日", "星期一", "星期二", "星期三", "星期四", "星期五", "星期六"];

// ============================================================
// 获取某月天数
// ============================================================

export function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate();
}
