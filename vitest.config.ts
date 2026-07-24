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
      "@yyc3/family-core": path.resolve(__dirname, "packages/family-core/src"),
      "@yyc3/family-agents": path.resolve(__dirname, "packages/family-agents/src"),

      "@yyc3/family-skills": path.resolve(__dirname, "packages/family-skills/src"),
    },
  },
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: ["./test-setup.ts"],
    include: ["packages/**/*.test.*", "apps/**/*.test.*"],
  },
});
