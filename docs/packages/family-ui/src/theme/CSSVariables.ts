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

import type { ThemeConfig } from './ThemeConfig.js';

export function themeToCSSVariables(theme: ThemeConfig): Record<string, string> {
  const vars: Record<string, string> = {};

  for (const [key, value] of Object.entries(theme.colors)) {
    vars[`--yyc3-color-${camelToKebab(key)}`] = value;
  }
  for (const [key, value] of Object.entries(theme.spacing)) {
    vars[`--yyc3-spacing-${camelToKebab(key)}`] = `${value}px`;
  }
  for (const [key, value] of Object.entries(theme.borderRadius)) {
    vars[`--yyc3-radius-${camelToKebab(key)}`] = `${value}px`;
  }
  for (const [key, value] of Object.entries(theme.typography)) {
    const v = typeof value === 'number' ? (key.includes('Weight') ? `${value}` : `${value}px`) : value;
    vars[`--yyc3-typo-${camelToKebab(key)}`] = v;
  }
  for (const [key, value] of Object.entries(theme.shadows)) {
    vars[`--yyc3-shadow-${camelToKebab(key)}`] = value;
  }
  for (const [key, value] of Object.entries(theme.transitions)) {
    vars[`--yyc3-transition-${camelToKebab(key)}`] = value;
  }
  for (const [key, value] of Object.entries(theme.layout)) {
    vars[`--yyc3-layout-${camelToKebab(key)}`] = `${value}px`;
  }
  for (const [key, value] of Object.entries(theme.animation)) {
    vars[`--yyc3-anim-${camelToKebab(key)}`] = typeof value === 'boolean' ? (value ? '1' : '0') : `${value}ms`;
  }
  for (const [memberId, color] of Object.entries(theme.memberColors)) {
    vars[`--yyc3-member-${memberId}`] = color;
  }

  return vars;
}

export function applyThemeToDOM(theme: ThemeConfig, root?: HTMLElement): void {
  const element = root ?? (typeof document !== 'undefined' ? document.documentElement : null);
  if (!element) return;

  const vars = themeToCSSVariables(theme);
  for (const [key, value] of Object.entries(vars)) {
    element.style.setProperty(key, value);
  }
}

export function removeThemeFromDOM(root?: HTMLElement): void {
  const element = root ?? (typeof document !== 'undefined' ? document.documentElement : null);
  if (!element) return;

  const vars = element.style;
  const toRemove: string[] = [];
  for (let i = 0; i < vars.length; i++) {
    const name = vars[i]!;
    if (name.startsWith('--yyc3-')) {
      toRemove.push(name);
    }
  }
  for (const name of toRemove) {
    vars.removeProperty(name);
  }
}

export function themeToStyleSheet(theme: ThemeConfig): string {
  const vars = themeToCSSVariables(theme);
  const entries = Object.entries(vars)
    .map(([key, value]) => `  ${key}: ${value};`)
    .join('\n');
  return `:root {\n${entries}\n}`;
}

function camelToKebab(str: string): string {
  return str.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase();
}
