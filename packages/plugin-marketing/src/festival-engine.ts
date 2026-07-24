/**
 * @file: festival-engine.ts
 * @description: 节日营销核心引擎 — 节日聚合 + 阶段归属 + 动作触发
 */

import type { Festival, FestivalAction, ActionTemplate, FestivalCalendarEntry, FestivalStage } from "./types";
import { ALL_FESTIVALS } from "./festivals";
import { lunarToSolar, getWeekday } from "./lunar-engine";

// ============================================================
// 根据公历日期判断节日-阶段归属
// ============================================================

export function getFestivalStage(month: number): FestivalStage {
  if ([1, 2, 7, 8, 10].includes(month)) return "peak";
  if ([3, 4, 5, 6, 9].includes(month)) return "stable";
  return "off";
}

// ============================================================
// 将农历节日转换为指定公历年份的实际日期
// ============================================================

export function resolveFestivalDate(festival: Festival, year: number): Date {
  if (!festival.isLunar) {
    return new Date(year, festival.month - 1, festival.day);
  }

  // 农历节日：先尝试当年，再处理腊月跨年
  let lunarYear = year;
  if (festival.lunarMonth === 12) {
    // 腊月节日属于该公历年的农历年
    // 例如：2026公历年的腊八节属于2026农历年的腊月初八
    // 但腊月初八可能落在2027年1月
  }

  return lunarToSolar(lunarYear, festival.lunarMonth!, festival.lunarDay!, false);
}

// ============================================================
// 生成全年节日日历
// ============================================================

export function buildFestivalCalendar(year: number): FestivalCalendarEntry[] {
  const entries: FestivalCalendarEntry[] = [];

  for (const festival of ALL_FESTIVALS) {
    try {
      const solarDate = resolveFestivalDate(festival, year);
      // 只包含该公历年度内的节日
      if (solarDate.getFullYear() === year) {
        entries.push({
          festival,
          solarDate,
          dateStr: `${year}-${String(solarDate.getMonth() + 1).padStart(2, "0")}-${String(solarDate.getDate()).padStart(2, "0")}`,
          weekday: getWeekday(solarDate),
          actions: getDefaultActions(festival),
        });
      }
    } catch {
      // 跳过不支持的年份
    }
  }

  // 按日期排序
  entries.sort((a, b) => a.solarDate.getTime() - b.solarDate.getTime());
  return entries;
}

// ============================================================
// 按阶段筛选节日
// ============================================================

export function filterByStage(entries: FestivalCalendarEntry[], stage: FestivalStage): FestivalCalendarEntry[] {
  return entries.filter(e => e.festival.stage === stage);
}

// ============================================================
// 按类型筛选节日
// ============================================================

export function filterByType(entries: FestivalCalendarEntry[], type: Festival["type"]): FestivalCalendarEntry[] {
  return entries.filter(e => e.festival.type === type);
}

// ============================================================
// 默认营销动作模板
// ============================================================

export function getDefaultActions(festival: Festival): FestivalAction[] {
  const templates: Record<string, FestivalAction[]> = {
    legal: [
      { type: "prepare", triggerOffset: -7, description: "营销准备：活动方案定稿 + 物料制作 + 包厢预配 + 库存预配", modules: ["营销活动模块", "设备运维模块", "库存运维模块"] },
      { type: "execute", triggerOffset: 0,  description: "执行营销：多渠道投放 + 门店布置 + 实时客流监控 + 动态定价", modules: ["营销活动模块", "财务审核模块"] },
      { type: "review",  triggerOffset: 3,  description: "复盘分析：数据收集 + ROI评估 + 客户反馈 + 经验沉淀", modules: ["盈亏测算模块", "表单体系模块"] },
    ],
    folk: [
      { type: "prepare", triggerOffset: -5, description: "民俗节预热：主题布置 + 套餐设计", modules: ["营销活动模块"] },
      { type: "execute", triggerOffset: 0,  description: "节日活动执行 + 优惠券推送", modules: ["营销活动模块", "客户运维模块"] },
      { type: "review",  triggerOffset: 2,  description: "活动效果评估", modules: ["盈亏测算模块"] },
    ],
    marketing: [
      { type: "prepare", triggerOffset: -3, description: "网络营销日预热：储值活动 + 会员积分翻倍配置", modules: ["营销活动模块", "客户运维模块"] },
      { type: "execute", triggerOffset: 0,  description: "营销日执行 + 竞品监控", modules: ["营销活动模块", "竞品监测模块"] },
      { type: "review",  triggerOffset: 1,  description: "核销率统计 + 转化分析", modules: ["财务审核模块"] },
    ],
    local: [
      { type: "prepare", triggerOffset: -7, description: "地方节日预热：区域特色套餐", modules: ["营销活动模块"] },
      { type: "execute", triggerOffset: 0,  description: "地方活动执行", modules: ["营销活动模块"] },
    ],
    brand: [
      { type: "prepare", triggerOffset: -3, description: "品牌日准备：提成翻倍配置 + 老客召回", modules: ["薪资模块", "客户运维模块"] },
      { type: "execute", triggerOffset: 0,  description: "品牌庆典执行 + 新品推广", modules: ["营销活动模块"] },
    ],
    store: [
      { type: "prepare", triggerOffset: -1, description: "门店活动准备", modules: ["营销活动模块"] },
      { type: "execute", triggerOffset: 0,  description: "会员日执行 + 专属权益推送", modules: ["客户运维模块"] },
    ],
  };

  return templates[festival.type] || templates.store;
}

// ============================================================
// 导出引擎对象
// ============================================================

export const FestivalEngine = {
  getFestivalStage,
  resolveFestivalDate,
  buildFestivalCalendar,
  filterByStage,
  filterByType,
  getDefaultActions,
};
