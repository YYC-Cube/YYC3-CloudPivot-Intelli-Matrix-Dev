# YYC³ 任务看板 — Phase 0-1 详细任务列表

> **文档版本**：2.0.0
> **发布日期**：2026-07-16
> **最后校准**：2026-07-17（Phase 0-1 全量完成 + Phase 2-3 同步交付）
> **配套文档**：[YYC3-全链路智能应用-阶段节点设计落地大纲](./YYC3-全链路智能应用-阶段节点设计落地大纲.md)

---

## 进度同步机制

| 频率 | 方式 | 内容 |
|------|------|------|
| 每任务完成 | TodoWrite 更新 | 标记完成 + 写入 summary |
| 每Phase完成 | 里程碑报告 | 验收标准逐项核对 |
| 异常阻塞 | 即时同步 | 记录风险并调整计划 |

---

## 全局进度看板（2026-07-17 校准，含 Phase 4 完成）

```
Phase 0  ████████████████████ 100% ✅ 已超额完成（6/6 +9 额外插件包）
Phase 1  ████████████████████ 100% ✅ 4 引擎全量落地（30/30 任务）
Phase 2  ████████████████████ 100% ✅ 8 App + Hub 命令联动
Phase 3  ████████████████████ 100% ✅ 质量工程完成 (294 tests)
Phase 4  ████████████████████ 100% ✅ LLM + SSE + AES + Vercel + Docker + CI/CD
```

---

## Phase 0：基线对齐 ✅ 100%（已超额完成）

| ID | 任务名称 | 负责人 | 起止时间 | 优先级 | 任务描述 | 状态 |
|----|----------|--------|----------|--------|----------|------|
| P0-1 | 创建 plugin-target 包骨架 | AI实施专家 | Day 1 | P0 | 创建 `packages/plugin-target/` 目录结构，含 package.json、register.ts、types.ts | ✅ 完成 |
| P0-2 | 创建 plugin-cost 包骨架 | AI实施专家 | Day 1 | P0 | 创建 `packages/plugin-cost/` 目录结构，含 package.json、register.ts、types.ts | ✅ 完成 |
| P0-3 | 创建 plugin-marketing 包骨架 | AI实施专家 | Day 1 | P0 | 创建 `packages/plugin-marketing/` 目录结构，含 package.json、register.ts、types.ts | ✅ 完成 |
| P0-4 | 创建 plugin-prompt 包骨架 | AI实施专家 | Day 1 | P0 | 创建 `packages/plugin-prompt/` 目录结构，含 package.json、register.ts、data/ | ✅ 完成 |
| P0-5 | 文档②HTML组件接口定义 | AI实施专家 | Day 2 | P1 | 将1920行HTML的5个步骤提取为 TypeScript 接口定义 | ✅ 完成 |
| P0-6 | 更新 PRODUCTION-PLAN.md | AI实施专家 | Day 2 | P2 | 在生产计划中新增业务工具章节 | ✅ 完成 |

### Phase 0 额外交付（+9 插件包 + 8 独立 App）

| 额外项 | 说明 |
|--------|------|
| +9 插件包 | shell / plugin-ai-family / plugin-monitor / plugin-ops / plugin-ai / plugin-dev / plugin-admin |
| +8 独立 App | full + 7 个 standalone-* 应用，全部可 npm install + vite dev |
| +测试框架 | Vitest + jsdom + Jest-DOM + React Testing Library + Playwright |
| +CI/CD | GitHub Actions (ai-eco-ci.yml) |

---

## Phase 1：引擎构建 ✅ 100%（M1 里程碑达成）

### 1A. 目标量化引擎（plugin-target）✅ 35 tests

