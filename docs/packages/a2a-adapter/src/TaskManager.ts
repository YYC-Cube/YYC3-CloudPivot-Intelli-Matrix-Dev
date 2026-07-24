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
 * TaskManager.ts
 * ==============
 * A2A 任务管理器 — 提交、执行、追踪跨 Agent 任务
 *
 * 设计:
 * - 队列式任务调度
 * - 支持超时和取消
 * - 事件驱动的进度通知
 * - 优先级排序
 */

import EventEmitter from 'eventemitter3';
import type {
  Task,
  TaskResult,
  TaskMessage,
  TaskQuery,
  A2AEvent,
} from './types';
import type { AgentCardRegistry } from './AgentCardRegistry';

export interface TaskManagerConfig {
  /** 默认任务超时(ms) */
  defaultTimeout?: number;
  /** 最大并发任务数 */
  maxConcurrent?: number;
  /** 是否自动清理已完成任务 */
  autoCleanup?: boolean;
  /** 任务缓存保留时间(ms) */
  retentionPeriod?: number;
}

const DEFAULT_CONFIG: Required<TaskManagerConfig> = {
  defaultTimeout: 60_000,
  maxConcurrent: 10,
  autoCleanup: true,
  retentionPeriod: 300_000,
};

/**
 * 任务执行函数 — 收到任务后实际执行的逻辑
 */
export type TaskExecutor = (
  task: Task,
  emitMessage: (msg: TaskMessage) => void,
) => Promise<TaskResult>;

export class TaskManager extends EventEmitter {
  private tasks: Map<string, Task> = new Map();
  private queue: Task[] = [];
  private activeCount = 0;
  private registry: AgentCardRegistry;
  private config: Required<TaskManagerConfig>;
  /** 任务 ID → 执行器 映射 */
  private executors: Map<string, TaskExecutor> = new Map();
  /** 正在执行的 AbortController */
  private abortControllers: Map<string, AbortController> = new Map();
  private cleanupTimer: ReturnType<typeof setInterval> | null = null;

  constructor(registry: AgentCardRegistry, config: TaskManagerConfig = {}) {
    super();
    this.registry = registry;
    this.config = { ...DEFAULT_CONFIG, ...config };

    if (this.config.autoCleanup) {
      this.cleanupTimer = setInterval(() => this.cleanup(), this.config.retentionPeriod);
    }
  }

  // ═══ 执行器注册 ═══

  /** 注册 agent 的执行器 */
  registerExecutor(agentId: string, executor: TaskExecutor): void {
    this.executors.set(agentId, executor);
  }

  /** 注销执行器 */
  unregisterExecutor(agentId: string): boolean {
    return this.executors.delete(agentId);
  }

  // ═══ 任务提交与执行 ═══

