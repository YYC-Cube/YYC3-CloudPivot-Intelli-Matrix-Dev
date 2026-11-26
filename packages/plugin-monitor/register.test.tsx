// @vitest-environment jsdom
/// <reference types="@testing-library/jest-dom/vitest" />
/**
 * @file: register.test.tsx
 * @description: 插件注册契约测试 + Dashboard 页面渲染测试（覆盖 index.ts 导出面与 hub action 白盒直调）
 */
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import * as pluginEntry from "./src/index";
import Dashboard from "./src/pages/Dashboard";
import { register } from "./src/register";

describe("plugin-monitor register", () => {
  const reg = register();

  it("index.ts 应再导出与 register.ts 同源的 register 函数", () => {
    expect(pluginEntry.register).toBe(register);
    expect(typeof pluginEntry.register).toBe("function");
  });

  it("应返回契约完整的 SystemRegistration", () => {
    expect(reg.id).toBe("monitor");
    expect(reg.name).toBe("监控中心");
    expect(reg.description).toBe("实时监控与告警");
    expect(reg.color).toBe("#00d4ff");
    expect(reg.order).toBe(10);
    expect(Array.isArray(reg.routes)).toBe(true);
  });

  it("侧边栏菜单应精确声明 4 项且 path/label 合法", () => {
    expect(reg.menuItems.map(m => m.path)).toEqual([
      "/monitor", "/monitor/follow-up", "/monitor/patrol", "/monitor/alerts",
    ]);
    for (const item of reg.menuItems) {
      expect(item.label.length).toBeGreaterThan(0);
    }
  });

  it("hub 命令的 systemId 应与插件 id 一致且 action 可直调", () => {
    expect(reg.hubCommands?.length).toBeGreaterThan(0);
    for (const cmd of reg.hubCommands ?? []) {
      expect(cmd.systemId).toBe(reg.id);
      expect(cmd.id).toBe("mon-status");
      expect(typeof cmd.action).toBe("function");
      expect(() => cmd.action()).not.toThrow();
    }
  });
});

describe("Dashboard 页面", () => {
  it("应渲染标题与副标题", () => {
    render(<Dashboard />);
    expect(screen.getByText("监控中心")).toBeInTheDocument();
    expect(screen.getByText("实时监控 · 告警 · 巡查")).toBeInTheDocument();
  });

  it("应渲染全部 6 张统计卡片（含标签与明细）", () => {
    render(<Dashboard />);
    for (const label of ["节点在线", "QPS", "告警", "延迟", "存储", "巡查"]) {
      expect(screen.getByText(label)).toBeInTheDocument();
    }
    expect(screen.getByText("GPU-A100-01 预警")).toBeInTheDocument();
    expect(screen.getByText("下次: 14:00")).toBeInTheDocument();
  });

  it("应渲染卡片指标值", () => {
    render(<Dashboard />);
    for (const value of ["7/8", "3.8k", "2", "48ms", "27%", "就绪"]) {
      expect(screen.getByText(value)).toBeInTheDocument();
    }
  });
});
