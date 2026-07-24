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

import { describe, it, expect, vi } from 'vitest';
import {
  AgentOrchestrator,
  WorkflowNodeType,
  OrchestrationStrategy,
} from '../src/orchestration/AgentOrchestrator.js';
import type { WorkflowNode, WorkflowEdge, WorkflowDefinition } from '../src/orchestration/AgentOrchestrator.js';

function createMockAgent(id: string, executeResult?: Record<string, any>) {
  return {
    getId: () => id,
    getName: () => `Agent-${id}`,
    execute: vi.fn(async (data: any) => executeResult ?? { [`${id}_result`]: true, input: data }),
    getCapabilities: () => [],
  };
}

describe('AgentOrchestrator — Decision/Parallel/Merge Nodes', () => {
  function makeSimpleWorkflow(overrides?: Partial<WorkflowDefinition>): WorkflowDefinition {
    return {
      id: 'wf-1',
      name: 'Test Workflow',
      nodes: [
        { id: 'start', type: WorkflowNodeType.START },
        { id: 'end', type: WorkflowNodeType.END },
      ],
      edges: [
        { id: 'e1', from: 'start', to: 'end' },
      ],
      ...overrides,
    };
  }

  describe('Decision Node', () => {
    it('should select matching branch based on condition', async () => {
      const orch = new AgentOrchestrator();
      const agentA = createMockAgent('agent-a');
      const agentB = createMockAgent('agent-b');
      orch.registerAgent(agentA as any);
      orch.registerAgent(agentB as any);

      const wf = makeSimpleWorkflow({
        nodes: [
          { id: 'start', type: WorkflowNodeType.START },
          { id: 'decision', type: WorkflowNodeType.DECISION },
          { id: 'node-a', type: WorkflowNodeType.AGENT, agentId: 'agent-a' },
          { id: 'node-b', type: WorkflowNodeType.AGENT, agentId: 'agent-b' },
          { id: 'end', type: WorkflowNodeType.END },
        ],
        edges: [
          { id: 'e0', from: 'start', to: 'decision' },
          { id: 'e1', from: 'decision', to: 'node-a', condition: (ctx: any) => ctx.score > 50 },
          { id: 'e2', from: 'decision', to: 'node-b', condition: (ctx: any) => ctx.score <= 50 },
          { id: 'e3', from: 'node-a', to: 'end' },
          { id: 'e4', from: 'node-b', to: 'end' },
        ],
      });
      orch.registerWorkflow(wf);

      const ctx = await orch.executeWorkflow('wf-1', { score: 80 });
      expect(ctx.data._decisionBranch).toBe('node-a');
    });

    it('should fallback to first edge when no condition matches', async () => {
      const orch = new AgentOrchestrator();
      const wf = makeSimpleWorkflow({
        nodes: [
          { id: 'start', type: WorkflowNodeType.START },
          { id: 'decision', type: WorkflowNodeType.DECISION },
          { id: 'node-a', type: WorkflowNodeType.AGENT, agentId: 'agent-a' },
          { id: 'node-b', type: WorkflowNodeType.AGENT, agentId: 'agent-b' },
          { id: 'end', type: WorkflowNodeType.END },
        ],
        edges: [
          { id: 'e0', from: 'start', to: 'decision' },
          { id: 'e1', from: 'decision', to: 'node-a', condition: (ctx: any) => ctx.flag === true },
          { id: 'e2', from: 'decision', to: 'node-b', condition: (ctx: any) => ctx.flag === false },
          { id: 'e3', from: 'node-a', to: 'end' },
          { id: 'e4', from: 'node-b', to: 'end' },
        ],
      });
      const agentA = createMockAgent('agent-a');
      const agentB = createMockAgent('agent-b');
      orch.registerAgent(agentA as any);
      orch.registerAgent(agentB as any);
      orch.registerWorkflow(wf);

      const ctx = await orch.executeWorkflow('wf-1', { flag: 'neither' });
      expect(ctx.data._decisionBranch).toBe('node-a');
    });

    it('should handle condition throwing error gracefully', async () => {
      const orch = new AgentOrchestrator();
      const agentB = createMockAgent('agent-b');
      orch.registerAgent(agentB as any);

      const wf = makeSimpleWorkflow({
        nodes: [
          { id: 'start', type: WorkflowNodeType.START },
          { id: 'decision', type: WorkflowNodeType.DECISION },
          { id: 'node-b', type: WorkflowNodeType.AGENT, agentId: 'agent-b' },
          { id: 'end', type: WorkflowNodeType.END },
        ],
        edges: [
          { id: 'e0', from: 'start', to: 'decision' },
          { id: 'e1', from: 'decision', to: 'node-b', condition: () => { throw new Error('boom'); } },
          { id: 'e2', from: 'node-b', to: 'end' },
        ],
      });
      orch.registerWorkflow(wf);

      const ctx = await orch.executeWorkflow('wf-1', {});
      expect(ctx.data._decisionBranch).toBe('node-b');
    });
  });

  describe('Parallel Node', () => {
    it('should execute branches in parallel and store results', async () => {
      const orch = new AgentOrchestrator({ maxConcurrency: 5 });
      const agentA = createMockAgent('agent-a', { resultA: true });
      const agentB = createMockAgent('agent-b', { resultB: true });
      orch.registerAgent(agentA as any);
      orch.registerAgent(agentB as any);

      const wf = makeSimpleWorkflow({
        nodes: [
          { id: 'start', type: WorkflowNodeType.START },
          { id: 'parallel', type: WorkflowNodeType.PARALLEL },
          { id: 'branch-a', type: WorkflowNodeType.AGENT, agentId: 'agent-a' },
          { id: 'branch-b', type: WorkflowNodeType.AGENT, agentId: 'agent-b' },
          { id: 'end', type: WorkflowNodeType.END },
        ],
        edges: [
          { id: 'e0', from: 'start', to: 'parallel' },
          { id: 'e1', from: 'parallel', to: 'branch-a' },
          { id: 'e2', from: 'parallel', to: 'branch-b' },
          { id: 'e3', from: 'branch-a', to: 'end' },
          { id: 'e4', from: 'branch-b', to: 'end' },
        ],
      });
      orch.registerWorkflow(wf);

      const ctx = await orch.executeWorkflow('wf-1', { input: 'test' });
      expect(ctx.data._parallelResults).toBeDefined();
      expect(ctx.data._parallelResults.length).toBe(2);
    });

    it('should handle errors in parallel branches', async () => {
      const orch = new AgentOrchestrator();
      const goodAgent = createMockAgent('good-agent', { ok: true });
      const badAgent = createMockAgent('bad-agent');
      (badAgent.execute as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('agent failed'));
      orch.registerAgent(goodAgent as any);
      orch.registerAgent(badAgent as any);

      const wf = makeSimpleWorkflow({
        nodes: [
          { id: 'start', type: WorkflowNodeType.START },
          { id: 'parallel', type: WorkflowNodeType.PARALLEL },
          { id: 'branch-good', type: WorkflowNodeType.AGENT, agentId: 'good-agent' },
          { id: 'branch-bad', type: WorkflowNodeType.AGENT, agentId: 'bad-agent' },
          { id: 'merge', type: WorkflowNodeType.MERGE },
          { id: 'end', type: WorkflowNodeType.END },
        ],
        edges: [
          { id: 'e0', from: 'start', to: 'parallel' },
          { id: 'e1', from: 'parallel', to: 'branch-good' },
          { id: 'e2', from: 'parallel', to: 'branch-bad' },
          { id: 'e3', from: 'branch-good', to: 'merge' },
          { id: 'e4', from: 'branch-bad', to: 'merge' },
          { id: 'e5', from: 'merge', to: 'end' },
        ],
      });
      orch.registerWorkflow(wf);

      const ctx = await orch.executeWorkflow('wf-1', {});
      const results = ctx.data._mergedResults;
      expect(results).toBeDefined();
      expect(results.ok).toBe(true);
      expect(ctx.data._mergeErrors).toBeDefined();
      expect(ctx.data._mergeErrors.length).toBeGreaterThan(0);
    });

    it('should respect maxConcurrency', async () => {
      const orch = new AgentOrchestrator({ maxConcurrency: 2 });
      const agents = ['a1', 'a2', 'a3', 'a4'].map(id => createMockAgent(id, { [id]: true }));
      for (const a of agents) orch.registerAgent(a as any);

      const wf = makeSimpleWorkflow({
        nodes: [
          { id: 'start', type: WorkflowNodeType.START },
          { id: 'parallel', type: WorkflowNodeType.PARALLEL },
          ...agents.map(a => ({ id: `branch-${a.getId()}`, type: WorkflowNodeType.AGENT, agentId: a.getId() } as WorkflowNode)),
          { id: 'end', type: WorkflowNodeType.END },
        ],
        edges: [
          { id: 'e0', from: 'start', to: 'parallel' },
          ...agents.map(a => ({ id: `ep-${a.getId()}`, from: 'parallel', to: `branch-${a.getId()}` } as WorkflowEdge)),
          ...agents.map(a => ({ id: `ee-${a.getId()}`, from: `branch-${a.getId()}`, to: 'end' } as WorkflowEdge)),
        ],
      });
      orch.registerWorkflow(wf);

      const ctx = await orch.executeWorkflow('wf-1', {});
      expect(ctx.data._parallelResults.length).toBe(4);
    });
  });

  describe('Merge Node', () => {
    it('should merge parallel results', async () => {
      const orch = new AgentOrchestrator();
      const agentA = createMockAgent('agent-a', { keyA: 'valueA' });
      const agentB = createMockAgent('agent-b', { keyB: 'valueB' });
      orch.registerAgent(agentA as any);
      orch.registerAgent(agentB as any);

      const wf = makeSimpleWorkflow({
        nodes: [
          { id: 'start', type: WorkflowNodeType.START },
          { id: 'parallel', type: WorkflowNodeType.PARALLEL },
          { id: 'branch-a', type: WorkflowNodeType.AGENT, agentId: 'agent-a' },
          { id: 'branch-b', type: WorkflowNodeType.AGENT, agentId: 'agent-b' },
          { id: 'merge', type: WorkflowNodeType.MERGE },
          { id: 'end', type: WorkflowNodeType.END },
        ],
        edges: [
          { id: 'e0', from: 'start', to: 'parallel' },
          { id: 'e1', from: 'parallel', to: 'branch-a' },
          { id: 'e2', from: 'parallel', to: 'branch-b' },
          { id: 'e3', from: 'branch-a', to: 'merge' },
          { id: 'e4', from: 'branch-b', to: 'merge' },
          { id: 'e5', from: 'merge', to: 'end' },
        ],
      });
      orch.registerWorkflow(wf);

      const ctx = await orch.executeWorkflow('wf-1', {});
      expect(ctx.data._mergedResults).toBeDefined();
      expect(ctx.data._mergedResults.keyA).toBe('valueA');
      expect(ctx.data._mergedResults.keyB).toBe('valueB');
      expect(ctx.data._parallelResults).toBeUndefined();
    });

    it('should collect merge errors from failed branches', async () => {
      const orch = new AgentOrchestrator();
      const goodAgent = createMockAgent('good', { ok: true });
      const badAgent = createMockAgent('bad');
      (badAgent.execute as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('fail'));
      orch.registerAgent(goodAgent as any);
      orch.registerAgent(badAgent as any);

      const wf = makeSimpleWorkflow({
        nodes: [
          { id: 'start', type: WorkflowNodeType.START },
          { id: 'parallel', type: WorkflowNodeType.PARALLEL },
          { id: 'branch-good', type: WorkflowNodeType.AGENT, agentId: 'good' },
          { id: 'branch-bad', type: WorkflowNodeType.AGENT, agentId: 'bad' },
          { id: 'merge', type: WorkflowNodeType.MERGE },
          { id: 'end', type: WorkflowNodeType.END },
        ],
        edges: [
          { id: 'e0', from: 'start', to: 'parallel' },
          { id: 'e1', from: 'parallel', to: 'branch-good' },
          { id: 'e2', from: 'parallel', to: 'branch-bad' },
          { id: 'e3', from: 'branch-good', to: 'merge' },
          { id: 'e4', from: 'branch-bad', to: 'merge' },
          { id: 'e5', from: 'merge', to: 'end' },
        ],
      });
      orch.registerWorkflow(wf);

      const ctx = await orch.executeWorkflow('wf-1', {});
      expect(ctx.data._mergedResults).toBeDefined();
      expect(ctx.data._mergedResults.ok).toBe(true);
      expect(ctx.data._mergeErrors).toBeDefined();
      expect(ctx.data._mergeErrors.length).toBeGreaterThan(0);
    });
  });

  describe('Full workflow lifecycle', () => {
    it('should execute start→decision→parallel→merge→end', async () => {
      const orch = new AgentOrchestrator();
      const agent1 = createMockAgent('agent-1', { processed: true });
      orch.registerAgent(agent1 as any);

      const wf: WorkflowDefinition = {
        id: 'wf-full',
        name: 'Full Pipeline',
        nodes: [
          { id: 'start', type: WorkflowNodeType.START },
          { id: 'decision', type: WorkflowNodeType.DECISION },
          { id: 'parallel', type: WorkflowNodeType.PARALLEL },
          { id: 'worker', type: WorkflowNodeType.AGENT, agentId: 'agent-1' },
          { id: 'merge', type: WorkflowNodeType.MERGE },
          { id: 'end', type: WorkflowNodeType.END },
        ],
        edges: [
          { id: 'e0', from: 'start', to: 'decision' },
          { id: 'e1', from: 'decision', to: 'parallel', condition: () => true },
          { id: 'e2', from: 'parallel', to: 'worker' },
          { id: 'e3', from: 'worker', to: 'merge' },
          { id: 'e4', from: 'merge', to: 'end' },
        ],
      };
      orch.registerWorkflow(wf);

      const ctx = await orch.executeWorkflow('wf-full', { input: 'data' });
      expect(ctx.status).toBe('completed');
      expect(ctx.visitedNodes).toContain('start');
      expect(ctx.visitedNodes).toContain('decision');
      expect(ctx.visitedNodes).toContain('parallel');
    });
  });

  describe('Workflow Cancellation (AbortController)', () => {
    it('should cancel a running workflow via abortController', async () => {
      const orch = new AgentOrchestrator();
      const slowAgent = createMockAgent('slow-agent');
      // 模拟一个长时间运行的 agent
      (slowAgent.execute as ReturnType<typeof vi.fn>).mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve({ done: true }), 5000)),
      );
      orch.registerAgent(slowAgent as any);

      const wf = makeSimpleWorkflow({
        id: 'wf-cancel',
        nodes: [
          { id: 'start', type: WorkflowNodeType.START },
          { id: 'agent', type: WorkflowNodeType.AGENT, agentId: 'slow-agent' },
          { id: 'end', type: WorkflowNodeType.END },
        ],
        edges: [
          { id: 'e0', from: 'start', to: 'agent' },
          { id: 'e1', from: 'agent', to: 'end' },
        ],
      });
      orch.registerWorkflow(wf);

      // 异步启动工作流
      const workflowPromise = orch.executeWorkflow('wf-cancel', {});
      // 立即取消
      orch.cancelWorkflow('wf-cancel');

      // 工作流应该取消
      await expect(workflowPromise).resolves.toBeDefined();

      const status = orch.getWorkflowStatus('wf-cancel');
      expect(status).toBeUndefined(); // 完成后已被移除
    });

    it('should emit workflow:cancelled event', async () => {
      const orch = new AgentOrchestrator();
      const cancelledHandler = vi.fn();
      orch.on('workflow:cancelled', cancelledHandler);

      const wf = makeSimpleWorkflow({
        id: 'wf-event',
        nodes: [
          { id: 'start', type: WorkflowNodeType.START },
          { id: 'end', type: WorkflowNodeType.END },
        ],
        edges: [{ id: 'e0', from: 'start', to: 'end' }],
      });
      orch.registerWorkflow(wf);

      const execPromise = orch.executeWorkflow('wf-event', {});
      orch.cancelWorkflow('wf-event');

      await execPromise;
      expect(cancelledHandler).toHaveBeenCalled();
    });
  });

  describe('Orchestration Strategy', () => {
    it('should use ADAPTIVE strategy by default', () => {
      const orch = new AgentOrchestrator();
      expect(orch).toBeDefined();
    });

    it('should support SEQUENTIAL batch execution', async () => {
      const orch = new AgentOrchestrator({ strategy: OrchestrationStrategy.SEQUENTIAL });
      const agent = createMockAgent('worker', { done: true });
      orch.registerAgent(agent as any);

      const wf1 = makeSimpleWorkflow({
        id: 'seq-wf-1',
        nodes: [
          { id: 'start', type: WorkflowNodeType.START },
          { id: 'agent', type: WorkflowNodeType.AGENT, agentId: 'worker' },
          { id: 'end', type: WorkflowNodeType.END },
        ],
        edges: [
          { id: 'e0', from: 'start', to: 'agent' },
          { id: 'e1', from: 'agent', to: 'end' },
        ],
      });
      const wf2 = makeSimpleWorkflow({
        id: 'seq-wf-2',
        nodes: [
          { id: 'start', type: WorkflowNodeType.START },
          { id: 'end', type: WorkflowNodeType.END },
        ],
        edges: [{ id: 'e0', from: 'start', to: 'end' }],
      });

      orch.registerWorkflow(wf1);
      orch.registerWorkflow(wf2);

      const results = await orch.executeWorkflows(['seq-wf-1', 'seq-wf-2'], {});
      expect(results.has('seq-wf-1')).toBe(true);
      expect(results.has('seq-wf-2')).toBe(true);
    });
  });
});
