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

export { deepAnalysisSkill } from './deep-analysis.js';
export { dataInsightSkill } from './data-insight.js';
export { comparativeAnalysisSkill } from './comparative-analysis.js';
export { dataAnalysisSkill } from './revenue-analysis.js';
export { documentAnalysisSkill } from './document-analysis.js';
export { summaryGenerationSkill } from './summary-generation.js';

import { deepAnalysisSkill } from './deep-analysis.js';
import { dataInsightSkill } from './data-insight.js';
import { comparativeAnalysisSkill } from './comparative-analysis.js';
import { dataAnalysisSkill } from './revenue-analysis.js';
import { documentAnalysisSkill } from './document-analysis.js';
import { summaryGenerationSkill } from './summary-generation.js';
import type { FamilySkill } from '@yyc3/family-agents';

export const analysisSkills: FamilySkill[] = [
  deepAnalysisSkill,
  dataInsightSkill,
  comparativeAnalysisSkill,
  dataAnalysisSkill,
  documentAnalysisSkill,
  summaryGenerationSkill,
];
