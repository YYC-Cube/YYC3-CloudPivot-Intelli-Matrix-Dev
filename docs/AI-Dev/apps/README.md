# apps — 独立应用目录

每个应用都是完整的 Vite + React 项目，可独立 `pnpm dev` 启动。

| 应用 | 启动命令 | 包含系统 |
|------|---------|---------|
| `standalone-monitor/` | `pnpm --filter @yyc3/app-standalone-monitor dev` | 监控中心 |
| `standalone-ops/` | `pnpm --filter @yyc3/app-standalone-ops dev` | 运维管理 |
| `standalone-ai/` | `pnpm --filter @yyc3/app-standalone-ai dev` | AI 智能 |
| `standalone-ai-family/` | `pnpm --filter @yyc3/app-standalone-ai-family dev` | AI Family |
| `standalone-dev/` | `pnpm --filter @yyc3/app-standalone-dev dev` | 开发工具 |
| `standalone-admin/` | `pnpm --filter @yyc3/app-standalone-admin dev` | 系统管理 |
| `full/` | `pnpm --filter @yyc3/app-full dev` | 全部 6 系统合并 |
