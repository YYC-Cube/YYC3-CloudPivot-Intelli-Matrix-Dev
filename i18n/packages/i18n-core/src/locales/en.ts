/**
 * file: en.ts
 * description: 英语翻译包 — 默认语言，其他语言的回退基准
 * author: YanYuCloudCube Team <admin@0379.email>
 * version: v2.0.0
 * created: 2026-03-21
 * updated: 2026-06-09
 * status: active
 * tags: [locale],[i18n],[en],[english]
 *
 * brief: 英语（en）翻译字典，作为默认语言和缺失翻译的回退
 *
 * details:
 * - 随 I18nManager 初始化时默认加载（非懒加载）
 * - 所有其他语言未覆盖的 key 自动回退到此翻译
 * - TranslationMap 结构：嵌套对象，key 点号分隔
 *
 * exports: en (TranslationMap)
 * notes: 新增 key 时需确保英语文件首先更新
 */

export const en = {
  common: {
    health: "Health",
    online: "Online",
    offline: "Offline",
    welcome: "Welcome",
    save: "Save",
    cancel: "Cancel",
    loading: "Loading...",
    error: "Error",
    success: "Success",
    version: "v2.0.0",
  },
  nav: {
    home: "Home",
    about: "About",
    contact: "Contact",
  },
  overview: {
    stats: {
      cronNext: "Next wake {time}",
    },
  },
  welcome: {
    message: "Hello {name}",
    title: "Welcome to YYC³ i18n Core",
  },
} as const;

export type TranslationMap = typeof en;
