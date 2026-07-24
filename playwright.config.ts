/**
 * @file: playwright.config.ts
 * @description: Playwright E2E 配置 — 自动启动 standalone-ai-family 开发服务器
 */
import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: "html",
  use: {
    baseURL: "http://localhost:3112",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
  ],
  webServer: {
    command: "cd apps/standalone-ai-family && npx vite --port 3112",
    url: "http://localhost:3112",
    reuseExistingServer: !process.env.CI,
    timeout: 30000,
  },
});
