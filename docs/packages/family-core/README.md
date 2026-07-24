# @yyc3/family-core

> YYC³ AI Family 核心引擎 — 编排、模型路由、消息总线、安全

## 概述

`family-core` 是 YYC³ MovPlug-AI 的基础引擎层，为上层 Agent、Skills 和 UI 提供核心基础设施。包含智能体编排、多模型路由、事件消息总线、安全沙箱、存储管理等核心能力。

## 安装

```bash
pnpm add @yyc3/family-core
```

## 模块结构

```
src/
├── deps/                    # 基础依赖 (logger, metrics, error-handler, model-types)
├── engine/                  # 消息总线 & 工具注册
│   ├── MessageBus.ts        # 事件驱动消息总线 (EventEmitter)
│   └── ToolRegistry.ts      # 工具注册中心
├── model/                   # 多模型适配层
│   ├── BaseModelAdapter.ts  # 抽象基类 (模板方法模式)
│   ├── ModelRouter.ts       # 策略路由 (RoundRobin/LeastLoaded/Capability)
│   └── OpenAIAdapter.ts     # OpenAI 适配器实现
├── orchestration/           # 智能体编排
│   ├── BaseAgent.ts         # 抽象 Agent 基类
│   ├── AgentManager.ts      # Agent 生命周期管理
│   ├── AgentOrchestrator.ts # 工作流编排 (决策/并行/合并节点)
│   └── MultiModelManager.ts # 多模型管理器
├── platform/                # 平台适配
├── security/                # 安全模块 (OWASP Agentic Top 10)
│   ├── AuditLogger.ts       # 全链路审计日志 (AG08)
│   ├── OutputValidator.ts   # 输出验证网关 (AG03)
│   ├── RateLimiter.ts       # 请求频率限制 (AG10)
│   └── SkillSandbox.ts      # Skill 执行沙箱 (AG05)
├── sovereignty/             # 用户主权
├── storage/                 # 存储层 (IndexedDB, LocalStorage, 统一管理器)
├── trust/                   # 信任守护
└── types/                   # Agent 协议类型定义
```

## 核心设计模式

| 模式 | 应用 |
|------|------|
| 模板方法 | `BaseModelAdapter` → 子类实现 `callModelAPI` / `callModelStream` |
| 策略 | `ModelRouter` — 根据策略选择模型提供者 |
| 观察者 | `MessageBus` — 发布/订阅事件驱动通信 |
| 沙箱 | `SkillSandbox` — 权限检查、资源限制、Worker 线程隔离 |
| 仓储 | `StorageManager` — 统一存储接口 |

## 快速使用

```typescript
import { MessageBus, ToolRegistry, ModelRouter } from '@yyc3/family-core';
import { AgentOrchestrator } from '@yyc3/family-core';

// 消息总线
const bus = new MessageBus();
bus.on('agent:message', (msg) => console.log(msg));

// 模型路由
const router = new ModelRouter({ provider: 'openai', model: 'gpt-4', apiKey: '...' });

// 工作流编排
const orchestrator = new AgentOrchestrator();
```

## 脚本

```bash
pnpm build        # TypeScript 编译
pnpm typecheck    # 类型检查
pnpm test         # 运行测试 (Vitest)
pnpm clean        # 清理 dist/
```

## 测试

12 个测试文件 · 226 个测试用例

覆盖：消息总线、工具注册、模型路由、适配器、编排器、安全模块、存储、主权、信任。

## 依赖

- `eventemitter3` — 高性能事件发射器

## License

Apache-2.0 © YanYuCloudCube Team
