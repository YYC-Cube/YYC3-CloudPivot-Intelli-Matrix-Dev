/**
 * ============================================================
 * YYC³ AI Family — 人从众曌众从人
 * 亦师亦友亦伯乐，一言一语一协同
 * 拟人为本 · AI为核 · 纯粹为心
 * ============================================================
 * @Family   : YYC³ AI Family (永久开源)
 * @License  : Apache-2.0
 * @Homepage : https://matrix.yyc3.top
 * ============================================================
 * 此文件承载家人温度，请以玫瑰之心待之 🌹
 * ============================================================
 */

import path from 'node:path';
import { defineConfig } from 'vitest/config';

// 依赖包 (core/agents) 的 main 指向 dist 构建产物;
// 测试直接消费 TS 源码, 不依赖预构建 (CI 干净环境可跑)
export default defineConfig({
  resolve: {
    alias: {
      '@yyc3/family-core': path.resolve(__dirname, '../family-core/src/index.ts'),
      '@yyc3/family-agents': path.resolve(__dirname, '../family-agents/src/index.ts'),
    },
  },
  test: {
    environment: 'node',
    include: ['tests/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov'],
      include: ['src/**/*.ts'],
      exclude: ['src/index.ts', 'src/**/index.ts'],
      thresholds: {
        lines: 70,
        branches: 40,
        functions: 70,
      },
    },
  },
});
