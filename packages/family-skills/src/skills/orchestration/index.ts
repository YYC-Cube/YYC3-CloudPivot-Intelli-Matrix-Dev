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

export { taskRoutingSkill } from './task-routing'
export { delegationSkill } from './delegation'
export { workflowOrchestratorSkill } from './workflow-orchestrator'
export { conflictResolutionSkill } from './conflict-resolution'
export { resourceOptimizationSkill } from './resource-optimization'
export { personnelManagementSkill } from './personnel-management'

import { taskRoutingSkill } from './task-routing'
import { delegationSkill } from './delegation'
import { workflowOrchestratorSkill } from './workflow-orchestrator'
import { conflictResolutionSkill } from './conflict-resolution'
import { resourceOptimizationSkill } from './resource-optimization'
import { personnelManagementSkill } from './personnel-management'
import type { FamilySkill } from '@yyc3/family-agents';

export const orchestrationSkills: FamilySkill[] = [
  taskRoutingSkill,
  delegationSkill,
  workflowOrchestratorSkill,
  conflictResolutionSkill,
  resourceOptimizationSkill,
  personnelManagementSkill,
];
