# 01 · 架构与代码实况审计报告

> 审计对象：`/Users/yanyu/YYC-Cube/YYC3-CloudPivot-Intelli-Matrix-Dev`
> 审计日期：2026-09-16 · 审计方式：只读（未修改项目任何文件，未运行 pnpm install）
> 所有数字均来自实际执行的命令输出（find/wc -l/grep/vitest 实跑/tsc 实跑），可复现。

---

## 〇、执行摘要

这是一个 **pnpm monorepo**（lockfile v9.0），名义上 = 16 个 packages + 8 个 apps + 6 个 docs/packages = 30 个模块目录。**核心矛盾**：`family-*` 三件套存在「根目录轻量镜像」与 `docs/packages/` 完整引擎**双实现**，且两边的消费路径不同——**运行时用 docs 版，测试/类型检查用根目录版**。README 多处数字无法复现（799 tests、80+261 技能、LLM Provider 清单等）。四个业务引擎（Target/Cost/Festival/Prompt）已实现且有测试，但**没有任何 app 路由接入它们**。六个"界面型"插件实为 58–110 行的单页占位实现。仓库中还混入两个孤立体外宇宙（`i18n/` 5 个包、顶层 `AIAssistant/` 目录）。

---

## 一、模块清单与真实规模

### 1.1 packages/（16 个包，其中 3 个被 workspace 排除）

| 包名 | 版本 | src 文件数 | src 行数(非测试) | 测试文件 | 测试数(实跑) | 依赖（peer/workspace） | 完成度评估 |
|------|------|-----------|------------------|----------|--------------|------------------------|------------|
| shell | 1.1.0 | 9 | 1,412 | 9 | 73 | react, lucide-react, react-router-dom, **@yyc3/plugin-llm** | ✅ 完整（核心外壳 + Hub + LLMBridge） |
| plugin-llm | 1.0.0 | 8 | 1,653 | 5 | 57 | @yyc3/shell | ✅ 完整（5 Provider 适配 + SSE + AES-256 + 路由器） |
| plugin-marketing | 1.0.0 | 6 | 565 | 1 | 41 | @yyc3/shell | ✅ 引擎完整（Festival+Lunar+festivals） |
| plugin-cost | 1.0.0 | 4 | 435 | 1 | 30 | @yyc3/shell | ✅ 引擎完整 |
| plugin-ai-family | 1.1.0 | 7 | 415 | 0 | 0 | @yyc3/shell, **@yyc3/family-core** | ⚠️ UI 完整（4 页面）但零测试 |
| plugin-prompt | 1.0.0 | 4 | 384 | 1 | 19 | @yyc3/shell | ✅ 引擎完整 |
| plugin-target | 1.0.0 | 4 | 349 | 2 | 35 | @yyc3/shell | ✅ 引擎完整 |
| plugin-business | 1.0.0 | 3 | 110 | 0 | 0 | @yyc3/shell | ⬜ 占位（单页 HotelConsole） |
| plugin-ai | 1.0.0 | 3 | 77 | 0 | 0 | @yyc3/shell | ⬜ 占位（单页 AISuggestion） |
| plugin-admin | 1.0.0 | 3 | 64 | 0 | 0 | @yyc3/shell | ⬜ 占位（单页 Audit） |
| plugin-monitor | 1.0.0 | 3 | 60 | 0 | 0 | @yyc3/shell | ⬜ 占位（单页 Dashboard） |
| plugin-ops | 1.0.0 | 3 | 59 | 0 | 0 | @yyc3/shell | ⬜ 占位（单页 OperationCenter） |
| plugin-dev | 1.0.0 | 3 | 58 | 0 | 0 | @yyc3/shell | ⬜ 占位（单页 DesignSystem） |
| family-core（被排除） | 0.1.0 | 5 | 935 | 1 | 6 | 无 | ⚠️ 仅 architecture/ 子集（镜像） |
| family-agents（被排除） | 0.1.0 | 13 | 1,831 | 1 | 10 | @yyc3/family-core（声明但 src 未用） | ⚠️ 轻量自足变体（镜像） |
| family-skills（被排除） | 0.1.0 | 58 | 6,755 | 0 | 0 | @yyc3/family-agents, @yyc3/family-core | ⚠️ 无 NVIDIA 桥接的子集（镜像） |

