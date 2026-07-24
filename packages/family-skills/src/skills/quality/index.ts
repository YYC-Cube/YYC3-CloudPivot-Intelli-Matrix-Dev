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

export { goldenStandardsSkill } from './golden-standards'
export { codeReviewSkill } from './code-review'
export { testGenerationSkill } from './test-generation'
export { documentationSkill } from './rites-documentation'
export { pipelineSkill } from './works-pipeline'

import { goldenStandardsSkill } from './golden-standards'
import { codeReviewSkill } from './code-review'
import { testGenerationSkill } from './test-generation'
import { documentationSkill } from './rites-documentation'
import { pipelineSkill } from './works-pipeline'
import type { FamilySkill } from '@yyc3/family-agents';

export const qualitySkills: FamilySkill[] = [
  goldenStandardsSkill,
  codeReviewSkill,
  testGenerationSkill,
  documentationSkill,
  pipelineSkill,
];
