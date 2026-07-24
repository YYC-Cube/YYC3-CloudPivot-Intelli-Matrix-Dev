/**
 * @file: index.ts
 * @description: plugin-marketing 包入口
 */
export { FestivalEngine } from "./festival-engine";
export {
  getFestivalStage, resolveFestivalDate, buildFestivalCalendar,
  filterByStage, filterByType, getDefaultActions,
} from "./festival-engine";
export {
  lunarToSolar, solarToLunar, formatLunarDay, getWeekday,
  WEEKDAY_NAMES, WEEKDAY_FULL, getDaysInMonth,
} from "./lunar-engine";
export { ALL_FESTIVALS, LEGAL_FESTIVALS, FOLK_FESTIVALS, MARKETING_FESTIVALS, LOCAL_FESTIVALS, BRAND_FESTIVALS } from "./festivals";
export { register } from "./register";
export type {
  Festival, FestivalType, FestivalStage, FestivalAction,
  ActionTemplate, FestivalCalendarEntry, ResourceAllocation,
} from "./types";
export { FESTIVAL_TYPE_LABELS, STAGE_LABELS } from "./types";
