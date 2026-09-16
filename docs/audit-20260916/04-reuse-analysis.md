# 复用性与多场景应用分析

> 审计对象：`/Users/yanyu/YYC-Cube/YYC3-CloudPivot-Intelli-Matrix-Dev`
> 审计方式：只读代码审计，所有结论基于真实代码（非 README 宣称）
> 日期：2026-09-16

---

## ① Apps 形态矩阵表 — 「同一底座多形态交付」的实况

项目宣称 8 个 App「同一底座多形态交付」（`apps/README.md`）。实况核查如下：

| App | 端口 | 声明依赖 (package.json) | 实际 import 的共享包 | 路由形态 | 能否独立构建 | 真实定位 |
|-----|:---:|------------------------|---------------------|---------|:---:|---------|
| `full` | 3100 | react / lucide / react-router-dom（**未声明任何 @yyc3/\* 依赖**） | shell + plugin-ai-family + 7 个 plugin-\* 页面 | createHashRouter + lazy 加载 7 条路由 | ✅ 有 dist（靠 vite alias 兜底） | 全系统合并版，**唯一消费 plugin-\* 页面的 App** |
| `standalone-ai-family` | 3112 | shell + plugin-ai-family | shell + plugin-ai-family | 单页 + 状态切换 | ✅ 有 dist | **唯一真正复用 plugin 包的 standalone** |
| `standalone-monitor` | 3113 | 仅 shell | 仅 shell | 单页 + 面板切换 | ✅ 有 dist | 自包含 mock UI |
| `standalone-ops` | 3114 | 仅 shell | 仅 shell | 单页 + 面板切换 | ✅ 有 dist | 自包含 mock UI |
| `standalone-ai` | 3115 | 仅 shell | 仅 shell | 单页 + 面板切换 | ✅ 有 dist | 自包含 mock UI |
| `standalone-dev` | 3116 | 仅 shell | 仅 shell | 单页 + 面板切换 | ✅ 有 dist | 自包含 mock UI |
| `standalone-admin` | 3117 | 仅 shell | 仅 shell | 单页 + 面板切换 | ✅ 有 dist | 自包含 mock UI |
| `standalone-business` | 3118 | 仅 shell | 仅 shell | 单页 + 面板切换 | ✅ 有 dist | 自包含 mock UI |

### 关键实况（与宣称的差距）

**1. standalone 与 plugin 是两套平行代码，不是复用关系。**
6 个 standalone-\*（除 ai-family）的 `App.tsx` 内嵌了完整的 mock 面板（用户列表、审计日志、集群状态等），**不 import 对应 plugin 包的任何代码**。例：
- `apps/standalone-monitor/src/App.tsx`：内联 STATS/ALERTS 常量 + `Math.random()` 生成 CPU 数据（约 150 行）
- `packages/plugin-monitor/src/pages/Dashboard.tsx`：另一套静态卡片（42 行）

同一「监控中心」存在 **standalone mock 版** 和 **plugin 页面版** 两份实现，数据均为硬编码。唯一消费 plugin 页面版的是 `full`（`apps/full/src/App.tsx:62-68` 的 lazy import）。

**2. `full` 的依赖声明不完整，构建靠 vite alias 侥幸成立。**
`apps/full/package.json` 的 dependencies 没有 `@yyc3/shell`、`@yyc3/plugin-ai-family` 等，但 `App.tsx` import 了它们；`apps/full/vite.config.ts` 用 `resolve.alias` 指向 `../../packages/*/src` 才解析成功。且 `apps/full/` 目录**没有 tsconfig.json**（其余 standalone 有）。复制到其他仓库即碎。

**3. `SystemRegistration` 插件注册契约无消费者。**
所有 plugin 包都导出 `register(): SystemRegistration`（如 `packages/plugin-monitor/src/register.ts`），shell 定义了类型（`packages/shell/src/types.ts:26`），但：
- 全仓 grep 无任何 app 调用 `register()`
- shell 没有实现 SystemRegistry（`packages/shell/src/index.ts` 仅导出类型）
- `plugin-monitor/src/register.ts:9` 的 `routes: [] as any` 是空壳
- `plugin-monitor/src/register.ts:7` 的 `label: "nav.dataMonitor"` 是 i18n key 风格，但**主项目没有任何翻译文件挂载该 key**

