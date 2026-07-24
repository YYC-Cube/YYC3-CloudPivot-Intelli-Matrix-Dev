/**
 * @file: test-setup.ts
 * @description: Vitest 全局测试设置 — jest-dom matchers + localStorage mock + jsdom polyfill
 */

// 仅在 jsdom 环境下加载 DOM 相关 matchers（node 环境测试不需要）
if (typeof document !== "undefined") {
  await import("@testing-library/jest-dom/vitest");
}

// localStorage mock（jsdom 环境需要）
if (typeof globalThis.localStorage === "undefined") {
  const localStorageMock = (() => {
    let store: Record<string, string> = {};
    return {
      getItem: (key: string) => store[key] ?? null,
      setItem: (key: string, value: string) => { store[key] = String(value); },
      removeItem: (key: string) => { delete store[key]; },
      clear: () => { store = {}; },
    };
  })();
  Object.defineProperty(globalThis, "localStorage", { value: localStorageMock });
}

// jsdom 不支持 scrollIntoView，mock 之
if (typeof Element !== "undefined" && !Element.prototype.scrollIntoView) {
  Element.prototype.scrollIntoView = () => { };
}
