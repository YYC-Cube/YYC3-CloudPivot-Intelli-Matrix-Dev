/**
 * @file: llm-bridge.router.test.ts
 * @description: LLMBridge 真实路由路径测试 — vi.mock plugin-llm 全确定性覆盖
 *   （chat/chatStream 路由成功、路由失败回退、Provider 管理、单例、defaultMockResponse 分支）
 */
import { beforeEach, afterEach, describe, expect, it, vi } from "vitest";

// ── 共享 mock 状态（vi.mock 工厂 hoist，须经 vi.hoisted 声明）──
const routerState = vi.hoisted(() => ({
  failChat: false,
  failStream: false,
}));

// ── mock @yyc3/plugin-llm：keyManager + LLMRouter 全 fake ──
vi.mock("@yyc3/plugin-llm", () => {
  const keyStore = new Map<string, { apiKey: string; defaultModel?: string }>();
  const keyManager = {
    canRestoreFromSession: () => false,
    restoreFromSession: async () => { },
    getStatus: () => (keyStore.size > 0 ? "unlocked" : "uninitialized"),
    initWithDeviceFingerprint: async () => { },
    buildProviderConfigs: () =>
      [...keyStore.entries()].map(([provider, v]) => ({
        provider,
        apiKey: v.apiKey,
        defaultModel: v.defaultModel,
      })),
    setKey: async (provider: string, apiKey: string, opts?: { defaultModel?: string }) => {
      keyStore.set(provider, { apiKey, defaultModel: opts?.defaultModel });
    },
    removeKey: (provider: string) => { keyStore.delete(provider); },
  };

  class LLMRouter {
    constructor(_config: unknown) { }
    chat(_req: unknown) {
      if (routerState.failChat) {
        const e = new Error("boom: provider down") as Error & { provider?: string };
        e.provider = "openai";
        throw e;
      }
      return Promise.resolve({
        content: "路由回复内容",
        provider: "openai",
        model: "gpt-4o",
        _routing: { reason: "manual → openai/gpt-4o" },
        usage: { promptTokens: 3, completionTokens: 5, totalTokens: 8 },
      });
    }
    async chatStream(_req: unknown, onChunk: (c: { delta?: string }) => void) {
      if (routerState.failStream) {
        const e = new Error("stream broken") as Error & { provider?: string };
        e.provider = "openai";
        throw e;
      }
      onChunk({ delta: "he" });
      onChunk({ delta: "llo" });
      onChunk({}); // 空 delta 应被忽略
      return {
        routing: { reason: "stream-manual", adapter: { provider: "openai" }, model: "gpt-4o-mini" },
      };
    }
  }

  return { keyManager, LLMRouter };
});

import { getLLMBridge, LLMBridge } from "../llm-bridge";

describe("LLMBridge — 真实路由路径 (mocked plugin-llm)", () => {
  beforeEach(() => {
    routerState.failChat = false;
    routerState.failStream = false;
  });
  afterEach(() => vi.clearAllMocks());

  it("init 后无 Key：keyManager 初始化 + router 为空 + Mock 聊天", async () => {
    const bridge = new LLMBridge({ mockDelay: 5 });
    await bridge.init();
    expect(bridge.isRealLLMAvailable()).toBe(false);
    expect(bridge.listProviders()).toEqual([]);

    const resp = await bridge.chat([{ role: "user", content: "帮助" }]);
    expect(resp.fellBack).toBe(true);
    expect(resp.content).toContain("可用命令");
  });

  it("setProviderKey 后 chat() 走路由成功路径", async () => {
    const bridge = new LLMBridge({ mockDelay: 5 });
    await bridge.init();
    await bridge.setProviderKey("openai", "sk-fake", { defaultModel: "gpt-4o" });
    expect(bridge.isRealLLMAvailable()).toBe(true);
    expect(bridge.listProviders()).toEqual([
      { provider: "openai", hasApiKey: true },
    ]);

    const resp = await bridge.chat([{ role: "user", content: "hi" }]);
    expect(resp.fellBack).toBe(false);
    expect(resp.content).toBe("路由回复内容");
    expect(resp.provider).toBe("openai");
    expect(resp.model).toBe("gpt-4o");
    expect(resp.routingReason).toBe("manual → openai/gpt-4o");
    expect(resp.usage?.totalTokens).toBe(8);
  });

  it("chat() 路由失败且 fallbackToMock=false 时返回错误不回退", async () => {
    routerState.failChat = true;
    const bridge = new LLMBridge({ fallbackToMock: false, mockDelay: 5 });
    await bridge.init();
    await bridge.setProviderKey("openai", "sk-fake");

    const resp = await bridge.chat([{ role: "user", content: "hi" }]);
    expect(resp.fellBack).toBe(false);
    expect(resp.content).toBe("");
    expect(resp.error).toContain("boom: provider down");
  });

  it("chatStream() 路由成功：delta 回调 + 元信息透传", async () => {
    const bridge = new LLMBridge({ mockDelay: 5 });
    await bridge.init();
    await bridge.setProviderKey("openai", "sk-fake");

    const deltas: string[] = [];
    const resp = await bridge.chatStream(
      [{ role: "user", content: "hi" }],
      (d) => deltas.push(d)
    );
    expect(deltas.join("")).toBe("hello");
    expect(resp.fellBack).toBe(false);
    expect(resp.content).toBe("hello");
    expect(resp.provider).toBe("openai");
    expect(resp.model).toBe("gpt-4o-mini");
    expect(resp.routingReason).toBe("stream-manual");
  });

  it("chatStream() 路由失败时回退流式 Mock", async () => {
    routerState.failStream = true;
    const bridge = new LLMBridge({ mockDelay: 5 });
    await bridge.init();
    await bridge.setProviderKey("openai", "sk-fake");

    const deltas: string[] = [];
    const resp = await bridge.chatStream(
      [{ role: "user", content: "状态如何" }],
      (d) => deltas.push(d)
    );
    expect(resp.fellBack).toBe(true);
    expect(resp.error).toContain("stream broken");
    expect(deltas.join("")).toBe(resp.content);
    expect(resp.content).toContain("状态报告");
  });

  it("removeProviderKey 后路由清空", async () => {
    const bridge = new LLMBridge({ mockDelay: 5 });
    await bridge.init();
    await bridge.setProviderKey("openai", "sk-fake");
    expect(bridge.isRealLLMAvailable()).toBe(true);
    bridge.removeProviderKey("openai");
    expect(bridge.isRealLLMAvailable()).toBe(false);
    expect(bridge.listProviders()).toEqual([]);
  });

  it("getLLMBridge 应返回全局单例", () => {
    const a = getLLMBridge({ mockDelay: 1 });
    const b = getLLMBridge();
    expect(a).toBe(b);
    expect(a).toBeInstanceOf(LLMBridge);
  });

  it("空消息列表 chat() 应回退 Mock（末条内容缺省分支）", async () => {
    const bridge = new LLMBridge({ mockDelay: 5 });
    await bridge.init();
    const resp = await bridge.chat([]);
    expect(resp.fellBack).toBe(true);
    expect(resp.content).toContain("收到");
  });
});