  /** 提交一个新任务 */
  async submit(task: Omit<Task, 'id' | 'state' | 'createdAt' | 'updatedAt' | 'messages'>): Promise<Task> {
    const fullTask: Task = {
      ...task,
      id: `task-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      state: 'submitted',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      messages: [],
    };

    // 验证目标 agent 是否存在
    const targetCard = this.registry.get(fullTask.to);
    if (!targetCard) {
      fullTask.state = 'failed';
      fullTask.result = {
        success: false,
        error: { code: 'AGENT_NOT_FOUND', message: `Agent ${fullTask.to} not found` },
      };
      this.tasks.set(fullTask.id, fullTask);
      this.emit('task:failed', { task: fullTask, timestamp: Date.now() } as unknown as A2AEvent);
      return fullTask;
    }

    // 检查并发限制
    if (this.activeCount >= this.config.maxConcurrent) {
      this.queue.push(fullTask);
      this.queue.sort((a, b) => b.priority - a.priority);
      fullTask.state = 'submitted';
      this.emit('task:submitted', { task: fullTask, timestamp: Date.now() } as unknown as A2AEvent);
    } else {
      this.executeTask(fullTask);
    }

    this.tasks.set(fullTask.id, fullTask);
    return fullTask;
  }

  /** 获取任务状态 */
  getTask(taskId: string): Task | undefined {
    return this.tasks.get(taskId);
  }

  /** 取消一个正在执行的任务 */
  cancel(taskId: string): boolean {
    const controller = this.abortControllers.get(taskId);
    if (controller) {
      controller.abort();
      const task = this.tasks.get(taskId);
      if (task) {
        task.state = 'cancelled';
        task.updatedAt = Date.now();
        this.emit('task:cancelled', { task, timestamp: Date.now() } as unknown as A2AEvent);
      }
      this.abortControllers.delete(taskId);
      this.activeCount = Math.max(0, this.activeCount - 1);
      this.drainQueue();
      return true;
    }
    return false;
  }

  /** 查询任务列表 */
  query(query: TaskQuery): Task[] {
    let results = Array.from(this.tasks.values());

    if (query.from) results = results.filter(t => t.from === query.from);
    if (query.to) results = results.filter(t => t.to === query.to);
    if (query.state) results = results.filter(t => t.state === query.state);
    if (query.action) results = results.filter(t => t.action === query.action);
    if (query.since) results = results.filter(t => t.createdAt >= query.since!);
    if (query.limit) results = results.slice(0, query.limit);

    return results.sort((a, b) => b.createdAt - a.createdAt);
  }

  /** 获取统计信息 */
  getStats() {
    const all = Array.from(this.tasks.values());
    return {
      total: all.length,
      pending: all.filter(t => t.state === 'submitted' || t.state === 'working').length,
      completed: all.filter(t => t.state === 'completed').length,
      failed: all.filter(t => t.state === 'failed').length,
      cancelled: all.filter(t => t.state === 'cancelled').length,
      queued: this.queue.length,
      active: this.activeCount,
    };
  }

  /** 销毁管理器 */
  dispose(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = null;
    }
    this.tasks.clear();
    this.queue = [];
    this.executors.clear();
    this.abortControllers.clear();
    this.removeAllListeners();
  }

  // ═══ 内部执行逻辑 ═══

  private async executeTask(task: Task): Promise<void> {
    this.activeCount++;
    task.state = 'working';
    task.updatedAt = Date.now();
    this.emit('task:started', { task, timestamp: Date.now() } as unknown as A2AEvent);

    const controller = new AbortController();
    this.abortControllers.set(task.id, controller);

    const timeoutId = setTimeout(() => controller.abort(), task.timeout ?? this.config.defaultTimeout);

    const executor = this.executors.get(task.to);

    try {
      const emitMessage = (msg: TaskMessage) => {
        msg.id = `${task.id}-msg-${(task.messages?.length ?? 0) + 1}`;
        msg.timestamp = Date.now();
        task.messages?.push(msg);
        this.emit('task:progress', { task, message: msg, timestamp: Date.now() } as unknown as A2AEvent);
      };

      let result: TaskResult;
      if (executor) {
        // 使用注册的执行器
        result = await Promise.race([
          executor(task, emitMessage),
          this.wrapAbort(controller.signal),
        ]);
      } else {
        // 通用执行：调用 agent 的 HTTP 端点
        result = await this.callAgentEndpoint(task, controller.signal);
      }

      clearTimeout(timeoutId);
      this.abortControllers.delete(task.id);

      task.result = result;
      task.state = result.success ? 'completed' : 'failed';
      task.updatedAt = Date.now();

      this.emit(
        result.success ? 'task:completed' : 'task:failed',
        { task, timestamp: Date.now() } as unknown as A2AEvent,
      );
    } catch (error: unknown) {
      clearTimeout(timeoutId);
      this.abortControllers.delete(task.id);

      if (controller.signal.aborted) {
        task.state = 'cancelled';
      } else {
        task.state = 'failed';
        task.result = {
          success: false,
          error: {
            code: 'EXECUTION_ERROR',
            message: error instanceof Error ? error.message : 'Unknown error',
          },
        };
      }
      task.updatedAt = Date.now();
      this.emit('task:failed', { task, timestamp: Date.now() } as unknown as A2AEvent);
    } finally {
      this.activeCount = Math.max(0, this.activeCount - 1);
      this.drainQueue();
    }
  }

  /** 队列排水 — 从等待队列中拉取下一个任务 */
  private drainQueue(): void {
    while (this.activeCount < this.config.maxConcurrent && this.queue.length > 0) {
      const next = this.queue.shift()!;
      this.executeTask(next);
    }
  }

  /** 通用 HTTP 调用 agent 端点 */
  private async callAgentEndpoint(task: Task, signal: AbortSignal): Promise<TaskResult> {
    const targetCard = this.registry.get(task.to);
    if (!targetCard) {
      return { success: false, error: { code: 'AGENT_NOT_FOUND', message: `Agent ${task.to} not found` } };
    }

    // internal:// 协议表示进程内调用 — 无实际 HTTP 请求
    if (targetCard.url.startsWith('internal://')) {
      return { success: false, error: { code: 'NO_EXECUTOR', message: `No executor registered for ${task.to}` } };
    }

    try {
      const response = await fetch(targetCard.url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(task),
        signal,
      });
      if (!response.ok) {
        return { success: false, error: { code: 'HTTP_ERROR', message: `HTTP ${response.status}` } };
      }
      return await response.json();
    } catch (error: unknown) {
      return {
        success: false,
        error: {
          code: 'NETWORK_ERROR',
          message: error instanceof Error ? error.message : 'Network error',
        },
      };
    }
  }

  /** 包装 AbortController signal 为可 reject 的 Promise */
  private async wrapAbort(signal: AbortSignal): Promise<never> {
    return new Promise((_, reject) => {
      if (signal.aborted) {
        reject(new Error('Task cancelled'));
        return;
      }
      signal.addEventListener('abort', () => reject(new Error('Task cancelled')), { once: true });
    });
  }

  /** 自动清理过期的已完成任务 */
  private cleanup(): void {
    const now = Date.now();
    const retention = this.config.retentionPeriod;
    for (const [id, task] of this.tasks) {
      const isTerminal = task.state === 'completed' || task.state === 'failed' || task.state === 'cancelled';
      if (isTerminal && (now - task.updatedAt) > retention) {
        this.tasks.delete(id);
      }
    }
  }
}
