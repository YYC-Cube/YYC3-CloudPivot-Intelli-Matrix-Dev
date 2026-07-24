/**
 * file: zh-TW.ts
 * description: 繁体中文翻译包 — 台湾地区繁体中文
 * author: YanYuCloudCube Team <admin@0379.email>
 * version: v2.0.0
 * created: 2026-03-21
 * updated: 2026-06-09
 * status: active
 * tags: [locale],[i18n],[zh-TW],[traditional-chinese]
 *
 * brief: 繁体中文（zh-TW）翻译字典
 *
 * exports: zh_TW (TranslationMap)
 * notes: 差异化管理，与 zh-CN 简体中文分开维护
 */

export const zh_TW = {
    common: {
        health: "健康狀態",
        online: "線上",
        offline: "離線",
        welcome: "歡迎",
        save: "儲存",
        cancel: "取消",
        loading: "載入中...",
        error: "錯誤",
        success: "成功",
        version: "v2.0.0",
    },
    nav: {
        home: "首頁",
        about: "關於",
        contact: "聯絡我們",
    },
    overview: {
        stats: {
            cronNext: "下次喚醒 {time}",
        },
    },
    welcome: {
        message: "你好 {name}",
        title: "歡迎使用 YYC³ i18n Core",
    },
} as const;
