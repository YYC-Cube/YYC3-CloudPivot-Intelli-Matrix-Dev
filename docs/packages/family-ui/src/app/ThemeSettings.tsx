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

import React, { useState, useEffect, useCallback } from 'react';
import type { ThemeManager } from '../theme/ThemeManager.js';
import type { ThemeConfig } from '../theme/ThemeConfig.js';
import { BUILT_IN_THEMES } from '../theme/ThemeConfig.js';

export interface ThemeSettingsProps {
  themeManager: ThemeManager;
  onClose?: () => void;
}

export const ThemeSettings: React.FC<ThemeSettingsProps> = ({ themeManager, onClose }) => {
  const [theme, setTheme] = useState<ThemeConfig>(themeManager.getTheme());
  const [tab, setTab] = useState<'presets' | 'colors' | 'typography' | 'layout' | 'members'>('presets');

  useEffect(() => {
    setTheme(themeManager.getTheme());
    const unsub = themeManager.onThemeChange((t) => setTheme(t));
    return unsub;
  }, [themeManager]);

  const handlePresetSelect = useCallback((id: string) => {
    themeManager.setTheme(id);
  }, [themeManager]);

  const handleColorChange = useCallback((key: keyof ThemeConfig['colors'], value: string) => {
    const updated = { ...theme.colors, [key]: value };
    theme.colors = updated;
    themeManager.setCustomTheme({ ...theme, colors: updated });
  }, [theme, themeManager]);

  const handleMemberColorChange = useCallback((memberId: string, color: string) => {
    themeManager.updateMemberColor(memberId, color);
  }, [themeManager]);

  const handleExport = useCallback(() => {
    const json = themeManager.exportTheme();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `yyc3-theme-${theme.id}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [themeManager, theme]);

  const handleImport = useCallback(() => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) return;
      const text = await file.text();
      try {
        const imported = themeManager.importTheme(text);
        themeManager.setTheme(imported.id);
      } catch (e) {
        console.error('Theme import failed:', e);
      }
    };
    input.click();
  }, [themeManager]);

  const tabs = [
    { id: 'presets' as const, label: '预设' },
    { id: 'colors' as const, label: '颜色' },
    { id: 'typography' as const, label: '排版' },
    { id: 'layout' as const, label: '布局' },
    { id: 'members' as const, label: '成员色' },
  ];

  return React.createElement('div', {
    'data-testid': 'theme-settings',
    style: {
      position: 'fixed',
      top: 0,
      right: 0,
      width: '360px',
      height: '100vh',
      backgroundColor: theme.colors.surface,
      borderLeft: `1px solid ${theme.colors.border}`,
      boxShadow: theme.shadows.lg,
      display: 'flex',
      flexDirection: 'column',
      fontFamily: theme.typography.fontFamily,
      color: theme.colors.text,
      zIndex: 9999,
    },
  },
    React.createElement('div', {
      style: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '16px',
        borderBottom: `1px solid ${theme.colors.border}`,
      },
    },
      React.createElement('h2', { style: { margin: 0, fontSize: '16px' } }, '🎨 主题设置'),
      React.createElement('button', {
        onClick: onClose,
        style: { background: 'none', border: 'none', cursor: 'pointer', fontSize: '18px', color: theme.colors.textSecondary },
      }, '✕'),
    ),
    React.createElement('div', {
      style: { display: 'flex', borderBottom: `1px solid ${theme.colors.border}` },
    }, ...tabs.map(t =>
      React.createElement('button', {
        key: t.id,
        onClick: () => setTab(t.id),
        style: {
          flex: 1,
          padding: '8px 4px',
          border: 'none',
          background: tab === t.id ? theme.colors.primary : 'transparent',
          color: tab === t.id ? '#fff' : theme.colors.textSecondary,
          cursor: 'pointer',
          fontSize: '12px',
          fontWeight: 500,
        },
      }, t.label),
    )),
    React.createElement('div', { style: { flex: 1, overflow: 'auto', padding: '16px' } },
      tab === 'presets' && React.createElement(PresetsTab, {
        themes: Object.values(BUILT_IN_THEMES),
        customThemes: themeManager.getCustomThemes(),
        currentId: theme.id,
        onSelect: handlePresetSelect,
        onExport: handleExport,
        onImport: handleImport,
        colors: theme.colors,
      }),
      tab === 'colors' && React.createElement(ColorsTab, {
        colors: theme.colors,
        onChange: handleColorChange,
      }),
      tab === 'members' && React.createElement(MembersTab, {
        memberColors: theme.memberColors,
        onChange: handleMemberColorChange,
      }),
      tab === 'typography' && React.createElement(TypographyTab, { theme }),
      tab === 'layout' && React.createElement(LayoutTab, { theme }),
    ),
  );
};

interface PresetsTabProps {
  themes: ThemeConfig[];
  customThemes: ThemeConfig[];
  currentId: string;
  onSelect: (id: string) => void;
  onExport: () => void;
  onImport: () => void;
  colors: ThemeConfig['colors'];
}

const PresetsTab: React.FC<PresetsTabProps> = ({ themes, customThemes, currentId, onSelect, onExport, onImport, colors }) => {
  const allThemes = [...themes, ...customThemes];
  return React.createElement('div', null,
    ...allThemes.map(t =>
      React.createElement('div', {
        key: t.id,
        onClick: () => onSelect(t.id),
        'data-testid': `theme-preset-${t.id}`,
        style: {
          padding: '12px',
          marginBottom: '8px',
          borderRadius: '8px',
          border: `2px solid ${t.id === currentId ? colors.primary : colors.border}`,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          background: t.id === currentId ? `${colors.primary}10` : 'transparent',
        },
      },
        React.createElement('div', {
          style: { display: 'flex', gap: '4px' },
        },
          React.createElement('div', { style: { width: 16, height: 16, borderRadius: '50%', background: t.colors.primary } }),
          React.createElement('div', { style: { width: 16, height: 16, borderRadius: '50%', background: t.colors.background } }),
          React.createElement('div', { style: { width: 16, height: 16, borderRadius: '50%', background: t.colors.accent } }),
        ),
        React.createElement('div', null,
          React.createElement('div', { style: { fontWeight: 600, fontSize: '13px' } }, t.name),
          React.createElement('div', { style: { fontSize: '11px', color: colors.textSecondary } }, t.mode),
        ),
      ),
    ),
    React.createElement('div', { style: { display: 'flex', gap: '8px', marginTop: '12px' } },
      React.createElement('button', {
        onClick: onExport,
        style: { flex: 1, padding: '8px', border: `1px solid ${colors.border}`, borderRadius: '6px', background: colors.surface, cursor: 'pointer', fontSize: '12px', color: colors.text },
      }, '📥 导出主题'),
      React.createElement('button', {
        onClick: onImport,
        style: { flex: 1, padding: '8px', border: `1px solid ${colors.border}`, borderRadius: '6px', background: colors.surface, cursor: 'pointer', fontSize: '12px', color: colors.text },
      }, '📤 导入主题'),
    ),
  );
};

interface ColorsTabProps {
  colors: ThemeConfig['colors'];
  onChange: (key: keyof ThemeConfig['colors'], value: string) => void;
}

const ColorsTab: React.FC<ColorsTabProps> = ({ colors, onChange }) => {
  const labels: Record<string, string> = {
    primary: '主色', secondary: '副色', accent: '强调色',
    background: '背景', surface: '卡片', text: '文字',
    textSecondary: '次要文字', border: '边框',
    error: '错误', success: '成功', warning: '警告', info: '信息',
  };
  return React.createElement('div', null,
    ...Object.entries(colors).map(([key, value]) =>
      React.createElement('div', {
        key,
        style: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' },
      },
        React.createElement('label', { style: { fontSize: '13px', color: '#666' } }, labels[key] ?? key),
        React.createElement('div', { style: { display: 'flex', alignItems: 'center', gap: '8px' } },
          React.createElement('input', {
            type: 'color',
            value,
            onChange: (e: React.ChangeEvent<HTMLInputElement>) => onChange(key as keyof ThemeConfig['colors'], e.target.value),
            'data-testid': `color-${key}`,
            style: { width: 32, height: 24, border: 'none', cursor: 'pointer' },
          }),
          React.createElement('span', { style: { fontSize: '11px', fontFamily: 'monospace', color: '#999' } }, value),
        ),
      ),
    ),
  );
};

interface MembersTabProps {
  memberColors: Record<string, string>;
  onChange: (memberId: string, color: string) => void;
}

const MembersTab: React.FC<MembersTabProps> = ({ memberColors, onChange }) => {
  const names: Record<string, string> = {
    qianhang: '🚀 前航', thinker: '🧠 思辨', prophet: '🔮 先知', bole: '👁 伯乐',
    tianshu: '⚙️ 天枢', guardian: '🛡 守护', grandmaster: '📚 宗师', grace: '🎨 优雅',
  };
  return React.createElement('div', null,
    ...Object.entries(memberColors).map(([id, color]) =>
      React.createElement('div', {
        key: id,
        style: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' },
      },
        React.createElement('label', { style: { fontSize: '13px' } }, names[id] ?? id),
        React.createElement('div', { style: { display: 'flex', alignItems: 'center', gap: '8px' } },
          React.createElement('input', {
            type: 'color',
            value: color,
            onChange: (e: React.ChangeEvent<HTMLInputElement>) => onChange(id, e.target.value),
            'data-testid': `member-color-${id}`,
            style: { width: 32, height: 24, border: 'none', cursor: 'pointer' },
          }),
          React.createElement('span', { style: { fontSize: '11px', fontFamily: 'monospace', color: '#999' } }, color),
        ),
      ),
    ),
  );
};

const TypographyTab: React.FC<{ theme: ThemeConfig }> = ({ theme }) => {
  const t = theme.typography;
  return React.createElement('div', null,
    React.createElement('div', { style: { marginBottom: '12px' } },
      React.createElement('div', { style: { fontSize: '12px', color: '#999', marginBottom: '4px' } }, '字体族'),
      React.createElement('div', { style: { fontFamily: t.fontFamily, fontSize: '14px' } }, t.fontFamily),
    ),
    React.createElement('div', { style: { marginBottom: '12px' } },
      React.createElement('div', { style: { fontSize: '12px', color: '#999', marginBottom: '8px' } }, '字号阶梯'),
      ...[
        { label: 'XS', size: t.fontSizeXs },
        { label: 'SM', size: t.fontSizeSm },
        { label: 'MD', size: t.fontSizeMd },
        { label: 'LG', size: t.fontSizeLg },
        { label: 'XL', size: t.fontSizeXl },
        { label: 'XXL', size: t.fontSizeXxl },
      ].map(s =>
        React.createElement('div', { key: s.label, style: { display: 'flex', justifyContent: 'space-between', marginBottom: '4px' } },
          React.createElement('span', { style: { fontSize: `${s.size}px` } }, `${s.label} — ${s.size}px`),
        ),
      ),
    ),
    React.createElement('div', null,
      React.createElement('div', { style: { fontSize: '12px', color: '#999', marginBottom: '4px' } }, `行高: ${t.lineHeight}`),
    ),
  );
};

const LayoutTab: React.FC<{ theme: ThemeConfig }> = ({ theme }) => {
  const l = theme.layout;
  return React.createElement('div', null,
    ...Object.entries(l).map(([key, value]) =>
      React.createElement('div', {
        key,
        style: { display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: `1px solid ${theme.colors.border}` },
      },
        React.createElement('span', { style: { fontSize: '13px', color: '#666' } }, key),
        React.createElement('span', { style: { fontSize: '13px', fontFamily: 'monospace' } }, `${value}px`),
      ),
    ),
  );
};
