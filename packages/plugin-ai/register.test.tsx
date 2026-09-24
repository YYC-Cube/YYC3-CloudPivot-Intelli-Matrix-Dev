// @vitest-environment jsdom
/// <reference types="@testing-library/jest-dom/vitest" />
/**
 * @file: register.test.tsx
 * @description: 插件注册契约测试 + AISuggestion 页面渲染测试
 */
import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import AISuggestion from "./src/pages/AISuggestion";
import { register } from "./src/register";

describe("plugin-ai register", () => {
  const reg = register();

  it("应返回契约完整的 SystemRegistration", () => {
    expect(reg.id).toBe("ai");
    expect(reg.name).toBe("AI 智能");
    expect(typeof reg.description).toBe("string");
    expect(reg.color).toMatch(/^#/);
    expect(typeof reg.order).toBe("number");
  });

  it("侧边栏菜单每项应含 path 与 label", () => {
    expect(reg.menuItems.length).toBeGreaterThan(0);
    for (const item of reg.menuItems) {
      expect(item.path.startsWith("/")).toBe(true);
      expect(item.label.length).toBeGreaterThan(0);
    }
  });

  it("hub 命令的 systemId 应与插件 id 一致", () => {
    for (const cmd of reg.hubCommands ?? []) {
      expect(cmd.systemId).toBe(reg.id);
      expect(typeof cmd.action).toBe("function");
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

  it("应渲染全部 4 项 AI 能力卡片", () => {
    render(<AISuggestion />);
    for (const label of ["智能分析", "模型管理", "AI 诊断", "决策推荐"]) {
      expect(screen.getByText(label)).toBeInTheDocument();
    }
  });
});
