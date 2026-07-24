# @yyc3/plugin-ai — AI 智能

导航分类：**AI 智能**（紫色 `#AA55FF`）

## 包含

| 文件 | 说明 |
|------|------|
| `register.ts` | 系统注册入口 (order:30, 3 菜单, 3 路由) |

## 注册信息

```ts
id: "ai"
menu: AI 决策 / 模型管理 / AI 诊断
命令: AI 智能分析 / 管理模型提供商 / 运行 AI 诊断
```

## Hub 浮窗

```tsx
<AIAssistantHub systemId="ai" title="AI 智能" accentColor="#AA55FF"
  commands={AI_CMDS}
  extraPrompts={[{ id: "ap1", name: "模型专家", prompt: "...", category: "模型" }]} />
```
