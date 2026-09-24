// @vitest-environment jsdom
/// <reference types="@testing-library/jest-dom/vitest" />
/**
 * @file: register.test.tsx
 * @description: 插件注册契约测试 + Dashboard 页面渲染测试
 */
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import Dashboard from "./src/pages/Dashboard";
import { register } from "./src/register";

describe("plugin-monitor register", () => {
  const reg = register();

  it("应返回契约完整的 SystemRegistration", () => {
    expect(reg.id).toBe("monitor");
    expect(reg.name).toBe("监控中心");
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

describe("Dashboard 页面", () => {
  it("应渲染标题与副标题", () => {
    render(<Dashboard />);
    expect(screen.getByText("监控中心")).toBeInTheDocument();
    expect(screen.getByText("实时监控 · 告警 · 巡查")).toBeInTheDocument();
  });

  it("应渲染全部 6 张统计卡片", () => {
    render(<Dashboard />);
    for (const label of ["节点在线", "QPS", "告警", "延迟", "存储", "巡查"]) {
      expect(screen.getByText(label)).toBeInTheDocument();
    }
  });
});
