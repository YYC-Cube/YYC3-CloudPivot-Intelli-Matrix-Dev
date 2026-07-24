# @yyc3/plugin-marketing — 节日营销引擎

6 类节日聚合 + 农历/公历转换 + 三阶段营销动作触发。含双引擎架构（节日引擎 + 农历引擎）。

---

## 注册信息

| 属性 | 值 |
|------|-----|
| id | `marketing` |
| name | 节日营销 |
| icon | `Calendar` (lucide) |
| color | `#AA55FF` |
| order | 30 |
| 菜单 | 节日总览 / 年度日历 / 三阶段分布 / 营销动作 |

---

## 模块结构

| 文件 | 说明 |
|------|------|
| `festival-engine.ts` | 节日引擎 — 阶段判定 + 日历构建 + 类型筛选 + 动作触发 |
| `lunar-engine.ts` | 农历引擎 — 公历↔农历转换 + 星期 + 月历 |
| `festivals.ts` | 节日数据库 — 法定/民俗/营销/地方/品牌共 6 类 |
| `types.ts` | 类型定义 — 节日/阶段/动作/日历条目 |
| `register.ts` | Shell 注册 |
| `index.ts` | 包入口 |

---

## 核心导出

### 节日引擎

| 导出名 | 说明 |
|--------|------|
| `FestivalEngine` | 引擎类 |
| `getFestivalStage(date)` | 获取当前节日阶段（预热期/爆发期/长尾期） |
| `resolveFestivalDate(name, year)` | 解析节日日期（含农历转换） |
| `buildFestivalCalendar(year)` | 构建年度节日日历 |
| `filterByStage(festivals, stage)` | 按阶段筛选 |
| `filterByType(festivals, type)` | 按类型筛选 |
| `getDefaultActions(festival)` | 获取默认营销动作 |

### 农历引擎

| 导出名 | 说明 |
|--------|------|
| `lunarToSolar(lunar)` | 农历转公历 |
| `solarToLunar(solar)` | 公历转农历 |
| `formatLunarDay(date)` | 农历日期格式化 |
| `getWeekday(date)` | 获取星期 |
| `WEEKDAY_NAMES` / `WEEKDAY_FULL` | 星期名称常量 |

### 节日数据

| 导出名 | 说明 |
|--------|------|
| `ALL_FESTIVALS` | 全部节日 |
| `LEGAL_FESTIVALS` | 法定节日（春节/国庆/劳动节等） |
| `FOLK_FESTIVALS` | 民俗节日（端午/中秋/重阳等） |
| `MARKETING_FESTIVALS` | 营销节日（双11/618等） |
| `LOCAL_FESTIVALS` | 地方节日 |
| `BRAND_FESTIVALS` | 品牌自定义节日 |

---

## 使用示例

```typescript
import { buildFestivalCalendar, lunarToSolar } from "@yyc3/plugin-marketing";

const calendar = buildFestivalCalendar(2026);
const solar = lunarToSolar({ year: 2026, month: 1, day: 1 }); // 春节
```

---

## 共用项衔接

| 依赖 | 用途 |
|------|------|
| `@yyc3/shell` (peerDep) | SystemRegistration 注册 |
| `@yyc3/plugin-prompt` | 节日营销 Prompt 模板引用日历数据 |
| `@yyc3/plugin-target` | 月度节点 → 营销日历联动 |

---

## 测试

```bash
pnpm --filter @yyc3/plugin-marketing test
# → festival-engine.test.ts · 41 Tests
```
