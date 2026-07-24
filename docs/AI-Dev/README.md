# YYC³ Cloud Intelli-Matrix · 架构参考

> AI Family 作为中枢，统一协同所有系统

## 说明文档索引

| 目录 | README |
|------|--------|
| 顶层 | [`./README.md`](./README.md) |
| 架构规范 | [`./ARCHITECTURE.md`](./ARCHITECTURE.md) |
| 复用浮窗组件 | [`./AIAssistant/README.md`](./AIAssistant/README.md) |
| | |
| **外壳层** | |
| `packages/shell/` | [`./packages/shell/README.md`](./packages/shell/README.md) |
| | |
| **子系统插件** | |
| `packages/plugin-monitor/` | [`./packages/plugin-monitor/README.md`](./packages/plugin-monitor/README.md) |
| `packages/plugin-ops/` | [`./packages/plugin-ops/README.md`](./packages/plugin-ops/README.md) |
| `packages/plugin-ai/` | [`./packages/plugin-ai/README.md`](./packages/plugin-ai/README.md) |
| `packages/plugin-ai-family/` | [`./packages/plugin-ai-family/README.md`](./packages/plugin-ai-family/README.md) |
| `packages/plugin-dev/` | [`./packages/plugin-dev/README.md`](./packages/plugin-dev/README.md) |
| `packages/plugin-admin/` | [`./packages/plugin-admin/README.md`](./packages/plugin-admin/README.md) |
| | |
| **独立应用** | |
| `apps/standalone-monitor/` | [`./apps/standalone-monitor/README.md`](./apps/standalone-monitor/README.md) |
| `apps/standalone-ops/` | [`./apps/standalone-ops/README.md`](./apps/standalone-ops/README.md) |
| `apps/standalone-ai/` | [`./apps/standalone-ai/README.md`](./apps/standalone-ai/README.md) |
| `apps/standalone-ai-family/` | [`./apps/standalone-ai-family/README.md`](./apps/standalone-ai-family/README.md) |
| `apps/standalone-dev/` | [`./apps/standalone-dev/README.md`](./apps/standalone-dev/README.md) |
| `apps/standalone-admin/` | [`./apps/standalone-admin/README.md`](./apps/standalone-admin/README.md) |

## 目录结构

```
docs/AI-Dev/
├── ARCHITECTURE.md                 ← 架构规范 (变量词库/路由接口/存储架构/事件总线)
├── AIAssistant/                    ← 原 AI 浮窗组件 (独立可复用, v3.0)
│   ├── types.ts / data.ts / mock.ts / components.tsx / panels.tsx
│   ├── AIAssistant.tsx (260 行主组件)
│   └── GUIDE.md / validate.js
│
├── packages/                       ← 按导航分类拆分的包结构 (Monorepo 示例)
│   ├── shell/                      ← 系统外壳层
│   │   ├── src/
│   │   │   ├── event-bus.ts        ← 跨系统事件总线
│   │   │   ├── storage.ts          ← 命名空间存储
│   │   │   ├── WelcomePage.tsx     ← 统一欢迎页
│   │   │   └── types.ts            ← 系统注册接口
│   │   └── package.json
│   │
│   └── plugin-ai-family/           ← AI Family 子系统
│       ├── src/
│       │   ├── AIAssistantHub.tsx   ← 中枢浮窗 (Hub 版本)
│       │   ├── register.ts          ← 系统注册入口
│       │   └── index.ts
│       └── package.json
│
├── apps/                           ← 应用示例
│   └── standalone-ai-family/       ← AI Family 独立版
│       ├── src/App.tsx
│       └── package.json
│
└── pnpm-workspace.yaml             ← Monorepo 配置
```

## 关键文件说明

| 文件 | 说明 |
|------|------|
| `ARCHITECTURE.md` | 变量词库、路由接口、存储架构、事件总线的完整规范 |
| `packages/shell/src/event-bus.ts` | 跨系统通信核心，预定义了 `ai:*` `hub:*` `system:*` `shell:*` 事件 |
| `packages/shell/src/storage.ts` | 按 `yyc3:{systemId}:` 前缀隔离的命名空间存储 |
| `packages/shell/src/WelcomePage.tsx` | 统一欢迎页，支持 page/modal 双模式 |
| `packages/plugin-ai-family/src/AIAssistantHub.tsx` | 改造后的 AI 浮窗：接收外部 Hub 命令，使用全局事件总线 |
| `packages/plugin-ai-family/src/register.ts` | 按 `SystemRegistration` 接口注册子系统 |
| `apps/standalone-ai-family/src/App.tsx` | AI Family 独立运行示例 |

## 快速理解

```
传统单体          →  AI Family 中枢架构
─────────────────────────────────────
全局浮窗           →  AI Family Hub 浮窗
导航菜单           →  SystemRegistration.menuItems
路由配置           →  SystemRegistration.routes
localStorage 混乱  →  createSystemStorage("systemId")
跨组件耦合调用     →  eventBus.emit("ai:ask")
首屏空白           →  WelcomePage
```

## 迁移路线

```
Step 1: ✅ 架构规范 (已完成)
  docs/AI-Dev/ARCHITECTURE.md

Step 2: ✅ Shell 核心 (已完成)
  @yyc3/shell → 事件总线 + 存储 + 欢迎页

Step 3: ✅ AI Family Hub (已完成)
  @yyc3/plugin-ai-family → 中枢浮窗 + 注册入口

Step 4: ⏳ 实际项目改造
  将 src/app/ 按 6 个导航分类拆分到 packages/plugin-*
  每个插件实现 register() 函数
  主应用通过 buildApp([...plugins]) 组合

Step 5: ⏳ 构建独立版
  apps/full/               ← 合并版
  apps/standalone-monitor/ ← 独立监控
  apps/standalone-ai/      ← 独立 AI
```
