# @yyc3/ai-assistant

> YYC³ AI 助理浮窗 — 模块化、可拖拽、i18n 就绪的共用包

`@yyc3/ai-assistant` 是 YYC³ CloudPivot Intelli-Matrix 的 AI 助理浮窗共用包，可被
任意 React 19+ 项目复用。它将原 1100+ 行单文件 `AIAssistant.tsx` 拆解为模块化、
可扩展、可国际化的标准结构。

## ✨ 核心特性

| 特性 | 描述 |
|------|------|
| 🧩 **模块化** | 4 大 Tab（Chat / Commands / Prompts / Settings）+ 6 大子组件 |
| 🌐 **i18n 就绪** | 内置 zh-CN / en-US，可桥接 `@yyc3/i18n-core` 实现全局语言切换 |
| 🪝 **Hook 拆分** | `useChat` / `useAIConfig` / `useFloatingPanel` / `useDraggable` 完全解耦 |
| 🔌 **Stub 桥接** | `useModelProvider` / `useSettingsStore` 提供默认 stub，外部项目可替换 |
| 🎨 **Radix UI** | 基于 Radix UI primitives，符合 shadcn/ui 规范 |
| 📱 **响应式** | 鼠标 + 触摸双拖拽、移动端全屏、桌面端浮窗三种模式 |
| 🎯 **TypeScript** | 完整类型定义，IDE 自动补全 |
| 🪶 **零硬编码** | 所有 UI 字符串抽取到 i18n key，无中文耦合 |

## 📦 安装

### 在 YYC3-CloudPivot-Intelli-Matrix-Dev workspace 内（推荐）

```bash
# pnpm-workspace.yaml 已包含 packages/*
pnpm install
```

### 外部项目（如 Intelli-Matrix）

```jsonc
// package.json
{
  "dependencies": {
    "@yyc3/ai-assistant": "workspace:*"  // 或 "^0.1.0" 从 npm 安装
  }
}
```

## 🚀 快速使用

### 1. 最简用法（独立运行）

```tsx
import { AIAssistant } from "@yyc3/ai-assistant";

export function App() {
  return (
    <>
      <YourApp />
      <AIAssistant />
    </>
  );
}
```

默认使用内置的 `zh-CN` 字典，localStorage 自动持久化语言偏好。

### 2. 接入 @yyc3/i18n-core（推荐，主项目语言切换自动同步）

```tsx
import { AIAssistant, createI18nCoreAdapter } from "@yyc3/ai-assistant";
import { i18n } from "@yyc3/i18n-core";

export function App() {
  return <AIAssistant i18nEngine={createI18nCoreAdapter(i18n)} />;
}
```

适配器会：

- 使用 i18n-core 的翻译结果（支持 ICU、缓存、AI 翻译、插件链）
- 订阅 i18n-core 的 locale 变更，自动同步 UI
- 在 i18n-core 未注册 ai-assistant 命名空间时回退到内置字典

### 3. 手动注入自定义 i18n 引擎

```tsx
import { AIAssistant, type AIAssistantI18nEngine } from "@yyc3/ai-assistant";

const customEngine: AIAssistantI18nEngine = {
  locale: "zh-CN",
  t: (key, vars) => myTranslateFunction(key, vars),
  subscribe: (listener) => myLocaleBus.subscribe(listener)
};

export function App() {
  return <AIAssistant i18nEngine={customEngine} />;
}
```

## 🔧 替换 Stub（生产环境集成）

包内提供两个 stub，外部项目可通过 vite alias / tsconfig paths 覆盖：

| Stub 文件 | 用途 | 替换示例 |
|-----------|------|----------|
| `hooks/stubs/useModelProvider.ts` | 提供可用模型列表 | 接入 Ollama API / OpenAI API |
| `hooks/stubs/useSettingsStore.ts` | 持久化配置 | 接入 zustand / electron-store |

### Vite 覆盖示例

```ts
// vite.config.ts
resolve: {
  alias: {
    "@yyc3/ai-assistant/hooks/stubs/useModelProvider":
      path.resolve(__dirname, "src/hooks/useModelProvider.ts"),
    "@yyc3/ai-assistant/hooks/stubs/useSettingsStore":
      path.resolve(__dirname, "src/hooks/useSettingsStore.ts")
  }
}
```

## 📚 API

### 组件

#### `<AIAssistant />`

| Prop | 类型 | 默认 | 说明 |
|------|------|------|------|
| `isMobile` | `boolean` | `false` | 移动端模式（全屏 + 大按钮） |
| `i18nEngine` | `AIAssistantI18nEngine` | `undefined` | 外部 i18n 引擎（兼容 i18n-core） |

