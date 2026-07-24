# @yyc3/plugin-prompt — 提示词库

15+ 业务 Prompt 模板 + 8 位家人人格映射。引擎型插件，为 AI Family 提供结构化提示词。

---

## 注册信息

| 属性 | 值 |
|------|-----|
| id | `prompt` |
| name | 提示词库 |
| icon | `BookOpen` (lucide) |
| color | `#3399FF` |
| order | 40 |
| 菜单 | Prompt总览 / 成本盈亏 / 节日营销 / 综合诊断 / 全链路 / 人格映射 |

---

## 模块结构

| 文件 | 说明 |
|------|------|
| `business-prompts.ts` | 核心 — 15+ 业务 Prompt 模板 + 家人映射 |
| `types.ts` | 类型定义 — Prompt / 分类 / 人格 ID / 映射关系 |
| `register.ts` | Shell 注册 |
| `index.ts` | 包入口 |

---

## 核心导出

| 导出名 | 类型 | 说明 |
|--------|------|------|
| `BUSINESS_PROMPTS` | `BusinessPrompt[]` | 15+ 业务 Prompt 模板（成本/营销/诊断/全链路） |
| `PERSONA_PROMPT_MAP` | `Record<PersonaId, PersonaMapping>` | 8 位家人 → Prompt 风格映射 |

### Prompt 分类

| 分类 | 说明 |
|------|------|
| 成本盈亏 | 引用 `@yyc3/plugin-cost` 引擎结果 |
| 节日营销 | 引用 `@yyc3/plugin-marketing` 日历数据 |
| 综合诊断 | 多维度交叉分析 |
| 全链路 | 端到端业务流水线 |

---

## 使用示例

```typescript
import { BUSINESS_PROMPTS, PERSONA_PROMPT_MAP } from "@yyc3/plugin-prompt";

const costPrompt = BUSINESS_PROMPTS.find(p => p.category === "cost");
const thinkerStyle = PERSONA_PROMPT_MAP["thinker"]; // 思辨家人风格
```

---

## 共用项衔接

| 依赖 | 用途 |
|------|------|
| `@yyc3/shell` (peerDep) | SystemRegistration 注册 |
| `@yyc3/plugin-target` | 目标 X 值 → 诊断 Prompt |
| `@yyc3/plugin-cost` | 成本数据 → 成本 Prompt |
| `@yyc3/plugin-marketing` | 节日日历 → 营销 Prompt |
| `@yyc3/plugin-ai-family` | 人格映射 → 家人语气 |

---

## 测试

```bash
pnpm --filter @yyc3/plugin-prompt test
# → business-prompts.test.ts · 19 Tests
```