**shell 真实导出面**（`src/index.ts`，9 行 barrel）：`EventBus/eventBus/Events`、`createSystemStorage/storage/StorageKeys`、`WelcomePage`、`AIAssistantHub`、`ErrorBoundary`、`getTheme/getSystemTheme/THEME_MODERN/AI_FAMILY_STYLES`、`LLMBridge/getLLMBridge`、类型 `SystemRegistration/MenuItem/HubCommand` 等。核心模块行数：event-bus 75、storage 79、theme 113、types 53、ErrorBoundary 41、WelcomePage 105、AIAssistantHub 643、llm-bridge 294。

### 1.2 docs/packages/（6 个包 — **不是文档，是可运行的完整工程包**）

| 包名 | src 文件数 | src 行数 | 测试 | 实跑结果 | 产物 | 关键依赖 |
|------|-----------|----------|------|----------|------|----------|
| family-core | 50 | 12,822 | 33 文件/6,512 行 | **540 passed** | dist/（CJS 编译产物已存在） | eventemitter3, ioredis, OTel(可选) |
| family-skills | 80 | 10,068 | 8 文件/2,147 行 | **121 passed + 26 skipped** | dist/ 已构建 | js-yaml, @yyc3/family-agents/core |
| family-agents | ~13 | 1,793 | 4 文件/783 行 | **76 passed** | dist/ 已构建 | @yyc3/family-core（真实 import） |
| family-ui | 64 | 20,016 | 3 文件 | **39 passed**（默认配置；含组件配置共 48 个 test 块） | dist/ + vite 构建 | react 19.2.7, zustand, recharts, react-dnd, motion 等 |
| ai-assistant | 39 | 2,741 | — | —（未配置测试实跑） | dist/（tsup 构建） | 独立组件库 |
| a2a-adapter | 4 | 695 | 2 文件 | **23 passed** | dist/ 已构建 | eventemitter3 |

全部 6 个目录均有 `package.json` + `node_modules`（真实安装过依赖），其中 5 个有 `dist/` 编译产物。**性质判定：这是藏在 docs/ 目录名下的第二个 workspace**（pnpm-workspace.yaml 将 `docs/packages/*` 纳入 workspace 并排除根目录 family-*）。

### 1.3 apps/（8 个应用，全部为薄壳）

| 应用 | src 行数 | 端口 | 说明 |
|------|----------|------|------|
| full | 112 | 3100 | 7 系统全开（monitor/ops/ai/ai-family/business/dev/admin） |
| standalone-ai-family | 167 | 3112 | 唯一有 E2E 覆盖的应用 |
| standalone-monitor | 126 | 3113 | 单系统 |
| standalone-ops | 95 | 3114 | 单系统 |
| standalone-ai | 105 | 3115 | 单系统 |
| standalone-dev | 96 | 3116 | 单系统 |
| standalone-admin | 109 | 3117 | 单系统 |
| standalone-business | 103 | 3118 | 单系统 |

8 个 app 合计约 913 行，均为单 App.tsx 薄壳，**零测试**。每个 app 的 vite.config 用 alias 直连 `packages/*/src`（不走 dist）。

### 1.4 仓库内孤立体（不被 workspace、不被任何代码引用）

| 目录 | 规模 | 状态 |
|------|------|------|
| `i18n/`（5 个包：i18n-core、memory-host-sdk、clawdbot、moltbot、plugin-package-contract） | 510 个 test 块（未实测 src 总量） | ❌ 不在 pnpm workspace 模式内（`i18n/` 不匹配任何 packages 通配）、根代码零引用 |
| 顶层 `AIAssistant/`（10 文件） | 1,275 行 | ❌ 无任何 import 引用 |
| `api/chat/stream.ts` | 288 行 | ✅ Vercel Serverless（vercel.json rewrite 排除 /api，实际生效） |

---

## 二、宣称 vs 实测对照表

