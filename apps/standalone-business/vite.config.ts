import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@yyc3/shell": path.resolve(__dirname, "../../packages/shell/src"),
    },
  },
  server: { port: 3118 },
  css: { postcss: { plugins: [] } },
});
