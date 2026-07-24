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
 * @file ai/AgentOrchestrator.ts
 * @description Agent Orchestrator 模块
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.0.0
 * @created 2026-03-07
 * @updated 2026-03-07
 * @status stable
 * @license MIT
 * @copyright Copyright (c) 2026 YanYuCloudCube Team
 * @tags typescript
 */

import EventEmitter from 'eventemitter3';
import { BaseAgent } from './BaseAgent';
import { logger } from '../deps/logger';


/**
 * 工作流节点类型
 */
export enum WorkflowNodeType {
  START = 'start',
  END = 'end',
  AGENT = 'agent',
  DECISION = 'decision',
  PARALLEL = 'parallel',
  MERGE = 'merge'
}

/**
 * 工作流节点
 */
export interface WorkflowNode {
  id: string;
  type: WorkflowNodeType;
  agentId?: string;
  condition?: (context: any) => boolean;
  next?: string | string[];
  metadata?: Record<string, any>;
}

/**
 * 工作流边
 */
export interface WorkflowEdge {
  id: string;
  from: string;
  to: string;
  condition?: (context: any) => boolean;
  metadata?: Record<string, any>;
}

/**
 * 工作流定义
 */
export interface WorkflowDefinition {
  id: string;
  name: string;
  description?: string;
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
  initialContext?: Record<string, any>;
}

/**
 * 工作流执行上下文
 */
export interface WorkflowContext {
  workflowId: string;
  data: Record<string, any>;
  currentNode: string;
  visitedNodes: string[];
  startTime: number;
  endTime?: number;
  status?: 'running' | 'completed' | 'failed' | 'cancelled';
  error?: string;
  /** 关联的 AbortController，用于取消工作流 */
  abortController?: AbortController;
  /** 关联的 AbortSignal */
  abortSignal?: AbortSignal;
}

/**
 * 编排策略
 */
export enum OrchestrationStrategy {
  SEQUENTIAL = 'sequential',
  PARALLEL = 'parallel',
  ADAPTIVE = 'adaptive',
  PRIORITIZED = 'prioritized'
}

/**
 * Agent编排器配置
 */
export interface OrchestratorConfig {
  strategy?: OrchestrationStrategy;
  maxConcurrency?: number;
  timeout?: number;
}

/**
 * Agent编排器
 */
export class AgentOrchestrator extends EventEmitter {
  private config: Required<OrchestratorConfig>;
  private agents: Map<string, BaseAgent> = new Map();
  private workflows: Map<string, WorkflowDefinition> = new Map();
  private activeWorkflows: Map<string, WorkflowContext> = new Map();
  private workflowHistory: Map<string, Array<{
    timestamp: number;
    status: 'completed' | 'failed' | 'cancelled';
    duration: number;
    nodesExecuted: number;
    error?: string;
  }>> = new Map();
  private workflowSnapshots: Map<string, WorkflowDefinition> = new Map();
  private workflowTemplates: Map<string, WorkflowDefinition> = new Map();
  private workflowDependencies: Map<string, Set<string>> = new Map();
  private performanceMetrics: Map<string, {
    avgDuration: number;
    successRate: number;
    executionCount: number;
  }> = new Map();
  private debugMode: boolean = false;
  private maxHistorySize: number = 1000;

  constructor(config: OrchestratorConfig = {}) {
    super();

    this.config = {
      strategy: config.strategy || OrchestrationStrategy.ADAPTIVE,
      maxConcurrency: config.maxConcurrency || 10,
      timeout: config.timeout || 300000 // 5分钟
    };
  }

  /**
   * 注册Agent
   */
  registerAgent(agent: BaseAgent): void {
    this.agents.set(agent.getId(), agent);
    this.emit('agent:registered', { agentId: agent.getId() });
  }

  /**
   * 注销Agent
   */
  unregisterAgent(agentId: string): void {
    this.agents.delete(agentId);
    this.emit('agent:unregistered', { agentId });
  }

