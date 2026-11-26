import path from "path";
import { defineConfig } from "vitest/config";

/**
 * @file: vitest.plugin-suite.config.ts
 * @description: plugin 五件套 (+ plugin-ai-family) 逐包 istanbul 覆盖率门禁
 *
 *   铁律: 已发布包下次版本发布前覆盖率 >85%（statements/branches/functions/lines）
 *
 * 用法:
 *   逐包门禁（CI 用）: PLUGIN_PKG=plugin-monitor npx vitest run --config vitest.plugin-suite.config.ts --coverage
 *   全套一次跑:        npx vitest run --config vitest.plugin-suite.config.ts --coverage
 *   或:               pnpm test:coverage:plugins
 */
const SUITE = [
  "plugin-admin",
  "plugin-ai",
  "plugin-dev",
  "plugin-monitor",
  "plugin-ops",
  "plugin-ai-family",
] as const;

const single = process.env.PLUGIN_PKG;
const pkgs: string[] = single && (SUITE as readonly string[]).includes(single) ? [single] : [...SUITE];

export default defineConfig({
  resolve: {
    alias: {
      "@yyc3/shell": path.resolve(__dirname, "packages/shell/src"),
      "@yyc3/family-core": path.resolve(__dirname, "docs/packages/family-core/src"),
    },
  },
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: ["./test-setup.ts"],
    include: pkgs.map((p) => `packages/${p}/**/*.test.*`),
    coverage: {
      provider: "istanbul",
      include: pkgs.map((p) => `packages/${p}/src/**`),
      exclude: ["**/dist/**", "**/node_modules/**"],
      reporter: ["text", "json-summary"],
      reportsDirectory:
        pkgs.length === 1 ? path.join("coverage", "plugin-suite", pkgs[0]!) : "coverage/plugin-suite",
      thresholds: {
        statements: 85,
        branches: 85,
        functions: 85,
        lines: 85,
      },
    },
  },
});
