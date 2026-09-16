/**
 * @file: eslint.config.js
 * @description: YYC³ 生态 ESLint flat config — TS 严格 + React Hooks + 可访问性基线
 * @scope: packages/ apps/ docs/packages/ (monorepo 全量源码)
 */
import js from "@eslint/js";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import globals from "globals";
import tseslint from "typescript-eslint";

export default tseslint.config(
  // 全局忽略 — 构建产物、依赖、嵌套独立仓库 (i18n/ 自带 lint/CI 治理)
  { ignores: ["**/dist/**", "**/node_modules/**", "coverage/**", "playwright-report/**", "test-results/**", "api/**", "i18n/**", "AIAssistant/**", "docs/AI-Dev/**"] },

  // JS 基线 (覆盖 .js/.mjs 配置文件)
  js.configs.recommended,

  // TypeScript 严格 (非类型感知, 保证 lint 速度)
  ...tseslint.configs.recommended.map(c => ({ ...c, files: ["**/*.{ts,tsx}"] })),

  {
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "module",
      globals: { ...globals.browser, ...globals.node },
    },
    plugins: {
      "react-hooks": reactHooks,
      "react-refresh": reactRefresh,
    },
    rules: {
      // React 正确性 (最高价值)
      "react-hooks/rules-of-hooks": "error",
      "react-hooks/exhaustive-deps": "warn",
      "react-refresh/only-export-components": "off", // 插件架构允许混合导出

      // TS 卫生
      "@typescript-eslint/no-unused-vars": ["warn", { argsIgnorePattern: "^_", varsIgnorePattern: "^_" }],
      "@typescript-eslint/no-explicit-any": "off", // 既有代码量大, 渐进收紧 (见 lint-todo)
      "@typescript-eslint/consistent-type-imports": ["warn", { prefer: "type-imports" }],
      "no-undef": "off", // TS 已覆盖

      // 安全基线
      "no-eval": "error",
      "no-new-func": "error",
    },
  },

  // 测试文件放宽
  {
    files: ["**/*.test.{ts,tsx}", "**/__tests__/**"],
    rules: {
      "@typescript-eslint/no-non-null-assertion": "off",
    },
  },

  // 安全/沙箱测试: require/eval 是被测能力本身 (SkillSandbox 隔离验证)
  {
    files: ["docs/packages/family-core/tests/security.test.ts", "docs/packages/family-core/tests/sandbox.test.ts"],
    rules: {
      "@typescript-eslint/no-require-imports": "off",
      "no-eval": "off",
      "no-new-func": "off",
    },
  },

  // 遗留数据层 (AST/正则引擎) 允许控制字符正则
  {
    files: ["docs/packages/family-core/tests/五维评估测试.test.ts"],
    rules: {
      "no-control-regex": "off",
    },
  }
);