| ID | 任务名称 | 负责人 | 起止时间 | 优先级 | 任务描述 | 依赖 | 状态 |
|----|----------|--------|----------|--------|----------|------|------|
| P1-T1 | TargetEngine 类型定义 | AI实施专家 | Day 3 | P0 | 定义 TargetParams、TargetResult、PhaseAllocation、MonthlyPlan 等接口 | P0-1 | ✅ 完成 |
| P1-T2 | X公式计算逻辑编码 | AI实施专家 | Day 3-4 | P0 | 实现 `calc()` 方法：基础基数 × 城市系数 × 规模系数 × 增速系数 × 调整系数 | P1-T1 | ✅ 完成 |
| P1-T3 | 三阶段拆分逻辑 | AI实施专家 | Day 4 | P0 | 实现 `splitPhases()`：旺季50% / 平季30% / 淡季20% | P1-T2 | ✅ 完成 |
| P1-T4 | 月度节点拆分逻辑 | AI实施专家 | Day 4 | P0 | 实现 `splitMonthly()`：开门红5%+高峰25%+突破20%+冲刺30%+收官20% | P1-T3 | ✅ 完成 |
| P1-T5 | 目标合理性校验 | AI实施专家 | Day 5 | P1 | 实现 `validate()`：利润率 ≥ 15% 判定 + 回调机制 | P1-T4 | ✅ 完成 |
| P1-T6 | TargetEngine 测试用例 | AI实施专家 | Day 5 | P0 | 20+ 测试：正常值/边界值/异常值/精度校验 | P1-T5 | ✅ 完成（27 + 8 = 35 用例） |
| P1-T7 | plugin-target register.ts | AI实施专家 | Day 5 | P1 | 注册到 Shell：路由 /target + 菜单项 | P1-T6 | ✅ 完成 |

### 1B. 成本盈亏引擎（plugin-cost）✅ 30 tests

| ID | 任务名称 | 负责人 | 起止时间 | 优先级 | 任务描述 | 依赖 | 状态 |
|----|----------|--------|----------|--------|----------|------|------|
| P1-C1 | CostEngine 类型定义 | AI实施专家 | Day 6 | P0 | 定义 VenueParams、EquipmentParams、CostBreakdown、ProfitAnalysis 等接口 | P0-2 | ✅ 完成 |
| P1-C2 | 城市数据模型 | AI实施专家 | Day 6 | P0 | 337城市数据结构化：等级/租金/消费力/竞争密度 | P1-C1 | ✅ 完成 |
| P1-C3 | 场地成本计算 | AI实施专家 | Day 7 | P0 | 实现：面积 × 租金 × 利用率 + 包厢配置成本 | P1-C2 | ✅ 完成 |
| P1-C4 | 设备成本计算 | AI实施专家 | Day 7 | P0 | 实现：音响/点歌/灯光/VR 投资额 + 折旧 + 回收期 | P1-C3 | ✅ 完成 |
| P1-C5 | 运营成本计算 | AI实施专家 | Day 8 | P0 | 实现：人力 + 能耗 + 物料 成本核算 | P1-C4 | ✅ 完成 |
| P1-C6 | 盈亏分析逻辑 | AI实施专家 | Day 8 | P0 | 实现：收入预测 + 利润计算 + 敏感性分析 | P1-C5 | ✅ 完成 |
| P1-C7 | CostEngine 测试用例 | AI实施专家 | Day 9 | P0 | 20+ 测试：各城市等级/各规模/盈亏平衡/敏感性 | P1-C6 | ✅ 完成（30 用例） |
| P1-C8 | plugin-cost register.ts | AI实施专家 | Day 9 | P1 | 注册到 Shell：路由 /cost + 菜单项 | P1-C7 | ✅ 完成 |

### 1C. 节日算法引擎（plugin-marketing）✅ 41 tests

| ID | 任务名称 | 负责人 | 起止时间 | 优先级 | 任务描述 | 依赖 | 状态 |
|----|----------|--------|----------|--------|----------|------|------|
| P1-M1 | FestivalEngine 类型定义 | AI实施专家 | Day 10 | P0 | 定义 Festival、FestivalType、FestivalStage、FestivalAction 等接口 | P0-3 | ✅ 完成 |
| P1-M2 | 农历转换引擎 | AI实施专家 | Day 10 | P0 | 实现 `lunar-engine.ts`：Solar↔Lunar 转换 + 闰月处理 | P1-M1 | ✅ 完成 |
| P1-M3 | 6类节日数据库 | AI实施专家 | Day 11 | P0 | 构建 festivals.ts：法定/民俗/网络/地方/品牌/门店 全年200+节日 | P1-M2 | ✅ 完成 |
| P1-M4 | 节日-阶段归属判定 | AI实施专家 | Day 11 | P0 | 实现 `getFestivalStage()`：旺季/平季/淡季 自动归类 | P1-M3 | ✅ 完成 |
| P1-M5 | 营销动作触发器 | AI实施专家 | Day 12 | P1 | 实现 `action-trigger.ts`：节前7天/节中/节后3天 规则引擎 | P1-M4 | ✅ 完成 |
| P1-M6 | FestivalEngine 测试用例 | AI实施专家 | Day 12 | P0 | 20+ 测试：2026全年农历校验/节日归类/闰月边界 | P1-M5 | ✅ 完成（41 用例） |
| P1-M7 | plugin-marketing register.ts | AI实施专家 | Day 12 | P1 | 注册到 Shell：路由 /marketing + 菜单项 | P1-M6 | ✅ 完成 |

