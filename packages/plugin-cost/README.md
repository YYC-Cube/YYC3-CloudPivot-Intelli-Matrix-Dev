# @yyc3/plugin-cost — 成本盈亏引擎

动态成本核算 + 盈亏平衡分析 + 敏感性测算。引擎型插件，纯函数零 UI 依赖。

---

## 注册信息

| 属性 | 值 |
|------|-----|
| id | `cost` |
| name | 成本盈亏 |
| icon | `Calculator` (lucide) |
| color | `#FF6600` |
| order | 20 |
| 菜单 | 成本总览 / 城市选择 / 场地配置 / 设备配置 / 成本计算 / 盈亏分析 |

---

## 模块结构

| 文件 | 说明 |
|------|------|
| `cost-engine.ts` | 核心引擎 — 城市成本指数 + 场地/设备/运营成本 + 收入预测 + 盈亏分析 + 敏感性测算 |
| `types.ts` | 类型定义 — 城市数据 / 场地配置 / 设备配置 / 装修等级 / 设备等级 |
| `register.ts` | Shell 注册 |
| `index.ts` | 包入口 |

---

## 核心导出

### 引擎函数

| 导出名 | 说明 |
|--------|------|
| `CostEngine` | 引擎类 |
| `calcCityCostIndex(city)` | 城市成本指数 |
| `calcVenueCost(config)` | 场地成本（租金 + 装修） |
| `calcEquipmentCost(config)` | 设备成本 |
| `calcOperationalCost(params)` | 运营成本（人力 + 水电 + 营销） |
| `calcTotalCost(...)` | 总成本汇总 |
| `forecastRevenue(params)` | 收入预测 |
| `analyzeProfit(cost, revenue)` | 盈亏平衡分析 + 预警分级 |
| `sensitivityAnalysis(params)` | 敏感性测算 |

### 常量

| 导出名 | 说明 |
|--------|------|
| `DECORATION_COSTS` | 装修等级费用表（简装/精装/豪装） |

---

## 使用示例

```typescript
import { calcTotalCost, analyzeProfit } from "@yyc3/plugin-cost";

const cost = calcTotalCost({ city: "北京", venue: {...}, equipment: {...}, operational: {...} });
const profit = analyzeProfit(cost.total, { monthlyRevenue: 80 });
// profit.breakEvenMonth → 盈亏平衡月
```

---

## 共用项衔接

| 依赖 | 用途 |
|------|------|
| `@yyc3/shell` (peerDep) | SystemRegistration 注册 |
| `@yyc3/plugin-target` | 目标 X 值 → 收入预测联动 |
| `@yyc3/plugin-prompt` | 成本盈亏 Prompt 模板引用引擎结果 |

---

## 测试

```bash
pnpm --filter @yyc3/plugin-cost test
# → cost-engine.test.ts · 30 Tests
```
