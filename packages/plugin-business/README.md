# @yyc3/plugin-business — 业务空间

智慧酒店 / 通讯基站等行业场景的统一入口。界面型插件。

---

## 注册信息

| 属性 | 值 |
|------|-----|
| id | `business` |
| name | 业务空间 |
| icon | `Building2` (lucide) |
| color | `#14B8A6` |
| order | 50 |
| 菜单 | 业务总览 / 智慧酒店 / 通讯基站 |

---

## 模块结构

| 文件 | 说明 |
|------|------|
| `pages/HotelConsole.tsx` | 智慧酒店控制台页面 |
| `register.ts` | Shell 注册 |
| `index.ts` | 包入口 |

---

## Hub 命令

| 命令 ID | 说明 |
|---------|------|
| `b-hotel` | 打开智慧酒店控制台 |

---

## 使用示例

```typescript
import { register } from "@yyc3/plugin-business";
// 在 apps/full 中注册
const registration = register();
```

---

## 共用项衔接

| 依赖 | 用途 |
|------|------|
| `@yyc3/shell` (peerDep) | SystemRegistration 注册 |
| `@yyc3/plugin-ai-family` | AI 家人辅助业务决策 |
| `@yyc3/plugin-monitor` | 业务运行状态监控 |
