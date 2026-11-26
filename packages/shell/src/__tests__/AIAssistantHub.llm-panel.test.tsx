/**
 * @file: AIAssistantHub.llm-panel.test.tsx
 * @description: AIAssistantHub LLM 状态与 LLMProviderPanel 补测
 *   策略: vi.mock("@yyc3/plugin-llm") 提供 fake keyManager/LLMRouter,
 *   让真实 LLMBridge 全链路确定性运行（不 mock llm-bridge 本身）。
 *   beforeAll 预热 mock 模块: 首个动态 import 落 mock 并进缓存,
 *   规避组件内并发动态 import 撞真实模块的竞态（真实空 keyring 会把 router 置 null）。
 */
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

// ── fake plugin-llm 共享状态（vi.mock 工厂 hoist，须经 vi.hoisted 声明）──
const fake = vi.hoisted(() => {
  const store = new Map<string, { apiKey: string; defaultModel?: string }>();
  const state = { failSet: false, failRemove: false, failStream: false };
  return { store, state };
});

vi.mock("@yyc3/plugin-llm", () => {
  const makeErr = (msg: string) => {
    const e = new Error(msg) as Error & { provider?: string };
    e.provider = "openai";
    return e;
  };
  const keyManager = {
    canRestoreFromSession: () => false,
    restoreFromSession: async () => { },
    getStatus: () => (fake.store.size > 0 ? "unlocked" : "uninitialized"),
    initWithDeviceFingerprint: async () => { },
    buildProviderConfigs: () =>
      [...fake.store.entries()].map(([provider, v]) => ({
        provider,
        apiKey: v.apiKey,
        defaultModel: v.defaultModel,
      })),
    setKey: async (provider: string, apiKey: string, opts?: { defaultModel?: string }) => {
      if (fake.state.failSet) throw makeErr("keyring locked");
      fake.store.set(provider, { apiKey, defaultModel: opts?.defaultModel });
    },
    removeKey: (provider: string) => {
      if (fake.state.failRemove) throw makeErr("delete failed");
      fake.store.delete(provider);
    },
  };
  class LLMRouter {
    constructor(_config: unknown) { }
    chat() {
      return Promise.resolve({
        content: "路由回复内容",
        provider: "openai",
        model: "gpt-4o",
        _routing: { reason: "manual → openai/gpt-4o" },
        usage: { promptTokens: 3, completionTokens: 5, totalTokens: 8 },
      });
    }
    async chatStream(_req: unknown, onChunk: (c: { delta?: string }) => void) {
      if (fake.state.failStream) throw makeErr("stream broken");
      onChunk({ delta: "流式" });
      onChunk({ delta: "回复" });
      return {
        routing: { reason: "stream-manual", adapter: { provider: "openai" }, model: "gpt-4o-mini" },
      };
    }
  }
  return { keyManager, LLMRouter };
});

import { AIAssistantHub } from "../AIAssistantHub";

// 预热 mock 模块缓存（见文件头说明）
beforeAll(async () => {
  await import("@yyc3/plugin-llm");
});

const renderOpen = async (props?: Partial<Parameters<typeof AIAssistantHub>[0]>) => {
  const utils = render(<AIAssistantHub systemId="llm" title="LLM 面板" {...props} />);
  fireEvent.click(screen.getByTestId("hub-btn-llm"));
  // 等桥接 init 稳定，避免发消息与 mount init 竞态
  await screen.findByText(/○ Mock|● LLM|● openai/);
  return utils;
};

