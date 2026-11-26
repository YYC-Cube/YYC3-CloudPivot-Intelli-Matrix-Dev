/**
 * @file: theme.test.ts
 * @description: 统一主题测试 — getTheme/getSystemTheme/AI_FAMILY_STYLES
 */
import { describe, it, expect } from "vitest";
import { AI_FAMILY_STYLES, getSystemTheme, getTheme, THEME_MODERN } from "../theme";

describe("theme", () => {
  it("getTheme 应返回 Modern 主题 tokens", () => {
    const t = getTheme("modern");
    expect(t.mode).toBe("modern");
    expect(t).toBe(THEME_MODERN);
    expect(t.accent).toBe("#00d4ff");
  });

  it("getSystemTheme 已知与未知 systemId 均返回主题", () => {
    expect(getSystemTheme("monitor").mode).toBe("modern");
    expect(getSystemTheme("nonexistent-system").mode).toBe("modern");
    expect(getSystemTheme("hub").accentBg).toContain("0,212,255");
  });

  it("AI_FAMILY_STYLES 函数应生成样式字符串", () => {
    expect(AI_FAMILY_STYLES.clockRingGlow("#00ff88")).toContain("#00ff8833");
    expect(AI_FAMILY_STYLES.clockRingGlow("#fff")).toContain("#fff11");
    expect(AI_FAMILY_STYLES.personaHover("#7b2ff7")).toContain("#7b2ff744");
    expect(AI_FAMILY_STYLES.bgGradient).toContain("radial-gradient");
  });
});
