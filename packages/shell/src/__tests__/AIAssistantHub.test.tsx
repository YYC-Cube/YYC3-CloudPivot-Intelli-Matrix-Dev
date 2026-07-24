/**
 * @file: AIAssistantHub.test.tsx
 * @description: AIAssistantHub 组件测试 — 浮窗开关、面板渲染、命令执行
 */
import { fireEvent, render, screen } from "@testing-library/react";
import { Activity, Brain } from "lucide-react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AIAssistantHub } from "../AIAssistantHub";
import { eventBus } from "../event-bus";
import type { HubCommand } from "../types";

const action1 = vi.fn(() => eventBus.emit("system:monitor-status", {}));
const action2 = vi.fn(() => eventBus.emit("ai:analyze", {}));

const MOCK_COMMANDS: HubCommand[] = [
  { id: "cmd-1", label: "查看状态", systemId: "monitor", icon: Activity, action: action1 },
  { id: "cmd-2", label: "AI 分析", systemId: "ai", icon: Brain, action: action2 },
];

describe("AIAssistantHub", () => {
  beforeEach(() => {
    action1.mockClear();
    action2.mockClear();
    localStorage.clear();
  });

  describe("浮窗按钮 (关闭态)", () => {
    it("应渲染浮窗触发按钮", () => {
      render(<AIAssistantHub systemId="monitor" title="监控中心" commands={MOCK_COMMANDS} />);
      expect(screen.getByTestId("hub-btn-monitor")).toBeInTheDocument();
    });

    it("点击按钮应打开面板", () => {
      render(<AIAssistantHub systemId="monitor" title="监控中心" commands={MOCK_COMMANDS} />);
      fireEvent.click(screen.getByTestId("hub-btn-monitor"));
      expect(screen.getByText("监控中心")).toBeInTheDocument();
    });
  });

  describe("面板 (打开态)", () => {
    const renderOpen = () => {
      const utils = render(<AIAssistantHub systemId="monitor" title="监控中心" commands={MOCK_COMMANDS} />);
      fireEvent.click(screen.getByTestId("hub-btn-monitor"));
      return utils;
    };

    it("应显示标题和命令数", () => {
      renderOpen();
      expect(screen.getByText("监控中心")).toBeInTheDocument();
      expect(screen.getByText(/2 条命令/)).toBeInTheDocument();
    });

    it("应有欢迎消息", () => {
      renderOpen();
      expect(screen.getByText(/你好！我是 监控中心/)).toBeInTheDocument();
    });

    it("关闭按钮应收起面板", () => {
      const { container } = renderOpen();
      // 关闭后面板内容（命令数提示）应消失
      expect(screen.getByText(/2 条命令/)).toBeInTheDocument();
      const closeIcon = container.querySelector(".lucide-x");
      expect(closeIcon).toBeTruthy();
      const closeBtn = closeIcon!.closest("button")!;
      fireEvent.click(closeBtn);
      expect(screen.queryByText(/2 条命令/)).not.toBeInTheDocument();
    });

    it("切换到命令 Tab 应显示命令列表", () => {
      renderOpen();
      fireEvent.click(screen.getByText("命令"));
      expect(screen.getByText("查看状态")).toBeInTheDocument();
      expect(screen.getByText("AI 分析")).toBeInTheDocument();
    });

    it("点击命令应执行 action 并发送消息", () => {
      renderOpen();
      fireEvent.click(screen.getByText("命令"));
      fireEvent.click(screen.getByText("查看状态"));
      expect(action1).toHaveBeenCalledTimes(1);
    });
  });

  describe("主题与配色", () => {
    it("应支持自定义 accentColor", () => {
      render(<AIAssistantHub systemId="custom" title="自定义" accentColor="#FF6600" />);
      const btn = screen.getByTestId("hub-btn-custom");
      const inner = btn.querySelector("div");
      expect(inner).toBeTruthy();
      // 浏览器将 hex 转为 rgb
      const bg = (inner as HTMLElement).style.background;
      expect(bg).toMatch(/255.*102.*0/i);
    });
  });
});
