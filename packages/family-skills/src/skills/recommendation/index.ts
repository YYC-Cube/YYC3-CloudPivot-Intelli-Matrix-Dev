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

export { coldStartSkill } from './cold-start'
export { personalizeRenderSkill } from './personalize-render'
export { collaborativeFilterSkill } from './collaborative-filter'
export { diversityRankingSkill } from './diversity-ranking'

import { coldStartSkill } from './cold-start'
import { personalizeRenderSkill } from './personalize-render'
import { collaborativeFilterSkill } from './collaborative-filter'
import { diversityRankingSkill } from './diversity-ranking'
import type { FamilySkill } from '@yyc3/family-agents';

export const recommendationSkills: FamilySkill[] = [
  coldStartSkill,
  personalizeRenderSkill,
  collaborativeFilterSkill,
  diversityRankingSkill,
];
