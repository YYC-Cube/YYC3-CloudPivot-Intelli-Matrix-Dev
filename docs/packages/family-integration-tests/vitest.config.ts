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
 * 跨包集成测试: 通过 alias 直接加载各包 TS 源码, 无需预构建 dist
 * ============================================================
 */

import path from 'node:path';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: {
    alias: {
      '@yyc3/family-agents': path.resolve(__dirname, '../family-agents/src/index.ts'),
      '@yyc3/family-skills': path.resolve(__dirname, '../family-skills/src/index.ts'),
      '@yyc3/family-core': path.resolve(__dirname, '../family-core/src/index.ts'),
    },
  },
  test: {
    environment: 'node',
    include: ['tests/**/*.test.ts'],
  },
});
