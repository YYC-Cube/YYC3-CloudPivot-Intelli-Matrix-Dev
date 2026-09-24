import path from "path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "@yyc3/shell": path.resolve(__dirname, "packages/shell/src"),
      "@yyc3/plugin-ai-family": path.resolve(__dirname, "packages/plugin-ai-family/src"),
      "@yyc3/plugin-monitor": path.resolve(__dirname, "packages/plugin-monitor/src"),
      "@yyc3/plugin-ops": path.resolve(__dirname, "packages/plugin-ops/src"),
      "@yyc3/plugin-ai": path.resolve(__dirname, "packages/plugin-ai/src"),
      "@yyc3/plugin-business": path.resolve(__dirname, "packages/plugin-business/src"),
      "@yyc3/plugin-dev": path.resolve(__dirname, "packages/plugin-dev/src"),
      "@yyc3/plugin-admin": path.resolve(__dirname, "packages/plugin-admin/src"),
      "@yyc3/plugin-target": path.resolve(__dirname, "packages/plugin-target/src"),
      "@yyc3/plugin-cost": path.resolve(__dirname, "packages/plugin-cost/src"),
      "@yyc3/plugin-marketing": path.resolve(__dirname, "packages/plugin-marketing/src"),
      "@yyc3/plugin-prompt": path.resolve(__dirname, "packages/plugin-prompt/src"),
      "@yyc3/plugin-llm": path.resolve(__dirname, "packages/plugin-llm/src"),
      "@yyc3/family-core": path.resolve(__dirname, "docs/packages/family-core/src"),
      "@yyc3/family-agents": path.resolve(__dirname, "docs/packages/family-agents/src"),

      "@yyc3/family-skills": path.resolve(__dirname, "docs/packages/family-skills/src"),
    },
  },
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: ["./test-setup.ts"],
    include: ["packages/**/*.test.*", "apps/**/*.test.*"],
    coverage: {
      provider: "v8",
      // 只统计根 workspace 的 packages/apps 源码; docs/ 有独立 Family Engine Gate 门禁
      include: ["packages/*/src/**"],
      // vitest v4 按已加载文件收集, include 的 glob 可命中任意层级 (如 docs/packages),
      // 故显式排除 docs/apps/i18n 防止跨工作区模块污染分母
      exclude: ["**/dist/**", "**/node_modules/**", "docs/**", "apps/**", "i18n/**"],
      // P0 门禁 (2026-09-24 实测基线: lines 77/branch 62.7/func 65/stmt 72.2;
      // 0% 洼地文件已补测, docs//apps 跨工作区污染分母已剔除)
      // 阈值 = 基线 - 3pt 余量, 防回退而非追高; 渐进收紧策略见会话文档
      thresholds: {
        lines: 74,
        branches: 59,
        functions: 62,
        statements: 69,
      },
    },
  },
});
