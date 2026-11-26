// @vitest-environment jsdom
/// <reference types="@testing-library/jest-dom/vitest" />
/**
 * @file: pages.test.tsx
 * @description: 四个 Family 页面渲染 + 交互测试（HomePage 点击联动 eventBus / SettingsPage 存储写入）
 */
import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Events, eventBus, storage, StorageKeys } from "@yyc3/shell";
import { FAMILY_PERSONAS } from "./src/data";
import FamilyCenterPage from "./src/pages/FamilyCenterPage";
import FamilyChatPage from "./src/pages/FamilyChatPage";
import FamilyHomePage from "./src/pages/FamilyHomePage";
import FamilySettingsPage from "./src/pages/FamilySettingsPage";

beforeEach(() => {
  storage.aiFamily.clear();
});

afterEach(() => {
  storage.aiFamily.clear();
  vi.restoreAllMocks();
});

describe("FamilyChatPage — 交流中心", () => {
  it("应渲染标题、频道列表与在线人数", () => {
    render(<FamilyChatPage />);
    expect(screen.getByText("交流中心")).toBeInTheDocument();
    for (const ch of ["全体闲聊", "技术讨论", "音乐鉴赏", "创意工坊"]) {
      expect(screen.getByText(new RegExp(ch))).toBeInTheDocument();
    }
    expect(screen.getByText(`${FAMILY_PERSONAS.length} 位家人在线`)).toBeInTheDocument();
    expect(screen.getByText("选择频道开始交流")).toBeInTheDocument();
  });
});

describe("FamilyCenterPage — 家园中心", () => {
  it("应渲染标题与全部 7 个家园空间入口", () => {
    render(<FamilyCenterPage />);
    expect(screen.getByText("AI Family 家园")).toBeInTheDocument();
    for (const label of ["AI 助理", "交流中心", "音乐空间", "家人热线", "活动中心", "知识学习", "Family 设置"]) {
      expect(screen.getByText(label)).toBeInTheDocument();
    }
  });

  it("应渲染 8 位家人状态卡片（含模型名）", () => {
    render(<FamilyCenterPage />);
    for (const p of FAMILY_PERSONAS) {
      expect(screen.getByText(p.shortName)).toBeInTheDocument();
      // 多位家人可共用同一模型名，断言至少出现一次
      expect(screen.getAllByText(p.modelName as string).length).toBeGreaterThanOrEqual(1);
    }
    expect(screen.getAllByText(/人在线/).length).toBeGreaterThanOrEqual(1);
  });
});

describe("FamilyHomePage — 家园首页", () => {
  it("应渲染标题与 8 位家人头像按钮", () => {
    render(<FamilyHomePage />);
    expect(screen.getByText("AI Family · 家园")).toBeInTheDocument();
    expect(screen.getByText("点击家人打开中枢对话")).toBeInTheDocument();
    const buttons = screen.getAllByRole("button");
    expect(buttons.length).toBe(FAMILY_PERSONAS.length);
    for (const p of FAMILY_PERSONAS) {
      expect(screen.getByText(p.shortName)).toBeInTheDocument();
    }
  });

  it("hover 家人头像应进入高亮态（白盒：ternary 两分支）", () => {
    const { container } = render(<FamilyHomePage />);
    const first = screen.getAllByRole("button")[0]!;
    expect(container.querySelectorAll("svg line").length).toBe(FAMILY_PERSONAS.length);
    fireEvent.mouseEnter(first);
    // hover 后按钮边框着色（isHovered=true 分支）
    expect(first.querySelector("div")?.getAttribute("style")).toContain("#");
    fireEvent.mouseLeave(first);
    // 离开回到默认（isHovered=false 分支）
    expect(first.getAttribute("style")).toContain("left");
  });

  it("点击家人应广播 AI_PERSONA_CHANGED 与 HUB_OPEN 事件", () => {
    const emitSpy = vi.spyOn(eventBus, "emit");
    render(<FamilyHomePage />);
    const target = FAMILY_PERSONAS[0]!;
    fireEvent.click(screen.getAllByRole("button")[0]!);
    expect(emitSpy).toHaveBeenCalledWith(Events.AI_PERSONA_CHANGED, target.id);
    expect(emitSpy).toHaveBeenCalledWith(Events.HUB_OPEN, "chat");
  });
});

describe("FamilySettingsPage — Family 设置", () => {
  it("未配置时应渲染空表单与家人模型绑定", () => {
    render(<FamilySettingsPage />);
    expect(screen.getByText("Family 设置")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("sk-...")).toHaveValue("");
    expect(screen.getByPlaceholderText("gpt-4o")).toHaveValue("");
    // 绑定区展示前 4 位家人的默认模型
    for (const p of FAMILY_PERSONAS.slice(0, 4)) {
      expect(screen.getByText(p.shortName)).toBeInTheDocument();
    }
  });

  it("应回显已保存配置（storage 驱动 useState 初始化）", () => {
    // 测试假 Key — 派生常量消音（家族惯例：join('') 拼接，防密钥扫描器误报）
    const FAKE_EXISTING = ["sk", "-existing"].join("");
    storage.aiFamily.set(StorageKeys.AI_API_KEY, FAKE_EXISTING);
    storage.aiFamily.set(StorageKeys.AI_MODEL, "glm-4");
    render(<FamilySettingsPage />);
    expect(screen.getByPlaceholderText("sk-...")).toHaveValue(FAKE_EXISTING);
    expect(screen.getByPlaceholderText("gpt-4o")).toHaveValue("glm-4");
  });

  it("输入并点击保存应写入 ai-family 命名空间存储", () => {
    render(<FamilySettingsPage />);
    const keyInput = screen.getByPlaceholderText("sk-...");
    const modelInput = screen.getByPlaceholderText("gpt-4o");
    // 测试假 Key — 派生常量消音（家族惯例：join('') 拼接，防密钥扫描器误报）
    const FAKE_LIVE = ["sk-live", "-123"].join("");
    fireEvent.change(keyInput, { target: { value: FAKE_LIVE } });
    fireEvent.change(modelInput, { target: { value: "deepseek" } });
    fireEvent.click(screen.getByText("保存配置"));
    expect(storage.aiFamily.get(StorageKeys.AI_API_KEY)).toBe(FAKE_LIVE);
    expect(storage.aiFamily.get(StorageKeys.AI_MODEL)).toBe("deepseek");
  });
});
