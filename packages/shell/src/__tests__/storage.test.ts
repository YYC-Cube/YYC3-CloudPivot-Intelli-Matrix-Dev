import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createSystemStorage, StorageKeys } from "../storage";

describe("createSystemStorage", () => {
  beforeEach(() => { localStorage.clear(); });
  afterEach(() => { localStorage.clear(); });

  it("应以 yyc3:{system}: 前缀存储", () => {
    const store = createSystemStorage("test");
    store.set("key", "value");
    expect(localStorage.getItem("yyc3:test:key")).toBe('"value"');
  });

  it("get 应正确读取", () => {
    const store = createSystemStorage("test");
    store.set("num", 42);
    expect(store.get("num")).toBe(42);
  });

  it("get 应支持 fallback", () => {
    const store = createSystemStorage("test");
    expect(store.get("missing", "default")).toBe("default");
  });

  it("remove 应删除数据", () => {
    const store = createSystemStorage("test");
    store.set("key", "val");
    store.remove("key");
    expect(store.get("key")).toBeUndefined();
  });

  it("clear 应清空所有命名空间数据", () => {
    const store = createSystemStorage("test");
    store.set("a", 1);
    store.set("b", 2);
    store.clear();
    expect(store.get("a")).toBeUndefined();
    expect(store.get("b")).toBeUndefined();
  });

  it("不同命名空间应隔离", () => {
    const a = createSystemStorage("ai-family");
    const b = createSystemStorage("business");
    a.set("key", "family");
    b.set("key", "business");
    expect(a.get("key")).toBe("family");
    expect(b.get("key")).toBe("business");
  });

  it("存储值损坏时应回退 fallback", () => {
    const store = createSystemStorage("corrupt");
    localStorage.setItem("yyc3:corrupt:key", "{not valid json");
    expect(store.get("key", "safe-default")).toBe("safe-default");
    expect(store.get<number>("corrupt-num", 0)).toBe(0);
  });

  it("写入配额超限时应静默失败", () => {
    const failing = {
      getItem: () => null,
      setItem: () => { throw new Error("QuotaExceededError"); },
      removeItem: () => { },
      clear: () => { },
      length: 0,
      key: () => null,
    };
    vi.stubGlobal("localStorage", failing);
    const store = createSystemStorage("quota");
    expect(() => store.set("key", "value")).not.toThrow();
    vi.unstubAllGlobals();
  });

  it("StorageKeys 常量应正确", () => {
    expect(StorageKeys.AI_ACTIVE_PERSONA).toBe("activePersona");
    expect(StorageKeys.AI_API_KEY).toBe("aiApiKey");
    expect(StorageKeys.SHELL_WELCOME_DISMISSED).toBe("welcomeDismissed");
  });
});
