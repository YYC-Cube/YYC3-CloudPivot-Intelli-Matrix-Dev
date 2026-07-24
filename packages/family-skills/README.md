# @yyc3/family-skills — 技能生态（MCP 兼容）

YYC³ AI Family 的技能注册与执行层。提供 `defineSkill()` 工厂函数、FamilySkillRegistry 注册中心、MCP（Model Context Protocol）桥接器，以及 **9 大技能域 × 48+ 基础技能** + **8 位家人专属技能**。

> 注：生产构建位于 `docs/packages/family-skills/`（含 NVIDIA 桥接 catalog · 121 tests），本目录为 monorepo 引擎层的源码镜像。

---

## 架构定位

```
family-core               ← 家人 ID 映射（peerDep）
family-agents             ← Agent 实例（peerDep）
    ↓
family-skills（本包）      ← 技能注册 + 执行 + MCP 桥接
    ↓
plugin-ai-family           ← UI 层展示技能面板
```

---

## 模块结构

### registry/ — 注册中心

| 文件 | 说明 |
|------|------|
| `FamilySkillRegistry.ts` | 技能注册中心 — 注册 / 搜索 / 导出 / 热更新 |
| `SkillManifest.ts` | `defineSkill()` 工厂函数 — 声明式技能定义 |
| `MCPSkillBridge.ts` | MCP 协议桥接 — 对接外部 MCP Server |

### skills/ — 9 大技能域

| 目录 | 技能数 | 说明 |
|------|--------|------|
| `nlu/` | 5 | 情感检测 · 多语言 NLU · 知识图谱 · 意图解析 · 情感分析 |
| `orchestration/` | 6 | 任务路由 · 委托 · 工作流编排 · 冲突解决 · 资源优化 · 人事管理 |
| `prediction/` | 4 | LSTM 预测 · 异常检测 · 趋势预报 · 概率估计 |
| `recommendation/` | 4 | 冷启动 · 个性化渲染 · 协同过滤 · 多样性排序 |
| `analysis/` | 4 | 深度分析 · 数据洞察 · 对比分析 · 数据分析 |
| `security/` | 4 | 自动修复 · 威胁响应 · 合规检查 · 安全审计 |
| `quality/` | 5 | 黄金标准 · 代码审查 · 测试生成 · 文档礼仪 · 流水线 |
| `creative/` | 3 | 风格迁移 · 创意生成 · 设计建议 |
| `exclusive/family/` | 16 | 8 位家人各自 2 个专属技能（共 16 个） |

---

## 核心导出

### 注册中心

| 导出名 | 类型 | 说明 |
|--------|------|------|
| `FamilySkillRegistry` | class | 全局注册中心单例 |
| `defineSkill` | fn | 声明式技能工厂（config + execute + validate?） |
| `MCPSkillBridge` | class | MCP 协议适配器 |

### 技能快捷导出

```typescript
// 按域导入
import { nluSkills, predictionSkills, creativeSkills } from "@yyc3/family-skills";

// 按技能导入
import { intentParseSkill, lstmPredictionSkill, codeReviewSkill } from "@yyc3/family-skills";

// 家人专属技能
import { allExclusiveSkills } from "@yyc3/family-skills";
```

---

## 使用示例

### defineSkill 工厂

```typescript
import { defineSkill } from "@yyc3/family-skills";

const mySkill = defineSkill(
  { id: "my-skill", name: "示例", family: "thinker", version: "1.0.0", tags: [] },
  async (input, ctx) => ({ result: "done" }),
  async (input) => input !== null,  // 可选验证
);
```

### 注册中心

```typescript
import { FamilySkillRegistry } from "@yyc3/family-skills";

const registry = FamilySkillRegistry.getInstance();
registry.register(mySkill);
const found = registry.search({ tags: ["data"] });
```

---

## 共用项衔接

| 依赖方向 | 包 | 引用内容 |
|----------|-----|----------|
| **上游** | `@yyc3/family-core` | 家人 ID 映射 |
| **上游** | `@yyc3/family-agents` | Agent 实例（技能执行宿主） |
| **下游** | `@yyc3/plugin-ai-family` | UI 层技能面板展示 |

---

## 测试

```bash
pnpm --filter @yyc3/family-skills test
# → 7 Test Files · 121 Tests · 全绿
```

---

_一技一能一世界 · 一家一人一天地_
