# @yyc3/plugin-admin — 系统管理

导航分类：**系统管理**（金色 `#FFDD00`）

## 包含

| 文件 | 说明 |
|------|------|
| `register.ts` | 系统注册入口 (order:60, 5 菜单, 5 路由) |

## 注册信息

```ts
id: "admin"
menu: 操作审计 / 系统设置 / 用户管理 / 安全监控 / PWA 管理
命令: 打开系统设置 / 用户管理 / 操作审计日志
```

## Hub 浮窗

```tsx
<AIAssistantHub systemId="admin" title="系统管理" accentColor="#FFDD00" commands={ADMIN_CMDS} />
```