### 1D. 提示词库结构化（plugin-prompt）✅ 19 tests

| ID | 任务名称 | 负责人 | 起止时间 | 优先级 | 任务描述 | 依赖 | 状态 |
|----|----------|--------|----------|--------|----------|------|------|
| P1-P1 | BusinessPrompt 类型定义 | AI实施专家 | Day 13 | P1 | 定义 BusinessPrompt、PromptCategory、PromptPersona 等接口 | P0-4 | ✅ 完成 |
| P1-P2 | 15个 Prompt 模板结构化 | AI实施专家 | Day 13 | P1 | 将文档④的15个 Prompt 编码为 PromptPreset 对象数组 | P1-P1 | ✅ 完成 |
| P1-P3 | 人格-Prompt 映射表 | AI实施专家 | Day 14 | P1 | 8位家人 × 15个 Prompt 的绑定关系配置 | P1-P2 | ✅ 完成 |
| P1-P4 | plugin-prompt register.ts | AI实施专家 | Day 14 | P2 | 注册到 Shell：路由 /prompt + 菜单项 | P1-P3 | ✅ 完成 |

### M1 里程碑验收 ✅ 全量达成

| 验收项 | 目标值 | 实际达成 | 状态 |
|--------|--------|---------|------|
| 引擎测试总数 | ≥60 | 125 (35+30+41+19) | ✅ 超额 208% |
| TypeScript 编译 | 0 错误 | 0 错误 | ✅ |
| 公式计算精度 | 小数点后2位 | 小数点后2位 | ✅ |
| 农历准确率 | 100% | 100% (lunar-engine) | ✅ |
| 节日覆盖 | 6类200+ | 6 类全量 | ✅ |

---

## Phase 2-3 同步交付（M8-M13 里程碑）

| 里程碑 | 内容 | 状态 |
|--------|------|------|
| M8-M9 | 8 独立 App 全量 npm install + vite 可启动 | ✅ |
| M10 | AI Family App 内部页面导航互联 | ✅ |
| M11 | Hub 浮窗命令 connect 到实际动作（7 系统 + full） | ✅ |
| M12 | 集成测试套件完善 (39 新增 / 206 全量通过) | ✅ |
| **M13** | **Phase 3 质量工程完成** — RTL + Playwright + 230 tests + 4 文档衔接 | ✅ |

### Phase 3 质量工程已完成子任务

| ID | 任务 | 状态 | 备注 |
|----|------|------|------|
| P3-1 | Vitest 覆盖率提升 (24 files / 294 tests) | ✅ | 从 158 → 294 (Phase 4 新增 64) |
| P3-2 | 引擎集成测试 (8 用例) | ✅ | plugin-target/engine-integration.test.ts |
| P3-3 | EventBus 跨插件测试 (16 用例) | ✅ | event-bus-cross-plugin.test.ts |
| P3-4 | Hub 命令集成测试 (15 用例) | ✅ | hub-commands.test.ts |
| P3-5 | React Testing Library 组件测试 (31 用例) | ✅ | + 7 LLMBridge |
| P3-6 | Playwright E2E (`welcome-flow.spec.ts`) | ✅ | Chromium 自动启动 dev server |
| P3-7 | Lighthouse 基线 | ✅ | `.lighthouserc.json` (Phase 4 已完成) |
| P3-8 | 4 核心业务文档"项目实现衔接"章节 | ✅ | 全部完成 + 交叉引用 |
| P3-9 | MCP Skill 注册 (12 个) | ⬜ | 后续可选迭代 |
| P3-10 | RAG 知识库 | ⬜ | 后续可选迭代 |

---

## Phase 4 已完成任务（M14 里程碑 ✅ 100%）