结论：**「插件注册机制」是定义了契约但未闭环的半成品**。实际路由拼装发生在 `full/src/App.tsx` 手写 lazy import。

**4. 真正实现「同底座复用」的只有 shell 一层。**
8 个 App 共享的是 `AIAssistantHub + WelcomePage + eventBus + storage`（均出自 `@yyc3/shell`），这是复用实态的底线，也是上限（对 6 个 standalone 而言）。

---

## ② 包复用性分级表

分级标准：**A=框架无关（可直接搬走） / B=React 绑定（需 React 宿主） / C=项目耦合（需拆解）**

| 包 | 行数/规模 | 分级 | 导出面 | 外部依赖 | 复用障碍 |
|----|----------|:---:|--------|---------|---------|
| `packages/plugin-llm` | 1653 行 src + 869 行测试 | **A** | 5 适配器 + SSEClient + AES 加密 + keyManager + LLMRouter + PROVIDER_PRESETS（`src/index.ts` 全量导出） | 仅 Web API（fetch/crypto/localStorage）；peerDeps 声明的 react/shell **实际零 import** | main 直出 `src/index.ts`，消费方需自配 TS 编译；价格表为 2025 快照 |
| `packages/family-skills`（根） | 54 个技能文件，9 域 | **A-** | defineSkill + FamilySkillRegistry + MCPSkillBridge + allSkills（`src/index.ts`） | `@yyc3/family-agents`（仅类型）；MCPSkillBridge 用 `child_process` | 类型依赖 family-agents 的 FamilySkill 定义，抽取需内联类型；根版被 workspace 排除 |
| `packages/family-core`（根） | 915 行 | **A** | 八位家人档案 + 家族宪章 + 五维评估 + 五环自进化（`src/index.ts`） | **零依赖** | 中文标识符（`八位家人`、`五维维度`）对英文工程不友好；与 docs/ 权威版双源 |
| `packages/family-agents`（根） | 1831 行 | **A-** | PDAMRCycle + AgentPersona + FamilyBaseAgent + 8 个 Agent 类（`src/index.ts`） | family-core（peerDep，实际仅 FAMILY_PROFILES 数据） | 同上双源问题；Agent 智能是关键词规则非 LLM |
| `packages/shell` | 1412 行 src | **B** | EventBus + storage + WelcomePage + AIAssistantHub + ErrorBoundary + theme + LLMBridge（`src/index.ts`） | react / lucide-react / react-router-dom（types.ts 引 RouteObject）；plugin-llm 为**动态可选** import | AIAssistantHub 643 行大单件；SystemRegistration 契约无闭环；llm-bridge 本地复刻了一份 plugin-llm 类型 |
| `packages/plugin-target` | 349 行引擎 | **A**（引擎）/ C（register） | TargetEngine.calc/splitPhases（纯函数） | 引擎零依赖；register.ts 引 shell 类型+lucide | register.ts 是唯一 UI 耦合点 |
| `packages/plugin-cost` | 380 行 | **A**/C 同上 | CostEngine | 同上 | 同上 |
| `packages/plugin-marketing` | 565 行 | **A**/C 同上 | FestivalEngine + **LunarEngine（零依赖农历转换，2024-2030）** | 同上 | 农历数据表 2030 年后需扩 |
| `packages/plugin-prompt` | 384 行 | **A**/C 同上 | BusinessPrompts 15 模板 + 8 家人映射 | 同上 | 模板内容是中文业务语料，场景绑定 |
| `packages/plugin-ai-family` | 数据层+4 页面 | **B** | register + FAMILY_PERSONAS + 4 页面（`src/index.ts`） | shell + family-core（读宪章唯一真相源，`src/data.ts:10`） | 4 页面仅 1 页（FamilyHomePage）被 full 消费 |
| `plugin-monitor / ops / ai / business / dev / admin` | 各 38-87 行页面 | **C** | register + 1-2 个静态页面 | shell（类型）+ lucide | 页面全是硬编码 mock 卡片，无数据接口层 |
| `AIAssistant/`（根目录） | 10 文件 ≈76KB | **B** | AIAssistant 组件（floating/inline 双模式，8 Tab）（`index.ts`） | react + lucide，Tailwind 可选 | **设计为「cp -r 复制」的独立组件**（README 安装说明），项目内零引用；与 shell/AIAssistantHub 是两代并行实现 |
| `docs/packages/family-core` | 12,822 行 src + 29 测试 | **A**（重量级） | ModelRouter + 5 ModelAdapter + MessageBus + AgentOrchestrator + StorageManager(5 层) + 安全(沙箱/审计/限流) + OTel 追踪 | eventemitter3 + ioredis（peerDep）；含 `main.ts` HTTP 服务入口 | 位置在 docs/ 下（反模式）；依赖 Redis 才能全量发挥 |
| `docs/packages/family-ui` | 8 Binding + 6 组件 | **B** | AIAssistant/FamilyChat/FamilyHome + 8 Binding + ThemeManager | react + EventEmitter | private 包；绑定层与其 family 引擎耦合 |
| `docs/packages/ai-assistant` | 包化版 | **B** | 同根 AIAssistant + hooks + i18n 适配（`src/i18n/`） | radix-ui slider（新引入）、@yyc3/i18n-core 可选 | 是 AIAssistant/ 的进化版，但主项目同样零引用 |
| `docs/packages/a2a-adapter` | AgentCard+TaskManager | **A** | A2A 协议（AgentCardRegistry + TaskManager） | eventemitter3 | 独立小包，未见主项目消费 |
| `i18n/packages/i18n-core` | 57 个 TS 文件 | **A** | I18nEngine + LRU + 插件系统 + RTL + 10 语言 locale（`src/index.ts`） | 零运行时依赖（lit 可选 peerDep） | **与主项目零连接**——apps/packages 无任何 import 它的代码 |

