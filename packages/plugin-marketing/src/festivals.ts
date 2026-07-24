/**
 * @file: festivals.ts
 * @description: 6类节日数据库 — 法定/民俗/网络/地方/品牌/门店
 */

import type { Festival } from "./types";

// ============================================================
// 法定节假日（公历固定日期）
// ============================================================

const LEGAL_FESTIVALS: Festival[] = [
  { id: "L001", name: "元旦", type: "legal", month: 1, day: 1, duration: 1, isLunar: false, stage: "off", region: "national", marketingWeight: 3 },
  { id: "L002", name: "清明节", type: "legal", month: 4, day: 5, duration: 1, isLunar: false, stage: "stable", region: "national", marketingWeight: 3 },
  { id: "L003", name: "劳动节", type: "legal", month: 5, day: 1, duration: 5, isLunar: false, stage: "stable", region: "national", marketingWeight: 4 },
  { id: "L004", name: "端午节", type: "legal", month: 0, day: 0, duration: 1, isLunar: true, lunarMonth: 5, lunarDay: 5, stage: "stable", region: "national", marketingWeight: 4 },
  { id: "L005", name: "中秋节", type: "legal", month: 0, day: 0, duration: 1, isLunar: true, lunarMonth: 8, lunarDay: 15, stage: "stable", region: "national", marketingWeight: 5 },
  { id: "L006", name: "国庆节", type: "legal", month: 10, day: 1, duration: 7, isLunar: false, stage: "peak", region: "national", marketingWeight: 5 },
  { id: "L007", name: "春节", type: "legal", month: 0, day: 0, duration: 7, isLunar: true, lunarMonth: 1, lunarDay: 1, stage: "peak", region: "national", marketingWeight: 5 },
];

// ============================================================
// 民俗节假日（农历）
// ============================================================

const FOLK_FESTIVALS: Festival[] = [
  { id: "F001", name: "腊八节", type: "folk", month: 0, day: 0, duration: 1, isLunar: true, lunarMonth: 12, lunarDay: 8, stage: "off", region: "national", marketingWeight: 3 },
  { id: "F002", name: "小年", type: "folk", month: 0, day: 0, duration: 1, isLunar: true, lunarMonth: 12, lunarDay: 23, stage: "peak", region: "national", marketingWeight: 4 },
  { id: "F003", name: "除夕", type: "folk", month: 0, day: 0, duration: 1, isLunar: true, lunarMonth: 12, lunarDay: 30, stage: "peak", region: "national", marketingWeight: 5 },
  { id: "F004", name: "元宵节", type: "folk", month: 0, day: 0, duration: 1, isLunar: true, lunarMonth: 1, lunarDay: 15, stage: "peak", region: "national", marketingWeight: 4 },
  { id: "F005", name: "龙抬头", type: "folk", month: 0, day: 0, duration: 1, isLunar: true, lunarMonth: 2, lunarDay: 2, stage: "stable", region: "national", marketingWeight: 2 },
  { id: "F006", name: "七夕节", type: "folk", month: 0, day: 0, duration: 1, isLunar: true, lunarMonth: 7, lunarDay: 7, stage: "stable", region: "national", marketingWeight: 5 },
  { id: "F007", name: "中元节", type: "folk", month: 0, day: 0, duration: 1, isLunar: true, lunarMonth: 7, lunarDay: 15, stage: "stable", region: "national", marketingWeight: 2 },
  { id: "F008", name: "重阳节", type: "folk", month: 0, day: 0, duration: 1, isLunar: true, lunarMonth: 9, lunarDay: 9, stage: "stable", region: "national", marketingWeight: 3 },
  { id: "F009", name: "冬至", type: "folk", month: 12, day: 22, duration: 1, isLunar: false, stage: "off", region: "national", marketingWeight: 3 },
];

// ============================================================
// 网络营销日（公历固定）
// ============================================================

