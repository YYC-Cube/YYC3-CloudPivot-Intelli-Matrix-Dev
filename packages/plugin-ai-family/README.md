# @yyc3/plugin-ai-family — AI Family (中枢)

导航分类：**AI Family**（绿色 `#00FF88`）— 中枢系统

## 包含

| 文件 | 说明 |
|------|------|
| `register.ts` | 系统注册入口 (order:40, 5 菜单, 5 路由) |
| `AIAssistantHub.tsx` | AI Family 增强版浮窗 (含 8 位家人人格条) |
| `pages/FamilyHomePage.tsx` | 时钟环家园页 ✓ 真实页面 |
| `pages/FamilyChatPage.tsx` | 交流中心页 ✓ 真实页面 |
| `pages/FamilySettingsPage.tsx` | Family 设置页 ✓ 真实页面 |
| `data.ts` / `mock.ts` / `components.tsx` / `panels.tsx` | 复用自 AIAssistant (见 `docs/AI-Dev/AIAssistant/`) |

## 注册信息

```ts
id: "ai-family"
menu: 家族首页 / 交流中心 / 音乐空间 / 语音系统 / Family 设置
命令: 呼叫千行 / 万物 / 先知 / 伯乐 / 天枢 / 守护 / 宗师 / 灵韵
```

## Hub 浮窗 (增强版)

```tsx
<AIAssistantHub systemId="ai-family" title="AI Family" accentColor="#00FF88"
  commands={FAMILY_CMDS}
  showPersonas
  renderPersonaBar={MyPersonaBar} />
```

## 共用项衔接

| 依赖 | 用途 |
|------|------|
| `@yyc3/shell` (peerDep) | SystemRegistration + EventBus + Storage |
| `@yyc3/family-core` (peerDep) | 家人档案（名称/角色/主题色）唯一真相源 |
| `@yyc3/family-agents` | Agent 实例（通过 skills 间接） |
| `@yyc3/family-skills` | 技能面板展示（63+198 技能） |
| `@yyc3/plugin-prompt` | 人格映射 Prompt |
| `@yyc3/plugin-llm` → `shell` | 间接使用 LLM 进行家人对话 |
