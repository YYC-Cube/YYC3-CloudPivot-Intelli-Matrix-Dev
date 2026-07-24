# @yyc3/family-ui

> YYC³ AI Family UI 表现层 — 8 Bindings + 6 React 组件 + 主题系统

## 概述

`family-ui` 是 YYC³ MovPlug-AI 的 UI 表现层，提供 8 个响应式数据绑定 (Binding)、6 个 React 组件、完整的主题系统和本地持久化。基于 React 19 + EventEmitter 构建。

> **注意**: 此包为 `private`，不发布到 npm。

## 模块结构

```
src/
├── app/                          # React 组件
│   ├── AIAssistant.tsx           # AI 助手浮窗 (FAB/最小化/展开/全屏)
│   ├── FamilyChat.tsx            # 家人对话组件
│   ├── FamilyHome.tsx            # 家人主页
│   ├── EmotionRipple.tsx         # 情感涟漪动效
│   ├── AchievementPanel.tsx      # 成就面板
│   ├── ThemeSettings.tsx         # 主题设置
│   └── index.ts
├── family-bindings/              # 响应式数据绑定层 (8 个)
│   ├── FamilyBinding.ts          # 家人总绑定
│   ├── FamilyChatBinding.ts      # 对话绑定
│   ├── FamilyHomeBinding.ts      # 主页绑定
│   ├── AIAssistantBinding.ts     # AI 助手绑定
│   ├── AuthBinding.ts            # 认证绑定 (Token + localStorage)
│   ├── EmotionRippleBinding.ts   # 情感绑定
│   ├── AchievementBinding.ts     # 成就绑定
│   ├── I18nBinding.ts            # 国际化绑定
│   └── index.ts
├── persistence/                  # 本地持久化
│   └── LocalPersister.ts         # localStorage 封装
└── theme/                        # 主题系统
    ├── ThemeManager.ts           # 主题管理器
    ├── ThemeConfig.ts            # 主题配置
    ├── CSSVariables.ts           # CSS 变量生成
    └── index.ts
```

## 核心设计

### Binding 模式

每个 Binding 继承 `EventEmitter`，提供响应式状态管理：

```typescript
const auth = new AuthBinding();
auth.on('state:change', (state) => { /* 响应状态变化 */ });
await auth.login({ email: '...', password: '...' });
```

### 主题系统

支持多主题切换，通过 CSS 变量实现运行时主题注入：

```typescript
const theme = new ThemeManager();
theme.applyTheme('dark');
```

## 快速使用

```tsx
import { AIAssistant } from '@yyc3/family-ui';

function App() {
  return <AIAssistant familyMember="qianhang" />;
}
```

## 脚本

```bash
pnpm dev          # Vite 开发服务器
pnpm build        # TypeScript 编译 + Vite 构建
pnpm typecheck    # 类型检查
pnpm test         # 运行单元测试 (Vitest, node 环境)
pnpm clean        # 清理 dist/
```

### 组件测试

```bash
npx vitest run --config vitest.component.config.ts   # jsdom 环境 React 组件测试
```

## 测试

| 类型 | 文件数 | 测试数 |
|------|--------|--------|
| 单元测试 | 4 | 138 |
| 组件测试 | 1 | 9 |
| **合计** | **5** | **147** |

## 依赖

- `@yyc3/family-core` — 核心引擎
- `@yyc3/family-agents` — Agent 定义
- `react` / `react-dom` — React 19
- `eventemitter3` — 事件系统

## License

Apache-2.0 © YanYuCloudCube Team
