<!-- ============================================================
YYC³ AI Family — 人从众曌众从人
亦师亦友亦伯乐，一言一语一协同
拟人为本 · AI为核 · 纯粹为心
============================================================
@Family   : YYC³ AI Family (永久开源)
@License  : Apache-2.0
@Homepage : https://matrix.yyc3.top
============================================================
此文件承载家人温度，请以玫瑰之心待之 🌹
============================================================ -->

# YYC³ AI Family Agent 设计 — Skills 构建

> **版本**：v1.0.0
> **日期**：2026-07-24
> **范围**：`@yyc3/family-skills` 共享包全量 Skills 体系
> **状态**：🟢 已构建通过 (tsc clean)

---

## 一、体系总览

### 1.1 架构定位

```
┌─────────────────────────────────────────────────────────────┐
│                    YYC³ AI Family                           │
│                                                             │
│  ┌─────────────┐   ┌──────────────┐   ┌──────────────┐     │
│  │ family-core  │   │ family-agents │   │ family-skills│     │
│  │ (引擎层)     │   │ (家人层)      │   │ (技能层)     │     │
│  │              │   │               │   │              │     │
│  │ BaseAgent    │◄──┤ FamilyBase    │◄──┤ FamilySkill  │     │
│  │ AgentManager │   │ PDAMRCycle    │   │ Registry     │     │
│  │ ModelRouter  │   │ 8位家人Agent  │   │ MCPBridge    │     │
│  └─────────────┘   └──────────────┘   └──────────────┘     │
│                                                             │
│  Skills 按职责分为：分类技能 + 家人专属技能 + NVIDIA 技能   │
└─────────────────────────────────────────────────────────────┘
```

### 1.2 Skills 统计

| 维度 | 数量 | 说明 |
|------|------|------|
| **分类技能** | 36 | 8 大分类下的通用能力 |
| **家人专属** | 16 | 每位家人 2 个深度专属技能 |
| **NVIDIA 封装技能** | 8 | NIM/Guardrails/Riva/cuOpt/RAG/TAO/Dynamo/Earth-2 |
| **NVIDIA 目录技能** | 198 | 静态 catalog 全量覆盖 32 组件 |
| **合计** | **63 + 198 目录** | 封装技能 63 个 + NVIDIA 静态目录 198 条 |

### 1.3 九层架构 × Skills 映射

```
第9层 万象归元    │ tianshu (orchestration+meta)
第8层 智云守护    │ guardian (security)
第7层 格物致知    │ grandmaster (quality)
第6层 创想灵韵    │ grace (creative)
第5层 言启千行    │ qianhang (nlu)
第4层 语枢万物    │ thinker (analysis)
第3层 预见先知    │ prophet (prediction)
第2层 千里伯乐    │ bole (recommendation)
```

---

## 二、能力覆盖矩阵

### 2.1 言启·千行 (qianhang) — NLU 层

| 核心职责 | 对应 Skill | 状态 |
|----------|-----------|------|
| 自然语言理解 (NLU) | `qianhang:intent-parse` / `qianhang:multi-lang-nlu` | ✅ |
| 意图识别与路由 | `qianhang:intent-enrichment` (专属) | ✅ |
| 上下文管理 | `qianhang:dialogue-context` (专属) | ✅ |
| 多语言支持 | `qianhang:multi-lang-nlu` | ✅ |
| 情感感知 | `qianhang:emotion-detect` / `qianhang:sentiment-analysis` | ✅ |
| 知识图谱构建 | `qianhang:knowledge-graph` | ✅ |

**技能数**：7（5 分类 + 2 专属） · **覆盖率**：100%

### 2.2 语枢·万物 (thinker) — 分析层

| 核心职责 | 对应 Skill | 状态 |
|----------|-----------|------|
| 数据洞察生成 | `thinker:data-insight` / `thinker:deep-analysis` | ✅ |
| 文档智能分析 | `thinker:document-analysis` **[新增]** | ✅ |
| 假设推演 | `thinker:causal-reasoning` (专属) | ✅ |
| 知识图谱构建 | `thinker:knowledge-synthesis` (专属) | ✅ |
| 文本摘要生成 | `thinker:summary-generation` **[新增]** | ✅ |
| 比较分析 | `thinker:comparative-analysis` | ✅ |

