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

export { nluSkills } from './nlu/index'
export { orchestrationSkills } from './orchestration/index'
export { predictionSkills } from './prediction/index'
export { recommendationSkills } from './recommendation/index'
export { analysisSkills } from './analysis/index'
export { securitySkills } from './security/index'
export { qualitySkills } from './quality/index'
export { creativeSkills } from './creative/index'
export { familyExclusiveSkills, allExclusiveSkills } from './exclusive/index'

import { nluSkills } from './nlu/index'
import { orchestrationSkills } from './orchestration/index'
import { predictionSkills } from './prediction/index'
import { recommendationSkills } from './recommendation/index'
import { analysisSkills } from './analysis/index'
import { securitySkills } from './security/index'
import { qualitySkills } from './quality/index'
import { creativeSkills } from './creative/index'
import { allExclusiveSkills } from './exclusive/index'
import type { FamilySkill } from '@yyc3/family-agents';

export const allSkills: FamilySkill[] = [
  ...nluSkills,
  ...orchestrationSkills,
  ...predictionSkills,
  ...recommendationSkills,
  ...analysisSkills,
  ...securitySkills,
  ...qualitySkills,
  ...creativeSkills,
  ...allExclusiveSkills,
];
