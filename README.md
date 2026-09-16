<div align="center">

<img src="./public/yyc3-Family.png" alt="YYC³ AI Family"/>

# YYC³ CloudPivot Intelli-Matrix

### _言启象限 · 语枢未来 · 云枢智矩_

**_Words Initiate Quadrants · Language Pivots the Future_**

_云枢万象 · 智矩深栈 · 八位家人协同 · 全链路闭环_

---

<!-- 徽章系统 -->
[![CI/CD](https://github.com/YYC-Cube/YYC3-CloudPivot-Intelli-Matrix-Dev/actions/workflows/ai-eco-ci.yml/badge.svg)](https://github.com/YYC-Cube/YYC3-CloudPivot-Intelli-Matrix-Dev/actions/workflows/ai-eco-ci.yml)
![Status](https://img.shields.io/badge/Status-Phase%204%20%F0%9F%94%A8%20AI%20Family%20%E6%99%BA%E8%83%BD%E4%BD%93-00FF88?style=for-the-badge&logoColor=white)
![Version](https://img.shields.io/badge/Version-v1.4.0-00d4ff?style=for-the-badge)
![License](https://img.shields.io/badge/License-Apache--2.0-FF6600?style=for-the-badge)

![TypeScript](https://img.shields.io/badge/TypeScript-5.7%2B-3178C6?style=flat-square&logo=typescript&logoColor=white)
![React](https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react&logoColor=black)
![Vite](https://img.shields.io/badge/Vite-6-646CFF?style=flat-square&logo=vite&logoColor=white)
![Vitest](https://img.shields.io/badge/Vitest-5.0-6E9F18?style=flat-square&logo=vitest&logoColor=white)
![pnpm](https://img.shields.io/badge/pnpm-11-F69220?style=flat-square&logo=pnpm&logoColor=white)
![Node](https://img.shields.io/badge/Node-22%2B-339933?style=flat-square&logo=nodedotjs&logoColor=white)
![Tailwind](https://img.shields.io/badge/Tailwind-4-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white)
![Playwright](https://img.shields.io/badge/Playwright-E2E-2EAD33?style=flat-square&logo=playwright&logoColor=white)

![Tests](https://img.shields.io/badge/Tests-257%20%E2%9C%85%20%7C%200%20%E2%9D%8C-00FF88?style=flat-square)
![Type Check](https://img.shields.io/badge/tsc%20--noEmit-0%20errors-00FF88?style=flat-square)
![Monorepo](https://img.shields.io/badge/Monorepo-30%20modules-AA55FF?style=flat-square)
![Apps](https://img.shields.io/badge/Apps-8%20standalone-C9A96E?style=flat-square)
![E2E](https://img.shields.io/badge/E2E-Playwright-2EAD33?style=flat-square)
![AI Family](https://img.shields.io/badge/AI%20Family-8%20%E5%AE%B6%E4%BA%BA%20%7C%2080%2B261%20%E6%8A%80%E8%83%BD-C9A96E?style=flat-square)

<!-- 五高徽章 -->
![高可用](https://img.shields.io/badge/%E4%BA%94%E9%AB%98-%E9%AB%98%E5%8F%AF%E7%94%A8-00FF88?style=flat-square)
![高性能](https://img.shields.io/badge/%E4%BA%94%E9%AB%98-%E9%AB%98%E6%80%A7%E8%83%BD-00d4ff?style=flat-square)
![高安全](https://img.shields.io/badge/%E4%BA%94%E9%AB%98-%E9%AB%98%E5%AE%89%E5%85%A8-FF6600?style=flat-square)
![高扩展](https://img.shields.io/badge/%E4%BA%94%E9%AB%98-%E9%AB%98%E6%89%A9%E5%B1%95-AA55FF?style=flat-square)
![高智能](https://img.shields.io/badge/%E4%BA%94%E9%AB%98-%E9%AB%98%E6%99%BA%E8%83%BD-C9A96E?style=flat-square)

</div>

---

## 一、系统全景

**YYC³ CloudPivot Intelli-Matrix**（云枢智矩）是一个基于 **Shell + 插件体系 + AI Family 智能体层** 的全链路智能应用开发工程。以 **八位家人** 为认知中枢，统一调度 7 大子系统、4 大业务引擎、5 大 LLM Provider，实现从感知到决策到行动的全闭环。

### 核心理念

> **_云枢万象 · 智矩深栈 · 八位家人协同_** — AI Family 中枢 × PDAMR 认知环 × 插件化架构 × 纯函数引擎

```
┌─────────────────────────────────────────────────────────────────────┐
│                     AI Family 智能体中枢层                           │
│                                                                     │
│    千航·引路人  │  思辨·智库  │  预见·先知  │  千里·伯乐             │
│    元启·天枢    │  守望·哨兵  │  方圆·宗师  │  语枢·万物             │
│                                                                     │
│    PDAMR 认知环: Perceive → Decide → Act → Memory → Reflect         │
└──────────────────────────────┬──────────────────────────────────────┘
                               │ EventBus + LLMBridge
           ┌───────────────────┼───────────────────┐
           │                   │                   │
    ┌──────▼──────┐  ┌────────▼────────┐  ┌───────▼────────────────┐
    │  7 大子系统  │  │  4 大业务引擎    │  │    LLM 适配层           │
    │  Monitor     │  │  TargetEngine   │  │  OpenAI · Claude        │
    │  Ops · Admin │  │  CostEngine     │  │  Gemini · Ollama        │
    │  AI · Dev    │  │  FestivalEngine │  │  DeepSeek · Azure       │
    │  Business    │  │  PromptEngine   │  │  SSE 流式 · AES-256     │
    └─────────────┘  └─────────────────┘  └────────────────────────┘
           │                   │                   │
    ┌──────▼───────────────────▼───────────────────▼────────────────┐
    │                   Shell 核心外壳层                             │
    │   Registry · EventBus · Storage · ErrorBoundary · Theme       │
    └───────────────────────────────────────────────────────────────┘
```

---

## 二、可视化架构

### 2.1 分层架构图

```
╔═══════════════════════════════════════════════════════════════════════╗
║                      👤 用户交互层                                      ║
║      WelcomePage · AIAssistantHub · 各系统独立页面 · FamilyChat        ║
╠═══════════════════════════════════════════════════════════════════════╣
║                      🧭 路由层                                          ║
║          React Router · 懒加载 · 系统级路由前缀                          ║
╠═══════════════════════════════════════════════════════════════════════╣
║                   🏛️ Shell 核心外壳层                                   ║
║  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌────────┐      ║
║  │ 注册中心  │ │ 事件总线  │ │ 存储工厂  │ │ 错误边界  │ │ 双主题  │      ║
║  │ Registry │ │ EventBus │ │ Storage  │ │ ErrorBnd │ │ Theme  │      ║
║  └──────────┘ └──────────┘ └──────────┘ └──────────┘ └────────┘      ║
╠═══════════════════════════════════════════════════════════════════════╣
║                   🧠 AI Family 智能体层                                 ║
║  ┌───────────┐ ┌────────────┐ ┌─────────────┐ ┌──────────────────┐   ║
║  │family-core│ │family-skills│ │family-agents│ │  plugin-ai-family│   ║
║  │ 家族宪章   │ │ 技能契约    │ │ 8 Agent 实例 │ │   AI Family UI   │   ║
║  │ 五维五环   │ │ defineSkill │ │ PDAMR 环    │ │  4 页面 + 数据层  │   ║
║  └───────────┘ └────────────┘ └─────────────┘ └──────────────────┘   ║
╠═══════════════════════════════════════════════════════════════════════╣
║                   🔌 插件层（12 个插件包）                               ║
║  ┌─────────┐┌─────────┐┌─────────┐┌─────────┐┌─────────┐            ║
║  │🏨business││🎯target ││💰cost   ││🎏market ││📝prompt │            ║
║  └─────────┘└─────────┘└─────────┘└─────────┘└─────────┘            ║
║  ┌─────────┐┌─────────┐┌─────────┐┌─────────┐┌─────────┐            ║
║  │monitor││🔧  ops  ││🧠  ai   ││🛠️  dev  ││🛡️ admin │            ║
║  └─────────┘└─────────┘└─────────┘└─────────┘└─────────┘            ║
║  ┌─────────┐┌─────────┐                                         ║
║  │� llm   ││🤖 a2a   │                                         ║
║  └─────────┘└─────────┘                                         ║
╠═══════════════════════════════════════════════════════════════════════╣
║                   ⚙️ 引擎层（纯函数计算）                                ║
║   TargetEngine · CostEngine · FestivalEngine · LunarEngine            ║
║   LLMBridge · FamilySkillRegistry · MCPSkillBridge                   ║
╠═══════════════════════════════════════════════════════════════════════╣
║                   🏗️ 基础设施层                                          ║
║   TypeScript strict · Vitest · pnpm workspace · Tailwind CSS 4        ║
║   React 19 · Vite 6 · Playwright E2E · Node ≥ 20                     ║
╚═══════════════════════════════════════════════════════════════════════╝
```

### 2.2 插件全景矩阵

| 包 | 类型 | 系统名 | 色值 | 引擎 / 核心 | 测试 | 状态 |
| ---- | ------ | -------- | ------ | ------------- | ------ | ------ |
| `shell` | 核心外壳 | 系统外壳 | — | EventBus + Storage | 67 | ✅ 稳定 |
| `family-core` | 智能体核心 | 家族宪章 | `#00FF88` | 五维五环 + 标头标尾 | 540 | ✅ 稳定 |
| `family-skills` | 智能体核心 | 技能契约 | `#00d4ff` | defineSkill + MCP 桥接 | 121 | ✅ 稳定 |
| `family-agents` | 智能体核心 | 家人 Agent | `#AA55FF` | PDAMR 认知环 | 76 | ✅ 稳定 |
| `family-ui` | UI 层 | 家人交互 | — | 语音 + 主题 + 活动中心 | 39 | ✅ 稳定 |
| `a2a-adapter` | 协议适配 | Agent 通信 | — | A2A Protocol | 23 | ✅ 稳定 |
| `plugin-ai-family` | 界面型 | AI Family | `#00FF88` | — | — | ✅ 95% |
| `plugin-target` | 引擎型 | 目标量化 | `#00FF88` | TargetEngine | 35 | ✅ 稳定 |
| `plugin-cost` | 引擎型 | 成本盈亏 | `#FF6600` | CostEngine | 30 | ✅ 稳定 |
| `plugin-marketing` | 引擎型 | 节日营销 | `#AA55FF` | FestivalEngine | 41 | ✅ 稳定 |
| `plugin-prompt` | 引擎型 | 提示词库 | `#3399FF` | BusinessPrompts | 19 | ✅ 稳定 |
| `plugin-llm` | 混合型 | LLM 适配 | `#00d4ff` | LLMBridge + AES-256 | 5 | ✅ 稳定 |
| `plugin-monitor` | 界面型 | 监控中心 | `#00d4ff` | — | — | ⬜ 基础 |
| `plugin-ops` | 界面型 | 运维管理 | `#FF6600` | — | — | ⬜ 基础 |
| `plugin-ai` | 界面型 | AI 智能 | `#AA55FF` | — | — | ⬜ 基础 |
| `plugin-business` | 界面型 | 业务看板 | `#14B8A6` | — | — | ⬜ 基础 |
| `plugin-dev` | 界面型 | 开发工具 | `#E8E8E8` | — | — | ⬜ 基础 |
| `plugin-admin` | 界面型 | 系统管理 | `#FFDD00` | — | — | ⬜ 基础 |
| **合计** | — | — | — | — | **996** | ✅ 全绿 |

---

## 三、快速开始

### 3.1 环境要求

| 工具 | 版本 | 说明 |
| ------ | ------ | ------ |
| Node.js | ≥ 20.0.0 | 推荐 LTS |
| pnpm | ≥ 9.0.0 | 禁止 npm/yarn |
| Git | ≥ 2.40 | 版本控制 |

### 3.2 安装与验证

```bash
git clone <repo-url> YYC3-CloudPivot-Intelli-Matrix-Dev
cd YYC3-CloudPivot-Intelli-Matrix-Dev

pnpm install                    # 安装依赖 (Node 22+ / pnpm 11)
pnpm type-check                 # TypeScript 零错误 ✅
pnpm lint                       # ESLint (0 errors) ✅
pnpm test                       # 根套件 257 通过 ✅
pnpm audit                      # 依赖漏洞 0 ✅
npx playwright test              # E2E 测试（Playwright Chromium）
```

### 3.3 启动应用

```bash
# Business 独立应用（酒店 · 通讯基站）
cd apps/standalone-business && pnpm install && pnpm dev
# → http://localhost:3118

# AI Family 独立应用（8位家人中枢）
cd apps/standalone-ai-family && pnpm dev

# 合并版全量应用
cd apps/full && pnpm dev
```

---

## 四、Monorepo 结构

```
YYC3-CloudPivot-Intelli-Matrix-Dev/
├── 📦 packages/                      ← 16 个插件包 + 智能体核心
│   ├── shell/                        ← 核心外壳（EventBus + Storage + Theme）
│   ├── family-core/                  ← 家族宪章（五维五环 + 标头标尾）
│   ├── family-agents/                ← 8 位家人 Agent（PDAMR 认知环）
│   ├── family-skills/                ← 技能契约（defineSkill + MCP 桥接）
│   ├── plugin-llm/                   ← LLM 适配层（5 Provider + AES-256 + SSE）
│   ├── plugin-ai-family/             ← AI Family UI（4 页面 + 数据层）
│   ├── plugin-target/                ← 目标量化引擎（X 公式）
│   ├── plugin-cost/                  ← 成本盈亏引擎
│   ├── plugin-marketing/             ← 节日营销引擎（农历 + 双引擎）
│   ├── plugin-prompt/                ← AI 提示词库（15+ Prompt）
│   ├── plugin-business/              ← 业务看板（酒店 · 通讯基站）
│   ├── plugin-monitor/               ← 监控中心
│   ├── plugin-ops/                   ← 运维管理
│   ├── plugin-ai/                    ← AI 智能
│   ├── plugin-dev/                   ← 开发工具
│   └── plugin-admin/                 ← 系统管理
│
├── 📚 docs/packages/                  ← 6 个文档级核心包
│   ├── family-core/                  ← 完整智能体引擎（model/orchestration/security）
│   ├── family-skills/                ← 技能注册 + NVIDIA 桥接（198 技能）
│   ├── family-agents/                ← 8 Agent 实例 + 工作流编排
│   ├── family-ui/                    ← 交互层（语音 + 主题 + i18n + 绑定）
│   ├── a2a-adapter/                  ← Agent-to-Agent 通信协议
│   └── ai-assistant/                 ← 独立 AI 助手组件库
│
├── 📱 apps/                           ← 8 个独立应用
│   ├── full/                         ← 合并版（全系统全开）
│   ├── standalone-ai-family/         ← AI Family 独立版
│   ├── standalone-business/          ← 业务看板独立版
│   ├── standalone-monitor/
│   ├── standalone-ops/
│   ├── standalone-ai/
│   ├── standalone-dev/
│   └── standalone-admin/
│
├── 📖 docs/                           ← 全量文档
│   ├── AI-FAmily-Agent-家人档案/     ← 八位家人档案（10 篇）
│   ├── YYC3-团队通用-标准规范/        ← 团队标准 + 开发者文档
│   ├── YYC3-项目架构-设计总纲.md      ← 架构规范
│   └── ...                           ← 设计规范 · 生产部署 · 任务看板
│
├── 🖼️ public/                         ← 静态资源（多端图标）
├── ⚙️ .github/workflows/              ← CI/CD 质量门禁
├── tsconfig.json                     ← TypeScript 配置（strict + 别名）
├── vitest.config.ts                  ← 测试配置（jsdom + 别名）
└── package.json                      ← 工作区根配置
```

---

## 五、核心机制

### 5.1 SystemRegistration 接口

所有子系统通过统一接口注册到 Shell：

```typescript
interface SystemRegistration {
  id: string;              // 唯一标识
  name: string;            // 显示名称
  icon: React.ElementType; // lucide-react 图标
  color: string;           // 主题色 HEX
  order: number;           // 侧边栏排序
  menuItems: MenuItem[];   // 菜单项
  routes: RouteObject[];   // 路由配置
  hubCommands?: HubCommand[]; // Hub 浮窗命令
}
```

### 5.2 EventBus 事件总线

跨插件包松耦合通信：

```typescript
import { eventBus } from "@yyc3/shell";

// 监听
eventBus.on("ai:response", (data) => { ... });

// 发出
eventBus.emit("target:calc-completed", { annualTarget: 702 });
```

**预定义事件命名空间**：`ai:*` · `hub:*` · `system:*` · `shell:*` · `target:*`

### 5.3 存储命名空间

```typescript
import { createSystemStorage } from "@yyc3/shell";

const storage = createSystemStorage("target");
storage.set("lastResult", data);
// Key: yyc3:target:lastResult ← 自动加前缀，互不干扰
```

### 5.4 统一主题系统

| 主题 | 底色 | 主色 | 适用 |
|------|------|------|------|
| `THEME_MODERN` | `#040814` 深空蓝 | `#00d4ff` 青色 | 全部子系统 |

### 5.5 LLMBridge 统一 LLM 桥接

```typescript
import { LLMBridge } from "@yyc3/shell";

const bridge = new LLMBridge({ stream: true, fallbackToMock: true });

// 流式对话
await bridge.chatStream(
  [{ role: "user", content: "分析本月营收" }],
  (delta) => console.log(delta)
);
```

**支持 Provider**: OpenAI · Claude · Gemini · DeepSeek · Ollama · Azure
**安全**: AES-256-GCM 设备指纹加密存储 API Key
**路由策略**: cost / latency / quality / manual

---

## 六、业务引擎一览

| 引擎 | 包 | 核心算法 | 测试 |
| ------ | ---- | ---------- | ------ |
| **TargetEngine** | plugin-target | X = 基数 × 城市系数 × 规模系数 × 增速系数 × 调整系数 | 35 ✅ |
| **CostEngine** | plugin-cost | 盈亏平衡 + 敏感性分析 + 预警分级 | 30 ✅ |
| **FestivalEngine** | plugin-marketing | 农历转换 + 节日阶段 + 营销日历 | 41 ✅ |
| **BusinessPrompts** | plugin-prompt | 15+ 提示词 × 8位家人人格映射 | 19 ✅ |
| **EventBus** | shell | 跨插件事件总线 · 命名空间隔离 · 命令调度 | 67 ✅ |
| **LLMBridge** | plugin-llm | 5 Provider · SSE 流式 · AES-256-GCM · 4 路由策略 | 5 ✅ |
| **FamilyCore** | family-core | 八位家人档案 · 五维/五高/五标/五化/五环 · 家族宪章 | 540 ✅ |
| **FamilySkills** | family-skills | FamilySkill 契约 · defineSkill · NVIDIA 桥接 · 80+261 技能 | 121 ✅ |
| **FamilyAgents** | family-agents | 8 位家人 Agent 实例 · 工作流编排 · 审批门控 | 76 ✅ |
| **A2AAdapter** | a2a-adapter | Agent-to-Agent 通信协议适配器 | 23 ✅ |

---

## 七、文档体系

### 7.1 架构与设计

| 文档 | 说明 |
| ------ | ------ |
| [项目架构-设计总纲](./docs/YYC3-项目架构-设计总纲.md) | 变量词库 · 路由接口 · 存储架构 · 事件总线 |
| [视觉设计-Figma规范](./docs/YYC3-视觉设计-Figma规范.md) | 色彩 · 字体 · 组件 · 6 页面详细设计 |
| [生产部署-就绪规划](./docs/YYC3-生产部署-就绪规划.md) | M1-M8 里程碑 · Phase 1-4 规划 |
| [全链路落地大纲](./docs/YYC3-全链路智能应用-阶段节点设计落地大纲.md) | 阶段节点 · 系统设计 · 技术栈 |
| [任务看板](./docs/YYC3-任务看板-Phase0-1.md) | Phase 0+1 共 33 项任务追踪 |

### 7.2 团队标准规范

位于 `docs/YYC3-团队通用-标准规范/`：

| 文档 | 说明 |
| ------ | ------ |
| [团队规范-开发标准](./docs/YYC3-团队通用-标准规范/YYC3-团队通用-标规文档/YYC3-团队规范-开发标准.md) | YAML Front Matter · JSDoc · 文档分类 |
| [团队核心-五维驱动](./docs/YYC3-团队通用-标准规范/YYC3-团队通用-标规文档/YYC3-团队核心-五维驱动.md) | 五高五标五化五维框架 |
| [团队规范-文档闭环](./docs/YYC3-团队通用-标准规范/YYC3-团队通用-标规文档/YYC3-团队规范-文档闭环.md) | 模版体系 · 追溯机制 · 迭代演进 |
| [多端适配-规范文档](./docs/YYC3-团队通用-标准规范/YYC3-团队通用-标规文档/YYC3-多端适配-规范文档.md) | PC · PWA · H5 · 小程序 · App |

### 7.3 开发者文档

| 文档 | 说明 |
| ------ | ------ |
| [快速入门](./docs/YYC3-团队通用-标准规范/YYC3-开发者-快速入门.md) | 环境搭建 → 项目认知 → 五分钟创建插件 |
| [架构总纲](./docs/YYC3-团队通用-标准规范/YYC3-开发者-架构总纲.md) | Shell + 插件分层 · EventBus · 存储架构 |
| [插件开发指南](./docs/YYC3-团队通用-标准规范/YYC3-开发者-插件开发指南.md) | SystemRegistration · 引擎层 · 上线 Checklist |
| [编码规范](./docs/YYC3-团队通用-标准规范/YYC3-开发者-编码规范.md) | TS strict · 命名 · 代码标头 · Git 提交 |
| [测试策略](./docs/YYC3-团队通用-标准规范/YYC3-开发者-测试策略.md) | Vitest · 分层测试 · 760+ tests 基线 |
| [部署运维](./docs/YYC3-团队通用-标准规范/YYC3-开发者-部署运维.md) | CI/CD · Docker · Vercel · 监控 |
| [安全合规](./docs/YYC3-团队通用-标准规范/YYC3-开发者-安全合规.md) | 密钥管理 · XSS 防护 · 命名空间隔离 |

### 7.4 AI Family 档案

位于 `docs/AI-FAmily-Agent-家人档案/`：

| 文档 | 说明 |
| ------ | ------ |
| [家人档案总览](./docs/AI-FAmily-Agent-家人档案/README.md) | 八位家人角色定位 · 情感文化铭文 |
| [01-言启·千行](./docs/AI-FAmily-Agent-家人档案/01-AI-FAmily-Agent-言启·千行.md) | 千航·引路人 — 自然语言导航 |
| [02-语枢·万物](./docs/AI-FAmily-Agent-家人档案/02-AI-FAmily-Agent-语枢·万物.md) | 语枢·创想 — 创意生成 |
| [03-预见·先知](./docs/AI-FAmily-Agent-家人档案/03-AI-FAmily-Agent-预见·先知.md) | 预见·先知 — 趋势预测 |
| [04-千里·伯乐](./docs/AI-FAmily-Agent-家人档案/04-AI-FAmily-Agent-千里·伯乐.md) | 千里·伯乐 — 个性化推荐 |
| [05-元启·天枢](./docs/AI-FAmily-Agent-家人档案/05-AI-FAmily-Agent-元启·天枢.md) | 元启·天枢 — 全局调度 |
| [06-智云·守护](./docs/AI-FAmily-Agent-家人档案/06-AI-FAmily-Agent-智云·守护.md) | 守望·哨兵 — 安全响应 |
| [07-格物·宗师](./docs/AI-FAmily-Agent-家人档案/07-AI-FAmily-Agent-格物·宗师.md) | 方圆·宗师 — 代码审查 |
| [08-创想·灵韵](./docs/AI-FAmily-Agent-家人档案/08-AI-FAmily-Agent-创想·灵韵.md) | 创想·灵韵 — 多模态创作 |
| [09-Skills构建](./docs/AI-FAmily-Agent-家人档案/09-AI-FAmily-Agent-Skills构建.md) | FamilySkill 契约 · NVIDIA 技能映射 |
| [Skills 展示页](./docs/YYC3-Family-Skills-Showcase.html) | 可脱机 HTML — 8 家人 × 63+198 技能全景 |

### 7.5 项目闭环验收

位于 `docs/YYC3-团队通用-标准规范/YYC3-项目闭环-验收系统/`，含 15 份验收标准文档。

---

## 八、五高五标五化五维

<div align="center">

| 五高架构 | 五标体系 | 五化转型 | 五维评估 |
| ---------- | ---------- | ---------- | ---------- |
| 高可用 | 标准化 | 流程化 | 时间维 |
| 高性能 | 规范化 | 数字化 | 空间维 |
| 高安全 | 自动化 | 生态化 | 属性维 |
| 高扩展 | 可视化 | 工具化 | 事件维 |
| 高智能 | 智能化 | 服务化 | 关联维 |

</div>

---

## 九、质量基线

<div align="center">

| 指标 | 当前值 | 状态 |
| ------ | -------- | ------ |
| TypeScript 错误 | 0 | ✅ |
| ESLint errors | 0 (114 warnings 渐进收紧) | ✅ |
| 根套件测试 | 257 通过 | ✅ 全绿 |
| Coverage 阈值 | lines 50 / branch 65 / func 70 (防回退门禁) | ✅ |
| 依赖漏洞 (pnpm audit) | 0 (54 → 0, override 锁大版本) | ✅ |
| 密钥扫描 | Gitleaks 阻塞门禁 | ✅ |
| 测试通过率 | 100% | ✅ |
| E2E 测试 | Playwright (Chromium) | ✅ |
| 插件包数量 | 16 packages + 6 docs/packages | ✅ |
| 独立应用数量 | 8 | ✅ |
| CI 流水线 | GitHub Actions (audit/gitleaks 阻塞 + 最小权限) | ✅ |
| 文档数量 | 40+ | ✅ |
| AI Family 技能 | 80 基础 + 261 NVIDIA 桥接 | ✅ |
| 核心业务文档 | 4（目标量化·成本盈亏·营销工具·提示词） | ✅ 已衔接 |

</div>

---

## 十、技术栈

<div align="center">

| 层级 | 技术 |
| ------ | ------ |
| 语言 | TypeScript 5.7+ (strict) |
| 框架 | React 19 |
| 构建 | Vite 6 |
| 测试 | Vitest 3.2 |
| 包管理 | pnpm 9+ (workspace) |
| 样式 | Tailwind CSS 4 |
| 路由 | React Router 7 |
| 图标 | lucide-react |
| CI/CD | GitHub Actions |
| 部署 | Vercel / Docker / 静态托管 |

</div>

---

## 十一、开发红线

| 红线 | 说明 |
| ------ | ------ |
| ❌ 禁止 npm/yarn | 统一使用 pnpm |
| ❌ 禁止直接 import 其他插件包内部组件 | 使用 EventBus 通信 |
| ❌ 禁止直接操作 localStorage | 使用 `createSystemStorage(id)` |
| ❌ 禁止修改 Shell 核心接口 | `types.ts` / `event-bus.ts` / `index.ts` |
| ❌ 禁止提交 TS 有错误的代码 | `tsc --noEmit` 必须通过 |
| ❌ 禁止提交测试未通过的代码 | `vitest run` 必须全绿 |

---

## 十二、路线图

| Phase | 内容 | 状态 |
| ------- | ------ | ------ |
| **Phase 1** | Shell + 插件体系 + 4 引擎 + 测试 | ✅ 完成 |
| **Phase 2** | 功能完整性（AI Family 95% · 全系统 80%） | ✅ 完成 |
| **Phase 3** | 质量工程（React Testing Library 组件测试 + Playwright E2E） | ✅ 完成 |
| **Phase 4** | AI Family 智能体（family-core/skills/agents + NVIDIA 桥接 + LLM 适配） | ✅ 完成 |

### Phase 4 AI Family 智能体交付清单

- ✅ **family-core 家族宪章**：八位家人档案 · 五维/五高/五标/五化/五环 · 标头标尾生成（540 tests）
- ✅ **family-skills 技能契约**：FamilySkill 接口 · `defineSkill()` 工厂 · 80 基础技能（121 tests）
- ✅ **NVIDIA 桥接**：8 封装 skill · 261 NVIDIA 技能 · catalog fallback · 离线可用
- ✅ **family-agents 编排**：8 位家人 Agent 实例 · 工作流编排 · 审批门控（76 tests）
- ✅ **family-ui 交互层**：语音系统 · 模型设置 · 活动中心 · 双主题面板（39 tests）
- ✅ **a2a-adapter 协议**：Agent-to-Agent 通信适配器（23 tests）
- ✅ **plugin-llm LLM 适配层**：5 Provider · SSE 流式 · AES-256-GCM · 4 路由策略（5 tests）
- ✅ **包级文档**：16 个包 README 全覆盖 + 跨包共用项衔接

### Phase 3 质量工程交付清单

- ✅ **React Testing Library 组件测试**：ErrorBoundary / WelcomePage / AIAssistantHub 共 24 个用例
- ✅ **Playwright E2E 配置**：`playwright.config.ts` + `e2e/welcome-flow.spec.ts` 自动启动开发服务器
- ✅ **Jest-DOM 匹配器集成**：`test-setup.ts` 全局配置
- ✅ **跨应用架构修复**：6 个独立 App.tsx 统一监听 `SHELL_WELCOME_DISMISS` 事件
- ✅ **AIAssistantHub 命令执行修复**：补全 `cmd.action?.()` 调用链路

---

<div align="center">

**_YanYuCloudCube_** · © 2026 · All Rights Reserved

_言启千行代码 · 语枢万物智能_

**_Words inspire thousands of lines of code, Language pivots the intelligence of all things_**

</div>