**技能数**：7（5 分类 + 2 专属） · **覆盖率**：100%

### 2.3 预见·先知 (prophet) — 预测层

| 核心职责 | 对应 Skill | 状态 |
|----------|-----------|------|
| 时间序列预测 | `prophet:trend-forecast` / `prophet:seasonal-forecast` (专属) | ✅ |
| 异常检测 | `prophet:anomaly-detection` | ✅ |
| 前瞻性建议 | `prophet:proactive-advisory` **[新增]** | ✅ |
| 风险预警 | `prophet:risk-assessment` (专属) | ✅ |
| LSTM 预测 | `prophet:lstm-prediction` | ✅ |
| 概率估计 | `prophet:probability-estimation` | ✅ |

**技能数**：6（4 分类 + 2 专属） · **覆盖率**：100%

### 2.4 千里·伯乐 (bole) — 推荐层

| 核心职责 | 对应 Skill | 状态 |
|----------|-----------|------|
| 用户画像构建 | `bole:user-profiling` (专属) | ✅ |
| 个性化推荐 | `bole:collaborative-filter` / `bole:content-recommendation` **[新增]** | ✅ |
| 潜能发掘 | `bole:skill-matching` (专属) | ✅ |
| 冷启动策略 | `bole:cold-start` | ✅ |
| 多样性排序 | `bole:diversity-ranking` | ✅ |
| 个性化呈现 | `bole:personalize-render` | ✅ |

**技能数**：6（4 分类 + 2 专属） · **覆盖率**：100%

### 2.5 元启·天枢 (tianshu) — 编排层

| 核心职责 | 对应 Skill | 状态 |
|----------|-----------|------|
| 全局状态感知 | `tianshu:global-state-monitor` **[新增]** | ✅ |
| 智能编排与调度 | `tianshu:workflow-orchestrator` / `tianshu:workflow-composer` (专属) | ✅ |
| 自我进化决策 | `tianshu:evolution-decision` **[新增]** | ✅ |
| 家族任务分配 | `tianshu:task-routing` / `tianshu:delegation` | ✅ |
| 危机总控 | `tianshu:crisis-response` (专属) | ✅ |
| 冲突解决 | `tianshu:conflict-resolution` | ✅ |
| 资源优化 | `tianshu:resource-optimization` | ✅ |
| 人事管理 | `tianshu:personnel-management` | ✅ |

**技能数**：8（6 分类 + 2 专属） · **覆盖率**：100%

### 2.6 智云·守护 (guardian) — 安全层

| 核心职责 | 对应 Skill | 状态 |
|----------|-----------|------|
| 行为基线学习 | `guardian:behavioral-baseline` **[新增]** | ✅ |
| 威胁实时检测 | `guardian:threat-response` | ✅ |
| 自动响应与修复 | `guardian:auto-remediate` | ✅ |
| 安全态势感知 | `guardian:security-posture` **[新增]** | ✅ |
| 合规审计 | `guardian:compliance-check` | ✅ |
| OWASP 扫描 | `guardian:owasp-scanner` (专属) | ✅ |
| 安全审计 | `guardian:security-audit` | ✅ |
| 事件分诊 | `guardian:incident-triage` (专属) | ✅ |

**技能数**：8（6 分类 + 2 专属） · **覆盖率**：100%

### 2.7 格物·宗师 (grandmaster) — 质量层