  /**
   * 注册工作流
   */
  registerWorkflow(workflow: WorkflowDefinition): void {
    this.validateWorkflowInternal(workflow);
    this.workflows.set(workflow.id, workflow);
    this.emit('workflow:registered', { workflowId: workflow.id });
  }

  /**
   * 获取工作流定义
   */
  getWorkflow(workflowId: string): WorkflowDefinition | undefined {
    return this.workflows.get(workflowId);
  }

  /**
   * 验证工作流（内部方法）
   */
  private validateWorkflowInternal(workflow: WorkflowDefinition): void {
    const hasStart = workflow.nodes.some(n => n.type === WorkflowNodeType.START);
    const hasEnd = workflow.nodes.some(n => n.type === WorkflowNodeType.END);

    if (!hasStart) {
      throw new Error('Workflow must have a START node');
    }

    if (!hasEnd) {
      throw new Error('Workflow must have an END node');
    }

    // 验证所有Agent引用
    for (const node of workflow.nodes) {
      if (node.type === WorkflowNodeType.AGENT && node.agentId) {
        if (!this.agents.has(node.agentId)) {
          throw new Error(`Agent ${node.agentId} not found`);
        }
      }
    }
  }

  /**
   * 执行工作流
   */
  async executeWorkflow(
    workflowId: string,
    initialData?: Record<string, any>
  ): Promise<WorkflowContext> {
    const workflow = this.workflows.get(workflowId);
    
    if (!workflow) {
      throw new Error(`Workflow ${workflowId} not found`);
    }

    const abortController = new AbortController();
    const context: WorkflowContext = {
      workflowId,
      data: { ...workflow.initialContext, ...initialData },
      currentNode: this.findStartNode(workflow).id,
      visitedNodes: [],
      startTime: Date.now(),
      status: 'running',
      abortController,
      abortSignal: abortController.signal,
    };

    this.activeWorkflows.set(workflowId, context);
    this.emit('workflow:started', { workflowId, context });

    try {
      // 持续执行节点直到到达 END 节点或被取消
      let iterations = 0;
      const maxIterations = 1000; // 防止无限循环

      while (iterations < maxIterations) {
        // 检查工作流是否被取消
        if (abortController.signal.aborted) {
          context.status = 'cancelled';
          context.endTime = Date.now();
          this.recordWorkflowExecution(workflowId, context);
          this.emit('workflow:cancelled', { workflowId, context });
          return context;
        }

        iterations++;
        const currentNodeObj = workflow.nodes.find(n => n.id === context.currentNode);
        
        if (!currentNodeObj) {
          throw new Error(`Current node ${context.currentNode} not found`);
        }

        // 如果到达 END 节点，停止
        if (currentNodeObj.type === WorkflowNodeType.END) {
          break;
        }

        // 执行当前节点（传入 abortSignal）
        await this.executeNode(workflow, context, abortController.signal);

        // 再次检查取消状态
        if (abortController.signal.aborted) {
          context.status = 'cancelled';
          context.endTime = Date.now();
          this.recordWorkflowExecution(workflowId, context);
          this.emit('workflow:cancelled', { workflowId, context });
          return context;
        }

        // 查找下一个节点
        const nextEdges = workflow.edges.filter(e => e.from === context.currentNode);
        if (nextEdges.length === 0) {
          // 如果没有出边，尝试找到 END 节点
          const endNode = workflow.nodes.find(n => n.type === WorkflowNodeType.END);
          if (endNode) {
            context.currentNode = endNode.id;
          } else {
            throw new Error(`No next edge from node ${context.currentNode}`);
          }
        } else {
          // 移动到第一条出边的目标节点
          context.currentNode = nextEdges[0]!.to;
        }
      }

      context.endTime = Date.now();
      context.status = 'completed';
      
      this.recordWorkflowExecution(workflowId, context);
      this.emit('workflow:completed', { workflowId, context });
      return context;
    } catch (error) {
      if (abortController.signal.aborted) {
        context.status = 'cancelled';
      } else {
        context.status = 'failed';
        context.error = error instanceof Error ? error.message : String(error);
      }
      this.emit('workflow:error', { workflowId, error });
      throw error;
    } finally {
      this.activeWorkflows.delete(workflowId);
    }
  }

