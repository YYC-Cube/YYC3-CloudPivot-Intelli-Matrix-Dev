# apps — 独立应用目录

每个应用都是完整的 Vite + React 项目，可独立 `pnpm dev` 启动。

| 应用 | 端口 | 启动命令 | 包含系统 |
|------|:----:|---------|---------|
| `standalone-monitor/` | 3113 | `pnpm --filter @yyc3/app-standalone-monitor dev` | 监控中心 |
| `standalone-ops/` | 3114 | `pnpm --filter @yyc3/app-standalone-ops dev` | 运维管理 |
| `standalone-ai/` | 3115 | `pnpm --filter @yyc3/app-standalone-ai dev` | AI 智能 |
| `standalone-ai-family/` | 3112 | `pnpm --filter @yyc3/app-standalone-ai-family dev` | AI Family |
| `standalone-business/` | 3118 | `pnpm --filter @yyc3/app-standalone-business dev` | 业务空间（酒店/通讯基站） |
| `standalone-dev/` | 3116 | `pnpm --filter @yyc3/app-standalone-dev dev` | 开发工具 |
| `standalone-admin/` | 3117 | `pnpm --filter @yyc3/app-standalone-admin dev` | 系统管理 |
| `full/` | 3100 | `pnpm --filter @yyc3/app-full dev` | 全部 7 系统合并 |
