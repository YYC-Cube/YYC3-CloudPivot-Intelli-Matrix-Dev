// @vitest-environment jsdom
/// <reference types="@testing-library/jest-dom/vitest" />
/**
 * @file: register.test.tsx
 * @description: 插件注册契约测试 + DesignSystem 页面渲染测试（覆盖 index.ts 导出面与 hub action 白盒直调）
 */
import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import * as pluginEntry from "./src/index";
import DesignSystem from "./src/pages/DesignSystem";
import { register } from "./src/register";

describe("plugin-dev register", () => {
  const reg = register();

  it("index.ts 应再导出与 register.ts 同源的 register 函数", () => {
    expect(pluginEntry.register).toBe(register);
    expect(typeof pluginEntry.register).toBe("function");
  });

  it("应返回契约完整的 SystemRegistration", () => {
    expect(reg.id).toBe("dev");
    expect(reg.name).toBe("开发工具");
    expect(reg.description).toBe("设计/终端/IDE");
    expect(reg.color).toBe("#E8E8E8");
    expect(reg.order).toBe(50);
    expect(Array.isArray(reg.routes)).toBe(true);
  });

  it("侧边栏菜单应精确声明 3 项且 path/label 合法", () => {
    expect(reg.menuItems.map(m => m.path)).toEqual([
      "/dev", "/dev/terminal", "/dev/ide",
    ]);
    for (const item of reg.menuItems) {
      expect(item.label.length).toBeGreaterThan(0);
    }
  });

  it("hub 命令的 systemId 应与插件 id 一致且 action 可直调", () => {
    expect(reg.hubCommands?.length).toBeGreaterThan(0);
    for (const cmd of reg.hubCommands ?? []) {
      expect(cmd.systemId).toBe(reg.id);
      expect(cmd.id).toBe("dev-terminal");
      expect(typeof cmd.action).toBe("function");
      expect(() => cmd.action()).not.toThrow();
    }
  });
});

describe("DesignSystem 页面", () => {
  it("应渲染标题与副标题", () => {
    render(<DesignSystem />);
    expect(screen.getByText("开发工具")).toBeInTheDocument();
    expect(screen.getByText("设计系统 · 终端 · IDE · 分析")).toBeInTheDocument();
  });

  it("应渲染全部 6 个开发工具入口（含描述）", () => {
    render(<DesignSystem />);
    for (const label of ["终端", "IDE", "设计系统", "重构分析", "开发指南", "架构审计"]) {
      expect(screen.getByText(label)).toBeInTheDocument();
    }
    expect(screen.getByText("CLI 命令行")).toBeInTheDocument();
    expect(screen.getByText("组件库")).toBeInTheDocument();
  });
});
