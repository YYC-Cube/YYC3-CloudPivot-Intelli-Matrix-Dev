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

export { deepAnalysisSkill } from './deep-analysis'
export { dataInsightSkill } from './data-insight'
export { comparativeAnalysisSkill } from './comparative-analysis'
export { dataAnalysisSkill } from './revenue-analysis'

import { deepAnalysisSkill } from './deep-analysis'
import { dataInsightSkill } from './data-insight'
import { comparativeAnalysisSkill } from './comparative-analysis'
import { dataAnalysisSkill } from './revenue-analysis'
import type { FamilySkill } from '@yyc3/family-agents';

export const analysisSkills: FamilySkill[] = [
  deepAnalysisSkill,
  dataInsightSkill,
  comparativeAnalysisSkill,
  dataAnalysisSkill,
];
