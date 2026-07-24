/**
 * file: zh-CN.ts
 * description: 简体中文翻译包 — 中国大陆地区简体中文
 * author: YanYuCloudCube Team <admin@0379.email>
 * version: v2.0.0
 * created: 2026-03-21
 * updated: 2026-06-09
 * status: active
 * tags: [locale],[i18n],[zh-CN],[chinese]
 *
 * brief: 简体中文（zh-CN）翻译字典
 *
 * exports: zh_CN (TranslationMap)
 * notes: 差异化管理，与 zh-TW 繁体中文分开维护
 */

export const zh_CN = {
  common: {
    health: "健康状况",
    online: "在线",
    offline: "离线",
    welcome: "欢迎",
    save: "保存",
    cancel: "取消",
    loading: "加载中...",
    error: "错误",
    success: "成功",
    version: "v2.0.0",
  },
  nav: {
    home: "首页",
    about: "关于",
    contact: "联系我们",
  },
  overview: {
    stats: {
      cronNext: "下次唤醒 {time}",
    },
  },
  welcome: {
    message: "你好 {name}",
    title: "欢迎使用 YYC³ i18n Core",
  },
} as const;
