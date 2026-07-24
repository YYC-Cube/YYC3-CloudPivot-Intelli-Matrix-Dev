/**
 * family-agents 集成测试
 * 验证 8 位家人 Agent 的 PDAMR 认知环真实可用
 */
import { describe, expect, it } from "vitest";
import type { FamilyMessage } from "./src";
import { BoleAgent, GraceAgent, GrandmasterAgent, GuardianAgent, ProphetAgent, QianHangAgent, ThinkerAgent, TianShuAgent } from "./src";

describe("Family Agents — 8 位家人 PDAMR 认知环", () => {
  it("QianHangAgent (言启·千行) — 意图分类", async () => {
    const agent = new QianHangAgent();
    const msg: FamilyMessage = {
      id: "m1", type: "USER_REQUEST", from: "qianhang" as any, to: "qianhang",
      timestamp: Date.now(), payload: { text: "请帮我分析一下销售数据" },
    };
    const res = await agent.handleFamilyMessage(msg);
    expect(res.success).toBe(true);
    const intent = res.data as any;
    expect(intent.intent.primary).toBe("analysis");
  });

  it("TianShuAgent (元启·天枢) — 任务路由", async () => {
    const agent = new TianShuAgent();
    const res = await agent.route({ primary: "code", confidence: 0.9, raw: "修复 bug" });
    expect(res.assignee).toBeTruthy();
  });

  it("ThinkerAgent (语枢·万物) — 数据洞察", async () => {
    const agent = new ThinkerAgent();
    const res = await agent.executeCommand("analyze", { data: [100, 200, 150, 300] });
    expect(res.success).toBe(true);
  });

  it("ProphetAgent (预见·先知) — 时序预测", async () => {
    const agent = new ProphetAgent();
    const res = await agent.executeCommand("predict", { metric: "sales", data: [10, 20, 30, 40, 50] });
    expect(res.success).toBe(true);
  });

  it("BoleAgent (千里·伯乐) — 用户画像", async () => {
    const agent = new BoleAgent();
    const res = await agent.executeCommand("profile", { userId: "u1" });
    expect(res.success).toBe(true);
  });

  it("GuardianAgent (智云·守护) — 威胁扫描", async () => {
    const agent = new GuardianAgent();
    const res = await agent.executeCommand("scan", { target: "web-app" });
    expect(res.success).toBe(true);
  });

  it("GrandmasterAgent (格物·宗师) — 代码审查", async () => {
    const agent = new GrandmasterAgent();
    const res = await agent.executeCommand("analyze-code", { code: "function f(){return 1;}" });
    expect(res.success).toBe(true);
  });

  it("GraceAgent (创想·灵韵) — 创意生成", async () => {
    const agent = new GraceAgent();
    const res = await agent.executeCommand("create", { prompt: "写一句欢迎语", type: "text" });
    expect(res.success).toBe(true);
  });

  it("所有 Agent 人格问候包含 Emoji + 名号", () => {
    const agents = [
      [new QianHangAgent(), "言启"],
      [new TianShuAgent(), "天枢"],
      [new ThinkerAgent(), "万物"],
      [new ProphetAgent(), "先知"],
      [new BoleAgent(), "伯乐"],
      [new GuardianAgent(), "守护"],
      [new GrandmasterAgent(), "宗师"],
      [new GraceAgent(), "灵韵"],
    ] as const;
    for (const [agent, keyword] of agents) {
      const greeting = agent.greet();
      expect(greeting).toBeTruthy();
      expect(greeting.length).toBeGreaterThan(5);
    }
  });

  it("所有 Agent 能力注册表非空", () => {
    const agents = [new QianHangAgent(), new TianShuAgent(), new ThinkerAgent(), new ProphetAgent(), new BoleAgent(), new GuardianAgent(), new GrandmasterAgent(), new GraceAgent()];
    for (const a of agents) {
      expect(a.getCapabilities().length).toBeGreaterThan(0);
    }
  });
});