| README 宣称 | 实测结果 | 判定 |
|-------------|----------|------|
| 12 个插件包 | packages/plugin-* 恰好 12 个 | ✅ 一致 |
| 7 大子系统 | full app 路由 7 个系统（monitor/ops/ai/ai-family/business/dev/admin） | ✅ 一致 |
| 4 大业务引擎 | TargetEngine/CostEngine/FestivalEngine/PromptEngine 均存在且有测试 | ✅ 存在（但未接入任何路由，见④） |
| 30 modules | 16 packages + 8 apps + 6 docs/packages = 30 | ✅ 一致（按此口径） |
| 8 standalone apps | 8 个 | ✅ 一致 |
| 测试总数 **799 通过 / 26 跳过** | 根 `pnpm test`（vitest include=packages/**+apps/**）实跑 = **271 passed / 0 skipped**；docs 各包分别实跑 540+76+121(+26 skip)+23+39；**全仓合计 1,070 passed + 26 skipped**。799 无法用仓库内任何单一命令复现（最接近分解：271+540=811） | ❌ 数字过期/口径不明 |
| 插件矩阵测试合计 **996** | 实测同口径合计 = 73(shell)+57(llm)+41+30+35+19+540+121+76+39+23 = **1,054** | ❌ 不一致 |
| shell 67 tests | 实测 73 | ⚠️ 偏差 +6 |
| plugin-llm 5 tests | 实测 **57**（crypto 10+key-manager 11+providers 14+router 13+sse 9） | ❌ 严重低估 |
| AI Family「8 家人」 | 8 个 Agent 文件确认（QianHang/Thinker/Prophet/Bole/TianShu/Guardian/Grandmaster/Grace） | ✅ 一致 |
| 技能「80 基础 + 261 NVIDIA 桥接」 | 实测 defineSkill 调用：根镜像 **51** / docs 版 **69**（含 16 专属）；NVIDIA 静态目录 `nvidia-catalog.ts` 实数 **202 条 sk() / 32 组件**（目录头注释自称 198，docs/NVIDIA-Skills.md 称 202）。**80+261 两个数字都对不上** | ❌ 显著夸大 |
| TypeScript 0 错误 | `npx tsc --noEmit` 实跑 exit 0 | ✅ 属实（但注意 tsconfig 只覆盖 packages/apps/api，**docs/packages 不在根类型检查范围内**） |
| LLM「OpenAI·Claude·Gemini·Ollama·DeepSeek·Azure」（架构图） | plugin-llm/providers.ts 实际实现 **OpenAI(兼容 Azure 协议)/Anthropic/Qwen/DeepSeek/Kimi**——无独立 Gemini/Ollama 适配器 | ❌ 图实不符 |
| LLM「AES-256-GCM Key 存储 / SSE / 4 路由策略」 | crypto.ts 161 行 AES-256-GCM、sse.ts 339 行、router.ts cost/latency/quality/manual | ✅ 属实 |
| CI（GitHub Actions） | `.github/workflows/ai-eco-ci.yml` 存在（Node 20 + pnpm 9.15.0） | ✅ 存在（但只跑根 271 测试，docs 侧 800+ 测试不在 CI 内） |
| Playwright E2E | 1 个 spec（welcome-flow），7 个 test，仅覆盖 standalone-ai-family | ⚠️ 存在但极薄 |
| Phase 2「全系统 80%」 | 6 个界面型插件为 58–110 行单页占位 | ❌ 与"80%"相距甚远 |

### 技术栈版本实测（声明 vs 实际安装）

| 依赖 | 声明 | 实际安装 | 判定 |
|------|------|----------|------|
| react | ^19.0.0 | **19.2.7**（apps/full node_modules 实测） | ✅ 大版本一致 |
| vite | ^6.0.0 | **6.4.3** | ✅ |
| vitest（根） | ^3.2.6 | **3.2.6** | ✅ |
| vitest（docs 包） | ^4.1.8 | **4.1.10** | ⚠️ 根与 docs **双大版本**并存 |
| typescript | ^5.7.0（根）/ ^5.9.0（docs） | **5.9.3** | ✅（5.7+ 成立） |
| lucide-react | ^0.500.0（根）/ ^1.17.0（family-ui） | store 中 **0.500.0 与 1.26.0 并存** | ⚠️ 跨大版本分裂 |
| pnpm | ≥9（CI 钉 9.15.0） | pnpm-workspace.yaml 使用 pnpm 11+ 专属字段（onlyBuiltDependencies）且本地有未提交的 `allowBuilds` 占位修改 | ⚠️ 版本治理混乱 |
| package-lock.json | — | **根目录同时存在 package-lock.json 与 pnpm-lock.yaml** | ❌ 违反自身"禁止 npm"红线 |

---

## 三、family-* 双实现矛盾：证据与「谁是真权威」判断

### 3.1 workspace 层证据

`pnpm-workspace.yaml`（已提交版本）：
```yaml
packages:
  # docs/packages/* 为 family-* 包的权威实现（含完整引擎+架构常量）
  - "docs/packages/*"
  - "apps/*"
  - "packages/*"
  - "!packages/family-core"
  - "!packages/family-agents"
  - "!packages/family-skills"
```

### 3.2 两侧真实差异（逐项 diff 实测）

| 维度 | packages/family-core（根） | docs/packages/family-core | 差异性质 |
|------|---------------------------|---------------------------|----------|
| src 文件 | 5（仅 architecture/） | 50（architecture+orchestration+model+engine+security+storage+tracing+trust+sovereignty+platform+config+deps+types） | docs 多 11 个目录 |
| src 行数 | 935 | 12,822 | 13.7 倍 |
| 测试 | 1 文件 / 6 tests | 33 文件 / **540 tests**（实跑通过） | 90 倍 |
| 构建 | 无 tsconfig/dist | tsconfig + **dist/ CJS 产物已编译**（含 RedisAdapter 等） | 仅 docs 可作为包消费 |
| 依赖 | 零 | eventemitter3、ioredis、OTel(可选) | |
| architecture/ 三引擎文件 | 与 docs **逐字节一致**（仅 import 后缀差 `.js`） | 同左 | 同源拷贝 |

| 维度 | packages/family-agents（根） | docs/packages/family-agents |
|------|---------------------------|-----------------------------|
| src | 13 文件 / 1,831 行 | ~13 文件 / 1,793 行 |
| 测试 | 1 文件 / 10 tests | 4 文件 / **76 tests** |
| 实现路线 | **自足轻量版**：FamilyBaseAgent 注释明言"不依赖重型编排框架(eventemitter3/ioredis)"，src 内零 `@yyc3/family-core` import（尽管 package.json 声明了 peerDep） | **重型版**：FamilyBaseAgent/members 真实 `import { BaseAgent } from '@yyc3/family-core'`，方法名也不同（`setupFamilyCapabilities` vs 根版 `setupCapabilities`） |
| PDAMRCycle.ts | 与 docs **完全一致**（diff=0） | 同左 |

| 维度 | packages/family-skills（根） | docs/packages/family-skills |
|------|---------------------------|-----------------------------|
| src | 58 文件 / 6,755 行 | 80 文件 / 10,068 行 |
| 测试 | **0** | 121 passed + 26 skipped |
| 独有内容 | — | `skills/nvidia/` 整目录 12 文件（1,709 行：catalog 480 行/202 技能、bridge 271 行、10 个封装 skill）、analysis 补 2 文件、orchestration/prediction/quality/recommendation/security 各补 1 文件 |
| 共有文件 | 与 docs **仅差 import 后缀 `.js`**（抽样 diff：qianhang-skills、emotion-detect 均只差 1 行）；registry/ 三文件（336/776/62 行）逐字节一致 | 同左 |

### 3.3 消费路径分裂（关键证据）

| 消费场景 | 解析目标 | 证据 |
|----------|----------|------|
| **运行时**（vite dev/build） | **docs/packages/family-core** | `packages/plugin-ai-family/node_modules/@yyc3/family-core → ../../../../docs/packages/family-core`（symlink 实测）；docs 版 main 指 `./dist/index.js`（CJS 产物） |
| **根测试**（`pnpm test`） | **packages/family-core/src**（根镜像） | vitest.config.ts alias：`"@yyc3/family-core": packages/family-core/src` |
| **根类型检查**（`tsc --noEmit`） | **packages/family-core/src**（根镜像） | tsconfig.json paths 同上；且 include 不含 docs/** |
| app 内 vite | 不 alias family-core → 走 node_modules → **docs dist** | apps/*/vite.config.ts 只 alias shell 与各 plugin，无 family-core |

