/**
 * @file: llm-bridge.test.ts
 * @description: LLMBridge 桥接器测试 — Mock 回退 + 真实 LLM 路径
 */
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { LLMBridge } from "../llm-bridge";

function mockStorage() {
  const store: Record<string, string> = {};
  return {
    getItem: (k: string) => store[k] ?? null,
    setItem: (k: string, v: string) => { store[k] = v; },
    removeItem: (k: string) => { delete store[k]; },
    clear: () => { for (const k of Object.keys(store)) delete store[k]; },
  };
}

describe("LLMBridge — 无 API Key 回退 Mock", () => {
  beforeEach(() => {
    vi.stubGlobal("localStorage", mockStorage());
    vi.stubGlobal("sessionStorage", mockStorage());
    vi.stubGlobal("window", {
      navigator: { userAgent: "test", language: "zh-CN", hardwareConcurrency: 8 },
      screen: { width: 1920, height: 1080, colorDepth: 24 },
    });
  });
  afterEach(() => vi.unstubAllGlobals());

  it("chat() 在无 Key 时应返回 Mock 内容", async () => {
    const bridge = new LLMBridge({ mockDelay: 10 });
    await bridge.init();
    expect(bridge.isRealLLMAvailable()).toBe(false);

    const resp = await bridge.chat([{ role: "user", content: "你好" }]);
    expect(resp.fellBack).toBe(true);
    expect(resp.provider).toBe("mock");
    expect(resp.content.length).toBeGreaterThan(0);
  });

  it("chatStream() 应按 delta 回调", async () => {
    const bridge = new LLMBridge({ mockDelay: 10 });
    await bridge.init();

    const deltas: string[] = [];
    const resp = await bridge.chatStream(
      [{ role: "user", content: "帮我分析状态" }],
      (d) => deltas.push(d)
    );
    expect(resp.fellBack).toBe(true);
    expect(deltas.length).toBeGreaterThan(0);
    // 拼接的 deltas 应等于完整 content
    expect(deltas.join("")).toBe(resp.content);
  });

  it("自定义 mockResponse 应被调用", async () => {
    const customMock = vi.fn(() => "自定义回复");
    const bridge = new LLMBridge({ mockResponse: customMock, mockDelay: 10 });
    await bridge.init();
    const resp = await bridge.chat([{ role: "user", content: "test" }]);
    expect(customMock).toHaveBeenCalledWith("test");
    expect(resp.content).toBe("自定义回复");
  });
});

describe("LLMBridge — Provider 管理", () => {
  beforeEach(() => {
    vi.stubGlobal("localStorage", mockStorage());
    vi.stubGlobal("sessionStorage", mockStorage());
    vi.stubGlobal("window", {
      navigator: { userAgent: "test", language: "zh-CN", hardwareConcurrency: 8 },
      screen: { width: 1920, height: 1080, colorDepth: 24 },
    });
  });
  afterEach(() => vi.unstubAllGlobals());

  it("setProviderKey 后 isRealLLMAvailable 应为 true", async () => {
    const bridge = new LLMBridge({ mockDelay: 10 });
    await bridge.init();
    expect(bridge.isRealLLMAvailable()).toBe(false);

    await bridge.setProviderKey("openai", "sk-test-key-12345", { defaultModel: "gpt-4o-mini" });
    expect(bridge.isRealLLMAvailable()).toBe(true);
    expect(bridge.listProviders()).toHaveLength(1);
    expect(bridge.listProviders()[0].provider).toBe("openai");
  });

  it("removeProviderKey 后 isRealLLMAvailable 应为 false", async () => {
    const bridge = new LLMBridge({ mockDelay: 10 });
    await bridge.init();
    await bridge.setProviderKey("openai", "sk-test");
    expect(bridge.isRealLLMAvailable()).toBe(true);

    bridge.removeProviderKey("openai");
    expect(bridge.isRealLLMAvailable()).toBe(false);
  });
});

describe("LLMBridge — 真实 LLM 失败回退 Mock", () => {
  beforeEach(() => {
    vi.stubGlobal("localStorage", mockStorage());
    vi.stubGlobal("sessionStorage", mockStorage());
    vi.stubGlobal("window", {
      navigator: { userAgent: "test", language: "zh-CN", hardwareConcurrency: 8 },
      screen: { width: 1920, height: 1080, colorDepth: 24 },
    });
    // 模拟 LLM 端点不可达
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("network error")));
  });
  afterEach(() => vi.unstubAllGlobals());

  it("真实 LLM 失败时应自动回退 Mock", async () => {
    const bridge = new LLMBridge({ mockDelay: 10 });
    await bridge.init();
    await bridge.setProviderKey("openai", "sk-test");

    const resp = await bridge.chat([{ role: "user", content: "你好" }]);
    expect(resp.fellBack).toBe(true);
    expect(resp.error).toContain("network error");
    expect(resp.content.length).toBeGreaterThan(0); // Mock 内容
  });

  it("fallbackToMock=false 时不应回退", async () => {
    const bridge = new LLMBridge({ fallbackToMock: false, mockDelay: 10 });
    await bridge.init();
    await bridge.setProviderKey("openai", "sk-test");

    const resp = await bridge.chat([{ role: "user", content: "hi" }]);
    expect(resp.fellBack).toBe(false);
    expect(resp.error).toBeTruthy();
    expect(resp.content).toBe("");
  });
});
