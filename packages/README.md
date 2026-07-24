# packages — 插件包目录

> 16 个包，通过 `SystemRegistration` 接口统一注册到 Shell

---

## 包依赖拓扑

```
family-core ←── family-agents ←── family-skills
                                     ↓
plugin-llm ←── shell ←─── 全部 plugin-*
```

---

## AI Family 智能体层

| 包 | 说明 | 测试 |
|----|------|------|
| [`family-core/`](./family-core/README.md) | 家族宪章 · 八位家人档案 · 五维/五环 · 标头标尾（唯一真相源） | 540 ✅ |
| [`family-agents/`](./family-agents/README.md) | 8 位家人 Agent · PDAMR 认知环 · 人格引擎 | 76 ✅ |
| [`family-skills/`](./family-skills/README.md) | defineSkill · 9 大技能域 × 48+ 技能 · MCP 桥接 | 121 ✅ |

## 核心外壳层

| 包 | 说明 |
|----|------|
| [`shell/`](./shell/README.md) | EventBus · Storage · WelcomePage · ErrorBoundary · LLM Bridge · 双主题 |

## LLM 适配层

| 包 | 说明 |
|----|------|
| [`plugin-llm/`](./plugin-llm/README.md) | 5 大 Provider · SSE 流式 · AES-256-GCM Key · 模型路由器 |

## 业务引擎层（纯函数引擎 + 测试）

| 包 | 系统名 | 引擎 | 测试 |
|----|--------|------|------|
| [`plugin-target/`](./plugin-target/README.md) | 🎯 目标量化 | TargetEngine（X 公式） | 35 ✅ |
| [`plugin-cost/`](./plugin-cost/README.md) | 💰 成本盈亏 | CostEngine（盈亏平衡） | 30 ✅ |
| [`plugin-marketing/`](./plugin-marketing/README.md) | 🎏 节日营销 | FestivalEngine + LunarEngine | 41 ✅ |
| [`plugin-prompt/`](./plugin-prompt/README.md) | 📝 提示词库 | BusinessPrompts（15+ 模板） | 19 ✅ |

## 智能系统层

| 包 | 系统名 | 说明 |
|----|--------|------|
| [`plugin-ai-family/`](./plugin-ai-family/README.md) | 👨‍👩‍👧‍👦 AI Family | 8 位家人中枢 · 人格条 · 技能面板 |
| [`plugin-ai/`](./plugin-ai/README.md) | 🧠 AI 智能 | AI 建议 · 模型管理 · AI 诊断 |
| [`plugin-business/`](./plugin-business/README.md) | 🏨 业务空间 | 智慧酒店 · 通讯基站 |

## 基础设施层

| 包 | 系统名 | 说明 |
|----|--------|------|
| [`plugin-monitor/`](./plugin-monitor/README.md) | 📊 监控中心 | 实时 Dashboard · 告警 · 巡查 |
| [`plugin-ops/`](./plugin-ops/README.md) | 🔧 运维管理 | 操作中心 · 文件 · 数据库 |
| [`plugin-dev/`](./plugin-dev/README.md) | 🛠️ 开发工具 | Design System · 终端 |
| [`plugin-admin/`](./plugin-admin/README.md) | 🛡️ 系统管理 | 审计 · 设置 · 安全 · PWA |

---

## 包类型说明

| 类型 | 特征 | 包 |
|------|------|-----|
| **引擎型** | 纯函数引擎 + 类型 + 测试 | target, cost, marketing, prompt |
| **界面型** | 页面/组件为主 | monitor, ops, ai, dev, admin, business |
| **混合型** | 引擎 + 界面 | ai-family, llm |
| **智能体型** | Agent 实例 + 认知环 | family-core, family-agents, family-skills |
| **基础设施** | Shell 外壳 | shell |

---

## 共用项速查

### Shell 提供的共享能力

```typescript
// 事件总线 — 跨插件松耦合通信
import { eventBus, Events } from "@yyc3/shell";
eventBus.emit(Events.SYSTEM_NOTIFY, { level: "info", message: "..." });

// 命名空间存储
import { createSystemStorage } from "@yyc3/shell";
const store = createSystemStorage("target");
store.set("lastResult", data);

// LLM 桥接
import { getLLMBridge } from "@yyc3/shell";
const bridge = getLLMBridge();
const resp = await bridge.chat({ messages: [...] });
```

### Family Core 提供的共享数据

```typescript
// 八位家人档案（唯一真相源）
import { 八位家人 } from "@yyc3/family-core";
const qianhang = 八位家人["qianhang"]; // { name, role, color, ... }
```

### Family Skills 提供的技能契约

```typescript
// defineSkill 工厂
import { defineSkill } from "@yyc3/family-skills";
const skill = defineSkill(config, execute, validate?);
```

---

## 开发规范

- 每个包遵循 `SystemRegistration` 接口注册
- 引擎层为纯函数，零 UI 依赖
- 测试文件与 `src/` 同级，命名 `{name}.test.ts`
- 每个包目录下应有 `README.md` 说明文档
- 详见 [开发者文档](../docs/YYC3-团队通用-标准规范/)

---

_言启千行代码 · 语枢万物智能_
