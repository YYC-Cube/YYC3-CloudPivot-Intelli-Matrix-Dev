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
|------|----|------|---------|
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
|------|------|------|
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
|-----|------|------|--------|------|
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