| ID | 任务 | 优先级 | 实际交付物 | 状态 |
|----|------|--------|----------|------|
| P4-1 | LLM 适配层 (OpenAI/Anthropic/Qwen/DeepSeek/Kimi) | P0 | `packages/plugin-llm/src/providers.ts` 5 适配器 | ✅ |
| P4-2 | 流式输出 SSE 协议封装 | P0 | `packages/plugin-llm/src/sse.ts` + `base-adapter.ts` | ✅ |
| P4-3 | API Key 加密存储 (AES-256-GCM) | P0 | `packages/plugin-llm/src/crypto.ts` + `key-manager.ts` | ✅ |
| P4-4 | 依赖扫描 (pnpm audit + Snyk + Gitleaks) | P1 | CI/CD security job | ✅ |
| P4-5 | CSP / CORS / XSS 加固 | P1 | `vercel.json` + Dockerfile Nginx 安全头 | ✅ |
| P4-6 | Rate Limiting | P1 | `api/chat/stream.ts` (60 req/min/IP) | ✅ |
| P4-7 | Vercel 部署 (Web SaaS) | P0 | `vercel.json` + Serverless Function | ✅ |
| P4-8 | Docker 私有部署 | P1 | `Dockerfile` 多阶段 + `docker-compose.yml` | ✅ |
| P4-9 | CI/CD 完善 (GitHub Actions 8-job) | P1 | `quality/build/e2e/security/lighthouse/docker/deploy/ecosystem-check` | ✅ |
| P4-10 | Lighthouse 基线 | P2 | `.lighthouserc.json` (LCP<2.5s/CLS<0.1/TBT<200ms) | ✅ |
| P4-11 | Serverless LLM 代理 (隐藏 Key) | P1 | `api/chat/stream.ts` (5 Provider 路由) | ✅ |
| P4-12 | AIAssistantHub 集成 + Mock 回退 | P0 | `packages/shell/src/llm-bridge.ts` + 7 tests | ✅ |
| P4-13 | 多 Provider 配置面板 (UI 可视化) | P1 | `AIAssistantHub` Settings tab | ✅ |
| P4-14 | (可选) 微信小程序 (uni-app) | P2 | — | ⬜ 后续迭代 |
| P4-15 | (可选) npm SDK 发布 (3 包) | P2 | — | ⬜ 后续迭代 |

---

## 后续阶段任务预览（Phase 2-4 概要）

| 阶段 | 核心任务 | 里程碑 | 状态 |
|------|----------|--------|------|
| Phase 2 (Week 4-6) | 8页面UI + 8家人绑定 + 数据流贯通 | M2: 可交互Web工具平台 | ✅ 完成 |
| Phase 3 (Week 7-9) | 组件测试 + E2E + 全链路质量工程 | M3: 全量 294 tests 100% pass | ✅ 完成 |
| Phase 4 (Week 10-12) | LLM + SSE + AES + Vercel + Docker + CI/CD | M4: 生态闭环全量达成 | ✅ 完成 |

> Phase 0-4 已全量完成。后续可选迭代：微信小程序、npm SDK 发布、MCP Skill 注册、RAG 知识库。

---

## 执行原则

1. **逐项推进**：完成一项任务并确保稳定运行后，再推进下一项
2. **测试同步**：每个引擎编码完成后立即编写对应测试用例
3. **进度同步**：每完成一个任务ID，更新本文档状态列 + TodoWrite
4. **质量优先**：TypeScript 0 错误 + 测试全绿 = 任务完成标准

---

## 全量交付物清单（2026-07-17 校准）

```
代码资产:
├── 13 插件包 (packages/)       ✅ 全量可运行
├── 8 独立应用 (apps/)          ✅ 全量可 npm install + vite dev
├── 18 测试文件 / 230 tests     ✅ 100% 通过
├── Playwright E2E              ✅ Chromium 通过
└── TypeScript 0 错误            ✅ tsc --noEmit

文档资产:
├── 5 份架构文档                ✅ 全量校准（本次）
├── 4 份核心业务文档            ✅ 含项目实现衔接 + 交叉引用
└── CI/CD                       ✅ GitHub Actions

待启动 (Phase 4):
├── LLM 适配层
├── SSE 流式输出
├── 安全加固
└── Vercel / Docker 部署
```
