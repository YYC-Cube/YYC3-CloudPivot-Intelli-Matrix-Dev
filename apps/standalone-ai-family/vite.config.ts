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
    },
  },
  server: { port: 3112 },
  css: {
    postcss: { plugins: [] },
  },
});
