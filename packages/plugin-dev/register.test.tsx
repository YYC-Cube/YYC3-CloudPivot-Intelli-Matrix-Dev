// @vitest-environment jsdom
/// <reference types="@testing-library/jest-dom/vitest" />
/**
 * @file: register.test.tsx
 * @description: 插件注册契约测试 + DesignSystem 页面渲染测试
 */
import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import DesignSystem from "./src/pages/DesignSystem";
import { register } from "./src/register";

describe("plugin-dev register", () => {
  const reg = register();

  it("应返回契约完整的 SystemRegistration", () => {
    expect(reg.id).toBe("dev");
    expect(reg.name).toBe("开发工具");
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

describe("DesignSystem 页面", () => {
  it("应渲染标题与副标题", () => {
    render(<DesignSystem />);
    expect(screen.getByText("开发工具")).toBeInTheDocument();
    expect(screen.getByText("设计系统 · 终端 · IDE · 分析")).toBeInTheDocument();
  });

  it("应渲染全部 6 个开发工具入口", () => {
    render(<DesignSystem />);
    for (const label of ["终端", "IDE", "设计系统", "重构分析", "开发指南", "架构审计"]) {
      expect(screen.getByText(label)).toBeInTheDocument();
    }
  });
});
