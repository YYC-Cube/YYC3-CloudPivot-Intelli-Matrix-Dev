/**
 * file: prettier.config.mjs
 * description: YYC³ 团队统一 Prettier 配置 — 代码格式化标准
 * author: YanYuCloudCube Team <admin@0379.email>
 * version: v1.0.0
 * created: 2026-06-09
 * updated: 2026-06-09
 * status: active
 * tags: [config],[format],[prettier]
 *
 * brief: YYC³ 代码格式化标准配置
 *
 * details:
 * - 2 空格缩进（禁止 Tab）
 * - 单引号优先（JSX 属性用双引号）
 * - 无分号
 * - 尾逗号（多行时）
 * - 行宽 ≤ 100 字符
 * - LF 换行符
 *
 * notes: 需配合 .editorconfig 和 .gitattributes 使用
 */

export default {
  printWidth: 100,
  tabWidth: 2,
  useTabs: false,
  semi: false,
  singleQuote: false,
  jsxSingleQuote: false,
  trailingComma: "all",
  bracketSpacing: true,
  bracketSameLine: false,
  arrowParens: "avoid",
  endOfLine: "lf",
  embeddedLanguageFormatting: "auto",
  overrides: [
    {
      files: ["*.md", "*.mdx"],
      options: { proseWrap: "preserve" },
    },
    {
      files: ["*.json", "*.yml", "*.yaml"],
      options: { tabWidth: 2 },
    },
  ],
};