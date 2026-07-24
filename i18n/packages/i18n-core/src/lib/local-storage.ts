/**
 * file: local-storage.ts
 * description: 安全的 localStorage 包装器 — SSR 兼容的浏览器存储抽象
 * author: YanYuCloudCube Team <admin@0379.email>
 * version: v2.0.0
 * created: 2026-03-21
 * updated: 2026-06-09
 * status: active
 * tags: [util],[storage],[ssr],[browser]
 *
 * brief: 提供 SSR 安全的 localStorage 读写封装
 *
 * details:
 * - getSafeLocalStorage() 在非浏览器环境返回 null-safe proxy
 * - 自动检测 window/localStorage 可用性
 * - SSR/Node.js 环境下静默降级，不抛异常
 * - 支持 getItem/setItem/removeItem 完整 API
 *
 * dependencies: 无（零依赖）
 * exports: getSafeLocalStorage
 * notes: SSR 环境下所有写操作静默丢弃，读操作返回 null
 */

export function getSafeLocalStorage(): Storage | null {
    if (typeof window === 'undefined') return null;

    try {
        const testKey = '__yyc3_test__';
        window.localStorage.setItem(testKey, 'test');
        window.localStorage.removeItem(testKey);
        return window.localStorage;
    } catch (e) {
        return null;
    }
}
