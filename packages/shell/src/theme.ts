/**
 * @file: theme.ts
 * @description: 统一视觉主题 — Modern (AI Family · 全子系统)
 */
export type ThemeMode = "modern";

export interface ThemeTokens {
  mode: ThemeMode;
  // 面板背景
  panelBg: string;
  panelBorder: string;
  panelShadow: string;
  // 语义色
  success: string;
  warning: string;
  reject: string;
  // 文字
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  // 强调色
  accent: string;
  accentBg: string;
  accentBorder: string;
  // Header
  headerBg: string;
  headerBorder: string;
  // Tab
  tabActiveBg: string;
  tabActiveText: string;
  tabInactiveText: string;
  // 输入
  inputBg: string;
  inputBorder: string;
  // 按钮
  btnSendGradient: string;
  // 动画
  typingDotColor: string;
  // 滚动条
  scrollbarClass: string;
  // 浮窗按钮
  floatBtnGradient: string;
  floatBtnShadow: string;
}

// ============================================================
// Modern Theme (AI Family / 其他现代系统)
// ============================================================

export const THEME_MODERN: ThemeTokens = {
  mode: "modern",
  panelBg: "rgba(8,25,55,0.95)",
  success: "#00FF88",
  warning: "#FFDD00",
  reject: "#FF3366",
  panelBorder: "rgba(0,212,255,0.2)",
  panelShadow: "0 0 60px rgba(0,180,255,0.12)",
  textPrimary: "#e0f0ff",
  textSecondary: "rgba(0,212,255,0.4)",
  textMuted: "rgba(0,212,255,0.2)",
  accent: "#00d4ff",
  accentBg: "rgba(0,212,255,0.12)",
  accentBorder: "rgba(0,212,255,0.25)",
  headerBg: "rgba(0,40,80,0.2)",
  headerBorder: "rgba(0,180,255,0.12)",
  tabActiveBg: "rgba(0,212,255,0.12)",
  tabActiveText: "#00d4ff",
  tabInactiveText: "rgba(0,212,255,0.4)",
  inputBg: "rgba(0,40,80,0.4)",
  inputBorder: "rgba(0,180,255,0.15)",
  btnSendGradient: "linear-gradient(135deg, #00d4ff, #0066ff)",
  typingDotColor: "#00d4ff",
  scrollbarClass: "hide-scrollbar",
  floatBtnGradient: "linear-gradient(135deg, #00d4ff, #7b2ff7)",
  floatBtnShadow: "0 0 30px rgba(0,180,255,0.4)",
};

// ============================================================
// 主题选择器
// ============================================================

export function getTheme(mode: ThemeMode): ThemeTokens {
  void mode;
  return THEME_MODERN;
}

const DEFAULT_THEME: Record<string, ThemeMode> = {
  "ai-family": "modern",
  monitor: "modern",
  ops: "modern",
  ai: "modern",
  dev: "modern",
  admin: "modern",
  business: "modern",
  hub: "modern",
};

export function getSystemTheme(systemId: string): ThemeTokens {
  return getTheme(DEFAULT_THEME[systemId] ?? "modern");
}

// ============================================================
// AI Family 现代化设计增强
// ============================================================

export const AI_FAMILY_STYLES = {
  // 时钟环光晕
  clockRingGlow: (color: string) => `0 0 40px ${color}33, 0 0 80px ${color}11`,
  // 家人卡片悬浮
  personaHover: (color: string) => `0 0 20px ${color}44`,
  // 渐变背景
  bgGradient: "radial-gradient(ellipse at center, rgba(0,255,136,0.03) 0%, rgba(4,8,20,1) 70%)",
} as const;
