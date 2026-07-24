/**
 * 全链路集成测试 — 4 内核包联动验证
 * family-core → family-agents → family-skills
 */
import { FAMILY_PROFILES, QianHangAgent, TianShuAgent } from "@yyc3/family-agents";
import { 五维评估器, 八位家人, 家族宪章 } from "@yyc3/family-core";
import { FamilySkillRegistry, allSkills } from "@yyc3/family-skills";
import { describe, expect, it } from "vitest";

describe("全链路集成 — 4 内核包联动", () => {
  it("family-core: 家族宪章权威定义 8 位家人", () => {
    const count = Object.keys(八位家人).length;
    expect(count).toBe(8);
    expect(家族宪章.名称).toContain("YYC");
  });

  it("family-core: 五维评估器可执行", () => {
    const report = 五维评估器.评估("test-001", "测试模块");
    expect(report.overallScore).toBeGreaterThanOrEqual(0);
    expect(report.dimensions.length).toBe(5);
  });

  it("family-agents: QianHangAgent 接收 family-core 的 PROFILE", () => {
    const agent = new QianHangAgent();
    expect(agent.memberId).toBe("qianhang");
    expect(FAMILY_PROFILES.qianhang.name).toBeTruthy();
  });

  it("family-agents: TianShuAgent 路由到正确家人", async () => {
    const tianshu = new TianShuAgent();
    const result = await tianshu.route({ primary: "code", confidence: 0.9, raw: "修复 bug" });
    expect(result.assignee).toBeTruthy();
  });

  it("family-skills: 技能注册表可注册 allSkills", async () => {
    const registry = new FamilySkillRegistry();
    expect(allSkills.length).toBeGreaterThan(20);
    for (const skill of allSkills) {
      await registry.register(skill);
    }
    expect(registry.list().length).toBe(allSkills.length);
  });

  it("family-skills: 按类别检索技能", async () => {
    const registry = new FamilySkillRegistry();
    for (const skill of allSkills) await registry.register(skill);
    const results = registry.listByCategory("nlu");
    expect(results.length).toBeGreaterThan(0);
  });
});
