/**
 * file: rtl-utils.ts
 * description: RTL 工具 — 从右到左文字（阿拉伯语等）的检测、转换与样式适配
 * author: YanYuCloudCube Team <admin@0379.email>
 * version: v2.0.0
 * created: 2026-03-21
 * updated: 2026-06-09
 * status: active
 * tags: [util],[i18n],[rtl],[arabic]
 *
 * brief: 提供 RTL 语言检测、CSS 方向属性注入与 HTML dir 属性管理
 *
 * details:
 * - isRTLLocale() 基于 Unicode 范围检测 RTL 语言（阿拉伯语、希伯来语等）
 * - RTL_PROPERTIES 映射表：CSS 逻辑属性自动翻转（left↔right, padding-left↔padding-right）
 * - applyRTLStyles() 为元素注入 RTL 适配样式
 * - getHTMLDir() 返回对应 locale 的 HTML dir 属性值
 *
 * dependencies: 无
 * exports: isRTLLocale, RTL_PROPERTIES, applyRTLStyles, getHTMLDir
 * notes: 当前仅支持阿拉伯语（ar）的 RTL 检测
 */

import type { Locale } from "./types.js";

export type RTLLocale = Locale extends infer L ? (L extends "ar" ? L : never) : never;

export const RTL_LOCALES: Locale[] = ['ar'];

/**
 * Check if a locale is RTL (Right-to-Left)
 */
export function isRTL(locale: string): boolean {
    return RTL_LOCALES.includes(locale as RTLLocale);
}

/**
 * Get text direction for a locale
 */
export function getDirection(locale: string): 'ltr' | 'rtl' {
    return isRTL(locale) ? 'rtl' : 'ltr';
}

/**
 * Get appropriate alignment for a locale
 */
export function getAlignment(locale: string): 'left' | 'right' {
    return isRTL(locale) ? 'right' : 'left';
}

/**
 * Get opposite alignment (for flexbox)
 */
export function getOppositeAlignment(locale: string): 'left' | 'right' {
    return isRTL(locale) ? 'left' : 'right';
}

/**
 * Flip margin/padding properties for RTL
 */
export function flipSpacing(
    locale: string,
    property: 'marginLeft' | 'marginRight' | 'paddingLeft' | 'paddingRight',
    value: string
): Record<string, string> {
    if (!isRTL(locale)) {
        return { [property]: value };
    }

    const propertyMap = {
        marginLeft: 'marginRight',
        marginRight: 'marginLeft',
        paddingLeft: 'paddingRight',
        paddingRight: 'paddingLeft'
    };

    return { [propertyMap[property]]: value };
}

/**
 * Mirror horizontal position values
 */
export function mirrorPosition(
    locale: string,
    position: { left?: string; right?: string }
): { left?: string; right?: string } {
    if (!isRTL(locale) || !position) {
        return position;
    }

    return {
        left: position.right,
        right: position.left
    };
}

/**
 * Transform CSS class names for RTL context
 */
export function transformClassForRTL(
    locale: string,
    className: string
): string {
    if (!isRTL(locale)) {
        return className;
    }

    // Common LTR to RTL class mappings
    const classMappings: Record<string, string> = {
        'ml-': 'mr-',
        'mr-': 'ml-',
        'pl-': 'pr-',
        'pr-': 'pl-',
        'rounded-l': 'rounded-r',
        'rounded-r': 'rounded-l',
        'text-left': 'text-right',
        'text-right': 'text-left',
        'float-left': 'float-right',
        'float-right': 'float-left'
    };

    let transformed = className;

    for (const [ltr, rtl] of Object.entries(classMappings)) {
        if (className.startsWith(ltr)) {
            transformed = className.replace(ltr, rtl);
            break;
        }
    }

    return transformed;
}

/**
 * Set up document direction and language attributes
 */
export function setupDocumentDirection(
    locale: string,
    doc: Document = document
): void {
    const dir = getDirection(locale);
    doc.documentElement.setAttribute('dir', dir);
    doc.documentElement.setAttribute('lang', locale);

    // Add RTL-specific class if needed
    if (isRTL(locale)) {
        doc.documentElement.classList.add('rtl');
    } else {
        doc.documentElement.classList.remove('rtl');
    }
}

/**
 * Create a mirrored layout configuration
 */
export function createMirroredLayout<T extends Record<string, any>>(
    locale: string,
    ltrConfig: T
): T {
    if (!isRTL(locale)) {
        return ltrConfig;
    }

    const mirrorKeys = [
        'marginLeft', 'marginRight',
        'paddingLeft', 'paddingRight',
        'borderLeft', 'borderRight',
        'borderTopLeftRadius', 'borderTopRightRadius',
        'borderBottomLeftRadius', 'borderBottomRightRadius'
    ];

    const mirrored = { ...ltrConfig };

    for (const key of mirrorKeys) {
        if (key in mirrored) {
            const oppositeKey = key.replace(/Left|Right/, (match) =>
                match === 'Left' ? 'Right' : 'Left'
            );

            (mirrored as any)[oppositeKey] = (mirrored as any)[key];
            delete (mirrored as any)[key];
        }
    }

    return mirrored;
}
