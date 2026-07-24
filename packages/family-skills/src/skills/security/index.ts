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

export { autoRemediateSkill } from './auto-remediate'
export { threatResponseSkill } from './threat-response'
export { complianceCheckSkill } from './compliance-check'
export { securityAuditSkill } from './justice-audit'

import { autoRemediateSkill } from './auto-remediate'
import { threatResponseSkill } from './threat-response'
import { complianceCheckSkill } from './compliance-check'
import { securityAuditSkill } from './justice-audit'
import type { FamilySkill } from '@yyc3/family-agents';

export const securitySkills: FamilySkill[] = [
  autoRemediateSkill,
  threatResponseSkill,
  complianceCheckSkill,
  securityAuditSkill,
];
