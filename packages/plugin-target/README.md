# @yyc3/plugin-target — 目标量化引擎

年度营收 X 公式计算 + 三阶段拆分 + 月度节点细化。引擎型插件，纯函数零 UI 依赖。

---

## 注册信息

| 属性 | 值 |
|------|-----|
| id | `target` |
| name | 目标量化 |
| icon | `Target` (lucide) |
| color | `#00FF88` |
| order | 10 |
| 菜单 | 目标总览 / X值计算 / 三阶段拆分 / 月度节点 |

---

## 模块结构

| 文件 | 说明 |
|------|------|
| `target-engine.ts` | 核心引擎 — X 值计算 + 三阶段拆分 + 月度分配 |
| `types.ts` | 类型定义 — 城市系数 / 规模系数 / 月度比例 / 阶段默认值 |
| `register.ts` | Shell 注册 — SystemRegistration |
| `index.ts` | 包入口 — 统一导出引擎 + 类型 + 注册函数 |

---

## 核心导出

### 引擎函数

| 导出名 | 说明 |
|--------|------|
| `TargetEngine` | 引擎类（封装全部计算） |
| `calc(params)` | 计算 X 值 — `基数 × 城市系数 × 规模系数 × 增速系数 × 调整系数` |
| `splitPhases(total)` | 三阶段拆分（启动期 / 成长期 / 稳定期） |
| `splitMonthly(total)` | 月度节点细化（12 个月权重分配） |
| `validate(params)` | 输入校验 |

### 常量

| 导出名 | 说明 |
|--------|------|
| `CITY_TIER_COEFFICIENTS` | 城市等级系数（一线/新一线/二线/三线） |
| `STORE_SCALE_COEFFICIENTS` | 门店规模系数 |
| `MONTHLY_SLOT_RATIOS` | 月度时段权重 |
| `PHASE_DEFAULTS` | 三阶段默认比例 |

---

## X 值公式

```
X = 基数 × 城市系数 × 规模系数 × 增速系数 × 调整系数
```

---

## 使用示例

```typescript
import { calc, splitPhases, splitMonthly } from "@yyc3/plugin-target";

const result = calc({ base: 500, cityTier: "新一线", scale: "中型", growth: 1.15 });
const phases = splitPhases(result.annualTarget);
const monthly = splitMonthly(result.annualTarget);
```

---

## 共用项衔接

| 依赖 | 用途 |
|------|------|
| `@yyc3/shell` (peerDep) | SystemRegistration 注册 |
| `@yyc3/plugin-prompt` | 目标量化 Prompt 模板引用引擎结果 |
| `@yyc3/plugin-ai-family` | AI 家人可调用引擎进行目标分析 |

---

## 测试

```bash
pnpm --filter @yyc3/plugin-target test
# → target-engine.test.ts + engine-integration.test.ts · 35 Tests
```