> 根 `packages/family-*` 三包被 `pnpm-workspace.yaml` 显式排除（`!packages/family-core` 等），注释声明「docs/packages/\* 为权威实现」；但根 `vitest.config.ts` 的 alias 仍指向根 packages/family-\*。**双源并存且测试走根版、安装走 docs 版**。

---

## ③ plugin-llm 可移植性深析

**定位**：`packages/plugin-llm`（1,653 行实现 + 5 个测试文件 869 行），全工程质量最高的资产。

### Provider 覆盖（`src/providers.ts`）

| Provider | 实现方式 | 默认端点 | 流式协议 |
|----------|---------|---------|---------|
| OpenAI | 基类直出 | api.openai.com/v1/chat/completions | `choices[0].delta.content` |
| Anthropic | 独立实现（system 消息外提、非流式不走 SSE） | api.anthropic.com/v1/messages | `content_block_delta` / `message_stop` |
| Qwen（通义） | 继承 OpenAIAdapter 改端点头 | dashscope 兼容模式 | OpenAI 协议 |
| DeepSeek | 继承 OpenAIAdapter 改端点 | api.deepseek.com | OpenAI 协议 |
| Kimi（Moonshot） | 继承 OpenAIAdapter 改端点 | api.moonshot.cn | OpenAI 协议 |
| custom | 复用 OpenAI 协议任意端点 | 用户指定 | OpenAI 协议 |

工厂 + 注册表模式（`ADAPTER_REGISTRY`），新增 Provider 只需继承 `BaseAdapter`（147 行，模板方法模式：getChatEndpoint/buildRequestBody/parseResponse/parseStreamChunk 四个钩子）。

### 流式 API（`src/sse.ts`，339 行）

- `SSEClient`：fetch-based POST SSE（原生 EventSource 只支持 GET）、指数退避+ jitter 自动重连、AbortController 取消
- `readSSEStream`：标准 `data:/event:/id:/retry:` 字段解析
- 流式故障转移策略明确：仅首连转移，流启动后不切换（`src/router.ts` chatStream 注释）

### 加密 Keyring（`src/crypto.ts` + `src/key-manager.ts`）

- **AES-256-GCM**：PBKDF2 100,000 次迭代派生密钥（OWASP 标准）、每密文独立 16B salt + 12B IV、GCM 完整性校验（`src/crypto.ts` 常量与 EncryptedBlob 结构）
- **三层存储**：localStorage 存 base64 密文 blob → sessionStorage 存会话口令（标签页级）→ 内存 Map 存明文（`src/key-manager.ts` 文件头工作流注释）
- **口令策略**：默认设备指纹（FNV-1a hash of UA+分辨率+时区，`crypto.ts getDeviceFingerprint`），推荐用户主口令（≥8 位，口令=指纹:密码拼接）
- ⚠️ 安全边界自认：代码注释明言指纹模式「安全性较低, 适合本地开发」。指纹是客户端可推算值，同源 XSS 可重建口令。生产应强制主口令或改服务端代理