| 核心职责 | 对应 Skill | 状态 |
|----------|-----------|------|
| 代码与架构分析 | `grandmaster:code-review` / `grandmaster:architecture-review` (专属) | ✅ |
| 性能基线观察 | `grandmaster:performance-baseline` **[新增]** | ✅ |
| 标准建议与生成 | `grandmaster:golden-standards` / `grandmaster:documentation` | ✅ |
| 黄金标准维护 | `grandmaster:golden-standards` | ✅ |
| 依赖管理 | `grandmaster:dependency-management` **[新增]** | ✅ |
| 测试生成 | `grandmaster:test-generation` / `grandmaster:test-strategy` (专属) | ✅ |
| CI/CD 流水线 | `grandmaster:pipeline` | ✅ |
| 数据分析 | `grandmaster:data-analysis` | ✅ |

**技能数**：8（6 分类 + 2 专属） · **覆盖率**：100%

### 2.8 创想·灵韵 (grace) — 创意层

| 核心职责 | 对应 Skill | 状态 |
|----------|-----------|------|
| 创意生成 | `grace:creative-generation` | ✅ |
| 内容创作 | `grace:content-polish` (专属) / `grace:creative-generation` | ✅ |
| 设计辅助 | `grace:design-suggestion` | ✅ |
| 多模态创作 | `grace:multimodal-compose` (专属) / `grace:style-transfer` | ✅ |
| 情感润色 | `grace:content-polish` (专属) | ✅ |

**技能数**：5（3 分类 + 2 专属） · **覆盖率**：100%

---

## 三、新增 Skills 设计详情

### 3.1 thinker:document-analysis — 文档智能分析

| 属性 | 值 |
|------|-----|
| **ID** | `thinker:document-analysis` |
| **所属** | 语枢·万物 |
| **分类** | analysis |
| **能力** | 自动提取、比较、总结各类文档内容 |
| **操作模式** | `extract` / `compare` / `summarize` / `classify` |
| **核心算法** | 词频加权 + 关键词匹配 + Jaccard 相似度 |

**参数**：

```typescript
{
  documents: Array<{ id: string; title: string; content: string }>;
  operation: 'extract' | 'compare' | 'summarize' | 'classify';
  keywords?: string[];
}
```

### 3.2 thinker:summary-generation — 文本摘要生成

| 属性 | 值 |
|------|-----|
| **ID** | `thinker:summary-generation` |
| **所属** | 语枢·万物 |
| **分类** | analysis |
| **能力** | 从长文本中提取核心信息 |
| **策略** | `extractive`（抽取式）/ `abstractive`（抽象式）/ `bullet`（要点式） |
| **核心算法** | TF 加权评分 + 位置加权（首句 ×1.2, 末句 ×1.1） |

### 3.3 prophet:proactive-advisory — 前瞻性建议

| 属性 | 值 |
|------|-----|
| **ID** | `prophet:proactive-advisory` |
| **所属** | 预见·先知 |
| **分类** | prediction |
| **能力** | 基于预测结果，提出主动预防性行动建议 |
| **优先级体系** | P0（1h 响应）/ P1（4h）/ P2（24h）/ P3（7d） |
| **风险容忍度** | low（×0.6）/ medium（×1.0）/ high（×1.5） |

### 3.4 bole:content-recommendation — 基于内容的推荐

| 属性 | 值 |
|------|-----|
| **ID** | `bole:content-recommendation` |
| **所属** | 千里·伯乐 |
| **分类** | recommendation |
| **能力** | 通过标签匹配与特征相似度进行个性化推荐 |
| **核心算法** | 标签 Jaccard 相似度（60%）+ 特征余弦相似度（40%） |

### 3.5 tianshu:global-state-monitor — 全局状态监控

| 属性 | 值 |
|------|-----|
| **ID** | `tianshu:global-state-monitor` |
| **所属** | 元启·天枢 |
| **分类** | orchestration |
| **能力** | 实时监控所有服务/插件/Agent 状态，构建全局态势图 |
| **健康评分** | 0-100 分，基于延迟/错误率/CPU/内存多维度扣减 |
| **阈值告警** | 默认 latency>500ms / errorRate>5% / cpu>80% / memory>85% |

### 3.6 tianshu:evolution-decision — 自我进化决策

