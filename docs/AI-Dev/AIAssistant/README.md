# AI 智能助理浮窗组件 v3.0

> 模块化重构 · 支持浮动/内嵌双模式

## 特性

### 基础功能
- 🪟 **双模式**：`floating` 模式（右下角浮窗）+ `inline` 模式（内嵌面板）
- 💬 **智能对话**：打字效果、消息复制、时间戳、人格感知回复
- ⚡ **12 个快捷命令**：可分类和按家人过滤
- 🎯 **提示词预设**：5 种角色预设 + 自定义编辑器
- ⚙️ **参数配置**：API Key、模型选择、Temperature、Top-P、Max Tokens
- 📱 **响应式**：移动端全屏，桌面端 520×680
- 🌐 **Mock 模式**：无需 API Key 完整运行
- 💾 **本地持久化**：参数自动保存到 localStorage

### AI Family 人格集成
- 👥 **8 位 AI 家人**：千行、万物、先知、伯乐、天枢、守护、宗师、灵韵
- 🎤 **语音输入**：Web Speech API
- 🧠 **8 套独立回复语料库**
- 🏷️ **命令按人过滤**

### 技能/插件/模块
- ⚡ **技能系统**：8 项 AI 能力，可启用/停用
- 🔌 **插件管理**：6 个插件，带版本号和开关
- 🧩 **模块管理**：8 个系统模块，含健康/音乐状态

## 依赖

- `react` (^18.0.0 || ^19.0.0)
- `lucide-react` (^0.500.0)
- TailwindCSS（推荐）

## 安装

```bash
# 复制组件目录到你的项目
cp -r AIAssistant/ your-project/src/components/AIAssistant/
npm install lucide-react
```

## 快速使用

```tsx
import { AIAssistant } from "./components/AIAssistant";

// 浮动模式 (默认)
<AIAssistant />

// 内嵌模式 (嵌入 AI Family 页面等)
<AIAssistant mode="inline" />

// 内嵌 + 默认展开
<AIAssistant mode="inline" defaultOpen={true} />
```

## Props

| Prop | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `mode` | `"floating" \| "inline"` | `"floating"` | 渲染模式 |
| `defaultOpen` | `boolean` | `true` | inline 模式默认展开 |
| `isMobile` | `boolean` | `false` | 移动端全屏 |
| `models` | `ModelOption[]` | 内建 5 个 | 自定义模型列表 |
| `apiKey` | `string` | `""` | 初始 API Key |
| `baseUrl` | `string` | `""` | 自定义 API URL |
| `loading` | `boolean` | `false` | 模型加载中 |

## 标签页

| Tab | 说明 |
|-----|------|
| 对话 | AI 聊天 + 语音输入 |
| 命令 | 快捷命令 (分类/按人过滤) |
| 家人 | 8 位 AI Family 档案 |
| 技能 | 技能开关列表 |
| 插件 | 插件管理 (版本/开关) |
| 模块 | 模块管理 (内存/状态) |
| 提示词 | 角色预设 + 自定义编辑 |
| 配置 | API Key / 模型 / 参数 |

## 文件结构

```
AIAssistant/
├── types.ts           # 所有类型定义
├── data.ts            # 常量数据 (人格/命令/技能/插件/模块/预设/模型)
├── mock.ts            # 人格化回复引擎
├── components.tsx     # 子组件 (AILogo / EmotionRipple / useSpeechRecognition)
├── panels.tsx         # 8 个 Tab 面板
├── AIAssistant.tsx    # 主组件 (260 行)
├── index.ts           # 导出入口
├── GUIDE.md           # 开发者指导手册
└── validate.js        # 完整性验证脚本
```

## CSS 注意事项

```css
.hide-scrollbar::-webkit-scrollbar { display: none; }
.hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
```

## 验证

```bash
cd AIAssistant/ && node validate.js
```

## 许可

MIT
