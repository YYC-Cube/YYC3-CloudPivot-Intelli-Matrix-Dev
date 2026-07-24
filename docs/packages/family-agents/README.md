# @yyc3/family-agents

> YYC³ AI Family 8 位家人 Agent — 人格化智能体

## 概述

`family-agents` 实现了 AI Family 的 8 位人格化智能体，每位家人拥有独特的情感基调、专业技能和认知循环 (PDAMR)。基于 `family-core` 的 `BaseAgent` 构建。

## 家人档案

| 成员 | 角色 | 色调 | 技能领域 |
|------|------|------|----------|
| 🧭 言启·千行 | 导航员 | warm | NLU |
| 🤔 语枢·万物 | 思考者 | scholarly | Analysis |
| 🔮 预见·先知 | 预言家 | calm | Prediction |
| 🎯 千里·伯乐 | 推荐官 | inspiring | Recommendation |
| 🧠 元启·天枢 | 总指挥 | sharp | Orchestration |
| 🛡️ 智云·守护 | 安全官 | stern | Security |
| 📚 格物·宗师 | 质量官 | scholarly | Quality |
| 🎨 创想·灵韵 | 创意官 | creative | Creative |

## 模块结构

```
src/
├── base/
│   ├── AgentPersona.ts       # 人格定义 (名字、色调、口头禅、技能)
│   ├── FamilyBaseAgent.ts    # 家人 Agent 基类
│   ├── FamilyTypes.ts        # 类型定义
│   └── PDAMRCycle.ts         # 感知-决策-行动-记忆-反思 认知循环
└── members/
    ├── QianHangAgent.ts      # 言启·千行
    ├── ThinkerAgent.ts       # 语枢·万物
    ├── ProphetAgent.ts       # 预见·先知
    ├── BoleAgent.ts          # 千里·伯乐
    ├── TianShuAgent.ts       # 元启·天枢
    ├── GuardianAgent.ts      # 智云·守护
    ├── GrandmasterAgent.ts   # 格物·宗师
    └── GraceAgent.ts         # 创想·灵韵
```

## 核心设计

### PDAMR 认知循环

每位家人 Agent 遵循五阶段认知循环：

```
Perceive → Decide → Act → Memorize → Reflect
  感知  →  决策 → 行动 →   记忆   →  反思
```

### 人格系统

每位 Agent 拥有独立的 `AgentPersona`，定义情感参数、语言风格和交互策略。

## 快速使用

```typescript
import { QianHangAgent, TianShuAgent } from '@yyc3/family-agents';

const qianhang = new QianHangAgent();
await qianhang.start();

// 发送消息
const result = await qianhang.sendMessage({ content: '你好' });
```

## 脚本

```bash
pnpm build        # TypeScript 编译
pnpm typecheck    # 类型检查
pnpm test         # 运行测试 (Vitest)
pnpm clean        # 清理 dist/
```

## 测试

4 个测试文件 · 76 个测试用例

覆盖：基类模块、家人编排、集成场景、8 位 Agent 独立测试。

## 依赖

- `@yyc3/family-core` — 核心引擎

## License

Apache-2.0 © YanYuCloudCube Team