const MARKETING_FESTIVALS: Festival[] = [
  { id: "M001", name: "情人节", type: "marketing", month: 2, day: 14, duration: 1, isLunar: false, stage: "stable", region: "national", marketingWeight: 5 },
  { id: "M002", name: "白色情人节", type: "marketing", month: 3, day: 14, duration: 1, isLunar: false, stage: "stable", region: "national", marketingWeight: 3 },
  { id: "M003", name: "女神节", type: "marketing", month: 3, day: 8, duration: 1, isLunar: false, stage: "stable", region: "national", marketingWeight: 4 },
  { id: "M004", name: "520表白日", type: "marketing", month: 5, day: 20, duration: 1, isLunar: false, stage: "stable", region: "national", marketingWeight: 5 },
  { id: "M005", name: "618购物节", type: "marketing", month: 6, day: 18, duration: 1, isLunar: false, stage: "stable", region: "national", marketingWeight: 4 },
  { id: "M006", name: "七夕情人节", type: "marketing", month: 0, day: 0, duration: 1, isLunar: true, lunarMonth: 7, lunarDay: 7, stage: "stable", region: "national", marketingWeight: 5 },
  { id: "M007", name: "双11购物节", type: "marketing", month: 11, day: 11, duration: 1, isLunar: false, stage: "off", region: "national", marketingWeight: 5 },
  { id: "M008", name: "双12购物节", type: "marketing", month: 12, day: 12, duration: 1, isLunar: false, stage: "off", region: "national", marketingWeight: 4 },
  { id: "M009", name: "圣诞节", type: "marketing", month: 12, day: 25, duration: 1, isLunar: false, stage: "off", region: "national", marketingWeight: 5 },
  { id: "M010", name: "万圣节", type: "marketing", month: 10, day: 31, duration: 1, isLunar: false, stage: "peak", region: "national", marketingWeight: 4 },
  { id: "M011", name: "母亲节", type: "marketing", month: 5, day: 11, duration: 1, isLunar: false, stage: "stable", region: "national", marketingWeight: 3 },
  { id: "M012", name: "父亲节", type: "marketing", month: 6, day: 15, duration: 1, isLunar: false, stage: "stable", region: "national", marketingWeight: 3 },
];

// ============================================================
// 地方特殊假日（示例：可扩展）
// ============================================================

const LOCAL_FESTIVALS: Festival[] = [
  { id: "X001", name: "成都糖酒会", type: "local", month: 3, day: 20, duration: 5, isLunar: false, stage: "stable", region: "city", marketingWeight: 3 },
  { id: "X002", name: "青岛啤酒节", type: "local", month: 7, day: 26, duration: 17, isLunar: false, stage: "peak", region: "city", marketingWeight: 4 },
  { id: "X003", name: "西安城墙灯会", type: "local", month: 1, day: 15, duration: 41, isLunar: false, stage: "peak", region: "city", marketingWeight: 3 },
];

// ============================================================
// 品牌庆典日 & 门店活动日（动态配置，此处为示例）
// ============================================================

const BRAND_FESTIVALS: Festival[] = [
  { id: "B001", name: "品牌成立日", type: "brand", month: 5, day: 18, duration: 1, isLunar: false, stage: "stable", region: "national", marketingWeight: 4 },
  { id: "B002", name: "会员日", type: "store", month: 1, day: 15, duration: 1, isLunar: false, stage: "stable", region: "store", marketingWeight: 3 },
  { id: "B003", name: "门店周年庆", type: "brand", month: 9, day: 1, duration: 7, isLunar: false, stage: "stable", region: "store", marketingWeight: 4 },
];

// ============================================================
// 合并导出
// ============================================================

export const ALL_FESTIVALS: Festival[] = [
  ...LEGAL_FESTIVALS,
  ...FOLK_FESTIVALS,
  ...MARKETING_FESTIVALS,
  ...LOCAL_FESTIVALS,
  ...BRAND_FESTIVALS,
];

export { BRAND_FESTIVALS, FOLK_FESTIVALS, LEGAL_FESTIVALS, LOCAL_FESTIVALS, MARKETING_FESTIVALS };
