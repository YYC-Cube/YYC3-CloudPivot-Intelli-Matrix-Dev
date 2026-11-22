import { defineConfig } from 'tsup'

// @yyc3/plugin-ai-family 构建配置（P1 批次基建补齐 · shell 同款模式）
// 发布链路：CI 门禁 → 域内确认门 → 锚定更新（YYC3-Package-Ops/VERSION_ANCHOR.yaml）→ npm publish
// peerDeps 中 @yyc3/shell 与 @yyc3/family-core 保持 workspace:*（内部接线，发布流水线统一替换为 npm 版）
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
    '@yyc3/shell',
    '@yyc3/family-core',
    '@yyc3/*',
  ],
})
