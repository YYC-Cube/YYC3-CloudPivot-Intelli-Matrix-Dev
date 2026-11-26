import { defineConfig } from 'tsup'

// @yyc3/plugin-ai 构建配置（P1 批次基建 · shell 同款模式）
// peerDeps 中 @yyc3/shell 保持 workspace:*（内部接线，发布流水线统一替换）
export default defineConfig({
  entry: ['src/index.ts'],
  format: ['cjs', 'esm'],
  dts: true,
  splitting: false,
  sourcemap: true,
  clean: true,
  external: ['react', 'react-dom', 'react/jsx-runtime', 'lucide-react', '@yyc3/shell', '@yyc3/*'],
})
