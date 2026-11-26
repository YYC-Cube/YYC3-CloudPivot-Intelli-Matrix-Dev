/**
 * @file: AIAssistantHub.interaction.test.tsx
 * @description: AIAssistantHub 交互补测 — 事件开关、四 Tab、语音、剪贴板、清空/最大化、流式发送
 */
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { Activity } from "lucide-react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AIAssistantHub } from "../AIAssistantHub";
import { eventBus, Events } from "../event-bus";

// ── SpeechRecognition stub ──
const srInstances: Array<{
  lang: string; continuous: boolean; interimResults: boolean;
  onresult: ((e: { results: Array<Array<{ transcript: string }>> }) => void) | null;
  onerror: (() => void) | null;
  onend: (() => void) | null;
  start: () => void; stop: () => void; abort: () => void;
  abortCalled: boolean;
}> = [];

class FakeSR {
  lang = ""; continuous = false; interimResults = false;
  onresult: ((e: { results: Array<Array<{ transcript: string }>> }) => void) | null = null;
  onerror: (() => void) | null = null;
  onend: (() => void) | null = null;
  abortCalled = false;
  start() { }
  stop() { }
  abort() { this.abortCalled = true; }
  constructor() { srInstances.push(this as never); }
}

describe("AIAssistantHub — 交互补测", () => {
  beforeEach(() => {
    localStorage.clear();
    srInstances.length = 0;
  });
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  const open = (props?: Partial<Parameters<typeof AIAssistantHub>[0]>) => {
    const utils = render(<AIAssistantHub systemId="it" title="交互测试" {...props} />);
    fireEvent.click(screen.getByTestId("hub-btn-it"));
    return utils;
  };

  it("HUB_OPEN / HUB_CLOSE 事件应控制浮窗开关，卸载后取消订阅", () => {
    const { unmount } = render(<AIAssistantHub systemId="it" title="交互测试" />);
    // 关闭态按钮含 tooltip 标题，但不含面板"条命令"标记
    expect(screen.queryByText(/条命令/)).not.toBeInTheDocument();

    // 事件回调内的 setState 需在 act 中派发以刷新
    act(() => { eventBus.emit(Events.HUB_OPEN); });
    expect(screen.getByText(/0 条命令/)).toBeInTheDocument();

    act(() => { eventBus.emit(Events.HUB_CLOSE); });
    expect(screen.queryByText(/条命令/)).not.toBeInTheDocument();

    // 再次打开后卸载 — 卸载清理不应抛错
    act(() => { eventBus.emit(Events.HUB_OPEN); });
    unmount();
    expect(() => eventBus.emit(Events.HUB_CLOSE)).not.toThrow();
  });

  it("空命令系统的命令 Tab 应显示占位文案", () => {
    open();
    fireEvent.click(screen.getByText("命令"));
    expect(screen.getByText("系统快捷命令")).toBeInTheDocument();
    expect(screen.getByText("暂无注册命令")).toBeInTheDocument();
  });

  it("提示词 Tab：extraPrompts 置顶渲染，点选预设回写系统提示词，可手动编辑", () => {
    open({
      extraPrompts: [{ id: "x1", name: "部署助手", prompt: "你是一个部署专家。", category: "运维" }],
    });
    fireEvent.click(screen.getByText("提示词"));
    // extraPrompts 在前
    expect(screen.getByText("部署助手")).toBeInTheDocument();
    expect(screen.getByText("运维助手")).toBeInTheDocument();
    // 初始 systemPrompt = allPrompts[0].prompt (extra 第一条)
    expect(screen.getByDisplayValue("你是一个部署专家。")).toBeInTheDocument();

    // 点选默认预设 → 系统提示词切换并回到对话 Tab
    fireEvent.click(screen.getByText("数据分析"));
    // 重新进入提示词 Tab 校验 textarea 值并手动编辑
    fireEvent.click(screen.getByText("提示词"));
    const ta = screen.getByDisplayValue(/你是数据分析专家/) as HTMLTextAreaElement;
    fireEvent.change(ta, { target: { value: "手动提示词" } });
    expect(screen.getByDisplayValue("手动提示词")).toBeInTheDocument();
  });

  it("配置 Tab：输入 API Key/模型并持久化，显示切换与清空配置", () => {
    open();
    fireEvent.click(screen.getByText("配置"));
    expect(screen.getByText("API Key")).toBeInTheDocument();

    const akInput = screen.getByPlaceholderText("sk-...");
    fireEvent.change(akInput, { target: { value: "sk-live-999" } });
    expect(localStorage.getItem("yyc3:it:aiApiKey")).toBe('"sk-live-999"');

    const modelInput = screen.getByPlaceholderText("gpt-4o");
    fireEvent.change(modelInput, { target: { value: "gpt-4o-mini" } });
    expect(localStorage.getItem("yyc3:it:aiModel")).toBe('"gpt-4o-mini"');

    // 显示/隐藏切换
    const toggle = screen.getByText("显示");
    fireEvent.click(toggle);
    expect(screen.getByText("隐藏")).toBeInTheDocument();
    expect(akInput.getAttribute("type")).toBe("text");
    fireEvent.click(screen.getByText("隐藏"));
    expect(akInput.getAttribute("type")).toBe("password");

    // 清空配置
    fireEvent.click(screen.getByText(/清空配置/));
    expect(screen.getByPlaceholderText("sk-...")).toHaveValue("");
    expect(screen.getByPlaceholderText("gpt-4o")).toHaveValue("");
  });

  it("语音识别：支持时应渲染麦克风，onresult 回填输入框，卸载时 abort", async () => {
    vi.stubGlobal("webkitSpeechRecognition", FakeSR);
    const { unmount } = open();

    const micBtn = document.querySelector(".lucide-mic")!.closest("button")!;
    expect(micBtn).toBeTruthy();
    fireEvent.click(micBtn);
    expect(srInstances).toHaveLength(1);
    expect(document.querySelector(".lucide-mic-off")).toBeTruthy();

    // 语音识别结果 → 输入框（原生回调在 act 内派发以刷新状态）
    await act(async () => {
      srInstances[0]!.onresult!({ results: [[{ transcript: "语音指令" }]] });
    });
    const ta = document.querySelector("textarea")!;
    expect(ta).toHaveValue("语音指令");

    // 识别结束 → 恢复非聆听态
    await act(async () => {
      srInstances[0]!.onend!();
    });
    expect(document.querySelector(".lucide-mic")).toBeTruthy();

    // 错误路径
    fireEvent.click(document.querySelector(".lucide-mic")!.closest("button")!);
    await act(async () => {
      srInstances[1]!.onerror!();
    });
    expect(document.querySelector(".lucide-mic")).toBeTruthy();

    unmount();
    expect(srInstances[srInstances.length - 1]!.abortCalled).toBe(true);
  });

  it("复制按钮应写剪贴板并出现已复制图标", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(window.navigator, "clipboard", {
      value: { writeText },
      configurable: true,
    });
    const { container } = open();
    const copyBtn = container.querySelector(".lucide-copy")!.closest("button")!;
    fireEvent.click(copyBtn);
    expect(writeText).toHaveBeenCalledTimes(1);
    await waitFor(() => expect(container.querySelector(".lucide-check")).toBeTruthy());
  });

  it("清空对话、最大化切换、空输入发送防护", () => {
    const { container } = open();

    // 清空对话
    fireEvent.click(container.querySelector(".lucide-trash-2")!.closest("button")!);
    expect(screen.getByText("对话已清空。")).toBeInTheDocument();

    // 最大化
    fireEvent.click(container.querySelector(".lucide-maximize-2")!.closest("button")!);
    expect(container.querySelector(".lucide-minimize-2")).toBeTruthy();
    fireEvent.click(container.querySelector(".lucide-minimize-2")!.closest("button")!);
    expect(container.querySelector(".lucide-maximize-2")).toBeTruthy();

    // 空输入：发送按钮禁用，Enter 不发消息
    const sendBtn = container.querySelector(".lucide-send")!.closest("button")!;
    expect(sendBtn).toBeDisabled();
    const ta = container.querySelector("textarea")!;
    fireEvent.change(ta, { target: { value: "   " } });
    fireEvent.keyDown(ta, { key: "Enter", shiftKey: false });
    expect(screen.queryByText(/收到/)).not.toBeInTheDocument();

    // Shift+Enter 不发送
    fireEvent.change(ta, { target: { value: "草稿" } });
    fireEvent.keyDown(ta, { key: "Enter", shiftKey: true });
    expect(screen.queryByText(/收到/)).not.toBeInTheDocument();
    expect(ta).toHaveValue("草稿");
  });

  it("Enter 发送消息：用户消息上屏并流式回填 Mock 回复", async () => {
    const { container } = open();
    const ta = container.querySelector("textarea")!;
    fireEvent.change(ta, { target: { value: "查看集群状态" } });
    fireEvent.keyDown(ta, { key: "Enter", shiftKey: false });

    await waitFor(
      () => expect(screen.getByText(/系统运行正常，所有节点在线/)).toBeInTheDocument(),
      { timeout: 8000 }
    );
    // 用户消息已上屏
    expect(screen.getByText("查看集群状态")).toBeInTheDocument();
    // 发送后输入框清空
    expect(ta).toHaveValue("");
  });

  it("命令点击：action 执行、切回对话 Tab 并发送命令文本", async () => {
    const action = vi.fn();
    const { container } = render(
      <AIAssistantHub
        systemId="it"
        title="交互测试"
        commands={[{ id: "c1", label: "深度巡检", systemId: "ops", icon: Activity, action }]}
      />
    );
    fireEvent.click(screen.getByTestId("hub-btn-it"));
    fireEvent.click(screen.getByText("命令"));
    fireEvent.click(screen.getByText("深度巡检"));
    expect(action).toHaveBeenCalledTimes(1);
    // 已切回对话 Tab 且命令文本作为用户消息发送
    await waitFor(() => expect(screen.getByText("深度巡检")).toBeInTheDocument());
    expect(container.querySelector(".lucide-send")).toBeTruthy();
  });

  it("showPersonas 渲染人格栏，isMobile 调整浮窗定位", () => {
    render(
      <AIAssistantHub
        systemId="it"
        title="交互测试"
        showPersonas
        renderPersonaBar={() => <div>人格栏-千行</div>}
        isMobile
      />
    );
    const btn = screen.getByTestId("hub-btn-it");
    expect((btn as HTMLElement).style.bottom).toBe("80px");
    fireEvent.click(btn);
    expect(screen.getByText("人格栏-千行")).toBeInTheDocument();
  });

  it("themeMode prop 与 mobile 面板类名", () => {
    const { container } = open({ themeMode: "modern", isMobile: true });
    expect(container.firstElementChild?.className).toContain("inset-0");
  });
});
