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

export { FamilySkillRegistry } from './registry/FamilySkillRegistry';
export type { SkillRegistrationResult, SkillSearchQuery, SkillManifestEntry, SkillExportConfig } from './registry/FamilySkillRegistry';

export { defineSkill } from './registry/SkillManifest';
export type { SkillManifestConfig } from './registry/SkillManifest';

export { MCPSkillBridge } from './registry/MCPSkillBridge';
export type { MCPEndpoint, MCPToolCall, MCPToolResult } from './registry/MCPSkillBridge';

export { allSkills, nluSkills, orchestrationSkills, predictionSkills, recommendationSkills, analysisSkills, securitySkills, qualitySkills, creativeSkills, familyExclusiveSkills, allExclusiveSkills } from './skills/index';

export { emotionDetectSkill, multiLangNluSkill, knowledgeGraphSkill, intentParseSkill, sentimentAnalysisSkill } from './skills/nlu/index';
export { taskRoutingSkill, delegationSkill, workflowOrchestratorSkill, conflictResolutionSkill, resourceOptimizationSkill, personnelManagementSkill } from './skills/orchestration/index';
export { lstmPredictionSkill, anomalyDetectionSkill, trendForecastSkill, probabilityEstimationSkill } from './skills/prediction/index';
export { coldStartSkill, personalizeRenderSkill, collaborativeFilterSkill, diversityRankingSkill } from './skills/recommendation/index';
export { deepAnalysisSkill, dataInsightSkill, comparativeAnalysisSkill, dataAnalysisSkill } from './skills/analysis/index';
export { autoRemediateSkill, threatResponseSkill, complianceCheckSkill, securityAuditSkill } from './skills/security/index';
export { goldenStandardsSkill, codeReviewSkill, testGenerationSkill, documentationSkill, pipelineSkill } from './skills/quality/index';
export { styleTransferSkill, creativeGenerationSkill, designSuggestionSkill } from './skills/creative/index';

export { intentEnrichmentSkill, dialogueContextSkill, causalReasoningSkill, knowledgeSynthesisSkill, seasonalForecastSkill, riskAssessmentSkill, userProfilingSkill, skillMatchingSkill, workflowComposerSkill, crisisResponseSkill, owaspScannerSkill, incidentTriageSkill, architectureReviewSkill, testStrategySkill, contentPolishSkill, multimodalComposeSkill } from './skills/exclusive/family/index';
