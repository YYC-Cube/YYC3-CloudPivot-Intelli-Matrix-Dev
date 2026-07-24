# @yyc3/family-skills

> YYC³ AI Family Skills 生态 — MCP 兼容技能注册与执行

## 概述

`family-skills` 实现了 35 个技能 (7 大类别) 的注册、发现和执行系统，包含 MCP (Model Context Protocol) 兼容桥接层。技能通过标准化接口注册，支持动态发现和远程 MCP 端点调用。

## 技能分类

| 类别 | 数量 | 说明 |
|------|------|------|
| NLU | 5 | 自然语言理解 (情感分析、意图识别等) |
| Analysis | 5 | 数据分析 |
| Prediction | 5 | 预测推理 |
| Recommendation | 5 | 推荐匹配 |
| Orchestration | 5 | 任务编排 |
| Quality | 5 | 质量评估 |
| Security | 5 | 安全检测 |

## 模块结构

```
src/
├── registry/
│   ├── FamilySkillRegistry.ts   # 技能注册中心
│   ├── MCPSkillBridge.ts        # MCP 协议桥接 (HTTP/SSE Transport)
│   └── SkillManifest.ts         # 技能清单声明
└── skills/
    ├── index.ts                 # 技能导出
    ├── analysis/                # 分析类技能
    ├── creative/                # 创意类技能
    ├── orchestration/           # 编排类技能
    ├── nlu/                     # NLU 类技能
    ├── prediction/              # 预测类技能
    ├── quality/                 # 质量类技能
    ├── recommendation/          # 推荐类技能
    └── security/                # 安全类技能
```

## 核心设计

### Skill 接口

```typescript
interface FamilySkill {
  id: string;
  name: string;
  category: SkillCategory;
  execute(params: SkillParams): Promise<SkillResult>;
  validate(params: SkillParams): boolean;
}
```

### MCP 桥接

`MCPSkillBridge` 支持 JSON-RPC 2.0 协议，通过 HTTP/SSE Transport 与远程 MCP 服务器通信，可将远程 MCP 工具包装为本地 Skill。

## 快速使用

```typescript
import { FamilySkillRegistry } from '@yyc3/family-skills';

const registry = new FamilySkillRegistry();
registry.register(skill);
const result = await registry.execute('sentiment-analysis', { text: '...' });
```

## 脚本

```bash
pnpm build        # TypeScript 编译
pnpm typecheck    # 类型检查
pnpm test         # 运行测试 (Vitest)
pnpm clean        # 清理 dist/
```

## 测试

3 个测试文件 · 72 个测试用例

覆盖：技能集成、MCP 传输层、技能清单。

## 依赖

- `@yyc3/family-core` — 核心引擎
- `@yyc3/family-agents` — Agent 基类

## License

Apache-2.0 © YanYuCloudCube Team
