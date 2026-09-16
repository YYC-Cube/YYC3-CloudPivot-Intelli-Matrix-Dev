# YYC³ Cloud Intelli-Matrix · 架构规范

> AI Family 作为中枢，统一协同所有系统

---

## 一、设计总纲

```
AI Family (中枢系统)
├── 浮窗 Hub ── 全局入口，始终可用
├── 8 位家人 ── 统一交互人格
├── 统一欢迎页 ── 首屏入口
└── 系统注册 ── 管理所有子系统接入
     ├── 监控中心   (monitor)
     ├── 运维管理   (ops)
     ├── AI 智能    (ai)
     ├── 开发工具   (dev)
     └── 系统管理   (admin)
```

---

## 二、变量词库 (Variable Dictionary)

### 2.1 系统标识

| 系统 | ID | 层级 | 路由前缀 |
| ------ | ---- | ------ | --------- |
| AI Family | `ai-family` | 中枢 | `/ai-family` |
| 监控中心 | `monitor` | 子系统 | `/monitor` |
| 运维管理 | `ops` | 子系统 | `/ops` |
| AI 智能 | `ai` | 子系统 | `/ai` |
| 开发工具 | `dev` | 子系统 | `/dev` |
| 系统管理 | `admin` | 子系统 | `/admin` |

### 2.2 命名约定

```
# 组件命名
AiFamily*     → AI Family 专属组件
System*       → 子系统组件
Hub*          → 中枢相关组件

# Hook 命名
useSystem*     → 系统级 Hook
usePlugin*     → 插件级 Hook

# 事件命名
system:*       → 系统级事件
ai:*           → AI 相关事件
hub:*          → 中枢事件

# 存储命名
yyc3:{system}:{key}

# 路由参数
systemId       → 系统标识
pageKey        → 页面标识
```

### 2.3 颜色词库

| 系统 | 主色 | 用途 |
| ------ | ------ | ------ |
| AI Family | `#00FF88` | 中枢绿色 |
| 监控中心 | `#00d4ff` | 青色 |
| 运维管理 | `#FF6600` | 橙色 |
| AI 智能 | `#AA55FF` | 紫色 |
| 开发工具 | `#E8E8E8` | 银灰 |
| 系统管理 | `#FFDD00` | 金色 |

### 2.4 图标词库

```typescript
const SYSTEM_ICONS = {
  "ai-family": UserCircle2,
  "monitor":   Activity,
  "ops":       Wrench,
  "ai":        Brain,
  "dev":       Code2,
  "admin":     ShieldCheck,
} as const;
```

---

## 三、路由接口 (Route Interface)

### 3.1 路由结构

```
/                          → 统一欢迎页 (WelcomePage)
/ai-family                → AI Family 首页
/ai-family/assistant      → AI 浮窗 (inline 模式)
/ai-family/home            → 家族首页
/ai-family/chat            → 交流中心
/ai-family/music           → 音乐空间
/ai-family/voice           → 语音系统
/ai-family/phone           → 家人热线
/ai-family/...

/monitor                   → 监控中心
/monitor/follow-up         → 一键跟进
/monitor/patrol            → 巡查模式
/monitor/alerts            → 告警规则

/ops                       → 运维管理
/ops/operations            → 操作中心
/ops/files                 → 文件管理
/ops/database              → 数据库管理

/ai                        → AI 智能
/ai/models                 → 模型管理
/ai/diagnosis              → AI 诊断

/dev                       → 开发工具
/dev/design-system         → 设计系统
/dev/terminal              → 终端
/dev/ide                   → IDE

/admin                     → 系统管理
/admin/settings            → 系统设置
/admin/users               → 用户管理
/admin/security            → 安全监控
```

### 3.2 系统注册接口

```typescript
/** 每个子系统向外暴露的注册信息 */
interface SystemRegistration {
  id: string;                    // 唯一标识
  name: string;                  // 显示名称
  icon: React.ElementType;       // 图标
  color: string;                 // 主题色
  order: number;                 // 侧边栏排序

  menuItems: MenuItem[];         // 侧边栏菜单
  routes: RouteObject[];         // 路由配置
  i18n?: Record<string, string>; // 翻译贡献

  /** 本系统在浮窗 Hub 中注册的快捷命令 */
  hubCommands?: HubCommand[];

  /** 本系统在浮窗 Hub 中注册的通知 */
  hubNotifications?: () => Notification[];
}
```

### 3.3 浮窗 Hub 命令注册

```typescript
/** 各系统注册到浮窗 Hub 的快捷命令 */
interface HubCommand {
  id: string;
  label: string;
  systemId: string;              // 归属系统
  icon: React.ElementType;
  action: () => void;            // 执行动作
}
```

