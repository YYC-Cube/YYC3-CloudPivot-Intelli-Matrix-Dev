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

export { intentEnrichmentSkill, dialogueContextSkill } from './qianhang-skills.js';
export { causalReasoningSkill, knowledgeSynthesisSkill } from './thinker-skills.js';
export { seasonalForecastSkill, riskAssessmentSkill } from './prophet-skills.js';
export { userProfilingSkill, skillMatchingSkill } from './bole-skills.js';
export { workflowComposerSkill, crisisResponseSkill } from './tianshu-skills.js';
export { owaspScannerSkill, incidentTriageSkill } from './guardian-skills.js';
export { architectureReviewSkill, testStrategySkill } from './grandmaster-skills.js';
export { contentPolishSkill, multimodalComposeSkill } from './grace-skills.js';

import type { FamilySkill } from '@yyc3/family-agents';
import { intentEnrichmentSkill, dialogueContextSkill } from './qianhang-skills.js';
import { causalReasoningSkill, knowledgeSynthesisSkill } from './thinker-skills.js';
import { seasonalForecastSkill, riskAssessmentSkill } from './prophet-skills.js';
import { userProfilingSkill, skillMatchingSkill } from './bole-skills.js';
import { workflowComposerSkill, crisisResponseSkill } from './tianshu-skills.js';
import { owaspScannerSkill, incidentTriageSkill } from './guardian-skills.js';
import { architectureReviewSkill, testStrategySkill } from './grandmaster-skills.js';
import { contentPolishSkill, multimodalComposeSkill } from './grace-skills.js';

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
