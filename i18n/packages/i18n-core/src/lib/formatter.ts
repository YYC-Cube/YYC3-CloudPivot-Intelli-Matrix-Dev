
/**
 * file: formatter.ts
 * description: 格式化工具 — 模板插值、复数处理与相对时间格式化
 * author: YanYuCloudCube Team <admin@0379.email>
 * version: v2.0.0
 * created: 2026-03-21
 * updated: 2026-06-09
 * status: active
 * tags: [util],[i18n],[format],[interpolation]
 *
 * brief: 提供 i18n 翻译字符串的格式化能力
 *
 * details:
 * - interpolate() 支持 {{variable}} 模板变量替换
 * - pluralize() 支持 | 分隔的单复数形式自动选择
 * - formatRelativeTime() 生成自然语言时间差（刚刚/N分钟前/N小时前）
 * - 对 null/undefined 值的安全处理
 *
 * dependencies: types.js
 * exports: interpolate, pluralize, formatRelativeTime, TranslateParams
 * notes: 模板变量仅支持 \w+ 模式（字母数字下划线）
 */

export interface TranslateParams {
    [key: string]: unknown;
}

export function interpolate(template: string, params?: TranslateParams): string {
    if (!params || Object.keys(params).length === 0) {
        return template;
    }

    return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
        const value = params[key];

        if (value === undefined || value === null) {
            return match;
        }

        return String(value);
    });
}

export function pluralize(template: string, count: number): string {
    return template
        .replace(/\(s\)/g, count === 1 ? "" : "s")
        .replace(/\{\{count\}\}/g, String(count));
}

export function formatRelativeTime(timestamp: number, locale: string): string {
    const diff = Date.now() - timestamp;
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (locale.startsWith("zh")) {
        if (seconds < 60) return "刚刚";
        if (minutes < 60) return `${minutes}分钟前`;
        if (hours < 24) return `${hours}小时前`;
        if (days < 7) return `${days}天前`;
        return new Date(timestamp).toLocaleDateString("zh-CN");
    } else {
        if (seconds < 60) return "just now";
        if (minutes < 60) return `${minutes}m ago`;
        if (hours < 24) return `${hours}h ago`;
        if (days < 7) return `${days}d ago`;
        return new Date(timestamp).toLocaleDateString("en-US");
    }
}