---

## 四、存储架构 (Storage Architecture)

### 4.1 命名空间

```
localStorage 按系统 ID 分区:

yyc3:ai-family:activePersona     → "meta-oracle"
yyc3:ai-family:voiceProfiles     → [...]

yyc3:monitor:autoRefresh         → true
yyc3:monitor:lastView            → "patrol"

yyc3:ops:fileManagerView         → "grid"

yyc3:shell:welcomeDismissed      → false
yyc3:shell:sidebarCollapsed      → false
yyc3:shell:theme                 → "dark"
```

### 4.2 存储 API

```typescript
// 统一的命名空间存储
function createSystemStorage(systemId: string) {
  const prefix = `yyc3:${systemId}:`;

  return {
    get<T>(key: string, fallback?: T): T {
      try {
        const raw = localStorage.getItem(prefix + key);
        return raw ? JSON.parse(raw) : fallback;
      } catch {
        return fallback;
      }
    },
    set(key: string, value: unknown): void {
      localStorage.setItem(prefix + key, JSON.stringify(value));
    },
    remove(key: string): void {
      localStorage.removeItem(prefix + key);
    },
    clear(): void {
      Object.keys(localStorage)
        .filter(k => k.startsWith(prefix))
        .forEach(k => localStorage.removeItem(k));
    },
  };
}

// 使用
const storage = createSystemStorage("ai-family");
storage.set("activePersona", "thinker");
const persona = storage.get("activePersona", "meta-oracle");
```

### 4.3 关键存储字段

| Key | 归属 | 类型 | 默认值 | 说明 |
| ----- | ------ | ------ | -------- | ------ |
| `activePersona` | ai-family | string | `meta-oracle` | 当前活跃人格 |
| `voiceProfiles` | ai-family | VoiceProfile[] | `[]` | 语音配置 |
| `welcomeDismissed` | shell | boolean | `false` | 欢迎页已关闭 |
| `sidebarCollapsed` | shell | boolean | `false` | 侧边栏折叠 |
| `aiApiKey` | ai-family | string | `""` | API Key |
| `aiModel` | ai-family | string | `""` | 当前模型 |

---

## 五、事件总线 (Event Bus)

### 5.1 跨系统通信

```
┌─────────┐     ┌─────────────┐     ┌─────────┐
│ 监控中心 │────▶│  事件总线   │◀────│  运维    │
└─────────┘     │             │     └─────────┘
                │  AI Family  │
┌─────────┐     │  (中枢路由)  │     ┌─────────┐
│ AI 智能  │────▶│             │◀────│ 开发工具 │
└─────────┘     └─────────────┘     └─────────┘
```

### 5.2 事件清单

```typescript
/** 所有跨系统事件定义 */
export const SystemEvents = {
  // AI Family 发出
  "ai:persona-changed":    { personaId: string },
  "ai:ask":               { question: string, personaId?: string },
  "ai:response":          { content: string, personaId: string },

  // 浮窗 Hub 发出
  "hub:open":             { defaultTab?: string },
  "hub:close":            {},
  "hub:navigate":         { tab: string },
  "hub:command":          { commandId: string },

  // 系统管理发出
  "shell:welcome-dismiss": {},
  "shell:sidebar-toggle":  {},

  // 任何系统发出
  "system:notify":         { level: "info"|"warn"|"error", message: string, systemId: string },
} as const;
```

### 5.3 事件总线实现

```typescript
class EventBus {
  private listeners = new Map<string, Set<Function>>();

  emit(event: string, data?: any): void {
    this.listeners.get(event)?.forEach(fn => fn(data));
  }

  on(event: string, fn: Function): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(fn);
    return () => this.listeners.get(event)?.delete(fn);
  }

  once(event: string, fn: Function): void {
    const wrapper = (data: any) => { fn(data); this.off(event, wrapper); };
    this.on(event, wrapper);
  }

  off(event: string, fn: Function): void {
    this.listeners.get(event)?.delete(fn);
  }
}

export const eventBus = new EventBus();
```

---

## 六、系统间关系