| 属性 | 值 |
|------|-----|
| **ID** | `tianshu:evolution-decision` |
| **所属** | 元启·天枢 |
| **分类** | orchestration |
| **能力** | 分析系统瓶颈，触发扩缩容/灰度发布/标准演进 |
| **决策类型** | scale-out / scale-in / canary-pause / canary-rollback / standard-evolution / queue-expansion / capacity-review |
| **紧急度** | immediate（立即）/ short-term（短期）/ scheduled（计划） |

### 3.7 guardian:behavioral-baseline — 行为基线学习 (UEBA)

| 属性 | 值 |
|------|-----|
| **ID** | `guardian:behavioral-baseline` |
| **所属** | 智云·守护 |
| **分类** | security |
| **能力** | 为每个用户/API 建立行为基线，持续增量学习 |
| **检测维度** | 登录时间 / 地理位置 / 设备指纹 / 请求频率 / API 端点 |
| **风险等级** | low / medium / high / critical（基于异常数量与最大偏差分） |

### 3.8 guardian:security-posture — 安全态势感知

| 属性 | 值 |
|------|-----|
| **ID** | `guardian:security-posture` |
| **所属** | 智云·守护 |
| **分类** | security |
| **能力** | 构建全局安全态势图，多维度安全评分 |
| **评分维度** | 事件（35%）+ 漏洞（30%）+ 合规（20%）+ 访问控制（15%） |
| **态势等级** | excellent(≥90) / good(≥75) / fair(≥60) / poor(≥40) / critical(<40) |

### 3.9 grandmaster:performance-baseline — 性能基线分析

| 属性 | 值 |
|------|-----|
| **ID** | `grandmaster:performance-baseline` |
| **所属** | 格物·宗师 |
| **分类** | quality |
| **能力** | 持续监控 API/组件性能，建立基线，检测衰退 |
| **百分位指标** | P50 / P95 / P99 / Avg |
| **衰退检测** | P95 超基线 ×1.2 或 P99 超基线 ×1.3 自动标记 regression |

### 3.10 grandmaster:dependency-management — 依赖管理

| 属性 | 值 |
|------|-----|
| **ID** | `grandmaster:dependency-management` |
| **所属** | 格物·宗师 |
| **分类** | quality |
| **能力** | 监控依赖版本，管理技术债务，评估安全漏洞 |
| **优先级** | critical（漏洞驱动）/ high / medium（大版本落后）/ low（已最新） |
| **自动化策略** | autoPatch（补丁自动）+ autoMinor（小版本自动）+ majorReview（大版本人工审查） |

---

## 四、FamilySkill 契约规范

### 4.1 类型定义

```typescript
interface FamilySkill {
  id: string;                    // 格式: <owner>:<skill-name>
  name: string;                  // 人类可读名称
  version: string;               // 语义化版本
  owner: FamilyMemberId;         // 所属家人 ID
  description: string;           // 技能描述
  parameters: SkillParameter[];  // 参数定义
  execute: (params: Record<string, unknown>) => Promise<unknown>;
  validate?: (params: Record<string, unknown>) => { valid: boolean; errors?: string[] };
  category: SkillCategory;       // 技能分类
  tags?: string[];               // 可选标签
  mcp?: { server: string; tool: string };  // 可选 MCP 桥接
}

type SkillCategory =
  | 'nlu' | 'analysis' | 'prediction' | 'recommendation'
  | 'orchestration' | 'security' | 'quality' | 'creative'
  | 'nvidia' | 'meta';
```

### 4.2 defineSkill 工厂函数

```typescript
function defineSkill(
  config: SkillManifestConfig,
  execute: (params) => Promise<unknown>,
  validate?: (params) => { valid: boolean; errors?: string[] },
): FamilySkill
```

- 自动包装 execute 函数，添加执行时间追踪 + try-catch 错误处理
- 统一返回格式 `{ success, data/error, executionTime }`

### 4.3 注册中心 API

