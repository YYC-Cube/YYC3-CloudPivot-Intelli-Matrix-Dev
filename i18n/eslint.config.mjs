/**
 * file: eslint.config.mjs
 * description: YYC³ 团队统一 ESLint 配置 — 基于 @typescript-eslint 的 TypeScript/JavaScript 代码规范检查
 * author: YanYuCloudCube Team <admin@0379.email>
 * version: v1.0.0
 * created: 2026-06-09
 * updated: 2026-06-09
 * status: active
 * tags: [config],[lint],[eslint],[typescript]
 *
 * brief: YYC³ 团队 ESLint 扁平配置
 *
 * details:
 * - TypeScript 严格类型检查规则
 * - 导入排序与路径别名规范
 * - React/JSX 最佳实践
 * - 命名规范（camelCase / PascalCase / UPPER_SNAKE_CASE）
 * - 禁止 console.log（允许 warn/error）
 *
 * dependencies: @typescript-eslint, eslint-plugin-import, eslint-plugin-react
 * notes: 使用 ESLint 9.x flat config 格式
 */

import js from "@eslint/js";
import tseslint from "typescript-eslint";
import importPlugin from "eslint-plugin-import";
import reactPlugin from "eslint-plugin-react";
import reactHooksPlugin from "eslint-plugin-react-hooks";

export default tseslint.config(
  // 基础配置
  js.configs.recommended,
  ...tseslint.configs.strict,
  ...tseslint.configs.stylistic,

  // 全局忽略
  {
    ignores: [
      "**/node_modules/**",
      "**/dist/**",
      "**/coverage/**",
      "**/build/**",
      "**/.next/**",
      "**/pnpm-lock.yaml",
      "**/package-lock.json",
    ],
  },

  // TypeScript 共享规则
  {
    files: ["**/*.ts", "**/*.tsx"],
    plugins: {
      import: importPlugin,
    },
    rules: {
      // 命名规范
      "@typescript-eslint/naming-convention": [
        "warn",
        { selector: "variableLike", format: ["camelCase", "PascalCase", "UPPER_SNAKE_CASE"] },
        { selector: "function", format: ["camelCase", "PascalCase"] },
        { selector: "typeLike", format: ["PascalCase"] },
        { selector: "interface", format: ["PascalCase"], custom: { regex: "^I[A-Z]", match: false } },
      ],
      // 类型导入
      "@typescript-eslint/consistent-type-imports": ["error", { prefer: "type-imports" }],
      "@typescript-eslint/no-unused-vars": ["warn", { argsIgnorePattern: "^_" }],
      // 导入排序
      "import/order": [
        "warn",
        {
          groups: ["builtin", "external", "internal", "parent", "sibling", "index"],
          "newlines-between": "always",
        },
      ],
      // 禁止相对路径过深
      "no-restricted-imports": [
        "warn",
        { patterns: ["../../../*", "../../../*"] },
      ],
      // 代码质量
      "no-console": ["warn", { allow: ["warn", "error"] }],
      "@typescript-eslint/no-explicit-any": "warn",
      "prefer-const": "error",
      "no-var": "error",
    },
  },

  // React/JSX 规则
  {
    files: ["**/*.tsx", "**/*.jsx"],
    plugins: {
      react: reactPlugin,
      "react-hooks": reactHooksPlugin,
    },
    settings: {
      react: { version: "detect" },
    },
    rules: {
      "react/jsx-pascal-case": "error",
      "react-hooks/rules-of-hooks": "error",
      "react-hooks/exhaustive-deps": "warn",
    },
  },

  // 测试文件宽松规则
  {
    files: ["**/*.test.ts", "**/*.test.tsx", "**/test/**"],
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-non-null-assertion": "off",
    },
  },
);