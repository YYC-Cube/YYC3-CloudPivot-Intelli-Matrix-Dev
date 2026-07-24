// @vitest-environment node
/**
 * @file: business-prompts.test.ts
 * @description: 提示词库测试 — 覆盖模板完整性、人格映射、分类一致性
 */

import { describe, it, expect } from "vitest";
import { BUSINESS_PROMPTS, PERSONA_PROMPT_MAP } from "./src/business-prompts";
import type { PromptCategory, PersonaId } from "./src/types";

// ============================================================
// Prompt模板完整性测试
// ============================================================

describe("BUSINESS_PROMPTS — 模板完整性", () => {
  it("Prompt总数 ≥ 15", () => {
    expect(BUSINESS_PROMPTS.length).toBeGreaterThanOrEqual(15);
  });

  it("每个Prompt有唯一ID", () => {
    const ids = BUSINESS_PROMPTS.map(p => p.id);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(ids.length);
  });

  it("每个Prompt有非空名称", () => {
    for (const p of BUSINESS_PROMPTS) {
      expect(p.name.length).toBeGreaterThan(0);
    }
  });

  it("每个Prompt有非空模板内容", () => {
    for (const p of BUSINESS_PROMPTS) {
      expect(p.template.length).toBeGreaterThan(20);
    }
  });

  it("每个Prompt有文档引用编号", () => {
    for (const p of BUSINESS_PROMPTS) {
      expect(p.docRef.length).toBeGreaterThan(0);
    }
  });

  it("每个Prompt至少有1个输入参数", () => {
    for (const p of BUSINESS_PROMPTS) {
      expect(p.inputs.length).toBeGreaterThan(0);
    }
  });

  it("每个Prompt有输出格式描述", () => {
    for (const p of BUSINESS_PROMPTS) {
      expect(p.outputFormat.length).toBeGreaterThan(0);
    }
  });
});

// ============================================================
// 分类覆盖测试
// ============================================================

describe("BUSINESS_PROMPTS — 分类覆盖", () => {
  const categories: PromptCategory[] = ["cost", "festival", "marketing", "diagnosis", "fullpipeline"];

  it("覆盖全部5个分类", () => {
    const coveredCategories = new Set(BUSINESS_PROMPTS.map(p => p.category));
    for (const cat of categories) {
      expect(coveredCategories.has(cat)).toBe(true);
    }
  });

  it("成本盈亏类 ≥ 3个Prompt", () => {
    expect(BUSINESS_PROMPTS.filter(p => p.category === "cost").length).toBeGreaterThanOrEqual(3);
  });

  it("节日营销类 ≥ 3个Prompt", () => {
    expect(BUSINESS_PROMPTS.filter(p => p.category === "festival").length).toBeGreaterThanOrEqual(3);
  });

  it("全链路类至少有1个Prompt", () => {
    expect(BUSINESS_PROMPTS.filter(p => p.category === "fullpipeline").length).toBeGreaterThanOrEqual(1);
  });
});

// ============================================================
// 人格映射测试
// ============================================================

describe("PERSONA_PROMPT_MAP — 人格映射", () => {
  it("覆盖至少6位家人人格", () => {
    expect(Object.keys(PERSONA_PROMPT_MAP).length).toBeGreaterThanOrEqual(6);
  });

  it("每个人格至少绑定1个Prompt", () => {
    for (const [personaId, mapping] of Object.entries(PERSONA_PROMPT_MAP)) {
      expect(mapping.promptIds.length).toBeGreaterThan(0);
    }
  });

  it("映射中的Prompt ID在BUSINESS_PROMPTS中存在", () => {
    const allPromptIds = new Set(BUSINESS_PROMPTS.map(p => p.id));
    for (const mapping of Object.values(PERSONA_PROMPT_MAP)) {
      for (const promptId of mapping.promptIds) {
        expect(allPromptIds.has(promptId)).toBe(true);
      }
    }
  });

  it("每个人格有中文名称", () => {
    for (const mapping of Object.values(PERSONA_PROMPT_MAP)) {
      expect(mapping.personaName.length).toBeGreaterThan(0);
    }
  });

  it("每个Prompt都能通过人格映射找到", () => {
    const mappedPromptIds = new Set<string>();
    for (const mapping of Object.values(PERSONA_PROMPT_MAP)) {
      mapping.promptIds.forEach(id => mappedPromptIds.add(id));
    }
    for (const p of BUSINESS_PROMPTS) {
      expect(mappedPromptIds.has(p.id)).toBe(true);
    }
  });
});

// ============================================================
// 引擎关联测试
// ============================================================

describe("BUSINESS_PROMPTS — 引擎关联", () => {
  it("成本类Prompt关联cost引擎", () => {
    const costPrompts = BUSINESS_PROMPTS.filter(p => p.category === "cost");
    for (const p of costPrompts) {
      expect(p.engine).toBe("cost");
    }
  });

  it("节日类Prompt关联marketing或target引擎", () => {
    const festivalPrompts = BUSINESS_PROMPTS.filter(p => p.category === "festival");
    for (const p of festivalPrompts) {
      expect(["marketing", "target"]).toContain(p.engine);
    }
  });

  it("全链路Prompt可以不关联具体引擎", () => {
    const pipelinePrompts = BUSINESS_PROMPTS.filter(p => p.category === "fullpipeline");
    for (const p of pipelinePrompts) {
      // fullpipeline 类型可以没有引擎关联，也可以有
      if (p.engine) {
        expect(["target", "cost", "marketing"]).toContain(p.engine);
      }
    }
  });
});
