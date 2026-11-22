import { defineConfig } from 'tsup'

// @yyc3/shell 构建配置（P1 发布前置基建 · 对齐 Component-Library 包族惯例）
// 发布链路：CI 门禁 → 版本锚定更新（YYC3-Package-Ops/VERSION_ANCHOR.yaml）→ npm publish（需负责人确认）
export default defineConfig({
  entry: ['src/index.ts'],
  format: ['cjs', 'esm'],
  dts: true,
  splitting: false,
  sourcemap: true,
  clean: true,
  external: [
    'react',
    'react-dom',
    'react/jsx-runtime',
    'lucide-react',
    'react-router-dom',
    '@yyc3/plugin-llm',
    '@yyc3/*',
  ],
})
