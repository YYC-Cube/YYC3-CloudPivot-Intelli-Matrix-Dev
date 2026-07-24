# @yyc3/family-agents — 8 位家人 Agent

基于 **PDAMR 认知环**（Perceive → Decide → Act → Memory → Reflect）的 8 位家人智能体实例。每位家人拥有独立人格特征、语气模式和专业技能。

> 注：生产构建位于 `docs/packages/family-agents/`（76 tests），本目录为 monorepo 引擎层的源码镜像。

---

## 架构定位

```
family-core               ← 提供家人档案（peerDep）
    ↓
family-agents（本包）      ← Agent 实例 + PDAMR + 人格
    ↓ peerDep
family-skills             ← 为 Agent 注册技能
```

---

## 模块结构

| 文件 | 说明 |
|------|------|
| **base/** | |
| `FamilyTypes.ts` | 全局类型 — FamilyMemberId / 消息协议 / 技能接口 / 编排模式 |
| `PDAMRCycle.ts` | PDAMR 认知环引擎 — 感知→决策→行动→记忆→反思 |
| `AgentPersona.ts` | 人格引擎 — 特质 + 语气模式 + 情绪基调 |
| `FamilyBaseAgent.ts` | 家人 Agent 抽象基类 — 命令处理 + 能力声明 |
| **members/** | |
| `QianHangAgent.ts` | 千航 — 自然语言理解 + 意图识别 |
| `ThinkerAgent.ts` | 思辨 — 数据洞察 + 文档分析 |
| `ProphetAgent.ts` | 预见 — 时序预测 + 异常检测 + 风险预警 |
| `BoleAgent.ts` | 伯乐 — 用户画像 + 个性化推荐 |
| `TianShuAgent.ts` | 天枢 — 全局调度 + 资源编排 |
| `GuardianAgent.ts` | 守护 — 威胁检测 + 安全基线 |
| `GrandmasterAgent.ts` | 宗师 — 代码审查 + 质量门控 |
| `GraceAgent.ts` | 灵韵 — 创意生成 + 设计建议 |

---

## 核心导出

### 基础设施

| 导出名 | 类型 | 说明 |
|--------|------|------|
| `PDAMRCycle` | class | 认知环引擎（5 阶段闭环） |
| `AgentPersona` | class | 人格引擎（特质 + 语气 + 情绪） |
| `FamilyBaseAgent` | abstract class | Agent 基类（继承实现命令处理） |
| `FAMILY_PROFILES` | const | 8 位家人完整配置档案 |
| `FAMILY_ORCHESTRATION_FLOW` | const | 家人协作编排流程定义 |

### 8 位家人 Agent

| 导出类 | 专业类型 |
|--------|----------|
| `QianHangAgent` | — |
| `ThinkerAgent` | `DataInsight`, `DocAnalysis` |
| `ProphetAgent` | `TimeSeriesPrediction`, `AnomalyReport`, `RiskAlert` |
| `BoleAgent` | `UserProfile`, `Recommendation` |
| `TianShuAgent` | — |
| `GuardianAgent` | `ThreatDetection`, `SecurityBaseline` |
| `GrandmasterAgent` | `CodeAnalysis`, `QualityGateResult` |
| `GraceAgent` | `CreativeOutput`, `DesignSuggestion` |

---

## 使用示例

```typescript
import { ThinkerAgent, PDAMRCycle } from "@yyc3/family-agents";

// 创建思辨 Agent 实例
const thinker = new ThinkerAgent();

// 执行 PDAMR 认知环
const cycle = new PDAMRCycle();
const result = await cycle.run({
  agent: thinker,
  input: { type: "data-analysis", data: [...] },
});
```

---

## 共用项衔接

| 依赖方向 | 包 | 引用内容 |
|----------|-----|----------|
| **上游** | `@yyc3/family-core` | 家人档案（peerDep） |
| **下游** | `@yyc3/family-skills` | Agent 实例接收技能注册 |

---

## 测试

```bash
pnpm --filter @yyc3/family-agents test
# → 4 Test Files · 76 Tests · 全绿
```

---

_亦师亦友亦伯乐 · 一言一语一协同_