### 模型路由器（`src/router.ts`）

- 四策略：cost（$/1M tokens 降序）/ latency（P99）/ quality（评分）/ manual
- `DEFAULT_MODEL_META`：13 个模型的价格/上下文/质量/延迟元数据表（2025 快照，**会过期，需运营维护**）
- 非流式请求带故障转移链（retryable 错误逐 provider 降级）；`estimateCost` 成本估算

### 可移植性结论

1. **框架无关性验证**：`grep import` 全部 src 文件，无 react、无 shell import。`package.json` 的 peerDependencies（react + @yyc3/shell）是**声明性冗余**，剥离零成本。
2. **宿主环境要求**：仅需 Web 标准 API（fetch / crypto.subtle / localStorage / sessionStorage）。Node 18+ 有 fetch 和 webcrypto，但 localStorage 需 shim（`key-manager.ts` 已做 `typeof window === "undefined"` 防御，`getDeviceFingerprint` 有 `"yyc3-server-fallback"` 服务端回退）。
3. **配套资产**：`api/chat/stream.ts`（Vercel Serverless LLM 代理：服务端 Key + IP 限流 60 req/min + SSE）是它的服务端互补形态；`packages/shell/src/llm-bridge.ts` 是应用层封装（动态 import + Mock 回退，零静态依赖）。
4. **抽取工作量：约 1-2 人日**——移除冗余 peerDeps、加 tsup/tsc 构建配置产出 ESM、补 Node 环境的 storage adapter 即可独立发包。

---

## ④ 智能体资产复用评估

### family-skills：技能契约的真实深度

- **契约**：`defineSkill(config, execute, validate)` 三元组（`src/registry/SkillManifest.ts`），返回带执行计时和错误捕获的 FamilySkill。契约设计干净，120 行内说清。
- **注册表**：`FamilySkillRegistry`（按 category/owner 双索引、调用统计、导出 SkillExportConfig），EventEmitter 驱动。
- **MCP 桥**：`MCPSkillBridge.ts`（776 行）定义 stdio/http/sse 三传输、MCPToolCall/Result 协议、`child_process spawn`——**协议面真实，但传输实现是骨架级**。
- **技能实态**：54 个技能文件、9 域（nlu/analysis/prediction/recommendation/orchestration/security/quality/creative/exclusive）。抽查：
  - `nlu/multi-lang-nlu.ts`：Unicode 区段检测语种 + 关键词意图抽取——规则引擎，无 LLM
  - `analysis/data-insight.ts`：均值/相关系数/离群点统计——真实算法但教科书级
  - `prediction/lstm-prediction.ts`：简化时序预测
- docs 版多出 `nvidia` 域（cuOpt 求解器/NIM/NeMo Guardrails 等，`docs/packages/family-skills/src/skills/nvidia/`），76 个技能文件 7,393 行。

**判定**：作为「**带统一契约的算法工具箱**」可复用（技能全是纯函数，defineSkill 契约本身是良好抽象）；作为「智能体技能」名不副实——智能含量需消费方自行接 LLM。适合被其他项目吸收做**技能注册与执行的骨架**。

### family-agents：8 位家人与 PDAMR 环

- **PDAMR 框架真实存在**：`src/base/PDAMRCycle.ts` 抽象五阶段（perceive→decide→act→remember→reflect）+ run() 编排 + 记忆淘汰 + 历史快照，结构完整。
- **智能实现深度**：以 `QianHangAgent.ts` 为证——意图分类是中英关键词打分表（`INTENT_KEYWORDS`，约 60 词），置信度 = maxScore/totalScore+0.3 截断 0.95；语义解析是 4 条正则；reflect 是平均置信度统计并建议「考虑引入 LLM 辅助」。**全家族无一处真实 LLM 调用**。
- **人格层**：AgentPersona（语调/特征/系统提示词）+ FamilyEmotionState（温度/参与度）+ family-core 家族宪章（编号/电话/座右铭/情感铭文等叙事字段，中文标识符，`packages/family-core/src/architecture/家族宪章.ts`）。
- docs 权威版更重：`docs/packages/family-core/src/`（12,822 行）含 ModelRouter（OpenAI/Anthropic/Gemini/Ollama 适配）、AgentOrchestrator 工作流引擎、ApprovalGate、StorageManager（local/IndexedDB/memory/file/redis 五层）、SkillSandbox 安全沙箱、OTel 追踪、`main.ts` HTTP 服务入口；29 个测试文件。

