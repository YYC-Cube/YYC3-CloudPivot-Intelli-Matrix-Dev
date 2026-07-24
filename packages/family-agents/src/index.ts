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
 *
 * @file index.ts
 * @description YYC³ Family Agents — 8 位家人 Agent 统一导出
 *              PDAMR 认知环 + AgentPersona 人格 + 8 个业务 Agent
 */

// ===== 基础类型 =====
export type {
  FamilyMemberId,
  FamilyMessageType,
  SkillCategory,
  FamilyOrchestrationMode,
  EmotionTone,
  FamilyIntent,
  FamilySkill,
  SkillParameter,
  SkillResult,
  SkillValidationResult,
  SkillExecutionContext,
  FamilyMessage,
  FamilyMessagePayload,
  UserRequestPayload,
  IntentResultPayload,
  TaskDispatchPayload,
  SkillExecutePayload,
  SkillResultPayload,
  CollaboratePayload,
  AlertPayload,
  QualityReportPayload,
  ReflectPayload,
  PDAMRState,
  FamilyEmotionState,
  FamilyMemberProfile,
} from './base/FamilyTypes';

export {
  FAMILY_PROFILES,
  FAMILY_ORCHESTRATION_FLOW,
} from './base/FamilyTypes';

// ===== PDAMR 认知环 =====
export type {
  PDAMRConfig,
  PDAMRContext,
  PerceptionResult,
  DecisionResult,
  ActionResult,
  MemoryEntry,
  ReflectionResult,
} from './base/PDAMRCycle';

export { PDAMRCycle } from './base/PDAMRCycle';

// ===== AgentPersona 人格 =====
export type {
  PersonaTraits,
  TonePattern,
  AgentPersonaConfig,
} from './base/AgentPersona';

export { AgentPersona } from './base/AgentPersona';

// ===== 家人 Agent 基类 =====
export { FamilyBaseAgent } from './base/FamilyBaseAgent';
export type {
  AgentCapability,
  CommandHandler,
  AgentResponse,
  AgentConfig,
} from './base/FamilyBaseAgent';

// ===== 8 位家人 Agent =====
export { QianHangAgent } from './members/QianHangAgent';
export { TianShuAgent } from './members/TianShuAgent';
export { ThinkerAgent } from './members/ThinkerAgent';
export type { DataInsight, DocAnalysis } from './members/ThinkerAgent';
export { ProphetAgent } from './members/ProphetAgent';
export type { TimeSeriesPrediction, AnomalyReport, RiskAlert } from './members/ProphetAgent';
export { BoleAgent } from './members/BoleAgent';
export type { UserProfile, Recommendation } from './members/BoleAgent';
export { GuardianAgent } from './members/GuardianAgent';
export type { ThreatDetection, SecurityBaseline } from './members/GuardianAgent';
export { GrandmasterAgent } from './members/GrandmasterAgent';
export type { CodeAnalysis, QualityGateResult } from './members/GrandmasterAgent';
export { GraceAgent } from './members/GraceAgent';
export type { CreativeOutput, DesignSuggestion } from './members/GraceAgent';
