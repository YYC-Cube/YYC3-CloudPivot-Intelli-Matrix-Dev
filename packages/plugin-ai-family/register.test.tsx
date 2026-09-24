// @vitest-environment jsdom
/// <reference types="@testing-library/jest-dom/vitest" />
/**
 * @file: register.test.tsx
 * @description: 插件注册契约测试 (ai-family 含 lazy routes 契约验证)
 */
import { describe, expect, it } from "vitest";
import { register } from "./src/register";

describe("plugin-ai-family register", () => {
  const reg = register();

  it("应返回契约完整的 SystemRegistration", () => {
    expect(reg.id).toBe("ai-family");
    expect(reg.name).toBe("AI Family");
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

  it("应声明 4 条 lazy 路由且 Component 均可解析", async () => {
    expect(reg.routes.length).toBe(4);
    for (const route of reg.routes) {
      expect(typeof route.lazy).toBe("function");
      const resolved = await (route.lazy as () => Promise<{ Component: unknown }>)();
      expect(resolved.Component).toBeDefined();
    }
  });

  it("hub 命令的 systemId 应与插件 id 一致", () => {
    for (const cmd of reg.hubCommands ?? []) {
      expect(cmd.systemId).toBe(reg.id);
      expect(typeof cmd.action).toBe("function");
    }
  });
});
