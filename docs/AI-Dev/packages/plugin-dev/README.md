# @yyc3/plugin-dev — 开发工具

导航分类：**开发工具**（银灰 `#E8E8E8`）

## 包含

| 文件 | 说明 |
|------|------|
| `register.ts` | 系统注册入口 (order:50, 3 菜单, 3 路由) |

## 注册信息

```ts
id: "dev"
menu: 设计系统 / 终端 / IDE
命令: 打开终端 / 设计系统 / 打开 IDE
```

## Hub 浮窗

```tsx
<AIAssistantHub systemId="dev" title="开发工具" accentColor="#E8E8E8" commands={DEV_CMDS} />
```
