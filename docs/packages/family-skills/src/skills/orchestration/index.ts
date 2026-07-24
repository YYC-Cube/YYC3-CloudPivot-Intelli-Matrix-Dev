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

export { taskRoutingSkill } from './task-routing.js';
export { delegationSkill } from './delegation.js';
export { workflowOrchestratorSkill } from './workflow-orchestrator.js';
export { conflictResolutionSkill } from './conflict-resolution.js';
export { resourceOptimizationSkill } from './resource-optimization.js';
export { personnelManagementSkill } from './personnel-management.js';
export { globalStateMonitorSkill } from './global-state-monitor.js';
export { evolutionDecisionSkill } from './evolution-decision.js';

import { taskRoutingSkill } from './task-routing.js';
import { delegationSkill } from './delegation.js';
import { workflowOrchestratorSkill } from './workflow-orchestrator.js';
import { conflictResolutionSkill } from './conflict-resolution.js';
import { resourceOptimizationSkill } from './resource-optimization.js';
import { personnelManagementSkill } from './personnel-management.js';
import { globalStateMonitorSkill } from './global-state-monitor.js';
import { evolutionDecisionSkill } from './evolution-decision.js';
import type { FamilySkill } from '@yyc3/family-agents';

export const orchestrationSkills: FamilySkill[] = [
  taskRoutingSkill,
  delegationSkill,
  workflowOrchestratorSkill,
  conflictResolutionSkill,
  resourceOptimizationSkill,
  personnelManagementSkill,
  globalStateMonitorSkill,
  evolutionDecisionSkill,
];
