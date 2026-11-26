// @vitest-environment jsdom
/// <reference types="@testing-library/jest-dom/vitest" />
/**
 * @file: register.test.tsx
 * @description: 插件注册契约测试 + Audit 页面渲染测试（覆盖 index.ts 导出面与 hub action 白盒直调）
 */
import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import * as pluginEntry from "./src/index";
import Audit from "./src/pages/Audit";
import { register } from "./src/register";

describe("plugin-admin register", () => {
  const reg = register();

  it("index.ts 应再导出与 register.ts 同源的 register 函数", () => {
    expect(pluginEntry.register).toBe(register);
    expect(typeof pluginEntry.register).toBe("function");
  });

  it("应返回契约完整的 SystemRegistration", () => {
    expect(reg.id).toBe("admin");
    expect(reg.name).toBe("系统管理");
    expect(reg.description).toBe("设置/用户/安全");
    expect(reg.color).toBe("#FFDD00");
    expect(reg.order).toBe(60);
    expect(Array.isArray(reg.routes)).toBe(true);
  });

  it("侧边栏菜单应精确声明 5 项且 path/label 合法", () => {
    expect(reg.menuItems.map(m => m.path)).toEqual([
      "/admin", "/admin/settings", "/admin/users", "/admin/security", "/admin/pwa",
    ]);
    for (const item of reg.menuItems) {
      expect(item.label.length).toBeGreaterThan(0);
    }
  });

  it("hub 命令的 systemId 应与插件 id 一致且 action 可直调", () => {
    expect(reg.hubCommands?.length).toBeGreaterThan(0);
    for (const cmd of reg.hubCommands ?? []) {
      expect(cmd.systemId).toBe(reg.id);
      expect(cmd.id).toBe("admin-settings");
      expect(typeof cmd.action).toBe("function");
      expect(() => cmd.action()).not.toThrow();
    }
  });
});

describe("Audit 页面", () => {
  it("应渲染标题与副标题", () => {
    render(<Audit />);
    expect(screen.getByText("系统管理")).toBeInTheDocument();
    expect(screen.getByText("设置 · 用户 · 安全 · PWA · 性能")).toBeInTheDocument();
  });

  it("应渲染全部 6 个管理模块卡片（含描述）", () => {
    render(<Audit />);
    for (const label of ["系统设置", "用户管理", "操作审计", "安全监控", "性能监控", "PWA 管理"]) {
      expect(screen.getByText(label)).toBeInTheDocument();
    }
    expect(screen.getByText("全局配置")).toBeInTheDocument();
    expect(screen.getByText("权限与角色")).toBeInTheDocument();
    expect(screen.getByText("日志追溯")).toBeInTheDocument();
    expect(screen.getByText("威胁检测")).toBeInTheDocument();
    expect(screen.getByText("系统指标")).toBeInTheDocument();
    expect(screen.getByText("离线与安装")).toBeInTheDocument();
  });

  it("应渲染底部安全审计标语", () => {
    render(<Audit />);
    expect(screen.getByText("系统安全审计")).toBeInTheDocument();
  });
});