  /**
   * 查找开始节点
   */
  private findStartNode(workflow: WorkflowDefinition): WorkflowNode {
    const startNode = workflow.nodes.find(n => n.type === WorkflowNodeType.START);
    if (!startNode) {
      throw new Error('No START node found');
    }
    return startNode;
  }

  /**
   * 执行节点
   */
  private async executeNode(
    workflow: WorkflowDefinition,
    context: WorkflowContext,
    abortSignal?: AbortSignal,
  ): Promise<void> {
    const node = workflow.nodes.find(n => n.id === context.currentNode);
    
    if (!node) {
      throw new Error(`Node ${context.currentNode} not found`);
    }

    if (abortSignal?.aborted) {
      return;
    }

    context.visitedNodes.push(node.id);
    this.emit('node:executing', { nodeId: node.id, context });

    switch (node.type) {
      case WorkflowNodeType.START:
        await this.executeStartNode(workflow, context, node);
        break;
      
      case WorkflowNodeType.END:
        // 工作流结束
        return;
      
      case WorkflowNodeType.AGENT:
        await this.executeAgentNode(workflow, context, node, abortSignal);
        break;
      
      case WorkflowNodeType.DECISION:
        await this.executeDecisionNode(workflow, context, node);
        break;
      
      case WorkflowNodeType.PARALLEL:
        await this.executeParallelNode(workflow, context, node);
        break;
      
      case WorkflowNodeType.MERGE:
        await this.executeMergeNode(workflow, context, node);
        break;
    }

    this.emit('node:completed', { nodeId: node.id, context });
  }

  /**
   * 执行开始节点
   */
  private async executeStartNode(
    _workflow: WorkflowDefinition,
    _context: WorkflowContext,
    _node: WorkflowNode
  ): Promise<void> {
    // 开始节点只是一个起点，不执行任何操作
  }

  /**
   * 执行Agent节点
   */
  private async executeAgentNode(
    _workflow: WorkflowDefinition,
    context: WorkflowContext,
    node: WorkflowNode,
    abortSignal?: AbortSignal,
  ): Promise<void> {
    if (!node.agentId) {
      throw new Error('Agent node must have agentId');
    }

    const agent = this.agents.get(node.agentId);
    if (!agent) {
      throw new Error(`Agent ${node.agentId} not found`);
    }

    // 执行Agent任务（如果 agent 有 execute 方法）
    if (typeof (agent as any).execute === 'function') {
      // 使用 Promise.race 支持取消
      const executePromise = (agent as any).execute(context.data);
      const result = abortSignal
        ? await Promise.race([
            executePromise,
            new Promise<never>((_, reject) => {
              if (abortSignal.aborted) {
                reject(new Error(`Workflow cancelled: ${context.workflowId}`));
                return;
              }
              abortSignal.addEventListener('abort', () => {
                reject(new Error(`Workflow cancelled: ${context.workflowId}`));
              }, { once: true });
            }),
          ])
        : await executePromise;
      context.data = { ...context.data, ...result };
    } else {
      // 否则只是标记为已执行
      context.data[`${node.agentId}_executed`] = true;
    }
  }

  /**
   * 执行决策节点
   */
  private async executeDecisionNode(
    workflow: WorkflowDefinition,
    context: WorkflowContext,
    node: WorkflowNode
  ): Promise<void> {
    const outgoingEdges = workflow.edges.filter(e => e.from === node.id);
    if (outgoingEdges.length === 0) return;

    for (const edge of outgoingEdges) {
      if (edge.condition) {
        try {
          const matched = edge.condition(context.data);
          if (matched) {
            context.data._decisionBranch = edge.to;
            return;
          }
        } catch (e) {
          logger.warn('Decision condition evaluation failed, skipping edge', 'AgentOrchestrator', { edgeId: edge.id, error: e instanceof Error ? e.message : String(e) });
        }
      }
    }

    // fallback: use first edge
    context.data._decisionBranch = outgoingEdges[0]!.to;
  }

