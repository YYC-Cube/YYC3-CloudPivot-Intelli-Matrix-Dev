import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@yyc3/shell": path.resolve(__dirname, "../../packages/shell/src"),
      "@yyc3/plugin-ai-family": path.resolve(__dirname, "../../packages/plugin-ai-family/src"),
      // 家族宪章唯一真相源 — 浏览器侧仅需 architecture 纯常量层 (零 Node 依赖),
      // 指向子入口避免把引擎层 (ioredis/events 等) 打进浏览器 bundle
      "@yyc3/family-core": path.resolve(__dirname, "../../docs/packages/family-core/src/architecture/index.ts"),
    },
  },
  server: { port: 3112 },
  css: {
    postcss: { plugins: [] },
  },
});
