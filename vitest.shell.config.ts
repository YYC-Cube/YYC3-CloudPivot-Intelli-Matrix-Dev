import path from "path";
import { defineConfig } from "vitest/config";

/**
 * @file: vitest.shell.config.ts
 * @description: @yyc3/shell istanbul 覆盖率门禁（复用 vitest.plugin-suite.config.ts 模式）
 *
 *   铁律: 已发布包（@yyc3/shell@1.1.0 已发 npm）下次版本发布前覆盖率 >85%
 *   （statements/branches/functions/lines）
 *
 * 用法:
 *   门禁跑法: npx vitest run --config vitest.shell.config.ts --coverage
 *   或:      pnpm test:coverage:shell
 */
export default defineConfig({
  resolve: {
    alias: {
      // shell 自身测试全部相对导入; plugin-llm alias 供 llm-bridge 动态加载 (与根配置一致)
      "@yyc3/shell": path.resolve(__dirname, "packages/shell/src"),
      "@yyc3/plugin-llm": path.resolve(__dirname, "packages/plugin-llm/src"),
    },
  },
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: ["./test-setup.ts"],
    include: ["packages/shell/**/*.test.*"],
    coverage: {
      provider: "istanbul",
      include: ["packages/shell/src/**"],
      exclude: ["**/dist/**", "**/node_modules/**"],
      reporter: ["text", "json-summary"],
      reportsDirectory: "coverage/shell",
      thresholds: {
        statements: 85,
        branches: 85,
        functions: 85,
        lines: 85,
      },
    },
  },
});