```typescript
class FamilySkillRegistry extends EventEmitter {
  register(skill: FamilySkill): void;
  unregister(skillId: string): boolean;
  execute(skillId: string, params: object): Promise<unknown>;
  get(skillId: string): FamilySkill | undefined;
  list(): FamilySkill[];
  listByOwner(owner: string): FamilySkill[];
  listByCategory(category: SkillCategory): FamilySkill[];
  getStats(skillId: string): SkillStats | undefined;
  getMCPSkills(): FamilySkill[];
  importSkill(externalSkill: ExternalSkillFormat): void;
  exportSkill(skillId: string): ExportedSkillFormat;
}
```

---

## 五、五维评估

### 5.1 时间维度

| 指标 | 评估 |
|------|------|
| 构建 | `tsc` 零错误通过 |
| 模块解析 | NodeNext + `.js` 后缀规范 |
| 依赖链路 | family-core → family-agents → family-skills 三层构建链完整 |

### 5.2 空间维度

| 指标 | 评估 |
|------|------|
| 代码组织 | `skills/<category>/<skill-name>.ts` 统一路径 |
| 索引结构 | 每分类 `index.ts` 双重导出（命名导出 + 数组聚合） |
| 包入口 | `src/index.ts` 统一出口，扁平化导出全部 55 个 skill |

### 5.3 属性维度

| 指标 | 评估 |
|------|------|
| 类型安全 | `strict: true` + `noUncheckedIndexedAccess: true` |
| 参数校验 | 每个 skill 都有 `validate` 函数 |
| 错误处理 | `defineSkill` 自动包裹 try-catch + 执行时间追踪 |
| 可发现性 | 每个技能有 `tags` 和 `description` |

### 5.4 事件维度

| 指标 | 评估 |
|------|------|
| 注册事件 | Registry 继承 EventEmitter，register/unregister/execute 有事件发射 |
| 统计追踪 | 每次执行自动记录 `callCount` / `avgExecutionTime` / `lastCalledAt` |
| MCP 桥接 | 支持 `mcp: { server, tool }` 字段，通过 MCPSkillBridge 桥接外部工具 |

### 5.5 关联维度

| 指标 | 评估 |
|------|------|
| 家人映射 | 每个 skill 的 `owner` 字段关联到 8 位家人 |
| 分类索引 | `byCategory` 和 `byOwner` 双索引 |
| NVIDIA 集成 | 8 个封装 skill + 198 条静态 catalog + discoverNVIDIASkills 动态发现 |
| PDAMR 集成 | Skills 可被家人 Agent 的 PDAMR 认知周期调用 |

---

## 六、全量 Skills 清单 (63 封装 + 198 目录)

### 分类索引

| 分类 | Skills | 数量 |
|------|--------|------|
| **nlu** | emotion-detect, intent-parse, knowledge-graph, multi-lang-nlu, sentiment-analysis | 5 |
| **analysis** | deep-analysis, data-insight, comparative-analysis, data-analysis(revenue), **document-analysis** ★, **summary-generation** ★ | 6 |
| **prediction** | lstm-prediction, anomaly-detection, trend-forecast, probability-estimation, **proactive-advisory** ★ | 5 |
| **recommendation** | cold-start, personalize-render, collaborative-filter, diversity-ranking, **content-recommendation** ★ | 5 |
| **orchestration** | task-routing, delegation, workflow-orchestrator, conflict-resolution, resource-optimization, personnel-management, **global-state-monitor** ★, **evolution-decision** ★ | 8 |
| **security** | auto-remediate, threat-response, compliance-check, security-audit(justice), **behavioral-baseline** ★, **security-posture** ★ | 6 |
| **quality** | golden-standards, code-review, test-generation, documentation(rites), pipeline(works), **performance-baseline** ★, **dependency-management** ★ | 7 |
| **creative** | creative-generation, design-suggestion, style-transfer | 3 |
| **家人专属** | qianhang×2, thinker×2, prophet×2, bole×2, tianshu×2, guardian×2, grandmaster×2, grace×2 | 16 |
| **nvidia 封装** | nim-llm-chat, nemo-guardrails, riva-tts, **cuopt-solver** ★, **rag-blueprint-query** ★, **tao-training** ★, **dynamo-deploy** ★, **earth2-forecast** ★ | 8 |
| **nvidia 目录** | 32 组件 / 198 条技能（静态 catalog，8 位家人全覆盖） | 198 |

