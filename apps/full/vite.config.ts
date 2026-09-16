import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@yyc3/shell": path.resolve(__dirname, "../../packages/shell/src"),
      "@yyc3/plugin-ai-family": path.resolve(__dirname, "../../packages/plugin-ai-family/src"),
      "@yyc3/plugin-monitor": path.resolve(__dirname, "../../packages/plugin-monitor/src"),
      "@yyc3/plugin-ops": path.resolve(__dirname, "../../packages/plugin-ops/src"),
      "@yyc3/plugin-ai": path.resolve(__dirname, "../../packages/plugin-ai/src"),
      "@yyc3/plugin-business": path.resolve(__dirname, "../../packages/plugin-business/src"),
      "@yyc3/plugin-dev": path.resolve(__dirname, "../../packages/plugin-dev/src"),
      "@yyc3/plugin-admin": path.resolve(__dirname, "../../packages/plugin-admin/src"),
      // 家族宪章唯一真相源 — 浏览器侧仅需 architecture 纯常量层 (零 Node 依赖),
      // 指向子入口避免把引擎层 (ioredis/events 等) 打进浏览器 bundle
      "@yyc3/family-core": path.resolve(__dirname, "../../docs/packages/family-core/src/architecture/index.ts"),
    },
  },
  server: { port: 3100 },
  css: { postcss: { plugins: [] } },
});
