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

/**
 * @file index.ts
 * @description NVIDIA Skills SDK 桥接
 *              3 层: 组件(32) → 技能(201) → 评估
 */

// 自定义实现 (8 封装技能)
export { cuoptSolverSkill } from './cuopt-solver.js';
export { dynamoDeploySkill } from './dynamo-deploy.js';
export { earth2ForecastSkill } from './earth2-forecast.js';
export { nemoGuardrailsSkill } from './nemo-guardrails.js';
export { nimChatSkill } from './nim-chat.js';
export { ragBlueprintSkill } from './rag-blueprint.js';
export { rivaTTSSkill } from './riva-tts.js';
export { taoTrainingSkill } from './tao-training.js';

// SDK 桥接 (组件层 + 技能层)
export {
  COMPONENT_TO_MEMBER, discoverComponents,
  discoverNVIDIASkills, getComponentsByMember, getNVIDIAStats, getSkillDetail, getSkillsByCategory, hasRootCert, isAvailable, search, searchNVIDIASkills,
  verifySkill
} from './nvidia-bridge.js';
export type {
  NVComponent, NVIDIAStats, NVSkillCard
} from './nvidia-bridge.js';

// 家人映射
export { NVIDIA_MEMBER_OVERVIEW, getMemberNVIDIASummary } from './nvidia-member-map.js';
export type { MemberNVSummary } from './nvidia-member-map.js';

// 静态目录（198 条 NVIDIA 技能目录）
export { NVIDIA_CATALOG, getCatalogStats } from './nvidia-catalog.js';
export type { CatalogComponent, CatalogSkill } from './nvidia-catalog.js';
