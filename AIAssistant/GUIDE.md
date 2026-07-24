# AI 智能助理浮窗组件 · 开发者指导手册

> 版本: v3.0 | 文档日期: 2026-06-12

---

## 目录

1. [架构概览](#1-架构概览)
2. [快速集成](#2-快速集成)
3. [API 参考](#3-api-参考)
4. [双模式详解](#4-双模式详解)
5. [定制化指南](#5-定制化指南)
6. [数据扩展](#6-数据扩展)
7. [测试方案](#7-测试方案)
8. [问题排查](#8-问题排查)

---

## 1. 架构概览

### 模块层级

```
AIAssistant/                      ← 组件根目录 (10 个文件)
├── types.ts                      ← 类型定义 (ChatMessage, FamilyPersona, AISkill, AIPlugin...)
├── data.ts                       ← 常量数据 (8人格/12命令/8技能/6插件/8模块/5预设/5模型)
├── mock.ts                       ← 人格感知 Mock 回复引擎
├── components.tsx                ← 子组件 + Hooks (AILogo, EmotionRipple, useSpeechRecognition)
├── panels.tsx                    ← 8 个 Tab 面板 (props-driven, 无独立状态)
├── AIAssistant.tsx               ← 主组件 (状态管理 + 布局组装, ~260 行)
├── index.ts                      ← 导出入口
├── README.md                     ← 快速使用说明
├── GUIDE.md                      ← 本开发者手册
└── validate.js                   ← 完整性验证脚本
```

### 数据流

```
Props
  │
  ▼
AIAssistant.tsx (状态中心)
  │
  ├──→ panelProps (统一 Props 对象) ──→ ChatPanel / CommandsPanel / ... / SettingsPanel
  │                                      ↑ 8 个面板均为纯渲染组件
  │
  ├── localStorage ←→ 持久化 (API Key / 模型选择 / Temperature / Top-P / Max Tokens)
  │
  └── useSpeechRecognition ←→ Web Speech API
```

### 外部依赖

| 依赖 | 用途 | 最小版本 |
|------|------|---------|
| `react` | 组件框架 | ^18.0.0 |
| `lucide-react` | 图标库 | ^0.500.0 |
| TailwindCSS | 样式 (可选) | v3+ |

---

## 2. 快速集成

### 2.1 复制文件

```bash
cp -r docs/AI-Dev/AIAssistant/ your-project/src/components/AIAssistant/
```

### 2.2 安装依赖

```bash
cd your-project
npm install lucide-react
```

### 2.3 引入使用

```tsx
import { AIAssistant } from "./components/AIAssistant";

function App() {
  return (
    <div>
      <AIAssistant />
    </div>
  );
}
```

### 2.4 CSS 配置

```css
.hide-scrollbar::-webkit-scrollbar { display: none; }
.hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
```

### 2.5 验证安装

```bash
cd src/components/AIAssistant/ && node validate.js
```

浏览器中右下角应出现 AI 浮窗按钮，点击展开面板即可在 Mock 模式下运行。

---

## 3. API 参考

### AIAssistantProps

```typescript
interface AIAssistantProps {
  mode?: "floating" | "inline";   // floating: 浮动按钮+面板, inline: 内嵌面板
  defaultOpen?: boolean;          // inline 模式下是否默认展开 (默认 true)
  isMobile?: boolean;             // 移动端模式 (全屏浮窗)
  models?: ModelOption[];         // 自定义模型列表 (默认 5 个内建模型)
  apiKey?: string;                // 初始 API Key (为空则 Mock 模式)
  baseUrl?: string;               // 自定义 API Base URL
  loading?: boolean;              // 模型加载中状态
}
```

### ModelOption

```typescript
interface ModelOption {
  id: string;       // 唯一标识
  name: string;     // 显示名称
  provider: string; // 提供商名称
  isLocal: boolean; // 是否为本地模型
}
```

### 完整集成示例

```tsx
import { useState, useEffect } from "react";
import { AIAssistant } from "./components/AIAssistant";

const customModels = [
  { id: "gpt-4",    name: "GPT-4",       provider: "OpenAI",   isLocal: false },
  { id: "claude-3", name: "Claude 3",     provider: "Anthropic", isLocal: false },
];

function Dashboard() {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }, []);

  return (
    <AIAssistant
      isMobile={isMobile}
      models={customModels}
      apiKey={import.meta.env.VITE_OPENAI_API_KEY}
    />
  );
}
```

---

## 4. 双模式详解

### 4.1 floating 模式 (默认)

固定的浮动按钮 + 弹出面板。按钮在右下角，点击展开全功能面板。

```tsx
<AIAssistant />                     // 等同 mode="floating"
<AIAssistant mode="floating" />
```

### 4.2 inline 模式 (内嵌)

面板直接渲染在 DOM 流中，无 fixed 定位。适用于：
- 嵌入 AI Family 页面中心 logo
- 嵌入设置页面
- 嵌入弹窗/抽屉组件
- 自定义触发方式

```tsx
// AI Family 页面嵌入示例
function AIFamilyPage() {
  const [showAssistant, setShowAssistant] = useState(false);

  return (
    <div>
      {/* AI Family 中心 logo — 点击触发 */}
      <div className="center-logo" onClick={() => setShowAssistant(!showAssistant)}>
        <YYC3LogoSvg size={120} />
        <p>点击打开 AI 智能助理</p>
      </div>

      {/* 内嵌面板 — 需要自己控制展开/动画 */}
      {showAssistant && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-[520px] h-[680px]">
            <AIAssistant mode="inline" />
          </div>
        </div>
      )}
    </div>
  );
}
```

### 4.3 两种模式对比

| 特性 | floating | inline |
|------|----------|--------|
| 定位 | `fixed` 右下角 | 跟随 DOM 流 |
| 浮窗按钮 | 有 (自动渲染) | 无 (需自行触发) |
| 关闭按钮 | 有 (面板内) | 有 (面板内) |
| 面板容器 | 自动创建 | 需父容器提供宽高 |
| 使用场景 | 全局 AI 助手 | 嵌入特定页面/组件 |

---

## 5. 定制化指南

### 5.1 修改人格数据

编辑 `data.ts` 中 `FAMILY_PERSONAS` 数组：

```typescript
{
  id: "navigator",          // 唯一 ID
  name: "言启·千行",        // 全名
  shortName: "千行",        // 简称 (显示在头像栏)
  enTitle: "Navigator",     // 英文称号
  role: "聆听与翻译",       // 角色描述
  color: "#FFD700",         // 主题色
  icon: Ear,                // lucide-react 图标组件
  personality: "热情开朗",  // 性格简述
  expertise: ["自然语言理解", "意图识别"],
  greeting: "嗨～你好！",
  mood: "energetic",
  modelName: "GPT-4o",      // 绑定模型名
}
```

### 5.2 修改人格回复

编辑 `mock.ts` 中 `PERSONA_RESPONSES`：

```typescript
const PERSONA_RESPONSES: Record<string, string[]> = {
  "navigator": [
    "我理解你的意图了！让我帮你...",
    "已收到，我来处理！",
  ],
  // ... 其他人格
};
```

### 5.3 修改系统命令

编辑 `data.ts` 中 `SYSTEM_COMMANDS`：

```typescript
{
  id: "cmd-custom",     // 唯一 ID
  icon: Zap,            // lucide-react 图标
  label: "自定义命令",  // 显示名称
  desc: "命令描述",
  category: "cluster",  // cluster/model/data/security/monitor
  action: "执行的提示词",
  color: "#ff6600",
  persona: "master",    // 绑定人格 (可选)
}
```

### 5.4 自定义技能/插件/模块

编辑 `data.ts` 中对应数组：

```typescript
// 添加技能
{ id: "skill-my", name: "自定义技能", description: "描述", icon: Code, category: "dev", color: "#00ff88", active: true }

// 添加插件
{ id: "plug-my", name: "我的插件", description: "描述", version: "1.0.0", icon: Globe, color: "#00d4ff", category: "custom", enabled: false }

// 添加模块
{ id: "mod-my", name: "我的模块", description: "描述", size: "1.2MB", icon: Box, color: "#FFD700", loaded: false }
```

### 5.5 主题色定制

组件使用赛博朋克暗色主题：

| 用途 | 颜色值 | 说明 |
|------|--------|------|
| 面板背景 | `rgba(8,25,55,0.95)` | 深空蓝背板 |
| 主色 | `#00d4ff` | 青色高亮 |
| 按钮渐变 | `from-[#00d4ff] to-[#7b2ff7]` | 蓝色→紫色 |
| 成功 | `#00ff88` | 绿色状态 |
| 文字 | `#e0f0ff` | 浅蓝文字 |
| 次要文字 | `rgba(0,212,255,0.4)` | 半透明 |

搜索上述色值全局替换即可修改配色。

---

## 6. 数据扩展

### 6.1 添加新家人人格

```typescript
// data.ts - FAMILY_PERSONAS
{ id: "healer", name: "治愈·心语", shortName: "心语", enTitle: "Healer",
  role: "情感支持", color: "#FF9999", icon: Heart,
  personality: "温柔细腻", expertise: ["情感分析", "心理疏导"],
  greeting: "心语在这里，有什么想倾诉的吗？",
  mood: "gentle", modelName: "Claude 3" }

// mock.ts - PERSONA_RESPONSES
"healer": ["我在这里听你说...", "你的感受很重要..."]
```

### 6.2 添加新 Tab

1. `types.ts` — 扩展 `TabKey` 联合类型
2. `data.ts` — 在 `ALL_TABS` 中添加 Tab 配置
3. `panels.tsx` — 创建新 Panel 组件 + 添加到导出
4. `AIAssistant.tsx` — 在 content 区添加 `{activeTab === "newTab" && <NewPanel .../>}`

### 6.3 PanelProps 扩展

如需为面板传递私有数据/回调：

```typescript
// panels.tsx - PanelProps interface
export interface PanelProps {
  // 现有字段...
  myCustomData?: string[];
  onMyCustomAction?: (id: string) => void;
}
```

---

## 7. 测试方案

### 7.1 自动验证

```bash
cd AIAssistant/
node validate.js
```

输出示例：
```
═══ 1. 文件完整性检查 ═══
  ✓ types.ts (2.2KB)
  ✓ data.ts (14.7KB)
  ...
═══ 6. 代码质量 ═══
  ✓ AIAssistant.tsx: 260 行 (原 1208 → 现 260, 缩减 948 行)

✅ 全部通过！模块化重构完整可用。
```

### 7.2 手动测试清单

| 测试项 | 预期结果 | 验证 |
|--------|---------|------|
| 浮窗按钮显示 | 右下角出现渐变 AI 按钮 | `data-testid="ai-assistant-float-btn"` |
| 点击展开面板 | 面板动画展开，显示完整 UI | — |
| 8 个 Tab 切换 | 每 Tab 内容正确渲染 | — |
| 家人切换 | 点击头像栏，系统消息提示切换 | — |
| 发送消息 | 输入文字按 Enter，显示对话 | — |
| 命令执行 | 点击命令，自动跳转对话并发送提示词 | — |
| 技能开关 | 点击 Toggle，启用/停用技能 | — |
| 插件开关 | 点击 Toggle，启用/停用插件 | — |
| 模块加载 | 点击按钮切换加载状态 | — |
| 配置持久化 | 修改参数，刷新后保持 | `localStorage` |
| inline 模式 | 无浮窗按钮，面板直接渲染 | `<AIAssistant mode="inline" />` |
| inline + 关闭 | 点击 X 后面板消失 | `defaultOpen` 控制 |

### 7.3 Vitest 组件测试

```tsx
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { AIAssistant } from "./AIAssistant";

// Mock lucide-react (complex icon library)
vi.mock("lucide-react", () => {
  const MockIcon = () => <div data-testid="mock-icon" />;
  return { __esModule: true, default: {}, ...Object.fromEntries(
    ["X","Send","Sparkles","MessageSquare","Command","Ear","Brain","Eye",
     "Star","Network","Shield","Scale","Lightbulb","Mic","MicOff","Zap",
     "Cpu","Activity","Heart","Music2","Key","Sliders","Trash2",
     "Minimize2","Maximize2","BookOpen","User","Code","Box","Grid3x3",
     "ToggleLeft","ToggleRight","RotateCcw","Play","Copy","Check",
     "Palette","Search","BarChart3","Globe","Terminal","Database",
     "HardDrive","AlertCircle","Wifi","Volume2","HelpCircle","Info",
     "Plus","Loader2","RefreshCw","FileText","Image","Clock","Layers",
     "Server"].map(n => [n, MockIcon])
  )};
});

describe("AIAssistant", () => {
  beforeEach(() => { cleanup(); localStorage.clear(); });

  it("renders floating button when closed", () => {
    render(<AIAssistant />);
    expect(screen.getByTestId("ai-assistant-float-btn")).toBeInTheDocument();
  });

  it("opens panel on click", () => {
    render(<AIAssistant />);
    fireEvent.click(screen.getByTestId("ai-assistant-float-btn"));
    // Panel header should be visible with persona name
    expect(screen.getByText("天枢")).toBeInTheDocument();
  });

  it("renders in inline mode without float button", () => {
    render(<AIAssistant mode="inline" />);
    expect(screen.queryByTestId("ai-assistant-float-btn")).not.toBeInTheDocument();
    // Panel should be visible directly
    expect(screen.getByText("天枢")).toBeInTheDocument();
  });

  it("switches persona on avatar click", () => {
    render(<AIAssistant />);
    fireEvent.click(screen.getByTestId("ai-assistant-float-btn"));
    // Click "万物" persona
    const personaBtn = screen.getByTitle("语枢·万物 - 分析与洞察");
    fireEvent.click(personaBtn);
    expect(screen.getByText("万物")).toBeInTheDocument();
  });

  it("sends message and shows response", async () => {
    render(<AIAssistant />);
    fireEvent.click(screen.getByTestId("ai-assistant-float-btn"));
    const textarea = screen.getByPlaceholderText(/输入指令/);
    fireEvent.change(textarea, { target: { value: "查看集群状态" } });
    fireEvent.keyDown(textarea, { key: "Enter" });
    // Wait for mock response
    await new Promise(r => setTimeout(r, 2500));
    expect(screen.getByText(/集群状态报告/)).toBeInTheDocument();
  });
});
```

### 7.4 Playwright E2E

```ts
import { test, expect } from "@playwright/test";

test("AI Assistant full flow", async ({ page }) => {
  await page.goto("http://localhost:3218");
  await expect(page.locator('[data-testid="ai-assistant-float-btn"]')).toBeVisible();
  await page.locator('[data-testid="ai-assistant-float-btn"]').click();
  await expect(page.locator("text=天枢")).toBeVisible();
  await page.locator('button[title*="万物"]').click();
  await page.locator("textarea").fill("查看集群状态");
  await page.locator("button:has(svg.lucide-send)").click();
  await page.waitForTimeout(2500);
  await expect(page.locator("text=集群状态报告")).toBeVisible();
});
```

---

## 8. 问题排查

### TSX 编译错误

```
Cannot use JSX unless the '--jsx' flag is provided.
```

**解决**: `tsconfig.json` 确保包含：
```json
{ "compilerOptions": { "jsx": "react-jsx", "esModuleInterop": true, "downlevelIteration": true } }
```

### 语音识别不工作

**原因**: 仅 Chrome/Edge 支持 Web Speech API。

**检测**:
```ts
const supported = "webkitSpeechRecognition" in window || "SpeechRecognition" in window;
```
不支持时麦克风按钮自动隐藏。

### 图标缺失

```
Module '"lucide-react"' has no exported member 'XXX'
```

**解决**: `npm install lucide-react@latest` (需 ≥ 0.500.0)

### 样式问题

- 无 TailwindCSS: 组件使用 Tailwind 类 + inline style。可将类名替换为纯 inline style
- 滚动条可见: 添加 `.hide-scrollbar` 样式

### Set 迭代错误

```
Type 'Set<string>' can only be iterated through when using the '--downlevelIteration' flag
```

**解决**: `tsconfig.json` → `"downlevelIteration": true`

### 内嵌模式不显示

inline 模式需要父容器有明确的 `width` + `height`：

```tsx
<div style={{ width: 520, height: 680 }}>
  <AIAssistant mode="inline" />
</div>
```

---

## 附录: 文件清单

| 文件 | 大小 | 说明 |
|------|------|------|
| `types.ts` | 2.2KB | 8 个接口/类型定义 |
| `data.ts` | 14.7KB | 所有常量数据 |
| `mock.ts` | 6.3KB | 人格化回复引擎 |
| `components.tsx` | 3.4KB | 子组件 + Hooks |
| `panels.tsx` | 30.8KB | 8 个 Tab 面板 |
| `AIAssistant.tsx` | 14.0KB | 主组件 (260 行) |
| `index.ts` | 0.5KB | 导出入口 |
| `README.md` | — | 快速使用说明 |
| `GUIDE.md` | — | 本开发者手册 |
| `validate.js` | 7.3KB | 完整性验证脚本 |

**合计**: 10 个文件，~72KB，33 个命名导出，20 项功能特性。

所有文件均位于 `docs/AI-Dev/AIAssistant/` 目录下，可直接复制到任意 React + TailwindCSS 项目中使用。
