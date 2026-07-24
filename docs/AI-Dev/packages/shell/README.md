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

## 依赖

- `react`, `lucide-react`, `react-router-dom`
