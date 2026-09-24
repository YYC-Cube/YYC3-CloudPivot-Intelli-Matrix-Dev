// @vitest-environment jsdom
/// <reference types="@testing-library/jest-dom/vitest" />
/**
 * @file: register.test.tsx
 * @description: 插件注册契约测试 + HotelConsole 页面渲染测试
 */
import { describe, expect, it } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import HotelConsole from "./src/pages/HotelConsole";
import { register } from "./src/register";

describe("plugin-business register", () => {
  const reg = register();

  it("应返回契约完整的 SystemRegistration", () => {
    expect(reg.id).toBe("business");
    expect(reg.name).toBe("业务空间");
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

describe("HotelConsole 页面", () => {
  it("应渲染标题与面板切换按钮", () => {
    render(<HotelConsole />);
    expect(screen.getByText("业务空间")).toBeInTheDocument();
    expect(screen.getByText("智慧酒店")).toBeInTheDocument();
    expect(screen.getByText("通讯基站")).toBeInTheDocument();
  });

  it("默认展示酒店面板并列出房间", () => {
    render(<HotelConsole />);
    expect(screen.getByText("智慧酒店控制台")).toBeInTheDocument();
    expect(screen.getByText("8801")).toBeInTheDocument();
    expect(screen.getByText("VIP套")).toBeInTheDocument();
  });

  it("点击切换按钮应切换到通讯基站面板", () => {
    render(<HotelConsole />);
    fireEvent.click(screen.getByText("通讯基站"));
    expect(screen.getByText("通讯基站状态")).toBeInTheDocument();
    expect(screen.getByText("基站运行正常")).toBeInTheDocument();
  });
});
