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

export { intentEnrichmentSkill, dialogueContextSkill } from './qianhang-skills'
export { causalReasoningSkill, knowledgeSynthesisSkill } from './thinker-skills'
export { seasonalForecastSkill, riskAssessmentSkill } from './prophet-skills'
export { userProfilingSkill, skillMatchingSkill } from './bole-skills'
export { workflowComposerSkill, crisisResponseSkill } from './tianshu-skills'
export { owaspScannerSkill, incidentTriageSkill } from './guardian-skills'
export { architectureReviewSkill, testStrategySkill } from './grandmaster-skills'
export { contentPolishSkill, multimodalComposeSkill } from './grace-skills'

import type { FamilySkill } from '@yyc3/family-agents';
import { intentEnrichmentSkill, dialogueContextSkill } from './qianhang-skills'
import { causalReasoningSkill, knowledgeSynthesisSkill } from './thinker-skills'
import { seasonalForecastSkill, riskAssessmentSkill } from './prophet-skills'
import { userProfilingSkill, skillMatchingSkill } from './bole-skills'
import { workflowComposerSkill, crisisResponseSkill } from './tianshu-skills'
import { owaspScannerSkill, incidentTriageSkill } from './guardian-skills'
import { architectureReviewSkill, testStrategySkill } from './grandmaster-skills'
import { contentPolishSkill, multimodalComposeSkill } from './grace-skills'

export const familyExclusiveSkills: FamilySkill[] = [
  intentEnrichmentSkill, dialogueContextSkill,
  causalReasoningSkill, knowledgeSynthesisSkill,
  seasonalForecastSkill, riskAssessmentSkill,
  userProfilingSkill, skillMatchingSkill,
  workflowComposerSkill, crisisResponseSkill,
  owaspScannerSkill, incidentTriageSkill,
  architectureReviewSkill, testStrategySkill,
  contentPolishSkill, multimodalComposeSkill,
];
