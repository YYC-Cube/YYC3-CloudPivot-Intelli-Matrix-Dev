// @vitest-environment jsdom
/// <reference types="@testing-library/jest-dom/vitest" />
/**
 * @file: register.test.tsx
 * @description: 插件注册契约测试 (ai-family 含 lazy routes 契约验证 + hub action 白盒直调 + index 导出面)
 */
import { describe, expect, it } from "vitest";
import * as pluginEntry from "./src/index";
import { register } from "./src/register";

describe("plugin-ai-family register", () => {
  const reg = register();

  it("index.ts 应再导出 register 与 data 层符号", () => {
    expect(pluginEntry.register).toBe(register);
    expect(Array.isArray(pluginEntry.FAMILY_PERSONAS)).toBe(true);
    expect(typeof pluginEntry.PERSONAS_MAP).toBe("object");
    expect(typeof pluginEntry.moodEmoji).toBe("object");
  });

  it("应返回契约完整的 SystemRegistration", () => {
    expect(reg.id).toBe("ai-family");
    expect(reg.name).toBe("AI Family");
    expect(reg.description).toBe("中枢 · 家人协同");
    expect(reg.color).toBe("#00FF88");
    expect(reg.order).toBe(40);
  });

  it("侧边栏菜单应精确声明 4 项且 path/label 合法", () => {
    expect(reg.menuItems.map(m => m.path)).toEqual([
      "/ai-family", "/ai-family/center", "/ai-family/chat", "/ai-family/settings",
    ]);
    for (const item of reg.menuItems) {
      expect(item.label.length).toBeGreaterThan(0);
    }
  });

  it("应声明 4 条 lazy 路由且 Component 均可解析", async () => {
    expect(reg.routes.length).toBe(4);
    expect(reg.routes.map(r => (r as { path?: string }).path ?? "index")).toEqual([
      "index", "center", "chat", "settings",
    ]);
    for (const route of reg.routes) {
      expect(typeof route.lazy).toBe("function");
      const resolved = await (route.lazy as () => Promise<{ Component: unknown }>)();
      expect(resolved.Component).toBeDefined();
      expect(typeof resolved.Component).toBe("function");
    }
  });

  it("hub 命令的 systemId 应与插件 id 一致且 action 可直调", () => {
    expect(reg.hubCommands?.length).toBe(2);
    for (const cmd of reg.hubCommands ?? []) {
      expect(cmd.systemId).toBe(reg.id);
      expect(typeof cmd.action).toBe("function");
      expect(() => cmd.action()).not.toThrow();
    }
  });
});
