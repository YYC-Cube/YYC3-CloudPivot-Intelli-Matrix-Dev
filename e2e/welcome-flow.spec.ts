/**
 * @file: welcome-flow.spec.ts
 * @description: E2E 测试 — 欢迎页 → 进入系统 → Hub 交互 全链路
 */
import { test, expect } from "@playwright/test";

// 每个测试前清除 localStorage，确保欢迎弹窗显示
test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.clear();
  });
});

test.describe("欢迎页流程", () => {
  test("应显示 YYC³ Cloud Intelli-Matrix 标题", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("h1")).toContainText("YYC³ Cloud Intelli-Matrix");
  });

  test("应显示 AI Family 系统卡片", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByText("AI Family").first()).toBeVisible();
  });

  test("点击'进入系统'应关闭欢迎弹窗并显示主界面", async ({ page }) => {
    await page.goto("/");
    // 点击"进入系统"按钮
    const enterBtn = page.getByRole("button", { name: /进入系统/ });
    await enterBtn.click();
    // 弹窗关闭后应不再显示该按钮
    await expect(enterBtn).not.toBeVisible({ timeout: 5000 });
  });
});

test.describe("Hub 浮窗交互", () => {
  test("关闭欢迎弹窗后应显示 Hub 浮窗按钮", async ({ page }) => {
    await page.goto("/");
    // 先关闭欢迎弹窗
    await page.getByRole("button", { name: /进入系统/ }).click();
    await expect(page.locator("[data-testid='hub-btn-ai-family']")).toBeVisible({ timeout: 10000 });
  });

  test("点击 Hub 按钮应打开面板", async ({ page }) => {
    await page.goto("/");
    // 先关闭欢迎弹窗
    await page.getByRole("button", { name: /进入系统/ }).click();
    await expect(page.locator("[data-testid='hub-btn-ai-family']")).toBeVisible({ timeout: 10000 });

    // 点击 Hub 按钮打开面板
    await page.locator("[data-testid='hub-btn-ai-family']").click();
    // 面板应显示"系统快捷命令"或命令数
    await expect(page.getByText(/条命令/)).toBeVisible({ timeout: 5000 });
  });

  test("切换到命令 Tab 应显示快捷命令", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: /进入系统/ }).click();
    await expect(page.locator("[data-testid='hub-btn-ai-family']")).toBeVisible({ timeout: 10000 });

    await page.locator("[data-testid='hub-btn-ai-family']").click();
    // 点击"命令"Tab
    await page.getByRole("button", { name: "命令" }).click();
    // 应显示系统快捷命令标题
    await expect(page.getByText("系统快捷命令")).toBeVisible({ timeout: 5000 });
  });

  test("点击命令应触发消息反馈", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: /进入系统/ }).click();
    await expect(page.locator("[data-testid='hub-btn-ai-family']")).toBeVisible({ timeout: 10000 });

    await page.locator("[data-testid='hub-btn-ai-family']").click();
    await page.getByRole("button", { name: "命令" }).click();
    // 点击第一条命令（呼叫家人）
    const firstCmd = page.locator("button:has(span:text('呼叫'))").first();
    await expect(firstCmd).toBeVisible({ timeout: 5000 });
    await firstCmd.click();
    // 应显示消息反馈"已接通"
    await expect(page.getByText(/已接通/).first()).toBeVisible({ timeout: 5000 });
  });
});
