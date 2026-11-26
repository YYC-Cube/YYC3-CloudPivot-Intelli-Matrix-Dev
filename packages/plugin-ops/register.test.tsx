// @vitest-environment jsdom
/// <reference types="@testing-library/jest-dom/vitest" />
/**
 * @file: register.test.tsx
 * @description: 插件注册契约测试 + OperationCenter 页面渲染测试（覆盖 index.ts 导出面与 hub action 白盒直调）
 */
import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import * as pluginEntry from "./src/index";
import OperationCenter from "./src/pages/OperationCenter";
import { register } from "./src/register";

describe("plugin-ops register", () => {
  const reg = register();

  it("index.ts 应再导出与 register.ts 同源的 register 函数", () => {
    expect(pluginEntry.register).toBe(register);
    expect(typeof pluginEntry.register).toBe("function");
  });

  it("应返回契约完整的 SystemRegistration", () => {
    expect(reg.id).toBe("ops");
    expect(reg.name).toBe("运维管理");
    expect(reg.description).toBe("操作/文件/数据库");
    expect(reg.color).toBe("#FF6600");
    expect(reg.order).toBe(20);
    expect(Array.isArray(reg.routes)).toBe(true);
  });

  it("侧边栏菜单应精确声明 4 项且 path/label 合法", () => {
    expect(reg.menuItems.map(m => m.path)).toEqual([
      "/ops", "/ops/files", "/ops/database", "/ops/reports",
    ]);
    for (const item of reg.menuItems) {
      expect(item.label.length).toBeGreaterThan(0);
    }
  });

  it("hub 命令的 systemId 应与插件 id 一致且 action 可直调", () => {
    expect(reg.hubCommands?.length).toBeGreaterThan(0);
    for (const cmd of reg.hubCommands ?? []) {
      expect(cmd.systemId).toBe(reg.id);
      expect(cmd.id).toBe("ops-backup");
      expect(typeof cmd.action).toBe("function");
      expect(() => cmd.action()).not.toThrow();
    }
  });
});

describe("OperationCenter 页面", () => {
  it("应渲染标题与副标题", () => {
    render(<OperationCenter />);
    expect(screen.getByText("运维管理")).toBeInTheDocument();
    expect(screen.getByText("操作中心 · 文件 · 数据库 · 报表")).toBeInTheDocument();
  });

  it("应渲染全部 6 个运维入口（含描述）", () => {
    render(<OperationCenter />);
    for (const label of ["执行备份", "文件管理", "数据库", "存储分析", "连接测试", "恢复操作"]) {
      expect(screen.getByText(label)).toBeInTheDocument();
    }
    expect(screen.getByText("全量数据备份")).toBeInTheDocument();
    expect(screen.getByText("PostgreSQL 状态")).toBeInTheDocument();
  });
});