**判定**：
- **产品资产**（八位家人档案、人格化命名体系、情感化文案）——高复用价值，直接可作为多 Agent 产品的人格规范模板
- **工程骨架**（PDAMR 抽象、BaseAgent 能力/命令注册）——中高价值，结构清晰可直接扩展
- **智能本身**——低，规则引擎层面，吸收后必须自接 LLM（docs 版的 ModelRouter 可直接补位，但其 ioredis/eventemitter3 依赖和 docs 位置抬高抽取成本）

### plugin-ai-family：UI 数据层的唯一真相源实践

`packages/plugin-ai-family/src/data.ts` 展示了一个值得复用的模式：UI 层（图标/人格描述/默认模型）与权威数据（family-core 宪章）分离，`FAMILY_PERSONAS` 由宪章派生。这是「数据单一真相源」的正确实践，但全项目仅此一处做到了。

---

## ⑤ 复用场景推演

### 场景 1：抽取 plugin-llm 做独立 LLM 网关包 ⭐ 价值最高

**目标**：任何前端/Node 项目获得多 Provider 统一聊天 API + 流式 + 加密 Key 管理 + 成本路由。

| 项 | 内容 |
|----|------|
| 抽取物 | `packages/plugin-llm`（整包）+ 可选 `api/chat/stream.ts`（服务端代理形态）+ `packages/shell/src/llm-bridge.ts`（应用层封装参考） |
| 依赖链 | 零包依赖（仅 Web API）；剥离 peerDeps 声明即可 |
| 改造点 | ① 删 peerDependencies 中 react/@yyc3/shell ② 加构建配置（tsup，因 main 直出 src/index.ts）③ Node 环境补 localStorage shim（防御代码已就位）④ DEFAULT_MODEL_META 价格表抽成可注入配置 |
| 工作量 | **1-2 人日**（含 869 行既有测试迁移） |
| 风险 | 价格元数据过期；指纹口令安全边界需在文档中明示 |

### 场景 2：抽取 shell + plugin 模式搭新管理后台骨架

**目标**：新管理后台直接获得浮窗 AI Hub、欢迎页、事件总线、命名空间存储、错误边界、主题系统。

| 项 | 内容 |
|----|------|
| 抽取物 | `packages/shell`（除 llm-bridge 可选）+ SystemRegistration 契约 |
| 依赖链 | react + lucide-react + react-router-dom（仅类型层）+ 可选 plugin-llm（动态加载） |
| 改造点 | ① **补全插件注册闭环**——实现 SystemRegistry 消费各包 register()（当前全仓无消费者，需 0.5-1 天）② AIAssistantHub（643 行）按需拆 Tab ③ 换主题 tokens（theme.ts 单一 modern 主题） |
| 工作量 | **3-5 人日**（含补 registry 与依赖治理） |
| 附注 | 若只要「AI 浮窗」不要底座，可直接 `cp -r AIAssistant/`（README 官方支持的用法，双模式 8 Tab，零 workspace 依赖）或用其包化版 `docs/packages/ai-assistant` |

### 场景 3：抽取 family-skills 做智能体技能库 / 算法工具箱

**目标**：任何 Agent 项目获得技能注册-校验-执行-统计骨架 + 54 个现成纯函数技能。

| 项 | 内容 |
|----|------|
| 抽取物 | `packages/family-skills`（根版，轻量）或 `docs/packages/family-skills`（含 nvidia 域 76 技能）|
| 依赖链 | family-agents 的**类型**（FamilySkill/SkillCategory/SkillResult）→ 可将约 80 行类型定义内联进包内解除依赖；MCPSkillBridge 依赖 node:child_process（浏览器环境需排除） |
| 改造点 | ① 内联 FamilyTypes ② 按运行环境裁剪 MCP 桥 ③ 技能按需精选（54 个非全有用） |
| 工作量 | **2-3 人日** |
| 附注 | 配合场景 1：技能的 execute 目前是纯函数，接 LLM 网关后可升级为智能技能 |

