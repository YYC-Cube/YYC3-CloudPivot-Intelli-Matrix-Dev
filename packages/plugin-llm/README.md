# @yyc3/plugin-llm — LLM 适配层

5 大 Provider 统一接口 + SSE 流式输出 + AES-256-GCM Key 加密存储 + 智能模型路由器。

---

## 架构定位

```
plugin-llm（本包）        ← Provider 适配 + SSE + 加密 + 路由
    ↓ peerDep
shell                     ← LLMBridge 桥接层（消费本包能力）
    ↓
各 plugin-*               ← 通过 shell 间接使用 LLM 能力
```

---

## 模块结构

| 文件 | 说明 |
|------|------|
| `types.ts` | 类型定义 — Provider/Strategy/ChatMessage/ChatRequest/ChatResponse |
| `base-adapter.ts` | 适配器基类 — fetchWithTimeout + requestId 生成 |
| `providers.ts` | 5 大 Provider 实现 + 预设配置 |
| `sse.ts` | SSE 客户端 — Server-Sent Events 流式读取 |
| `crypto.ts` | 加密层 — AES-256-GCM + 设备指纹 + Demo Key |
| `key-manager.ts` | Key 管理器 — 加密存储 + 状态查询 + Provider 配置构建 |
| `router.ts` | 模型路由器 — cost/latency/quality/manual 策略 |
| `index.ts` | 包入口 — 统一导出全部模块 |

---

## 核心导出

### Provider 适配器

| 导出名 | 说明 |
|--------|------|
| `OpenAIAdapter` | OpenAI GPT 系列 |
| `AnthropicAdapter` | Anthropic Claude 系列 |
| `QwenAdapter` | 阿里通义千问 |
| `DeepSeekAdapter` | DeepSeek |
| `KimiAdapter` | Moonshot Kimi |
| `createAdapter(type)` | 工厂函数 |
| `PROVIDER_PRESETS` | 各 Provider 默认配置（endpoint/model） |

### SSE 流式

| 导出名 | 说明 |
|--------|------|
| `SSEClient` | SSE 客户端类 |
| `readSSEStream(response, handlers)` | 流式读取辅助函数 |

### 加密 & Key 管理

| 导出名 | 说明 |
|--------|------|
| `encryptString(plain, key)` | AES-256-GCM 加密 |
| `decryptString(cipher, key)` | AES-256-GCM 解密 |
| `getDeviceFingerprint()` | 设备指纹（开发环境 Key 派生） |
| `APIKeyManager` / `keyManager` | Key 管理器（单例） |

### 模型路由

| 导出名 | 说明 |
|--------|------|
| `LLMRouter` | 路由器类 — 按 strategy 自动选择 Provider |
| `DEFAULT_MODEL_META` | 默认模型元信息（cost/latency/quality） |

---

## 路由策略

| Strategy | 说明 |
|----------|------|
| `cost` | 优先低成本模型 |
| `latency` | 优先低延迟模型 |
| `quality` | 优先高质量模型 |
| `manual` | 手动指定 Provider |

---

## 使用示例

```typescript
import { keyManager, LLMRouter } from "@yyc3/plugin-llm";

// 1. 初始化 + 存 Key（自动 AES-256-GCM 加密）
keyManager.initWithDeviceFingerprint();
await keyManager.setKey("openai", "sk-xxx");

// 2. 创建路由器
const router = new LLMRouter({
  strategy: "cost",
  providers: keyManager.buildProviderConfigs(),
});

// 3. 非流式
const resp = await router.chat({
  messages: [{ role: "user", content: "你好" }],
});

// 4. 流式（SSE）
await router.chatStream(
  { messages: [{ role: "user", content: "讲个笑话" }], stream: true },
  (chunk) => process.stdout.write(chunk.delta),
);
```

---

## 共用项衔接

| 依赖方向 | 包 | 引用内容 |
|----------|-----|----------|
| **下游** | `@yyc3/shell` | `LLMBridge` 消费本包的 Router + KeyManager |
| **间接** | 全部 plugin-* | 通过 shell 的 `getLLMBridge()` 获取 LLM 能力 |

---

## 测试

```bash
pnpm --filter @yyc3/plugin-llm test
# → crypto + key-manager + providers + router + sse · 全绿
```