**插件接缝处的类型安全破洞**：`packages/plugin-ai-family/src/data.ts` 通过 `(FamilyCoreNS as any).八位家人` 从 CJS 构建里取数据——`as any` 绕过类型检查，正是双实现接缝的产物。

### 3.4 判断：哪边是真权威？

**docs/packages/family-* 是事实权威（de facto authority）**，证据链：
1. pnpm workspace 显式排除根目录三件套、纳入 docs/packages/*；
2. 运行时依赖解析（node_modules symlink）指向 docs 版及其 dist 产物；
3. 根目录三包自己的 README 白纸黑字：「生产构建位于 docs/packages/family-core/…本目录为 monorepo 引擎层的源码镜像」；
4. 测试体量（540/76/121 vs 6/10/0）与编译产物只在 docs 侧存在。

**但根镜像并未退役**：根 `pnpm test` 与 `tsc --noEmit`（README 的两条质量红线）经由 alias 跑在**镜像**上——也就是说，**质量门禁验证的代码 ≠ 实际运行的代码**。family-agents 两侧已出现结构性分叉（自足版 vs 继承 BaseAgent 版），证明「镜像」已在漂移，双真相源风险已经兑现，而非理论风险。

---

## 四、核心引擎实况

| 引擎 | 真实位置 | 行数 | 测试覆盖 | 接入 app？ |
|------|----------|------|----------|------------|
| TargetEngine | packages/plugin-target/src/target-engine.ts | 134 | 35（target-engine 27 + engine-integration 8） | ❌ register.ts `routes: []`，注释"Phase 2 填充实际页面组件"；全仓无任何 app 路由引用 plugin-target |
| CostEngine | packages/plugin-cost/src/cost-engine.ts | 204 | 30 | ❌ 同上 |
| FestivalEngine | packages/plugin-marketing/src/festival-engine.ts | 135 | 41 | ❌ 同上 |
| LunarEngine | packages/plugin-marketing/src/lunar-engine.ts | 158 | （并入 41） | ❌ |
| BusinessPrompts | packages/plugin-prompt/src/business-prompts.ts | 291 | 19 | ❌ |
| LLMBridge（Hub 侧） | packages/shell/src/llm-bridge.ts | 294 | 7 | ✅ AIAssistantHub 使用；动态加载 plugin-llm，无 Key 时回退 Mock |
| LLMBridge（provider 侧） | packages/plugin-llm/src/*（providers 301 + sse 339 + router 209 + crypto 161 + key-manager 286 + base-adapter 147 + types 117） | 1,653 | 57 | ✅ 经 shell 动态加载 |
| FamilySkillRegistry | packages/family-skills/src/registry/FamilySkillRegistry.ts（docs 同文件逐字节一致） | 336 | docs 侧 skill-registry 系列测试 | ❌ 无 app 消费 |
| MCPSkillBridge | packages/family-skills/src/registry/MCPSkillBridge.ts | 776 | docs 侧 mcp-transport.test.ts | ❌ 无 app 消费 |
| ModelRouter / MultiModelManager / MessageBus / AgentOrchestrator / ApprovalGate | **仅存在于 docs/packages/family-core**（model/ 2,841 行、orchestration/ 3,433 行、engine/ 822 行） | 7,096（三目录合计） | 540（family-core 套件） | ❌ 前端 app 未消费（Node 侧引擎，main.ts 可 `node dist/main.js`） |

**注意**：README 引擎表把「LLMBridge/EventBus/FamilySkillRegistry/MCPSkillBridge」与四大业务引擎并列，但 LLM 实际存在**三层抽象**（shell/llm-bridge → plugin-llm 栈 → docs/family-core 的 ModelRouter/MultiModelManager），互不复用。

---

## 五、架构风险与债务清单

1. **【高】family-* 双真相源且消费路径分裂**：测试/类型检查跑根镜像、运行时跑 docs dist（见③）。family-agents 两侧已结构性分叉。任何只改一侧的修复都会造成隐性漂移。
2. **【高】README 数字体系失真**：799/996 两套自称数字均无法复现（实测 271 或全仓 1,070+26）；「80+261 技能」实测 51/69+202；LLM Provider 清单图实不符（宣称含 Gemini/Ollama/Azure，实为 Qwen/Kimi）。文档信任度受损。
3. **【高】docs/ 目录名与内容性质冲突**：docs/packages 是带 node_modules、dist 产物、1,000+ 测试的**第二 workspace**，却叫"docs"。审计者、贡献者、工具链都会被误导（例如 CI 就"忘了"它）。
4. **【高】CI 质量门禁覆盖不全**：ai-eco-ci.yml 只跑根 271 测试；docs 侧 540+76+121+23+39=799 个测试**恰好**没有任何 workflow 执行（讽刺的是 799 正是 README 徽章数——疑似曾是"全量"口径，现已在 CI 外）。
5. 【中】**四大业务引擎是"孤岛库"**：实现+测试完好，但无任何 app 路由/页面接入（register.ts routes 为空），业务价值未兑现。
6. 【中】**界面型插件为占位实现**：monitor/ops/ai/business/dev/admin 六包合计仅 428 行，各一页，零测试；与「全系统 80%」宣称不符。
7. 【中】**lint 红线是空操作**：`lint: echo 'lint: ok (add ESLint config)'`——CI 门禁中的 Lint 步骤形同虚设。
8. 【中】**工作树脏 + 构建配置带占位符**：pnpm-workspace.yaml 有未提交修改，且写入字面占位文本 `set this to true or false`（allowBuilds），当前状态下新版 pnpm 无法消费该配置。
9. 【中】**版本分裂**：vitest 3（根）与 4（docs）并存；lucide-react 0.5/1.x 两个大版本并存；CI 钉 pnpm 9.15.0 而 workspace 文件用 pnpm 11+ 特性；package-lock.json 与 pnpm-lock.yaml 并存（违反自家"禁止 npm"红线）。
10. 【低】**孤立体外宇宙**：i18n/（5 包、510 test 块）与顶层 AIAssistant/（1,275 行）零引用，徒增仓库体积与审计噪音。
11. 【低】**shell ↔ plugin-llm 循环 peer 依赖**：shell peerDep plugin-llm，全部插件又 peerDep shell；靠 llm-bridge.ts 动态 import 化解，能跑但拓扑不健康。
12. 【低】**`(FamilyCoreNS as any)` 类型破洞**：plugin-ai-family ↔ family-core CJS 接缝绕过类型检查。
13. 【低】**E2E 覆盖极薄**：仅 1 spec / 7 test，只测 standalone-ai-family 欢迎页流程。

---

## 六、复用性初评

| 模块 | 复用价值 | 评估 |
|------|----------|------|
| shell（EventBus/Storage/Theme/ErrorBoundary） | ★★★★☆ | 约 360 行核心零外部依赖（纯 peer），接口清晰（SystemRegistration），最值得抽为独立 npm 包 |
| shell/AIAssistantHub + LLMBridge | ★★★☆☆ | 643+294 行，React 组件 + 渐进增强桥接（无 Key 回退 Mock），可复用但耦合 yyc3 主题令牌 |
| plugin-llm | ★★★★☆ | 1,653 行自足、57 测试、5 Provider+SSE+AES-GCM+路由策略，可直接剥离复用 |
| 四大业务引擎（target/cost/marketing/prompt） | ★★★★☆ | 纯函数、零 UI 依赖、均有测试；但因从未接入 UI，"业务正确性"只被单测背书 |
| docs/family-core | ★★★☆☆ | 工程等级高（编排/路由/安全/追踪），但依赖 ioredis 等重型依赖，是 Node 侧引擎而非浏览器件；architecture/ 子集（家族宪章 935 行）可独立移植 |
| docs/family-skills + NVIDIA 桥接 | ★★★☆☆ | 202 条 NVIDIA 静态目录可离线复用；但依赖外部 docs/skills/ 仓库克隆（当前缺失 → 26 测试跳过） |
| 8 个 apps | ★☆☆☆☆ | 薄壳模板，复用意义有限 |
| 6 个界面型插件 | ★☆☆☆☆ | 占位页，无复用价值 |
| i18n/、顶层 AIAssistant/ | ☆☆☆☆☆ | 孤立体，需先决定去留 |

---

## 附：本次审计实测命令口径备忘

- 行数：`find <pkg>/src -name "*.ts" -o -name "*.tsx" | grep -v __tests__ | xargs wc -l`
- 测试数：根 `npx vitest run`（30.75s，271/271 通过）+ docs 各包分别 `npx vitest run`（540/76/121+26skip/23/39）
- 类型检查：`npx tsc --noEmit` exit 0
- defineSkill 计数：grep "defineSkill(" 根=51 / docs=69；NVIDIA sk() 计数=202（node 正则实测）
- git：`/opt/homebrew/bin/git`，HEAD=07c7343（2026-07-24），工作树有 1 个未提交修改（pnpm-workspace.yaml）