### 场景 4：抽取 family-core + family-agents 做多 Agent 人格化底座

**目标**：新 Agent 家族产品获得人格档案规范 + PDAMR 认知环骨架 + 情感状态模型。

| 项 | 内容 |
|----|------|
| 抽取物 | `packages/family-core`（家族宪章+五维+五环，零依赖）+ `packages/family-agents`（根版轻量）；重型需求取 `docs/packages/family-core`（编排/模型路由/安全/追踪全家桶） |
| 依赖链 | 轻量链：family-core ← family-agents（peerDep，实际只取 FAMILY_PROFILES 数据）。重量链：eventemitter3 + ioredis + OTel 可选 |
| 改造点 | ① 家人档案换成自家角色（保留档案 schema：id/编号/名号/角色/座右铭/主题色/情感铭文 结构优秀）② PDAMR 各阶段接入自家 LLM（当前是关键词规则）③ 中文标识符按团队习惯决定保留与否 |
| 工作量 | 轻量 **2-3 人日**；docs 重量版 **5-8 人日**（含 Redis/部署面） |

### 场景 5：抽取 4 大业务引擎做连锁经营计算内核

**目标**：零售/连锁/门店类系统直接获得目标测算、盈亏分析、节日营销日历、提示词模板。

| 项 | 内容 |
|----|------|
| 抽取物 | `packages/plugin-target`（X 公式营收测算）、`plugin-cost`（盈亏平衡）、`plugin-marketing`（FestivalEngine + **零依赖农历引擎**）、`plugin-prompt`（15 中文业务模板） |
| 依赖链 | 引擎本体零依赖；剥离 `register.ts`（各 36-38 行，唯一 UI 耦合）后即纯函数包 |
| 改造点 | ① 删 register.ts 或改为可选导出 ② LunarEngine 数据表 2030 年后扩展（`src/lunar-engine.ts` LUNAR_DATA）③ 125 个既有测试随包迁移 |
| 工作量 | **1-2 人日** |

### 场景 6（可选）：抽取 i18n-core 做国际化底座

`i18n/packages/i18n-core` v2.0.1：零依赖、10 语言、LRU 缓存、插件化、RTL 支持，代码质量与完成度高。**但它是主项目零消费的孤岛资产**（apps/packages 无 import）。若新项目需要 i18n，1 人日内可独立启用。注意 `i18n/` 目录混入了 openclaw 生态包（clawdbot/moltbot/memory-host-sdk），抽取时只取 `i18n/packages/i18n-core` 子目录。

---

## ⑥ 复用风险与建议

### 风险清单

| # | 风险 | 证据 | 影响 |
|---|------|------|------|
| R1 | **双源镜像**：family-\* 存在根版（轻量）与 docs/packages 版（权威）两套，workspace 安装走 docs 版、vitest 测试走根版 | `pnpm-workspace.yaml:2-8` 注释与排除项；`vitest.config.ts` alias 指向根版 | 复用者不知取哪份；两边漂移无守护 |
| R2 | **full 依赖声明不完整**：import 了 8 个 @yyc3 包但 package.json 零声明 | `apps/full/package.json` vs `apps/full/src/App.tsx:5-6,62-68` | 该模式被复制即碎；pnpm 严格模式下 install 后无法解析 |
| R3 | **mock 数据硬编码遍布**：QPS 3.8k、7/8 节点、入住率 50% 等写死在组件里，`Math.random()` 冒充实时数据 | `apps/standalone-monitor/src/App.tsx`（STATS/ALERTS/random CPU）；`packages/plugin-*/src/pages/*.tsx` | plugin 页面层复用价值≈0，复用者需自建数据层 |
| R4 | **SystemRegistration 契约未闭环**：register() 无消费者、routes 空壳、i18n label 无翻译挂载 | ①②节证据 | 「插件化架构」宣称强于实态；直接搬 shell 会发现没有插件宿主 |
| R5 | **两代 AI 助理并行**：根 `AIAssistant/`（v3.0 全功能）与 `shell/AIAssistantHub`（简版）+ `docs/packages/ai-assistant`（包化）三份实现并存 | 各自 README 与零交叉引用 | 复用者需三选一，长期维护成本三倍 |
| R6 | **i18n/ 目录异物**：内含 openclaw 生态（clawdbot shim、@openclaw/memory-host-sdk）与主项目无关 | `i18n/packages/clawdbot/index.js`（`export * from "openclaw"`） | 误导复用者以为主项目依赖 openclaw |
| R7 | **plugin-llm 价格表过期**：DEFAULT_MODEL_META 是 2025 静态快照 | `src/router.ts` 注释「公开价格表, 2025 数据」 | cost 路由决策随时间失真 |
| R8 | **指纹口令安全边界**：设备指纹可被同源脚本推算 | `src/crypto.ts getDeviceFingerprint` + key-manager 自认注释 | 生产环境必须主口令或服务端代理（api/chat/stream.ts 形态） |
| R9 | **monorepo 无构建产物**：所有包 main 直出 src/index.ts | 各 package.json `"main": "src/index.ts"` | 复用方必须处理 TS 编译；无法直接 npm 发布 |