describe("AIAssistantHub — LLM 状态与 Provider 面板", () => {
  beforeEach(() => {
    localStorage.clear();
    fake.store.clear();
    fake.state.failSet = false;
    fake.state.failRemove = false;
    fake.state.failStream = false;
  });

  it("桥接报告真实 LLM 可用时状态徽标应显示 Provider 列表", async () => {
    fake.store.set("openai", { apiKey: "sk-1", defaultModel: "gpt-4o" });
    fake.store.set("anthropic", { apiKey: "" });
    render(<AIAssistantHub systemId="llm" title="LLM 面板" />);
    fireEvent.click(screen.getByTestId("hub-btn-llm"));
    await screen.findByText(/openai, anthropic/);
    expect(screen.getByTitle(/LLM: openai, anthropic/)).toBeInTheDocument();
  });

  it("无 API Key 时应显示 Mock 模式徽标", async () => {
    render(<AIAssistantHub systemId="llm" title="LLM 面板" />);
    fireEvent.click(screen.getByTestId("hub-btn-llm"));
    await screen.findByText("○ Mock");
  });

  it("LLMProviderPanel 应渲染并支持切换 Provider", async () => {
    await renderOpen();
    fireEvent.click(screen.getByText("配置"));
    expect(screen.getByText(/LLM 多 Provider/)).toBeInTheDocument();

    for (const name of ["OpenAI", "Anthropic Claude", "通义千问 (DashScope)", "DeepSeek", "Kimi (Moonshot)"]) {
      expect(screen.getByText(name)).toBeInTheDocument();
    }
    // 切换到 Anthropic → 输入区 placeholder 与模型列表联动
    fireEvent.click(screen.getByText("Anthropic Claude"));
    expect(screen.getByPlaceholderText("Anthropic Claude API Key")).toBeInTheDocument();
    const select = document.querySelector("select") as HTMLSelectElement;
    expect([...select.options].map((o) => o.value)).toContain("claude-3-5-sonnet-20241022");
    // 切回 OpenAI
    fireEvent.click(screen.getByText("OpenAI"));
    expect(screen.getByPlaceholderText("OpenAI API Key")).toBeInTheDocument();
  });

  it("保存 API Key：写入 keyring、展示已配置列表、触发 onConfigured 重新检测", async () => {
    await renderOpen();
    fireEvent.click(screen.getByText("配置"));

    fireEvent.change(screen.getByPlaceholderText("OpenAI API Key"), {
      target: { value: "sk-panel-key" },
    });
    fireEvent.click(screen.getByText("保存 (AES-256-GCM 加密)"));

    // 真实 LLMBridge → fake keyManager.setKey → keyring 写入
    await waitFor(() => {
      expect(fake.store.get("openai")).toEqual({ apiKey: "sk-panel-key", defaultModel: "gpt-4o" });
    });
    // 已配置列表（refreshConfigured 从 keyring 回读）
    await screen.findByText("已配置 Provider:");
    // 输入框清空 + 已保存徽标
    expect((screen.getByPlaceholderText("OpenAI API Key") as HTMLInputElement).value).toBe("");
    await screen.findByText(/已保存/);
    // onConfigured 触发 hub 重新检测（bridgeRef init 已缓存 router=null → 保持 Mock 徽标）
    await screen.findByText("○ Mock");
  });

  it("空 Key 保存应提示错误且不写入 keyring", async () => {
    await renderOpen();
    fireEvent.click(screen.getByText("配置"));
    fireEvent.click(screen.getByText("保存 (AES-256-GCM 加密)"));
    await screen.findByText("请输入 API Key");
    expect(fake.store.size).toBe(0);
  });

  it("保存异常时应展示错误信息", async () => {
    fake.state.failSet = true;
    await renderOpen();
    fireEvent.click(screen.getByText("配置"));
    fireEvent.change(screen.getByPlaceholderText("OpenAI API Key"), {
      target: { value: "sk-x" },
    });
    fireEvent.click(screen.getByText("保存 (AES-256-GCM 加密)"));
    await screen.findByText("keyring locked");
  });

  it("删除已配置 Provider：从 keyring 移除并触发 onConfigured", async () => {
    fake.store.set("openai", { apiKey: "sk-1", defaultModel: "gpt-4o" });
    await renderOpen();
    fireEvent.click(screen.getByText("配置"));
    await screen.findByText("已配置 Provider:");

    const configuredBlock = screen.getByText("已配置 Provider:").parentElement!;
    fireEvent.click(configuredBlock.querySelector("button")!);
    await waitFor(() => expect(fake.store.has("openai")).toBe(false));
  });

  it("删除异常时应展示错误信息", async () => {
    fake.store.set("openai", { apiKey: "sk-1" });
    fake.state.failRemove = true;
    await renderOpen();
    fireEvent.click(screen.getByText("配置"));
    await screen.findByText("已配置 Provider:");
    const configuredBlock = screen.getByText("已配置 Provider:").parentElement!;
    fireEvent.click(configuredBlock.querySelector("button")!);
    await screen.findByText("delete failed");
  });

  it("发送消息应经真实桥接走路由流式回填", async () => {
    // 预置 Key → bridgeRef.init 后 router 可用 → chatStream 走 fake 路由
    fake.store.set("openai", { apiKey: "sk-1", defaultModel: "gpt-4o" });
    const { container } = await renderOpen({
      extraPrompts: [{ id: "s1", name: "巡检", prompt: "你是巡检专家。", category: "运维" }],
    });
    const ta = container.querySelector("textarea")!;
    fireEvent.change(ta, { target: { value: "做个巡检" } });
    fireEvent.keyDown(ta, { key: "Enter", shiftKey: false });

    await screen.findByText(/流式回复/);
    expect(screen.getByText("做个巡检")).toBeInTheDocument();
  });

  it("桥接流式失败时应回退 Mock（customMock 接管回复）", async () => {
    fake.store.set("openai", { apiKey: "sk-1" });
    fake.state.failStream = true;
    await renderOpen({ customMock: () => "CUSTOM-MOCK-REPLY" });
    const ta = document.querySelector("textarea")!;
    fireEvent.change(ta, { target: { value: "触发失败" } });
    fireEvent.keyDown(ta, { key: "Enter", shiftKey: false });

    // 路由失败后 streamMock 用 customMock 内容流式回填（成功路径回填的是路由内容，非 customMock）
    await screen.findByText(/CUSTOM-MOCK-REPLY/);
    expect(screen.queryByText(/流式回复/)).not.toBeInTheDocument();
  });

  it("桥接流式失败且无 customMock 时用默认 Mock 文案", async () => {
    fake.store.set("openai", { apiKey: "sk-1" });
    fake.state.failStream = true;
    await renderOpen();
    const ta = document.querySelector("textarea")!;
    fireEvent.change(ta, { target: { value: "默认回退" } });
    fireEvent.keyDown(ta, { key: "Enter", shiftKey: false });

    await screen.findByText(/收到: "默认回退"/);
  });
});
