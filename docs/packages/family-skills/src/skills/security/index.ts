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

export { autoRemediateSkill } from './auto-remediate.js';
export { threatResponseSkill } from './threat-response.js';
export { complianceCheckSkill } from './compliance-check.js';
export { securityAuditSkill } from './justice-audit.js';
export { behavioralBaselineSkill } from './behavioral-baseline.js';
export { securityPostureSkill } from './security-posture.js';

import { autoRemediateSkill } from './auto-remediate.js';
import { threatResponseSkill } from './threat-response.js';
import { complianceCheckSkill } from './compliance-check.js';
import { securityAuditSkill } from './justice-audit.js';
import { behavioralBaselineSkill } from './behavioral-baseline.js';
import { securityPostureSkill } from './security-posture.js';
import type { FamilySkill } from '@yyc3/family-agents';

export const securitySkills: FamilySkill[] = [
  autoRemediateSkill,
  threatResponseSkill,
  complianceCheckSkill,
  securityAuditSkill,
  behavioralBaselineSkill,
  securityPostureSkill,
];