  /**
   * 执行并行节点
   */
  private async executeParallelNode(
    workflow: WorkflowDefinition,
    context: WorkflowContext,
    node: WorkflowNode
  ): Promise<void> {
    const outgoingEdges = workflow.edges.filter(e => e.from === node.id);
    if (outgoingEdges.length === 0) return;

    const concurrencyLimit = this.config.maxConcurrency;
    const parallelResults: Array<{ edgeTo: string; status: string; data?: any; error?: string }> = [];

    // Execute branches with concurrency limit
    const chunks: WorkflowEdge[][] = [];
    for (let i = 0; i < outgoingEdges.length; i += concurrencyLimit) {
      chunks.push(outgoingEdges.slice(i, i + concurrencyLimit));
    }

    for (const chunk of chunks) {
      const settled = await Promise.allSettled(
        chunk.map(async (edge) => {
          const targetNode = workflow.nodes.find(n => n.id === edge.to);
          if (!targetNode) return { edgeTo: edge.to, status: 'skipped', error: 'Node not found' };

          if (targetNode.type === WorkflowNodeType.AGENT && targetNode.agentId) {
            const agent = this.agents.get(targetNode.agentId);
            if (agent && typeof (agent as any).execute === 'function') {
              const result = await (agent as any).execute({ ...context.data });
              return { edgeTo: edge.to, status: 'completed', data: result };
            }
          }
          return { edgeTo: edge.to, status: 'completed', data: {} };
        })
      );

      for (const result of settled) {
        if (result.status === 'fulfilled') {
          parallelResults.push(result.value);
        } else {
          parallelResults.push({ edgeTo: 'unknown', status: 'failed', error: result.reason?.message || 'Unknown' });
        }
      }
    }

    context.data._parallelResults = parallelResults;
  }

  /**
   * 执行合并节点
   */
  private async executeMergeNode(
    _workflow: WorkflowDefinition,
    context: WorkflowContext,
    _node: WorkflowNode
  ): Promise<void> {
    const results = context.data._parallelResults as Array<{ edgeTo: string; status: string; data?: any; error?: string }> | undefined;
    if (!results || results.length === 0) return;

    const merged: Record<string, any> = {};
    const errors: string[] = [];

    for (const result of results) {
      if (result.status === 'completed' && result.data) {
        if (typeof result.data === 'object') {
          Object.assign(merged, result.data);
        } else {
          merged[result.edgeTo] = result.data;
        }
      } else if (result.error) {
        errors.push(`${result.edgeTo}: ${result.error}`);
      }
    }

    context.data._mergedResults = merged;
    if (errors.length > 0) {
      context.data._mergeErrors = errors;
    }

    // Clean up parallel results after merging
    delete context.data._parallelResults;
  }

  /**
   * 获取工作流状态
   */
  getWorkflowStatus(workflowId: string): WorkflowContext | undefined {
    return this.activeWorkflows.get(workflowId);
  }

  /**
   * 取消工作流 — 触发 AbortController 中断正在执行的异步任务
   */
  cancelWorkflow(workflowId: string): void {
    const context = this.activeWorkflows.get(workflowId);
    
    if (context) {
      context.status = 'cancelled';
      // 触发 AbortController 中断所有关联的异步操作
      if (context.abortController) {
        context.abortController.abort();
      }
      this.emit('workflow:cancelled', { workflowId });
    }
  }

  /**
   * 获取所有Agent
   */
  getAllAgents(): BaseAgent[] {
    return Array.from(this.agents.values());
  }

  /**
   * 获取所有工作流
   */
  getAllWorkflows(): WorkflowDefinition[] {
    return Array.from(this.workflows.values());
  }

