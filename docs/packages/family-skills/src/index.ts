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

export { FamilySkillRegistry } from './registry/FamilySkillRegistry.js';
export type { SkillExportConfig, SkillManifestEntry, SkillRegistrationResult, SkillSearchQuery } from './registry/FamilySkillRegistry.js';

export { defineSkill } from './registry/SkillManifest.js';
export type { SkillManifestConfig } from './registry/SkillManifest.js';

export { MCPSkillBridge } from './registry/MCPSkillBridge.js';
export type { MCPEndpoint, MCPToolCall, MCPToolResult } from './registry/MCPSkillBridge.js';

export { allExclusiveSkills, allSkills, analysisSkills, creativeSkills, familyExclusiveSkills, nluSkills, orchestrationSkills, predictionSkills, qualitySkills, recommendationSkills, securitySkills } from './skills/index.js';

export { comparativeAnalysisSkill, dataAnalysisSkill, dataInsightSkill, deepAnalysisSkill, documentAnalysisSkill, summaryGenerationSkill } from './skills/analysis/index.js';
export { creativeGenerationSkill, designSuggestionSkill, styleTransferSkill } from './skills/creative/index.js';
export { emotionDetectSkill, intentParseSkill, knowledgeGraphSkill, multiLangNluSkill, sentimentAnalysisSkill } from './skills/nlu/index.js';
export { conflictResolutionSkill, delegationSkill, evolutionDecisionSkill, globalStateMonitorSkill, personnelManagementSkill, resourceOptimizationSkill, taskRoutingSkill, workflowOrchestratorSkill } from './skills/orchestration/index.js';
export { anomalyDetectionSkill, lstmPredictionSkill, proactiveAdvisorySkill, probabilityEstimationSkill, trendForecastSkill } from './skills/prediction/index.js';
export { codeReviewSkill, dependencyManagementSkill, documentationSkill, goldenStandardsSkill, performanceBaselineSkill, pipelineSkill, testGenerationSkill } from './skills/quality/index.js';
export { coldStartSkill, collaborativeFilterSkill, contentRecommendationSkill, diversityRankingSkill, personalizeRenderSkill } from './skills/recommendation/index.js';
export { autoRemediateSkill, behavioralBaselineSkill, complianceCheckSkill, securityAuditSkill, securityPostureSkill, threatResponseSkill } from './skills/security/index.js';

export { architectureReviewSkill, causalReasoningSkill, contentPolishSkill, crisisResponseSkill, dialogueContextSkill, incidentTriageSkill, intentEnrichmentSkill, knowledgeSynthesisSkill, multimodalComposeSkill, owaspScannerSkill, riskAssessmentSkill, seasonalForecastSkill, skillMatchingSkill, testStrategySkill, userProfilingSkill, workflowComposerSkill } from './skills/exclusive/family/index.js';

// NVIDIA Skills
export type { CuOptConfig, CuOptResult } from './skills/nvidia/cuopt-solver.js';
export type { DynamoConfig, DynamoResult } from './skills/nvidia/dynamo-deploy.js';
export type { Earth2Config, Earth2Result } from './skills/nvidia/earth2-forecast.js';
export { cuoptSolverSkill, dynamoDeploySkill, earth2ForecastSkill, nemoGuardrailsSkill, nimChatSkill, ragBlueprintSkill, rivaTTSSkill, taoTrainingSkill } from './skills/nvidia/index.js';
export type { NeMoGuardrailConfig, NeMoGuardrailResult } from './skills/nvidia/nemo-guardrails.js';
export type { NIMChatConfig, NIMChatResult } from './skills/nvidia/nim-chat.js';
export type { RAGBlueprintConfig, RAGBlueprintResult } from './skills/nvidia/rag-blueprint.js';
export type { RIVATTSConfig, RIVATTSResult } from './skills/nvidia/riva-tts.js';
export type { TAOTrainingConfig, TAOTrainingResult } from './skills/nvidia/tao-training.js';

// NVIDIA Skills SDK 桥接 (3 层: 组件 → 技能 → 评估) + 静态 Catalog
export {
  NVIDIA_CATALOG, NVIDIA_MEMBER_OVERVIEW, discoverComponents,
  discoverNVIDIASkills, getCatalogStats, getComponentsByMember, getMemberNVIDIASummary, getNVIDIAStats, getSkillDetail, getSkillsByCategory, hasRootCert, isAvailable, search, searchNVIDIASkills,
  verifySkill
} from './skills/nvidia/index.js';
export type { CatalogComponent, CatalogSkill, MemberNVSummary, NVComponent, NVIDIAStats, NVSkillCard } from './skills/nvidia/index.js';
