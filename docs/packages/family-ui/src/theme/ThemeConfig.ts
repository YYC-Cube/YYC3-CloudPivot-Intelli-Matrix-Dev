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

export interface ThemeColors {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  surface: string;
  text: string;
  textSecondary: string;
  border: string;
  error: string;
  success: string;
  warning: string;
  info: string;
}

export interface ThemeSpacing {
  xs: number;
  sm: number;
  md: number;
  lg: number;
  xl: number;
  xxl: number;
}

export interface ThemeBorderRadius {
  sm: number;
  md: number;
  lg: number;
  xl: number;
  full: number;
}

export interface ThemeTypography {
  fontFamily: string;
  fontSizeXs: number;
  fontSizeSm: number;
  fontSizeMd: number;
  fontSizeLg: number;
  fontSizeXl: number;
  fontSizeXxl: number;
  lineHeight: number;
  headingWeight: number;
  bodyWeight: number;
}

export interface ThemeShadows {
  sm: string;
  md: string;
  lg: string;
}

export interface ThemeTransitions {
  fast: string;
  normal: string;
  slow: string;
}

export interface ThemeLayout {
  maxWidth: number;
  sidebarWidth: number;
  cardMinWidth: number;
  cardGap: number;
  headerHeight: number;
}

export interface ThemeAnimation {
  enabled: boolean;
  rippleDuration: number;
  fadeDuration: number;
  slideDuration: number;
}

export interface ThemeConfig {
  id: string;
  name: string;
  mode: 'light' | 'dark' | 'custom';
  colors: ThemeColors;
  spacing: ThemeSpacing;
  borderRadius: ThemeBorderRadius;
  typography: ThemeTypography;
  shadows: ThemeShadows;
  transitions: ThemeTransitions;
  layout: ThemeLayout;
  animation: ThemeAnimation;
  memberColors: Record<string, string>;
}

export type ThemeVariableKey = keyof ThemeColors | keyof ThemeSpacing | keyof ThemeBorderRadius | keyof ThemeTypography | keyof ThemeShadows | keyof ThemeTransitions | keyof ThemeLayout;

export const LIGHT_THEME: ThemeConfig = {
  id: 'light',
  name: 'YYC³ 日光',
  mode: 'light',
  colors: {
    primary: '#6366f1',
    secondary: '#8b5cf6',
    accent: '#f59e0b',
    background: '#ffffff',
    surface: '#f8fafc',
    text: '#1e293b',
    textSecondary: '#64748b',
    border: '#e2e8f0',
    error: '#ef4444',
    success: '#22c55e',
    warning: '#f59e0b',
    info: '#3b82f6',
  },
  spacing: { xs: 4, sm: 8, md: 16, lg: 24, xl: 32, xxl: 48 },
  borderRadius: { sm: 4, md: 8, lg: 12, xl: 16, full: 9999 },
  typography: {
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    fontSizeXs: 10, fontSizeSm: 12, fontSizeMd: 14, fontSizeLg: 16, fontSizeXl: 20, fontSizeXxl: 28,
    lineHeight: 1.5, headingWeight: 700, bodyWeight: 400,
  },
  shadows: {
    sm: '0 1px 2px rgba(0,0,0,0.05)',
    md: '0 4px 6px rgba(0,0,0,0.07)',
    lg: '0 10px 25px rgba(0,0,0,0.1)',
  },
  transitions: { fast: '0.1s ease', normal: '0.2s ease', slow: '0.3s ease' },
  layout: { maxWidth: 1280, sidebarWidth: 280, cardMinWidth: 200, cardGap: 16, headerHeight: 56 },
  animation: { enabled: true, rippleDuration: 600, fadeDuration: 200, slideDuration: 300 },
  memberColors: {
    qianhang: '#ff6b35',
    thinker: '#4fc3f7',
    prophet: '#ab47bc',
    bole: '#ffd54f',
    tianshu: '#78909c',
    guardian: '#69f0ae',
    grandmaster: '#90a4ae',
    grace: '#ff8c00',
  },
};

export const DARK_THEME: ThemeConfig = {
  id: 'dark',
  name: 'YYC³ 星辰',
  mode: 'dark',
  colors: {
    primary: '#818cf8',
    secondary: '#a78bfa',
    accent: '#fbbf24',
    background: '#0f172a',
    surface: '#1e293b',
    text: '#f1f5f9',
    textSecondary: '#94a3b8',
    border: '#334155',
    error: '#f87171',
    success: '#4ade80',
    warning: '#fbbf24',
    info: '#60a5fa',
  },
  spacing: LIGHT_THEME.spacing,
  borderRadius: LIGHT_THEME.borderRadius,
  typography: LIGHT_THEME.typography,
  shadows: {
    sm: '0 1px 2px rgba(0,0,0,0.3)',
    md: '0 4px 6px rgba(0,0,0,0.4)',
    lg: '0 10px 25px rgba(0,0,0,0.5)',
  },
  transitions: LIGHT_THEME.transitions,
  layout: LIGHT_THEME.layout,
  animation: LIGHT_THEME.animation,
  memberColors: {
    qianhang: '#ff8a65',
    thinker: '#64b5f6',
    prophet: '#ce93d8',
    bole: '#fff176',
    tianshu: '#90a4ae',
    guardian: '#81c784',
    grandmaster: '#b0bec5',
    grace: '#ffb74d',
  },
};

export const BUILT_IN_THEMES: Record<string, ThemeConfig> = {
  light: LIGHT_THEME,
  dark: DARK_THEME,
};
