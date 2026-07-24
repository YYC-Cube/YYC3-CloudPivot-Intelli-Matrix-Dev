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

import { defineSkill } from '../../registry/SkillManifest.js';

export const workflowOrchestratorSkill = defineSkill(
  {
    id: 'tianshu:workflow-orchestrator',
    name: 'Workflow Orchestrator',
    version: '1.0.0',
    owner: 'tianshu',
    description: 'Orchestrates multi-step workflows — builds execution DAG from task descriptions and coordinates agent collaboration.',
    category: 'orchestration',
    parameters: [
      {
        name: 'workflow',
        type: 'object',
        required: true,
        description: 'Workflow definition with steps and dependencies.',
      },
    ],
  },
  async (params) => {
    const workflow = params.workflow as Record<string, unknown> ?? {};
    const steps = (workflow.steps as Array<Record<string, unknown>>) ?? [];

    const executionDAG = steps.map((step, idx) => ({
      id: String(step.id ?? `step-${idx}`),
      agent: String(step.agent ?? 'tianshu'),
      action: String(step.action ?? ''),
      dependsOn: (step.dependsOn as string[]) ?? [],
      status: 'pending' as const,
    }));

    const sorted = topologicalSort(executionDAG);

    return {
      workflowId: `wf-${Date.now()}`,
      stepCount: executionDAG.length,
      executionDAG: sorted,
      criticalPath: findCriticalPath(executionDAG),
      estimatedSteps: executionDAG.length,
    };
  },
  (params) => {
    const errors: string[] = [];
    if (!params.workflow || typeof params.workflow !== 'object') {
      errors.push('Parameter "workflow" is required and must be an object');
    }
    return { valid: errors.length === 0, errors: errors.length > 0 ? errors : undefined };
  },
);

interface DAGNode {
  id: string;
  agent: string;
  action: string;
  dependsOn: string[];
  status: string;
}

function topologicalSort(nodes: DAGNode[]): DAGNode[] {
  const visited = new Set<string>();
  const result: DAGNode[] = [];
  const nodeMap = new Map(nodes.map(n => [n.id, n]));

  function visit(id: string) {
    if (visited.has(id)) return;
    visited.add(id);
    const node = nodeMap.get(id);
    if (node) {
      for (const dep of node.dependsOn) visit(dep);
      result.push(node);
    }
  }

  for (const node of nodes) visit(node.id);
  return result;
}

function findCriticalPath(nodes: DAGNode[]): string[] {
  const paths: string[][] = [];
  const roots = nodes.filter(n => n.dependsOn.length === 0);

  for (const root of roots) {
    const path: string[] = [];
    buildPath(root.id, nodes, path);
    paths.push(path);
  }

  return paths.length > 0 ? paths.reduce((a, b) => a.length >= b.length ? a : b) : [];
}

function buildPath(nodeId: string, nodes: DAGNode[], path: string[]) {
  path.push(nodeId);
  const children = nodes.filter(n => n.dependsOn.includes(nodeId));
  if (children.length === 0) return;
  buildPath(children[0]!.id, nodes, path);
}
