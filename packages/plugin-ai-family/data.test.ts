/**
 * @file: data.test.ts
 * @description: data 层测试 — FAMILY_PERSONAS 派生 / PERSONAS_MAP / moodEmoji / 工具函数 + 白盒覆盖 ?? 回退分支
 */
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  FAMILY_PERSONAS,
  INITIAL_TIMESTAMP,
  PERSONAS_MAP,
  PROMPT_PRESETS,
  generateMessageId,
  getCurrentTimestamp,
  moodEmoji,
} from "./src/data";

describe("data — 家人档案派生（真实家族宪章）", () => {
  it("FAMILY_PERSONAS 应派生自家族宪章且权威字段齐全", () => {
    expect(FAMILY_PERSONAS.length).toBe(8);
    for (const p of FAMILY_PERSONAS) {
      expect(p.id.length).toBeGreaterThan(0);
      expect(p.name).toContain("·");
      expect(p.shortName.length).toBeGreaterThan(0);
      expect(p.role.length).toBeGreaterThan(0);
      expect(p.color).toMatch(/^#/);
      expect(p.greeting).toContain(p.name);
      expect(p.icon != null).toBe(true); // lucide 组件（forwardRef 对象或函数组件）
      // 家族宪章权威字段
      expect(p.编号.length).toBeGreaterThan(0);
      expect(p.座右铭.length).toBeGreaterThan(0);
      expect(p.情感铭文.length).toBeGreaterThan(0);
      expect(p.电话号码.length).toBeGreaterThan(0);
      expect(p.徽章文字.length).toBeGreaterThan(0);
      expect(p.五环职责.length).toBeGreaterThan(0);
    }
  });

  it("每位的 mood 都应在 moodEmoji 表中", () => {
    for (const p of FAMILY_PERSONAS) {
      expect(moodEmoji[p.mood]).toBeDefined();
    }
    expect(Object.keys(moodEmoji).length).toBe(8);
  });

  it("PERSONAS_MAP 应按 id 建立索引且与列表一致", () => {
    expect(Object.keys(PERSONAS_MAP).length).toBe(FAMILY_PERSONAS.length);
    for (const p of FAMILY_PERSONAS) {
      expect(PERSONAS_MAP[p.id]).toBe(p);
    }
  });

  it("moodEmoji 映射应稳定", () => {
    expect(moodEmoji.energetic).toBe("⚡");
    expect(moodEmoji.thoughtful).toBe("🤔");
    expect(moodEmoji.vigilant).toBe("👁️");
    expect(moodEmoji.inspired).toBe("💡");
  });
});

describe("data — 工具函数（白盒直调）", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it("generateMessageId 应单调递增且支持后缀", async () => {
    const fresh = await import("./src/data");
    const a = fresh.generateMessageId();
    const b = fresh.generateMessageId("-reply");
    expect(a).toMatch(/^msg-\d+$/);
    expect(b).toBe(`msg-${Number(a.slice(4)) + 1}-reply`);
  });

  it("getCurrentTimestamp / INITIAL_TIMESTAMP 应为有效时间戳", () => {
    expect(getCurrentTimestamp()).toBeLessThanOrEqual(Date.now() + 1);
    expect(INITIAL_TIMESTAMP).toBeLessThanOrEqual(Date.now() + 1);
  });

  it("PROMPT_PRESETS 应含预设且字段完整", () => {
    expect(PROMPT_PRESETS.length).toBe(2);
    for (const preset of PROMPT_PRESETS) {
      expect(preset.id.length).toBeGreaterThan(0);
      expect(preset.name.length).toBeGreaterThan(0);
      expect(preset.prompt.length).toBeGreaterThan(0);
      expect(preset.category.length).toBeGreaterThan(0);
    }
  });
});

describe("data — 回退分支（白盒：mock 家族宪章注入异常档案）", () => {
  it("未知 id 回退 navigator UI 档案；名号无 · 时 shortName 回退全名", async () => {
    vi.resetModules();
    vi.doMock("@yyc3/family-core", () => ({
      八位家人: {
        ghost: {
          id: "unknown-id",
          中文名号: "无环名",
          英文名号: "NoDot",
          角色: "测试",
          主题色: "#123456",
          编号: "00",
          座右铭: "测试座右铭",
          情感铭文: "测试铭文",
          电话号码: "000",
          徽章文字: "T",
          五环职责: "测试职责",
        },
      },
    }));
    try {
      const fresh = await import("./src/data");
      expect(fresh.FAMILY_PERSONAS.length).toBe(1);
      const ghost = fresh.FAMILY_PERSONAS[0];
      // 未知 id → 回退 navigator 档案（热情开朗 / energetic / GPT-4o / Ear 图标语义）
      expect(ghost.personality).toBe("热情开朗");
      expect(ghost.mood).toBe("energetic");
      expect(ghost.modelName).toBe("GPT-4o");
      expect(ghost.expertise).toEqual(["自然语言理解", "意图识别", "多语言翻译"]);
      // 无 · 名号 → shortName 回退全名
      expect(ghost.name).toBe("无环名");
      expect(ghost.shortName).toBe("无环名");
      expect(fresh.PERSONAS_MAP["unknown-id"]).toBe(ghost);
    } finally {
      vi.doUnmock("@yyc3/family-core");
      vi.resetModules();
    }
  });
});
