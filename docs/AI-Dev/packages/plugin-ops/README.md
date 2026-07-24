# @yyc3/plugin-ops — 运维管理

导航分类：**运维管理**（橙色 `#FF6600`）

## 包含

| 文件 | 说明 |
|------|------|
| `register.ts` | 系统注册入口 (order:20, 4 菜单, 4 路由) |

## 注册信息

```ts
id: "ops"
menu: 操作中心 / 文件管理 / 数据库管理 / 报表导出
命令: 执行数据备份 / 管理文件 / 数据库健康检查
```

## Hub 浮窗

```tsx
<AIAssistantHub systemId="ops" title="运维管理" accentColor="#FF6600" commands={OPS_CMDS} />
```
