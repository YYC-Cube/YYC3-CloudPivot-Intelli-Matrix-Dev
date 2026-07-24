/**
 * @file: WelcomePage.test.tsx
 * @description: WelcomePage 组件测试 — 系统卡片渲染、导航、关闭弹窗
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { Sparkles, Brain, ShieldCheck } from "lucide-react";
import { WelcomePage } from "../WelcomePage";
import { storage, StorageKeys, eventBus, Events } from "../index";

const MOCK_SYSTEMS = [
  { id: "ai-family", name: "AI Family", description: "家人中枢", icon: Sparkles, color: "#00FF88", path: "/ai-family" },
  { id: "ai", name: "AI 智能", description: "决策分析", icon: Brain, color: "#AA55FF", path: "/ai" },
  { id: "admin", name: "系统管理", description: "安全审计", icon: ShieldCheck, color: "#FFDD00", path: "/admin" },
];

describe("WelcomePage", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  describe("page 模式", () => {
    it("应渲染标题 YYC³ Cloud Intelli-Matrix", () => {
      render(<WelcomePage systems={MOCK_SYSTEMS} onNavigate={vi.fn()} />);
      expect(screen.getByText("YYC³ Cloud Intelli-Matrix")).toBeInTheDocument();
    });

    it("应渲染所有系统卡片", () => {
      render(<WelcomePage systems={MOCK_SYSTEMS} onNavigate={vi.fn()} />);
      expect(screen.getByText("AI Family")).toBeInTheDocument();
      expect(screen.getByText("AI 智能")).toBeInTheDocument();
      expect(screen.getByText("系统管理")).toBeInTheDocument();
    });

    it("点击系统卡片应触发 onNavigate", () => {
      const onNavigate = vi.fn();
      render(<WelcomePage systems={MOCK_SYSTEMS} onNavigate={onNavigate} />);

      fireEvent.click(screen.getByText("AI Family"));
      expect(onNavigate).toHaveBeenCalledWith("/ai-family");
    });

    it("page 模式下不应显示关闭按钮", () => {
      render(<WelcomePage systems={MOCK_SYSTEMS} onNavigate={vi.fn()} />);
      expect(screen.queryByText("进入系统 · 下次不再提示")).not.toBeInTheDocument();
    });
  });

  describe("modal 模式", () => {
    it("未关闭时应显示弹窗", () => {
      render(<WelcomePage systems={MOCK_SYSTEMS} mode="modal" onNavigate={vi.fn()} />);
      expect(screen.getByText("YYC³ Cloud Intelli-Matrix")).toBeInTheDocument();
    });

    it("已关闭后应返回 null", () => {
      storage.shell.set(StorageKeys.SHELL_WELCOME_DISMISSED, true);
      const { container } = render(<WelcomePage systems={MOCK_SYSTEMS} mode="modal" onNavigate={vi.fn()} />);
      expect(container.firstChild).toBeNull();
    });

    it("点击关闭按钮应持久化状态并发射事件", () => {
      const dismissHandler = vi.fn();
      eventBus.on(Events.SHELL_WELCOME_DISMISS, dismissHandler);

      render(<WelcomePage systems={MOCK_SYSTEMS} mode="modal" onNavigate={vi.fn()} />);

      fireEvent.click(screen.getByText("进入系统 · 下次不再提示"));

      expect(storage.shell.get(StorageKeys.SHELL_WELCOME_DISMISSED, false)).toBe(true);
      expect(dismissHandler).toHaveBeenCalledTimes(1);
    });
  });

  describe("familySummary", () => {
    it("提供 familySummary 时应显示状态摘要", () => {
      render(<WelcomePage systems={MOCK_SYSTEMS} onNavigate={vi.fn()} familySummary="6 位家人在线" />);
      expect(screen.getByText("6 位家人在线")).toBeInTheDocument();
    });

    it("未提供 familySummary 时不应显示摘要区域", () => {
      const { container } = render(<WelcomePage systems={MOCK_SYSTEMS} onNavigate={vi.fn()} />);
      // Users 图标所在的摘要区域不应存在
      expect(screen.queryByText(/在线/)).not.toBeInTheDocument();
    });
  });
});
