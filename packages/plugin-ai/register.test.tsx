// @vitest-environment jsdom
/// <reference types="@testing-library/jest-dom/vitest" />
/**
 * @file: register.test.tsx
 * @description: 插件注册契约测试 + AISuggestion 页面渲染测试（覆盖 index.ts 导出面与 hub action 白盒直调）
 */
import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import * as pluginEntry from "./src/index";
import AISuggestion from "./src/pages/AISuggestion";
import { register } from "./src/register";

describe("plugin-ai register", () => {
  const reg = register();

  it("index.ts 应再导出与 register.ts 同源的 register 函数", () => {
    expect(pluginEntry.register).toBe(register);
    expect(typeof pluginEntry.register).toBe("function");
  });

  it("应返回契约完整的 SystemRegistration", () => {
    expect(reg.id).toBe("ai");
    expect(reg.name).toBe("AI 智能");
    expect(reg.description).toBe("决策/模型/诊断");
    expect(reg.color).toBe("#AA55FF");
    expect(reg.order).toBe(30);
    expect(Array.isArray(reg.routes)).toBe(true);
  });

  it("侧边栏菜单应精确声明 3 项且 path/label 合法", () => {
    expect(reg.menuItems.map(m => m.path)).toEqual([
      "/ai", "/ai/models", "/ai/diagnosis",
    ]);
    for (const item of reg.menuItems) {
      expect(item.label.length).toBeGreaterThan(0);
    }
  });

  it("hub 命令的 systemId 应与插件 id 一致且 action 可直调", () => {
    expect(reg.hubCommands?.length).toBeGreaterThan(0);
    for (const cmd of reg.hubCommands ?? []) {
      expect(cmd.systemId).toBe(reg.id);
      expect(cmd.id).toBe("ai-analyze");
      expect(typeof cmd.action).toBe("function");
      expect(() => cmd.action()).not.toThrow();
    }
  });
});

describe("AISuggestion 页面", () => {
  it("应渲染标题与健康指数", () => {
    render(<AISuggestion />);
    expect(screen.getByText("AI 智能")).toBeInTheDocument();
    expect(screen.getByText("系统健康指数")).toBeInTheDocument();
    expect(screen.getByText("87")).toBeInTheDocument();
  });

  it("应渲染全部 4 项 AI 能力卡片（含描述）", () => {
    render(<AISuggestion />);
    for (const label of ["智能分析", "模型管理", "AI 诊断", "决策推荐"]) {
      expect(screen.getByText(label)).toBeInTheDocument();
    }
    expect(screen.getByText("异常模式检测")).toBeInTheDocument();
    expect(screen.getByText("7 家提供商")).toBeInTheDocument();
  });

  it("应渲染健康环 SVG 与底部标语", () => {
    const { container } = render(<AISuggestion />);
    // 健康环 SVG 以 viewBox 64x64 标识（lucide 图标内亦含 circle，不可全文档计数）
    const ring = container.querySelector('svg[viewBox="0 0 64 64"]');
    expect(ring).not.toBeNull();
    expect(ring?.querySelectorAll("circle").length).toBe(2);
    expect(screen.getByText("AI Family 智能驱动")).toBeInTheDocument();
  });
});