### 建议

1. **立即可做**：将 `plugin-llm` 独立发包（最高价值/成本比），顺带把 `api/chat/stream.ts` 的服务端代理形态文档化为部署选项。
2. **合并双源**：family-\* 根版与 docs 版二选一为唯一权威（建议根版升位，docs 版降级为发布产物），否则场景 3/4 的复用者将持续踩坑。
3. **补全插件闭环**：在 shell 实现 SystemRegistry（消费 register()、聚合 routes/menuItems/i18n），让 full 的手写 lazy import 变成数据驱动——这是「shell+plugin 模式」能否对外复用的分水岭。
4. **砍掉或合并冗余 App**：6 个 standalone-\* 除 ai-family 外是 mock 演示双份代码，建议要么让它们真正 import plugin 页面（复用），要么明确其「demo」定位并从复用叙事中剔除。
5. **数据层留白**：若复用 plugin 页面骨架，先定义 `DataAdapter` 接口替换硬编码常量，否则页面层复用无意义。
6. **AI 助理三选一**：保留 `docs/packages/ai-assistant`（最完整）或根 `AIAssistant/`（最独立）其一，shell/AIAssistantHub 维持轻量定位并在 README 明示分工。

---

## 附：复用价值排序（总览）

| 排名 | 资产 | 价值密度 | 一句话理由 |
|:---:|------|:---:|-----------|
| 1 | `packages/plugin-llm` | ★★★★★ | 零框架依赖、5 Provider、流式+加密+路由全真实实现、869 行测试护航，1-2 天可独立成包 |
| 2 | `packages/family-skills`（defineSkill 契约 + 54 纯函数技能） | ★★★★☆ | 契约干净、技能即插即用，是智能体技能库的正确骨架 |
| 3 | `packages/family-core`（家族宪章 + 五维五环）+ `family-agents`（PDAMR 骨架） | ★★★★☆ | 人格档案 schema 与认知环抽象优秀，智能层需自接 LLM |
| 4 | `packages/shell`（EventBus/Storage/Hub/Welcome/ErrorBoundary） | ★★★☆☆ | 组件可直接用，但插件注册契约未闭环拉低整体复用度 |
| 5 | 4 大业务引擎（target/cost/marketing/prompt，含零依赖农历引擎） | ★★★☆☆ | 125 个测试的纯函数内核，行业场景匹配即高价值 |
| 6 | `AIAssistant/`（v3.0 独立组件）与 `docs/packages/ai-assistant` | ★★★☆☆ | 官方支持 cp -r 复制，双模式 8 Tab，但与 Hub 三代并存需治理 |
| 7 | `i18n/packages/i18n-core` | ★★☆☆☆ | 质量不差的孤岛资产，主项目自己都没用上 |
| 8 | `docs/packages/family-core`（重量版全家桶） | ★★☆☆☆ | 12.8K 行能力全面但依赖重、位置反常，抽取成本最高 |
| 9 | plugin-\* 页面层（monitor/ops/ai/business/dev/admin 的 pages） | ★☆☆☆☆ | 硬编码 mock 卡片，复用需重写数据层 |
