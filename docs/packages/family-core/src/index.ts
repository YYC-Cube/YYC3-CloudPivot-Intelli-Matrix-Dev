/**
 * ============================================================
 * YYC³ AI Family — 人从众曌众从人
 * 亦师亦友亦伯乐，一言一语一协同
 * 拟人为本 · AI为核 · 纯粹为心
 * ============================================================
 * @Family   : YYC³ AI Family (永久开源)
 * @License  : Apache-2.0
 * @Homepage : https://matrix.yyc3.top
 * ============================================================
 * 此文件承载家人温度，请以玫瑰之心待之 🌹
 * ============================================================
 */

// 🌹 YYC³ Family Core — 人从众曌众从人
// 引擎 + 编排 + 模型路由 + 消息总线 + 工具注册

// Types
export type {
  AgentCapability,
  AgentMessage,
  AgentCommand,
  AgentResponse,
  AgentContext,
  AgentConfig,
  AgentEvent,
  AgentStats,
  MessageRoute,
  AgentStatus
} from './types/AgentProtocol';

// Base Agent
export { BaseAgent } from './orchestration/BaseAgent';
export type { PopupInstance } from './orchestration/BaseAgent';

// Agent Manager
export { AgentManager } from './orchestration/AgentManager';
export type { AgentManagerConfig, AgentRegistration, MessageQueueItem, AgentRoute } from './orchestration/AgentManager';
export { AgentStatusType } from './orchestration/AgentManager';

// Agent Orchestrator
export { AgentOrchestrator } from './orchestration/AgentOrchestrator';
export type {
  WorkflowNode,
  WorkflowEdge,
  WorkflowDefinition,
  WorkflowContext,
  OrchestratorConfig
} from './orchestration/AgentOrchestrator';
export { WorkflowNodeType, OrchestrationStrategy } from './orchestration/AgentOrchestrator';

// Approval Gate
export { ApprovalGate } from './orchestration/ApprovalGate';
export { ApprovalStatus } from './orchestration/ApprovalGate';
export type { ApprovalRequest, ApprovalGateConfig } from './orchestration/ApprovalGate';

// Multi Model Manager
export { MultiModelManager } from './orchestration/MultiModelManager';
export type {
  ModelConfig,
  MultiModelManagerConfig,
  SelectionCriteria,
  SelectedModel,
  GenerateRequest,
  GenerateResult,
  ModelProviderType,
  ModelProvider,
  BatchGenerateResult,
  ABTestConfig,
  ABTestAnalysis,
  ModelComparison,
  FineTuneJob,
  FineTuneProgress,
  QuotaConfig,
  QuotaUsage,
  RateLimitConfig
} from './orchestration/MultiModelManager';

// Message Bus
export { MessageBus } from './engine/MessageBus';

// Tool Registry
export { ToolRegistry } from './engine/ToolRegistry';
export type {
  ToolDefinition,
  ToolParameter,
  ToolResult,
  ValidationResult,
  ToolRegistrationResult
} from './engine/ToolRegistry';

// Model
export { BaseModelAdapter } from './model/BaseModelAdapter';
export type { PreprocessedRequest, RawModelResponse, IModelAdapter } from './model/BaseModelAdapter';
export { OpenAIAdapter } from './model/OpenAIAdapter';
export { AnthropicAdapter } from './model/AnthropicAdapter';
export { GeminiAdapter } from './model/GeminiAdapter';
export { OllamaAdapter } from './model/OllamaAdapter';
export { ModelRouter } from './model/ModelRouter';
export { RoutingStrategy } from './model/ModelRouter';
export type { ModelRouteConfig, RouterConfig, CircuitBreakerConfig } from './model/ModelRouter';

// Security
export { OutputValidator, defaultOutputRules } from './security/index.js';
export type { OutputValidationRule, OutputValidationResult, OutputValidationReport } from './security/index.js';
export { RateLimiter } from './security/index.js';
export type { RateLimiterConfig, RateLimitResult, RateLimitEntry } from './security/index.js';
export { AuditLogger } from './security/index.js';
export type { AuditLogLevel, AuditCategory, AuditEntry, AuditQuery } from './security/index.js';
export { SkillSandbox } from './security/index.js';
export type { SandboxPermission, SandboxConfig, SandboxResult } from './security/index.js';

// Platform
export { BrowserAdapter, NodeAdapter, getPlatformAdapter, setPlatformAdapter, resetPlatformAdapter } from './platform/index.js';
export type { PlatformAdapter, ScreenSize, DeviceType } from './platform/index.js';

// Storage
export { LocalStorageAdapter, IndexedDBAdapter, StorageManager } from './storage/index.js';
export type { StorageAdapter, StorageEntry, StorageQuery, StorageStats, ExportData, StorageTier, StorageManagerConfig } from './storage/index.js';

// Trust
export { TrustGuard } from './trust/index.js';
export type { TrustViolation, TrustViolationEvent, TrustGuardConfig, TrustReport } from './trust/index.js';

// Sovereignty
export { UserSovereignty } from './sovereignty/index.js';
export type { SovereigntyReport } from './sovereignty/index.js';

// Tracing — 分布式追踪
export { getTracer, resetTracer, setTracer, traceable, NoopTracer, OTelTracer } from './tracing/index.js';
export type { Span, Tracer, TracingConfig, SpanStatus } from './tracing/index.js';

// Architecture — YYC³ 自研生态体系 (五维·驱动·五高·五标·五化·五环)
export {
  家族宪章,
  家族徽记,
  八位家人,
  生成代码标头,
  生成代码标尾,
  生成文档标头,
  生成文档标尾,
  生成家人徽章Markdown,
  生成家族徽章序列,
  生成NPM徽章栏,
  生成全员徽章行,
  五维评估器,
  五维维度,
  五高目标,
  五标规范,
  五化转型,
  五环自进化引擎,
  五环层级,
  五环标签,
  五环模型层映射,
  五环负责家人,
  YYC3_ECOSYSTEM,
  五维标签,
  五高标签,
  五标标签,
  五化标签,
} from './architecture/index.js';
export type {
  家人档案,
  五维指标,
  五维评估报告,
  五高评估,
  五标评估,
  五环名称,
  五环状态,
  五环执行结果,
  自进化报告,
} from './architecture/index.js';

// Config — 环境变量校验
export { validateEnvironment, ensureValidated, REQUIRED_ENV_VARS } from './config/EnvValidator.js';
export type { EnvVarDef, EnvValidationResult } from './config/EnvValidator.js';