```
                  ┌─────────────────────┐
                  │     统一欢迎页       │
                  │   (WelcomePage)      │
                  └──────────┬──────────┘
                             │ 点击卡片进入
                             ▼
┌──────────────────────────────────────────────────┐
│                  AI Family (中枢)                  │
│                                                    │
│  ┌──────────────────────────────────────────────┐ │
│  │         浮窗 Hub (AIAssistant)                │ │
│  │  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐        │ │
│  │  │ 监控  │ │ 运维  │ │ AI   │ │ 开发  │        │ │
│  │  │ 快捷  │ │ 命令  │ │ 查询  │ │ 工具  │        │ │
│  │  └──────┘ └──────┘ └──────┘ └──────┘        │ │
│  │  [对话] [命令] [家人] [提示词] [配置]         │ │
│  └──────────────────────────────────────────────┘ │
│                                                    │
│  8 位家人 × 人格切换 × 语音输入 × 统一通信         │
└──────────────────────────────────────────────────┘
        │              │              │
        ▼              ▼              ▼
  ┌────────┐    ┌────────┐    ┌────────┐
  │ 监控中心 │    │ 运维管理 │    │ AI 智能  │   ← 子系统
  └────────┘    └────────┘    └────────┘
```

---

## 七、开发规范

### 7.1 文件组织

```
packages/{system-id}/
├── src/
│   ├── index.ts          ← 注册入口 (SystemRegistration)
│   ├── yyc3.config.ts    ← 系统配置 (菜单+路由)
│   ├── routes.ts         ← 路由定义
│   ├── pages/            ← 页面组件
│   ├── components/       ← 私有组件
│   ├── hooks/            ← 私有 Hook
│   ├── storage.ts        ← 本系统存储 (调用 createSystemStorage)
│   └── events.ts         ← 本系统监听/发出的事件
```

### 7.2 系统间通信原则

```
✅ 允许: 事件总线 → 松耦合通信
✅ 允许: 浮窗 Hub → 统一入口
✅ 允许: 统一存储 → 共享配置
❌ 禁止: 直接 import 其他系统的组件
❌ 禁止: 直接读写其他系统的存储
❌ 禁止: 互相依赖路由结构
```

---

## 八、项目实际现状对齐（2026-07-17 校准，含 Phase 4 完成）

> 本章为项目实施进度可视化锚点，所有数据均由 `npx vitest run` 实测，`tsc --noEmit` 零错误验证。

### 8.1 Monorepo 实际结构

```
YYC3-CloudPivot-Intelli-Matrix-Dev/
├── packages/ (14 个插件包, Phase 4 新增 plugin-llm)
│   ├── shell/                 ← 中枢 (WelcomePage/AIAssistantHub/ErrorBoundary/eventBus/storage/theme/llm-bridge)
│   ├── plugin-llm/            ← 【Phase 4】LLM 适配层 (5 Provider + SSE + AES-256-GCM Keyring)
│   ├── plugin-ai-family/      ← 8 位家人 · 4 页面 (Home/Center/Chat/Settings)
│   ├── plugin-monitor/        ← Dashboard 监控中心
│   ├── plugin-ops/            ← OperationCenter 运维管理
│   ├── plugin-ai/              ← AISuggestion AI 智能
│   ├── plugin-dev/             ← DesignSystem 开发工具
│   ├── plugin-admin/           ← Audit 系统管理
│   ├── plugin-target/          ← TargetEngine X 公式 + 三阶段拆分 (35 tests)
│   ├── plugin-cost/            ← CostEngine 5 步成本核算 (30 tests)
│   ├── plugin-marketing/       ← FestivalEngine 6 类节日 (41 tests)
│   └── plugin-prompt/          ← BUSINESS_PROMPTS 15 模板 (19 tests)
├── apps/ (8 个独立应用)
│   ├── full/                   ← 合并版 (7 系统全集)
│   ├── standalone-ai-family/  ← AI Family 独立版
│   ├── standalone-monitor/    ← 监控中心独立版
│   ├── standalone-ops/        ← 运维管理独立版
│   ├── standalone-ai/          ← AI 智能独立版
│   ├── standalone-dev/         ← 开发工具独立版
│   └── standalone-admin/      ← 系统管理独立版
├── e2e/                        ← Playwright (welcome-flow.spec.ts)
├── AIAssistant/                ← 原始 AI 助理组件 (legacy reference)
├── docs/                       ← 项目文档群 (5 份架构文档 + 4 份核心业务文档)
├── .github/workflows/         ← 【Phase 4】CI/CD pipeline
├── Dockerfile + docker-compose.yml + .lighthouserc.json  ← 【Phase 4】部署基线
└── test-setup.ts               ← Jest-DOM 匹配器 + scrollIntoView polyfill
```

### 8.2 测试基线矩阵（24 files / 294 tests / 100% ✅）

