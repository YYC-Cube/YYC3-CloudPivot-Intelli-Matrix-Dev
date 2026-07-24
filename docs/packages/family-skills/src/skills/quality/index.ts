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

export { goldenStandardsSkill } from './golden-standards.js';
export { codeReviewSkill } from './code-review.js';
export { testGenerationSkill } from './test-generation.js';
export { documentationSkill } from './rites-documentation.js';
export { pipelineSkill } from './works-pipeline.js';
export { performanceBaselineSkill } from './performance-baseline.js';
export { dependencyManagementSkill } from './dependency-management.js';

import { goldenStandardsSkill } from './golden-standards.js';
import { codeReviewSkill } from './code-review.js';
import { testGenerationSkill } from './test-generation.js';
import { documentationSkill } from './rites-documentation.js';
import { pipelineSkill } from './works-pipeline.js';
import { performanceBaselineSkill } from './performance-baseline.js';
import { dependencyManagementSkill } from './dependency-management.js';
import type { FamilySkill } from '@yyc3/family-agents';

export const qualitySkills: FamilySkill[] = [
  goldenStandardsSkill,
  codeReviewSkill,
  testGenerationSkill,
  documentationSkill,
  pipelineSkill,
  performanceBaselineSkill,
  dependencyManagementSkill,
];