#### `<FloatingButton />` / `<PanelHeader />` / `<ChatPanel />` / `<CommandsPanel />` / `<PromptsPanel />` / `<SettingsPanel />`

可单独引入并组合使用，详见 TypeScript 类型定义。

### Hooks

| Hook | 描述 |
|------|------|
| `useI18n()` | 消费 i18n 上下文，返回 `{ locale, setLocale, t, locales }` |
| `useChat()` | 聊天消息管理（含 mock 响应引擎，生产环境应替换为真实 LLM 调用） |
| `useAIConfig()` | API Key / 模型 / 温度 / Top-P / MaxTokens 状态管理 |
| `useFloatingPanel()` | 浮窗开关 / 最大化 / Tab 切换 |
| `useDraggable()` | 鼠标 + 触摸拖拽（含边界 clamp） |

### 常量

| 导出 | 描述 |
|------|------|
| `SYSTEM_COMMANDS` | 10 个内置系统命令（cmd-01 ~ cmd-10） |
| `CMD_CATEGORIES` | 6 个命令分类（all / cluster / model / data / security / monitor） |
| `PROMPT_PRESETS` | 5 个系统提示词预设（运维/模型/数据/安全/通用） |

### i18n Key 命名空间

```text
brand.*              # 品牌相关
panel.*              # 浮窗头部
tabs.*               # Tab 标签
chat.*               # 聊天相关
prompts.*            # 提示词面板
settings.*           # 设置面板
commands.categories.*  # 命令分类
commands.items.<id>.{label,desc}  # 命令项
promptsData.<id>.{name,category}  # 提示词预设
```

## 🌍 国际化扩展

### 添加新语言

```ts
// src/i18n/ja-JP.ts
import type { TranslationKeys } from "./zh-CN";

export const jaJP: TranslationKeys = {
  // ... 翻译为日语
};
```

然后在 `hooks/useI18n.tsx` 的 `localeMap` 注册即可。

### 通过 i18n-core 注册 ai-assistant 命名空间

```ts
import { i18n } from "@yyc3/i18n-core";

// 在 i18n-core 的语言包中添加 ai-assistant.* 命名空间
// 然后所有 t("brand.name") 等调用会自动走 i18n-core
```

## 🏗️ 架构

```
ai-assistant/
├── src/
│   ├── AIAssistant.tsx           # 主组件（含 I18nProvider 包裹）
│   ├── index.ts                  # 包导出入口
│   ├── types.ts                  # 公共类型
│   ├── i18n/
│   │   ├── zh-CN.ts              # 简体中文（默认）
│   │   ├── en-US.ts              # 英文
│   │   ├── adapter.ts            # i18n-core 桥接适配器
│   │   └── index.ts
│   ├── hooks/
│   │   ├── useI18n.tsx           # i18n Provider + Hook
│   │   ├── useChat.ts            # 聊天消息 Hook
│   │   ├── useAIConfig.ts        # AI 配置 Hook
│   │   ├── useFloatingPanel.ts   # 浮窗状态 Hook
│   │   ├── useDraggable.ts       # 拖拽 Hook
│   │   ├── stubs/                # 默认 stub（可被外部覆盖）
│   │   │   ├── useModelProvider.ts
│   │   │   └── useSettingsStore.ts
│   │   └── index.ts
│   ├── constants/
│   │   ├── commands.ts           # 10 个系统命令
│   │   ├── prompts.ts            # 5 个提示词预设
│   │   └── index.ts
│   ├── components/
│   │   ├── FloatingButton.tsx
│   │   ├── PanelHeader.tsx
│   │   ├── ChatPanel/            # ChatInput / ChatMessage / TypingIndicator
│   │   ├── CommandsPanel/        # CommandCard
│   │   ├── PromptsPanel/         # PromptCard
│   │   ├── SettingsPanel/        # ApiKeyInput / ModelSelector / ParameterSlider
│   │   └── index.ts
│   ├── ui/                       # Radix UI 原子组件
│   │   ├── slider.tsx
│   │   ├── tabs.tsx
│   │   ├── utils.ts
│   │   └── index.ts
│   └── assets/
│       └── YYC3LogoSvg.tsx
├── package.json
├── tsconfig.json
├── tsup.config.ts                # 构建配置（ESM + dts）
├── vitest.config.ts
└── README.md
```

## 🧪 开发

```bash
# 类型检查
pnpm typecheck

# 构建（输出 dist/）
pnpm build

# 测试
pnpm test
```

## 📄 License

MIT © YanYuCloudCube Team
