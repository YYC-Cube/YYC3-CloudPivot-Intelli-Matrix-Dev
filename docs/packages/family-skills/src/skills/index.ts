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

export { nluSkills } from './nlu/index.js';
export { orchestrationSkills } from './orchestration/index.js';
export { predictionSkills } from './prediction/index.js';
export { recommendationSkills } from './recommendation/index.js';
export { analysisSkills } from './analysis/index.js';
export { securitySkills } from './security/index.js';
export { qualitySkills } from './quality/index.js';
export { creativeSkills } from './creative/index.js';
export { familyExclusiveSkills, allExclusiveSkills } from './exclusive/index.js';
export { nimChatSkill, nemoGuardrailsSkill, rivaTTSSkill } from './nvidia/index.js';
export { discoverNVIDIASkills, getNVIDIAStats, getSkillsByCategory, searchNVIDIASkills, verifySkill } from './nvidia/nvidia-bridge.js';

import { nluSkills } from './nlu/index.js';
import { orchestrationSkills } from './orchestration/index.js';
import { predictionSkills } from './prediction/index.js';
import { recommendationSkills } from './recommendation/index.js';
import { analysisSkills } from './analysis/index.js';
import { securitySkills } from './security/index.js';
import { qualitySkills } from './quality/index.js';
import { creativeSkills } from './creative/index.js';
import { allExclusiveSkills } from './exclusive/index.js';
// NVIDIA skills are lazily loaded via discoverNVIDIASkills() from nvidia-bridge
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