  /**
   * 创建工作流快照
   */
  createWorkflowSnapshot(workflowId: string, snapshotId?: string): string {
    const workflow = this.workflows.get(workflowId);
    if (!workflow) {
      throw new Error(`Workflow ${workflowId} not found`);
    }

    const id = snapshotId || `snapshot-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const snapshot: WorkflowDefinition = {
      ...workflow,
      id,
      name: `${workflow.name} (Snapshot)`,
    };

    this.workflowSnapshots.set(id, snapshot);
    this.emit('workflow:snapshot:created', { workflowId, snapshotId: id });
    return id;
  }

  /**
   * 恢复工作流快照
   */
  restoreWorkflowSnapshot(snapshotId: string, targetWorkflowId?: string): void {
    const snapshot = this.workflowSnapshots.get(snapshotId);
    if (!snapshot) {
      throw new Error(`Snapshot ${snapshotId} not found`);
    }

    const workflowId = targetWorkflowId || snapshot.id;
    this.workflows.set(workflowId, snapshot);
    this.emit('workflow:snapshot:restored', { snapshotId, workflowId });
  }

  /**
   * 删除工作流快照
   */
  deleteWorkflowSnapshot(snapshotId: string): void {
    this.workflowSnapshots.delete(snapshotId);
    this.emit('workflow:snapshot:deleted', { snapshotId });
  }

  /**
   * 创建工作流模板
   */
  createWorkflowTemplate(templateId: string, workflow: WorkflowDefinition): void {
    this.workflowTemplates.set(templateId, workflow);
    this.emit('workflow:template:created', { templateId });
  }

  /**
   * 从模板创建工作流
   */
  createWorkflowFromTemplate(
    templateId: string,
    workflowId: string,
    name: string
  ): void {
    const template = this.workflowTemplates.get(templateId);
    if (!template) {
      throw new Error(`Template ${templateId} not found`);
    }

    const workflow: WorkflowDefinition = {
      ...template,
      id: workflowId,
      name,
    };

    this.registerWorkflow(workflow);
    this.emit('workflow:created:from:template', { templateId, workflowId });
  }

  /**
   * 获取工作流模板
   */
  getWorkflowTemplate(templateId: string): WorkflowDefinition | undefined {
    return this.workflowTemplates.get(templateId);
  }

  /**
   * 获取所有工作流模板
   */
  getAllWorkflowTemplates(): WorkflowDefinition[] {
    return Array.from(this.workflowTemplates.values());
  }

  /**
   * 设置工作流依赖
   */
  setWorkflowDependencies(workflowId: string, dependencies: string[]): void {
    this.workflowDependencies.set(workflowId, new Set(dependencies));
    this.emit('workflow:dependencies:set', { workflowId, dependencies });
  }

  /**
   * 获取工作流依赖
   */
  getWorkflowDependencies(workflowId: string): string[] {
    return Array.from(this.workflowDependencies.get(workflowId) || []);
  }

  /**
   * 检查工作流依赖
   */
  checkWorkflowDependencies(workflowId: string): {
    satisfied: boolean;
    missing: string[];
  } {
    const dependencies = this.workflowDependencies.get(workflowId) || new Set();
    const missing: string[] = [];

    for (const dep of dependencies) {
      if (!this.workflows.has(dep)) {
        missing.push(dep);
      }
    }

    return {
      satisfied: missing.length === 0,
      missing,
    };
  }

  /**
   * 批量执行工作流
   */
  async executeWorkflows(
    workflowIds: string[],
    initialData?: Record<string, any>
  ): Promise<Map<string, WorkflowContext>> {
    const results = new Map<string, WorkflowContext>();

    if (this.config.strategy === OrchestrationStrategy.PARALLEL) {
      const promises = workflowIds.map(async (workflowId) => {
        try {
          const context = await this.executeWorkflow(workflowId, initialData);
          results.set(workflowId, context);
        } catch (error) {
          this.emit('workflow:error', { workflowId, error });
        }
      });
      await Promise.all(promises);
    } else {
      for (const workflowId of workflowIds) {
        try {
          const context = await this.executeWorkflow(workflowId, initialData);
          results.set(workflowId, context);
        } catch (error) {
          this.emit('workflow:error', { workflowId, error });
        }
      }
    }

    return results;
  }

  /**
   * 获取工作流历史
   */
  getWorkflowHistory(workflowId: string, limit: number = 100): Array<{
    timestamp: number;
    status: 'completed' | 'failed' | 'cancelled';
    duration: number;
    nodesExecuted: number;
    error?: string;
  }> {
    const history = this.workflowHistory.get(workflowId) || [];
    return history.slice(-limit);
  }

  /**
   * 获取工作流性能指标
   */
  getWorkflowPerformanceMetrics(workflowId?: string): Record<string, any> {
    if (workflowId) {
      const metrics = this.performanceMetrics.get(workflowId);
      if (!metrics) {
        return { workflowId, avgDuration: 0, successRate: 0, executionCount: 0 };
      }
      return {
        workflowId,
        avgDuration: metrics.avgDuration,
        successRate: metrics.successRate,
        executionCount: metrics.executionCount,
      };
    }

    const result: Record<string, any> = {};
    for (const [id, metrics] of this.performanceMetrics) {
      result[id] = {
        avgDuration: metrics.avgDuration,
        successRate: metrics.successRate,
        executionCount: metrics.executionCount,
      };
    }
    return result;
  }

  /**
   * 记录工作流执行
   */
  private recordWorkflowExecution(
    workflowId: string,
    context: WorkflowContext
  ): void {
    const history = this.workflowHistory.get(workflowId) || [];
    const duration = (context.endTime || Date.now()) - context.startTime;

    history.push({
      timestamp: context.startTime,
      status: (context.status === 'running') ? 'completed' : (context.status || 'completed'),
      duration,
      nodesExecuted: context.visitedNodes.length,
      error: context.error,
    });

    if (history.length > this.maxHistorySize) {
      history.shift();
    }

    this.workflowHistory.set(workflowId, history);

    const metrics = this.performanceMetrics.get(workflowId) || {
      avgDuration: 0,
      successRate: 0,
      executionCount: 0,
    };

    const newExecutionCount = metrics.executionCount + 1;
    const newAvgDuration =
      (metrics.avgDuration * metrics.executionCount + duration) / newExecutionCount;
    const newSuccessRate =
      (metrics.successRate * metrics.executionCount +
        (context.status === 'completed' ? 1 : 0)) /
      newExecutionCount;

    this.performanceMetrics.set(workflowId, {
      avgDuration: newAvgDuration,
      successRate: newSuccessRate,
      executionCount: newExecutionCount,
    });
  }

  /**
   * 清除工作流历史
   */
  clearWorkflowHistory(workflowId?: string): void {
    if (workflowId) {
      this.workflowHistory.delete(workflowId);
      this.emit('workflow:history:cleared', { workflowId });
    } else {
      this.workflowHistory.clear();
      this.emit('workflow:history:cleared', { all: true });
    }
  }

  /**
   * 设置调试模式
   */
  setDebugMode(enabled: boolean): void {
    this.debugMode = enabled;
    this.emit('debug:mode:changed', { enabled });
  }

  /**
   * 获取调试模式
   */
  isDebugMode(): boolean {
    return this.debugMode;
  }

  /**
   * 验证工作流
   */
  validateWorkflow(workflow: WorkflowDefinition): {
    valid: boolean;
    errors: string[];
    warnings: string[];
  } {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!workflow.id) {
      errors.push('Workflow must have an ID');
    }

    if (!workflow.name) {
      errors.push('Workflow must have a name');
    }

    const hasStart = workflow.nodes.some(n => n.type === WorkflowNodeType.START);
    const hasEnd = workflow.nodes.some(n => n.type === WorkflowNodeType.END);

    if (!hasStart) {
      errors.push('Workflow must have a START node');
    }

    if (!hasEnd) {
      errors.push('Workflow must have an END node');
    }

    const nodeIds = new Set(workflow.nodes.map(n => n.id));
    for (const edge of workflow.edges) {
      if (!nodeIds.has(edge.from)) {
        errors.push(`Edge references non-existent node: ${edge.from}`);
      }
      if (!nodeIds.has(edge.to)) {
        errors.push(`Edge references non-existent node: ${edge.to}`);
      }
    }

    const orphanNodes = workflow.nodes.filter(
      n => !workflow.edges.some(e => e.from === n.id) && n.type !== WorkflowNodeType.START
    );
    for (const node of orphanNodes) {
      warnings.push(`Node ${node.id} has no incoming edges`);
    }

    for (const node of workflow.nodes) {
      if (node.type === WorkflowNodeType.AGENT && node.agentId) {
        if (!this.agents.has(node.agentId)) {
          warnings.push(`Agent ${node.agentId} not registered`);
        }
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * 优化工作流
   */
  optimizeWorkflow(workflowId: string): {
    optimized: boolean;
    suggestions: string[];
  } {
    const workflow = this.workflows.get(workflowId);
    if (!workflow) {
      throw new Error(`Workflow ${workflowId} not found`);
    }

    const suggestions: string[] = [];

    const nodeCounts = new Map<WorkflowNodeType, number>();
    for (const node of workflow.nodes) {
      const count = nodeCounts.get(node.type) || 0;
      nodeCounts.set(node.type, count + 1);
    }

    if (nodeCounts.get(WorkflowNodeType.DECISION)! > 5) {
      suggestions.push('Consider reducing the number of decision nodes for better performance');
    }

    const avgEdgesPerNode = workflow.edges.length / workflow.nodes.length;
    if (avgEdgesPerNode > 3) {
      suggestions.push('Consider simplifying the workflow structure');
    }

    const metrics = this.getWorkflowPerformanceMetrics(workflowId);
    if (metrics.avgDuration > 10000) {
      suggestions.push('Workflow execution time is high, consider optimizing agent tasks');
    }

    if (metrics.successRate < 0.8) {
      suggestions.push('Workflow success rate is low, review error handling');
    }

    return {
      optimized: suggestions.length > 0,
      suggestions,
    };
  }

  /**
   * 克隆工作流
   */
  cloneWorkflow(sourceWorkflowId: string, targetWorkflowId: string, name: string): void {
    const sourceWorkflow = this.workflows.get(sourceWorkflowId);
    if (!sourceWorkflow) {
      throw new Error(`Workflow ${sourceWorkflowId} not found`);
    }

    const clonedWorkflow: WorkflowDefinition = {
      ...sourceWorkflow,
      id: targetWorkflowId,
      name,
      nodes: sourceWorkflow.nodes.map(node => ({ ...node })),
      edges: sourceWorkflow.edges.map(edge => ({ ...edge })),
    };

    this.registerWorkflow(clonedWorkflow);
    this.emit('workflow:cloned', { sourceWorkflowId, targetWorkflowId });
  }

  /**
   * 导出工作流
   */
  exportWorkflow(workflowId: string): string {
    const workflow = this.workflows.get(workflowId);
    if (!workflow) {
      throw new Error(`Workflow ${workflowId} not found`);
    }
    return JSON.stringify(workflow, null, 2);
  }

  /**
   * 导入工作流
   */
  importWorkflow(workflowData: string): string {
    const workflow: WorkflowDefinition = JSON.parse(workflowData);
    this.registerWorkflow(workflow);
    this.emit('workflow:imported', { workflowId: workflow.id });
    return workflow.id;
  }

  /**
   * 获取工作流统计
   */
  getWorkflowStatistics(): {
    totalWorkflows: number;
    totalAgents: number;
    activeWorkflows: number;
    avgNodesPerWorkflow: number;
    avgEdgesPerWorkflow: number;
    mostUsedNodeType: WorkflowNodeType;
  } {
    const workflows = Array.from(this.workflows.values());
    const totalNodes = workflows.reduce((sum, wf) => sum + wf.nodes.length, 0);
    const totalEdges = workflows.reduce((sum, wf) => sum + wf.edges.length, 0);

    const nodeTypeCounts = new Map<WorkflowNodeType, number>();
    for (const workflow of workflows) {
      for (const node of workflow.nodes) {
        const count = nodeTypeCounts.get(node.type) || 0;
        nodeTypeCounts.set(node.type, count + 1);
      }
    }

    let mostUsedNodeType = WorkflowNodeType.AGENT;
    let maxCount = 0;
    for (const [type, count] of nodeTypeCounts) {
      if (count > maxCount) {
        maxCount = count;
        mostUsedNodeType = type;
      }
    }

    return {
      totalWorkflows: this.workflows.size,
      totalAgents: this.agents.size,
      activeWorkflows: this.activeWorkflows.size,
      avgNodesPerWorkflow: workflows.length > 0 ? totalNodes / workflows.length : 0,
      avgEdgesPerWorkflow: workflows.length > 0 ? totalEdges / workflows.length : 0,
      mostUsedNodeType,
    };
  }

  /**
   * 重置编排器
   */
  reset(): void {
    this.workflows.clear();
    this.activeWorkflows.clear();
    this.workflowHistory.clear();
    this.workflowSnapshots.clear();
    this.workflowTemplates.clear();
    this.workflowDependencies.clear();
    this.performanceMetrics.clear();
    this.emit('orchestrator:reset');
  }

  /**
   * 生成编排报告
   */
  generateReport(): string {
    const stats = this.getWorkflowStatistics();
    const performanceMetrics = this.getWorkflowPerformanceMetrics();

    return `
╔══════════════════════════════════════════════════════════════╗
║            Agent Orchestrator Report                        ║
╚══════════════════════════════════════════════════════════════╝

=== Agent统计 ===
已注册Agent: ${this.agents.size}
活动工作流: ${this.activeWorkflows.size}
已注册工作流: ${this.workflows.size}
工作流模板: ${this.workflowTemplates.size}
工作流快照: ${this.workflowSnapshots.size}

=== 编排策略 ===
当前策略: ${this.config.strategy}
最大并发: ${this.config.maxConcurrency}
超时时间: ${this.config.timeout}ms
调试模式: ${this.debugMode ? '启用' : '禁用'}

=== 工作流统计 ===
总工作流数: ${stats.totalWorkflows}
平均节点数/工作流: ${stats.avgNodesPerWorkflow.toFixed(2)}
平均边数/工作流: ${stats.avgEdgesPerWorkflow.toFixed(2)}
最常用节点类型: ${stats.mostUsedNodeType}

=== 已注册Agent ===
${Array.from(this.agents.values()).map(agent =>
  `- ${agent.getName()} (${agent.getId()})`
).join('\n') || '无'}

=== 已注册工作流 ===
${Array.from(this.workflows.values()).map(wf => {
  const validation = this.validateWorkflow(wf);
  const status = validation.valid ? '✅' : '❌';
  return `${status} ${wf.name} (${wf.id}) - ${wf.nodes.length} nodes, ${wf.edges.length} edges`;
}).join('\n') || '无'}

=== 工作流模板 ===
${Array.from(this.workflowTemplates.values()).map(wf =>
  `- ${wf.name} (${wf.id})`
).join('\n') || '无'}

=== 性能指标 ===
${Object.entries(performanceMetrics)
  .slice(0, 5)
  .map(([workflowId, metrics]) =>
    `${workflowId}:\n  平均执行时间: ${metrics.avgDuration.toFixed(2)}ms\n  成功率: ${(metrics.successRate * 100).toFixed(2)}%\n  执行次数: ${metrics.executionCount}`
  )
  .join('\n\n') || '无数据'}

=== 工作流依赖 ===
${Array.from(this.workflowDependencies.entries()).map(([workflowId, deps]) =>
  `- ${workflowId}: ${Array.from(deps).join(', ')}`
).join('\n') || '无依赖'}

=== 调试信息 ===
最大历史记录: ${this.maxHistorySize}
总历史记录: ${Array.from(this.workflowHistory.values()).reduce((sum, history) => sum + history.length, 0)}
    `.trim();
  }
}

/**
 * 创建Agent编排器
 */
export function createAgentOrchestrator(config?: OrchestratorConfig): AgentOrchestrator {
  return new AgentOrchestrator(config);
}