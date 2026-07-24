# @yyc3/shell — 系统外壳

所有子系统共享的基础设施。

## 包含

| 模块 | 说明 |
|------|------|
| `event-bus.ts` | 跨系统事件总线 (10 个预定义事件) |
| `storage.ts` | 命名空间存储 `yyc3:{system}:{key}` |
| `WelcomePage.tsx` | 统一欢迎页 (page/modal 双模式) |
| `AIAssistantHub.tsx` | 通用中枢浮窗 (6 子系统各持一份) |
| `types.ts` | `SystemRegistration` 等接口 |

## 使用

```ts
import { eventBus, Events } from "@yyc3/shell";
eventBus.emit(Events.AI_PERSONA_CHANGED, "thinker");

import { createSystemStorage } from "@yyc3/shell";
const store = createSystemStorage("monitor");
store.set("autoRefresh", true);

import { AIAssistantHub } from "@yyc3/shell";
<AIAssistantHub systemId="monitor" accentColor="#00d4ff" commands={myCommands} />
```

## 共用项衔接

| 依赖方向 | 包 | 引用内容 |
|----------|-----|----------|
| **上游** | `@yyc3/plugin-llm` (peerDep) | `LLMBridge` 消费 LLM Router + KeyManager |
| **下游** | 全部 `plugin-*` | 所有插件通过 shell 注册到系统 |
| **下游** | 全部 `plugin-*` | 通过 `EventBus` / `createSystemStorage` 通信 |

---

_言启千行代码 · 语枢万物智能_
