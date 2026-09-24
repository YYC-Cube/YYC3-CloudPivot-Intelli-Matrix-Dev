// @vitest-environment jsdom
/// <reference types="@testing-library/jest-dom/vitest" />
/**
 * @file: register.test.tsx
 * @description: 插件注册契约测试 + OperationCenter 页面渲染测试
 */
import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import OperationCenter from "./src/pages/OperationCenter";
import { register } from "./src/register";

describe("plugin-ops register", () => {
  const reg = register();

  it("应返回契约完整的 SystemRegistration", () => {
    expect(reg.id).toBe("ops");
    expect(reg.name).toBe("运维管理");
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

describe("OperationCenter 页面", () => {
  it("应渲染标题与副标题", () => {
    render(<OperationCenter />);
    expect(screen.getByText("运维管理")).toBeInTheDocument();
    expect(screen.getByText("操作中心 · 文件 · 数据库 · 报表")).toBeInTheDocument();
  });

  it("应渲染全部 6 个运维入口", () => {
    render(<OperationCenter />);
    for (const label of ["执行备份", "文件管理", "数据库", "存储分析", "连接测试", "恢复操作"]) {
      expect(screen.getByText(label)).toBeInTheDocument();
    }
  });
});
