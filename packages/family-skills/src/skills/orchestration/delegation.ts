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

import { defineSkill } from '../../registry/SkillManifest'
import type { FamilyMemberId } from '@yyc3/family-agents';

export const delegationSkill = defineSkill(
  {
    id: 'tianshu:delegation',
    name: 'Multi-Agent Delegation',
    version: '1.0.0',
    owner: 'tianshu',
    description: 'Multi-agent task delegation with dependency resolution and execution plan generation.',
    category: 'orchestration',
    parameters: [
      {
        name: 'task',
        type: 'string',
        required: true,
        description: 'The task to decompose and delegate.',
      },
      {
        name: 'agents',
        type: 'array',
        required: false,
        description: 'Available agents for delegation.',
      },
    ],
  },
  async (params) => {
    const task = String(params.task ?? '');
    const availableAgents = (params.agents as FamilyMemberId[]) ?? ['qianhang', 'thinker', 'prophet', 'bole', 'tianshu', 'guardian', 'grandmaster', 'grace'];

    const subtasks = decomposeTask(task);
    const plan = resolveDependencies(subtasks);

    const delegationPlan = plan.map((step, idx) => ({
      stepId: `step-${idx}`,
      subtask: step.description,
      assignedTo: step.assignedTo,
      dependsOn: step.dependsOn,
      status: 'pending' as const,
    }));

    return {
      originalTask: task,
      subtaskCount: subtasks.length,
      delegationPlan,
      executionOrder: delegationPlan.map(d => d.stepId),
      summary: `Decomposed into ${subtasks.length} subtasks across ${new Set(delegationPlan.map(d => d.assignedTo)).size} agents.`,
    };
  },
  (params) => {
    const errors: string[] = [];
    if (!params.task || typeof params.task !== 'string') {
      errors.push('Parameter "task" is required and must be a string');
    }
    return { valid: errors.length === 0, errors: errors.length > 0 ? errors : undefined };
  },
);

interface Subtask {
  id: string;
  description: string;
  assignedTo: FamilyMemberId;
  dependsOn: string[];
}

function decomposeTask(task: string): Subtask[] {
  const lower = task.toLowerCase();
  const subtasks: Subtask[] = [];

  if (lower.includes('分析') || lower.includes('analyz')) {
    subtasks.push({ id: 'collect', description: 'Collect and preprocess data', assignedTo: 'thinker', dependsOn: [] });
    subtasks.push({ id: 'analyze', description: 'Perform deep analysis', assignedTo: 'thinker', dependsOn: ['collect'] });
  }

  if (lower.includes('安全') || lower.includes('secur')) {
    subtasks.push({ id: 'audit', description: 'Security audit', assignedTo: 'guardian', dependsOn: [] });
  }

  if (lower.includes('推荐') || lower.includes('recommend')) {
    subtasks.push({ id: 'profile', description: 'Build user profile', assignedTo: 'bole', dependsOn: [] });
    subtasks.push({ id: 'recommend', description: 'Generate recommendations', assignedTo: 'bole', dependsOn: ['profile'] });
  }

  if (lower.includes('预测') || lower.includes('predict') || lower.includes('forecast')) {
    subtasks.push({ id: 'data-prep', description: 'Prepare time-series data', assignedTo: 'prophet', dependsOn: [] });
    subtasks.push({ id: 'predict', description: 'Run prediction model', assignedTo: 'prophet', dependsOn: ['data-prep'] });
  }

  if (lower.includes('质量') || lower.includes('quality') || lower.includes('review')) {
    subtasks.push({ id: 'review', description: 'Quality review', assignedTo: 'grandmaster', dependsOn: [] });
  }

  if (lower.includes('创意') || lower.includes('creat') || lower.includes('design')) {
    subtasks.push({ id: 'creative', description: 'Creative generation', assignedTo: 'grace', dependsOn: [] });
  }

  if (subtasks.length === 0) {
    subtasks.push(
      { id: 'understand', description: 'Understand the task requirements', assignedTo: 'qianhang', dependsOn: [] },
      { id: 'process', description: 'Process and execute the task', assignedTo: 'tianshu', dependsOn: ['understand'] },
    );
  }

  return subtasks;
}

function resolveDependencies(subtasks: Subtask[]): Subtask[] {
  const visited = new Set<string>();
  const result: Subtask[] = [];

  function visit(id: string) {
    if (visited.has(id)) return;
    visited.add(id);
    const task = subtasks.find(s => s.id === id);
    if (task) {
      for (const dep of task.dependsOn) visit(dep);
      result.push(task);
    }
  }

  for (const subtask of subtasks) visit(subtask.id);
  return result;
}
