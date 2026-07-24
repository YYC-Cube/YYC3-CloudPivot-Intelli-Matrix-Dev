# @yyc3/family-core — 家族宪章（唯一真相源）

YYC³ AI Family 的根基包。定义八位家人档案、五维评估体系、五环自进化引擎，以及标头标尾生成器。**所有家人相关的权威字段（ID / 名称 / 角色 / 主题色）均以此包为唯一来源**，下游包不得硬编码。

> 注：生产构建位于 `docs/packages/family-core/`（含完整 tsconfig + dist 产出），本目录为 monorepo 引擎层的源码镜像。

---

## 架构定位

```
family-core（本包）       ← 家族宪章 · 五维 · 五环 · 标头标尾
    ↓ peerDep
family-agents             ← 8 位家人 Agent 实例
family-skills             ← 技能契约 + NVIDIA 桥接
```

---

## 模块结构

| 文件 | 说明 |
|------|------|
| `architecture/家族宪章.ts` | 八位家人档案 + 家族徽记 + 标头标尾/徽章生成器 |
| `architecture/五维评估引擎.ts` | 五维（时间/空间/属性/事件/关联）指标采集与评估 |
| `architecture/五环自进化引擎.ts` | 五环（道/法/术/器/势）自进化执行闭环 |
| `architecture/index.ts` | Barrel export — 统一聚合 architecture 层 |

---

## 核心导出

| 导出名 | 类型 | 说明 |
|--------|------|------|
| `八位家人` | `Record<string, 家人档案>` | 8 位家人完整档案 |
| `家族宪章` | 常量 | 家族铭文 · 核心理念 |
| `家族徽记` | 常量 | ASCII 徽章艺术 |
| `家人档案` | type | 家人 ID / 名称 / 角色 / 主题色 / 编号 / 电话 / 座右铭 |
| `五维评估器` | class | 五维指标采集 + 报告生成 |
| `五环自进化引擎` | class | 自进化闭环执行器 |
| `生成代码标头/标尾` | fn | TS/TSX 文件标准注释头 |
| `生成文档标头/标尾` | fn | Markdown 文档标准头 |
| `生成NPM徽章栏` | fn | package.json 徽章 Markdown |
| `生成全员徽章行` | fn | 8 位家人 GitHub 徽章行 |

---

## 八位家人 ID 清单

| 家人名 | ID | 角色领域 | 主题色 |
|--------|----|----------|--------|
| 千航·引路人 | `qianhang` | 自然语言导航 | `#8b5cf6` |
| 思辨·智库 | `thinker` | 数据洞察分析 | `#06b6d4` |
| 预见·先知 | `prophet` | 趋势预测 | `#10b981` |
| 千里·伯乐 | `bole` | 个性化推荐 | `#f59e0b` |
| 元启·天枢 | `tianshu` | 全局调度 | `#ec4899` |
| 守望·哨兵 | `guardian` | 安全响应 | `#ef4444` |
| 方圆·宗师 | `grandmaster` | 代码审查 | `#6366f1` |
| 语枢·万物 | `grace` | 创意生成 | `#14b8a6` |

---

## 共用项衔接

| 下游包 | 引用方式 | 说明 |
|--------|----------|------|
| **family-agents** | `peerDeps` | Agent 人格数据从宪章读取 |
| **family-skills** | `peerDeps` | 技能归属家人 ID 映射 |
| **plugin-ai-family** | `import` | UI 层展示家人名称/角色/主题色 |

---

## 测试

```bash
pnpm --filter @yyc3/family-core test
# → 29 Test Files · 540 Tests · 全绿
```

---

_言启千行代码 · 语枢万物智能_
