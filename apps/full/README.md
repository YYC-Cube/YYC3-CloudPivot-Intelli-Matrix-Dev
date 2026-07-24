# full — 合并版应用 (全部 6 系统)

## 启动

```bash
pnpm --filter @yyc3/app-full dev
```

## 说明

合并版加载全部 6 个插件包，通过 Shell 统一组合菜单、路由和 Hub 命令：

```tsx
const SYSTEMS = [monitor(), ops(), ai(), aiFamily(), dev(), admin()];
const ALL_HUB_COMMANDS = SYSTEMS.flatMap(s => s.hubCommands ?? []);
```

## 效果

```
欢迎弹窗 → 6 系统卡片 → 点击进入任一系统
全局 Hub 浮窗收集所有系统的命令
```