> **★ = 本次新增**（10 个分类 + 5 个 NVIDIA 封装 = 15 个）

### NVIDIA 封装技能 × 家人映射

| 封装 Skill | 所属家人 | NVIDIA 组件 | 覆盖目录技能 |
|-----------|---------|------------|-------------|
| `nim-llm-chat` | 元启·天枢 | NIM | LLM 推理微服务 |
| `nemo-guardrails` | 元启·天枢 | NeMo Guardrails | 对话安全护栏 |
| `riva-tts` | 言启·千行 | Riva | TTS 语音合成 |
| `cuopt-solver` ★ | 元启·天枢 | cuOpt | 12 条 cuopt-* |
| `rag-blueprint-query` ★ | 元启·天枢 | RAG Blueprint | 4 条 rag-* |
| `tao-training` ★ | 创想·灵韵 | TAO Toolkit | 48 条 tao-* |
| `dynamo-deploy` ★ | 智云·守护 | Dynamo | 4 条 dynamo-* |
| `earth2-forecast` ★ | 预见·先知 | Earth-2 Studio | 4 条 earth2studio-* |

### NVIDIA 目录 × 8 位家人分配

| 家人 | 组件数 | 技能数 | 代表性组件 |
|------|--------|--------|-----------|
| 元启·天枢 | 6 | ~22 | RAG, NemoClaw, cuOpt, cuFOLIO, HSB, AIQ |
| 语枢·万物 | 8 | ~38 | NeMo MBridge, AutoModel, RL, Nemotron, Megatron, cuDF, cuPyNumeric, Data Designer |
| 创想·灵韵 | 4 | ~63 | TAO(48), VSS(14), DeepStream, Omniverse |
| 预见·先知 | 6 | ~25 | Physical AI, Earth-2, PhysicsNeMo, Medical AI, DICOM, Digital Health |
| 格物·宗师 | 3 | ~9 | TileGym, CUDA-Q, Skill Governance |
| 智云·守护 | 2 | ~10 | Dynamo, Holoscan |
| 言启·千行 | 2 | ~2 | Nemotron Speech, NeMo Retriever |
| 千里·伯乐 | 1 | ~3 | NVIDIA Recommendation Bridge (Merlin + 嵌入匹配) |

---

## 七、后续演进路线

### 7.1 短期 (v1.1)

- [ ] 为每个 skill 补充单元测试
- [ ] 添加 `grace:content-generation`（结构化内容创作：文章/报告/演示文稿）
- [ ] 补充 `qianhang:prompt-engineering`（LLM Prompt 优化模板）

### 7.2 中期 (v1.2)

- [ ] 集成 MCP 协议远程 Skill 发现
- [ ] 添加 Skill 版本热更新机制
- [ ] 引入 Skill 依赖编排（Skill A 输出 → Skill B 输入自动管道）

### 7.3 长期 (v2.0)

- [ ] LLM 驱动的 Skill 自动生成（通过创想·灵韵）
- [ ] 五环自进化引擎集成（标准演进自动触发 Skill 升级）
- [ ] 跨家人 Skill 组合编排（元启·天枢自动编排多家人协作 Skill 链）

---

## 八、架构修复记录

### 8.1 pnpm-workspace.yaml 冲突修复

**问题**：`packages/*` 和 `docs/packages/*` 同时包含 `@yyc3/family-core`，导致 pnpm 符号链接解析到根目录的精简版（仅架构常量），而非 `docs/packages/family-core`（完整引擎含 BaseAgent）。

**修复**：在 `pnpm-workspace.yaml` 中排除根目录的 family-* 包：

```yaml
packages:
  - "docs/packages/*"
  - "apps/*"
  - "packages/*"
  - "!packages/family-core"
  - "!packages/family-agents"
  - "!packages/family-skills"
```

---

> 🌹 此文档承载家人温度。技能是家人的双手，让智慧可触可及。