| 包 | 测试文件 | 用例数 | 覆盖范围 |
| ---- | --------- | ------- | --------- |
| plugin-target | `target-engine.test.ts` + `engine-integration.test.ts` | 27 + 8 = 35 | X 公式 / 三阶段 / 月度节点 / 跨引擎联动 |
| plugin-cost | `cost-engine.test.ts` | 30 | 城市指数 / 场地/设备/运营 / 盈亏 / 敏感性 |
| plugin-marketing | `festival-engine.test.ts` | 41 | 6 类节日 / 农历转换 / 三阶段归属 / 动作模板 |
| plugin-prompt | `business-prompts.test.ts` | 19 | 15 模板 / 6 分类 / 5 人格 / 5 引擎关联 |
| shell | 8 文件 (ErrorBoundary/WelcomePage/AIAssistantHub/llm-bridge/eventBus/hub-commands/storage/jest-dom) | 74 | +7 LLMBridge (Phase 4) Mock 回退 / Provider 管理 |
| **plugin-llm** | **【Phase 4】5 文件 (crypto/sse/key-manager/providers/router)** | **57** | **AES-256-GCM / SSE / 5 Provider / Keyring / 路由** |
| **合计** | **24 文件** | **294** | **全量 ✅ 通过 (Phase 4 新增 64 tests)** |

### 8.3 路由实际清单

```
/                          → WelcomePage (统一欢迎页)
/ai-family                → AI Family 家园 (FamilyHomePage)
/ai-family/center         → 家园中心
/ai-family/chat           → 交流中心
/ai-family/settings       → 家人设置
/monitor                  → 监控中心 (Dashboard)
/ops                      → 运维管理 (OperationCenter)
/ai                       → AI 智能 (AISuggestion)
/dev                      → 开发工具 (DesignSystem)
/admin                    → 系统管理 (Audit)
```

### 8.4 核心业务文档衔接矩阵

| 文档 | 插件包 | 公开 API | 行数 | 衔接状态 |
| ------ | -------- | --------- | ------ | --------- |
| 《My-经管运维-目标量化》 | plugin-target | `calc/splitPhases/splitMonthly/validate` | 236 | ✅ |
| 《My-成本盈亏-计算工具》 | plugin-cost | `calcCityCostIndex/calcTotalCost/analyzeProfit` | 2020 | ✅ |
| 《My-营销工具-构建方案》 | plugin-marketing | `buildFestivalCalendar/filterByStage/getDefaultActions` | 489 | ✅ |
| 《My-经管运维工具提示词》 | plugin-prompt | `BUSINESS_PROMPTS/PERSONA_PROMPT_MAP` | 535 | ✅ |

### 8.5 阶段里程碑

| 里程碑 | 内容 | 状态 |
| -------- | ------ | ------ |
| M1-M7 | 架构 + Shell + 7 插件 + 双主题 + Figma 规范 | ✅ |
| M8-M12 | Phase 2 功能完整性 + Hub 命令联动 + 206 tests | ✅ |
| **M13** | **Phase 3 质量工程完成** (RTL + Playwright + 230 tests + 4 文档衔接) | ✅ |
| **M14** | **Phase 4 生态闭环完成** (plugin-llm + SSE + AES-256-GCM + Docker + CI/CD + Lighthouse + 294 tests) | ✅ |

### 8.6 Phase 4 关键架构演进

| 演进点 | 原架构 | Phase 4 新架构 | 价值 |
| -------- | -------- | ------------- | ------ |
| AIAssistantHub | Mock-only | Mock + Real LLM 回退 | 渐进增强 |
| 流式输出 | setTimeout 模拟 | SSE Token-by-Token | 真实体验 |
| API Key 存储 | localStorage 明文 | AES-256-GCM + Keyring | 安全合规 |
| LLM Provider | 单一 | 5 Provider 路由 (cost/latency/quality) | 灵活可控 |
| 部署 | dev-only | Docker + CI/CD | 生产可用 |
| 安全 | 基础 | CSP/CORS/XSS/Rate Limit/Dep Scan | 全方位加固 |
| 性能 | 未度量 | Lighthouse 基线 (LCP<2.5s) | 可度量 |
| 类型补全 | @testing-library/jest-dom 隐式依赖 jest | +@types/jest 占位 | IDE 诊断零错误 |

### 8.7 Phase 4 类型系统修复记录

| 问题 | 根因 | 修复 |
| ------ | ------ | ------ |
| `jest.d.ts` 报 "找不到 jest 类型定义文件" | `@testing-library/jest-dom` 内部声明引用 jest 命名空间，项目用 vitest 未装 @types/jest | 安装 `@types/jest@29.5.14` devDependency |
| `jest.d.ts` 报 "找不到名称 expect" | 同上，jest 全局未定义 | 同上，@types/jest 提供 expect 全局类型 |
| 效果验证 | — | `pnpm type-check` 0 错误 / `pnpm test --run` 294/294 通过 |
