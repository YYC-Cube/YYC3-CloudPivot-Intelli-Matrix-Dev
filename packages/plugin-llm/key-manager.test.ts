/**
 * @file: key-manager.test.ts
 * @description: APIKeyManager 测试 — 加密存储 Keyring
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { APIKeyManager } from "./src/key-manager";

/** 简单 localStorage / sessionStorage mock */
function mockStorage() {
  const store: Record<string, string> = {};
  return {
    getItem: (k: string) => store[k] ?? null,
    setItem: (k: string, v: string) => { store[k] = v; },
    removeItem: (k: string) => { delete store[k]; },
    clear: () => { for (const k of Object.keys(store)) delete store[k]; },
    _dump: () => ({ ...store }),
  };
}

describe("APIKeyManager", () => {
  let km: APIKeyManager;
  let localStorageMock: ReturnType<typeof mockStorage>;
  let sessionStorageMock: ReturnType<typeof mockStorage>;

  beforeEach(() => {
    localStorageMock = mockStorage();
    sessionStorageMock = mockStorage();
    // 重写 navigator + window 以保证 getDeviceFingerprint 稳定
    vi.stubGlobal("localStorage", localStorageMock);
    vi.stubGlobal("sessionStorage", sessionStorageMock);
    vi.stubGlobal("window", {
      navigator: { userAgent: "test", language: "zh-CN", hardwareConcurrency: 8 },
      screen: { width: 1920, height: 1080, colorDepth: 24 },
    });
    km = new APIKeyManager();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("初始状态应为 uninitialized", () => {
    expect(km.getStatus()).toBe("uninitialized");
  });

  it("initWithDeviceFingerprint 应创建空 Keyring 并解锁", async () => {
    await km.initWithDeviceFingerprint();
    expect(km.getStatus()).toBe("unlocked");
    expect(km.listProviders()).toHaveLength(0);
  });

  it("setKey 应加密存储, getKey 应返回明文", async () => {
    await km.initWithDeviceFingerprint();
    await km.setKey("openai", "sk-openai-12345");

    expect(km.getKey("openai")).toBe("sk-openai-12345");
    expect(km.hasKey("openai")).toBe(true);

    // localStorage 不应包含明文 Key
    const raw = localStorageMock.getItem("yyc3:llm:keyring:v1");
    expect(raw).toBeTruthy();
    expect(raw).not.toContain("sk-openai-12345");
  });

  it("listProviders 应返回已配置 Provider (不含 Key 明文)", async () => {
    await km.initWithDeviceFingerprint();
    await km.setKey("openai", "sk-1");
    await km.setKey("deepseek", "sk-2");

    const list = km.listProviders();
    expect(list).toHaveLength(2);
    expect(list.some(p => p.provider === "openai")).toBe(true);
    expect(list.some(p => p.provider === "deepseek")).toBe(true);
    // 不应包含 Key 明文
    for (const p of list) {
      expect(JSON.stringify(p)).not.toContain("sk-1");
      expect(JSON.stringify(p)).not.toContain("sk-2");
    }
  });

  it("removeKey 应删除指定 Provider", async () => {
    await km.initWithDeviceFingerprint();
    await km.setKey("openai", "sk-1");
    await km.setKey("deepseek", "sk-2");
    km.removeKey("openai");
    expect(km.hasKey("openai")).toBe(false);
    expect(km.hasKey("deepseek")).toBe(true);
  });

  it("lock 应清除内存 Key", async () => {
    await km.initWithDeviceFingerprint();
    await km.setKey("openai", "sk-1");
    km.lock();
    expect(km.getStatus()).toBe("locked");
    expect(km.getKey("openai")).toBeNull();
  });

  it("unlock 应使用口令重新解密", async () => {
    // 用主口令设置
    await km.setMasterPassword("password123");
    await km.setKey("openai", "sk-secret");
    km.lock();

    // 错误口令
    const ok1 = await km.unlock("wrong-password");
    expect(ok1).toBe(false);
    expect(km.getStatus()).toBe("locked");

    // 正确口令
    const ok2 = await km.unlock("password123");
    expect(ok2).toBe(true);
    expect(km.getStatus()).toBe("unlocked");
    expect(km.getKey("openai")).toBe("sk-secret");
  });

  it("buildProviderConfigs 应返回可用于 LLMRouter 的配置", async () => {
    await km.initWithDeviceFingerprint();
    await km.setKey("openai", "sk-openai");
    await km.setKey("qwen", "sk-qwen", { defaultModel: "qwen-max" });

    const configs = km.buildProviderConfigs();
    expect(configs).toHaveLength(2);
    const openai = configs.find(c => c.provider === "openai");
    const qwen = configs.find(c => c.provider === "qwen");
    expect(openai?.apiKey).toBe("sk-openai");
    expect(qwen?.apiKey).toBe("sk-qwen");
    expect(qwen?.defaultModel).toBe("qwen-max");
  });

  it("未解锁时 setKey 应抛出错误", async () => {
    await expect(km.setKey("openai", "sk-x")).rejects.toThrow();
  });

  it("主口令少于 8 位应拒绝", async () => {
    await expect(km.setMasterPassword("123")).rejects.toThrow();
  });

  it("Keyring 持久化 — 新实例应能恢复 (通过 restoreFromSession)", async () => {
    await km.initWithDeviceFingerprint();
    await km.setKey("openai", "sk-persisted");

    // 模拟刷新 — sessionStorage 仍存在
    const km2 = new APIKeyManager();
    expect(km2.getStatus()).toBe("locked"); // 构造函数只能识别为 locked, 不能同步解密
    expect(km2.canRestoreFromSession()).toBe(true);
    const restored = await km2.restoreFromSession();
    expect(restored).toBe(true);
    expect(km2.getStatus()).toBe("unlocked");
    expect(km2.getKey("openai")).toBe("sk-persisted");
  });
});
