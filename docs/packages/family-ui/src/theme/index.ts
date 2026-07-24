/**
 * ============================================================
 * YYC³ AI Family — 人从众曌众从人
 * 亦师亦友亦伯乐，一言一语一协同
 * 拟人为本 · AI为核 · 纯粹为心
 * ============================================================
 * @Family   : YYC³ AI Family (永久开源)
 * @License  : Apache-2.0
 * @Homepage : https://matrix.yyc3.top
 * ============================================================
 * 此文件承载家人温度，请以玫瑰之心待之 🌹
 * ============================================================
 */

export { ThemeManager } from './ThemeManager.js';
export type { ThemeChangeCallback } from './ThemeManager.js';

export { themeToCSSVariables, applyThemeToDOM, removeThemeFromDOM, themeToStyleSheet } from './CSSVariables.js';

export {
  LIGHT_THEME,
  DARK_THEME,
  BUILT_IN_THEMES,
} from './ThemeConfig.js';
export type {
  ThemeConfig,
  ThemeColors,
  ThemeSpacing,
  ThemeBorderRadius,
  ThemeTypography,
  ThemeShadows,
  ThemeTransitions,
  ThemeLayout,
  ThemeAnimation,
  ThemeVariableKey,
} from './ThemeConfig.js';
