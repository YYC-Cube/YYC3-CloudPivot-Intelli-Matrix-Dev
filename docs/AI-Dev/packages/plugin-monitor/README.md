# @yyc3/plugin-monitor — 监控中心

导航分类：**监控中心**（青色 `#00d4ff`）

## 包含

| 文件 | 说明 |
|------|------|
| `register.ts` | 系统注册入口 (order:10, 4 菜单, 4 路由) |
| `src/pages/` | 页面组件 (待迁移: Dashboard, FollowUp, Patrol, Alerts) |

## 注册信息

```ts
id: "monitor"
menu: 数据监控 / 一键跟进 / 巡查模式 / 告警规则
命令: 查看集群状态 / 查看告警列表 / 启动巡查 / 配置告警规则
```

## Hub 浮窗

```tsx
import { AIAssistantHub } from "@yyc3/shell";
<AIAssistantHub systemId="monitor" title="监控中心" accentColor="#00d4ff" commands={MONITOR_CMDS} />
```
