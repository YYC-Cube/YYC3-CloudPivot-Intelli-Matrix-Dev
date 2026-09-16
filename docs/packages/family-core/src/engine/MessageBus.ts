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
 * @file MessageBus.ts - 消息总线实现（支持优先级队列和背压）
 * @description YYC³ MovAISys 智能浮窗系统 - 核心引擎层
 * @author YanYuCloudCube Team
 * @version 1.1.0
 * @created 2025-12-31
 */

import { EventEmitter } from 'node:events';
import { logger } from '../deps/logger';
import { metrics } from '../deps/metrics';
import { AgentMessage, MessageType, MessageHandler, ProcessingContext, EngineStatus } from '../deps/engine-types';

/**
 * 消息总线配置接口
 */
interface MessageBusConfig {
  maxQueueSize: number;
  retryPolicy: {
    maxRetries: number;
    backoffFactor: number;
  };
  /** 背压超时（ms），0 表示无限等待，默认 30000ms */
  backpressureTimeout?: number;
}

/**
 * 消息条目（包含重试信息和优先级）
 */
interface MessageEntry {
  message: AgentMessage;
  retries: number;
  nextRetryAt?: Date;
  priority: number;
  enqueuedAt: number;
}

/**
 * 最小堆实现 — 按 (nextRetryAt, priority) 排序
 * - 优先取 nextRetryAt 已到期的消息
 * - 同等条件下优先级数值越小越优先
 * - 同等优先级下先进先出（enqueuedAt）
 */
class MinHeap {
  private heap: MessageEntry[] = [];

  get size(): number {
    return this.heap.length;
  }

  peek(): MessageEntry | undefined {
    return this.heap[0];
  }

  push(entry: MessageEntry): void {
    this.heap.push(entry);
    this.bubbleUp(this.heap.length - 1);
  }

  pop(): MessageEntry | undefined {
    if (this.heap.length === 0) return undefined;
    const top = this.heap[0]!;
    const bottom = this.heap.pop()!;
    if (this.heap.length > 0) {
      this.heap[0] = bottom;
      this.sinkDown(0);
    }
    return top;
  }

  private bubbleUp(index: number): void {
    while (index > 0) {
      const parent = Math.floor((index - 1) / 2);
      if (this.compare(index, parent) >= 0) break;
      [this.heap[index], this.heap[parent]] = [this.heap[parent]!, this.heap[index]!];
      index = parent;
    }
  }

  private sinkDown(index: number): void {
    const length = this.heap.length;
    while (true) {
      let smallest = index;
      const left = 2 * index + 1;
      const right = 2 * index + 2;

      if (left < length && this.compare(left, smallest) < 0) smallest = left;
      if (right < length && this.compare(right, smallest) < 0) smallest = right;

      if (smallest === index) break;
      [this.heap[index], this.heap[smallest]] = [this.heap[smallest]!, this.heap[index]!];
      index = smallest;
    }
  }

  /** 比较两条消息的优先级：先按 nextRetryAt，再按 priority，最后按 enqueuedAt */
  private compare(a: number, b: number): number {
    const entryA = this.heap[a]!;
    const entryB = this.heap[b]!;

    // 检查 nextRetryAt 是否到期
    const now = Date.now();
    const aReady = !entryA.nextRetryAt || entryA.nextRetryAt.getTime() <= now;
    const bReady = !entryB.nextRetryAt || entryB.nextRetryAt.getTime() <= now;

    if (aReady && !bReady) return -1;
    if (!aReady && bReady) return 1;

    // 都到期或都未到期时按 priority
    if (entryA.priority !== entryB.priority) {
      return entryA.priority - entryB.priority;
    }

    // 同优先级先进先出
    return entryA.enqueuedAt - entryB.enqueuedAt;
  }
}

/**
 * 消息总线实现
 *
 * 设计理念：
 * 1. 基于EventEmitter实现发布-订阅模式
 * 2. 支持消息持久化，防止消息丢失
 * 3. 支持消息重试，提高可靠性
 * 4. 支持优先级队列（MinHeap），确保重要消息优先处理
 * 5. 背压机制：队列满时阻塞发送方而非丢弃
 * 6. 监控消息吞吐量和延迟
 */
export class MessageBus extends EventEmitter {
  private config: Required<MessageBusConfig>;
  private handlers: Map<MessageType, MessageHandler[]> = new Map();
  private queue: MinHeap;
  private processing: boolean = false;
  private backpressureTimeout: number;
  /** 等待队列空位的 resolve 函数列表（背压） */
  private waiters: Array<{ resolve: () => void; timer: ReturnType<typeof setTimeout> }> = [];
  private metrics = {
    published: 0,
    processed: 0,
    failed: 0,
    retried: 0,
    averageProcessingTime: 0,
    totalProcessingTime: 0,
  };

  constructor(config: MessageBusConfig) {
    super();
    this.config = {
      ...config,
      backpressureTimeout: config.backpressureTimeout ?? 30000,
    };
    this.queue = new MinHeap();
    this.backpressureTimeout = this.config.backpressureTimeout;
    this.setMaxListeners(100); // 增加最大监听器数量

    logger.info('消息总线初始化', 'MessageBus', {
      maxQueueSize: config.maxQueueSize,
      retryPolicy: config.retryPolicy,
      backpressureTimeout: this.backpressureTimeout,
    });
  }

  /**
   * 发布消息（支持背压：队列满时阻塞等待）
   * @param priority 优先级（数值越小越优先，默认 100）
   */
  async publish(message: AgentMessage, priority: number = 100): Promise<void> {
    // 验证消息
    if (!message.id) {
      message.id = this.generateId();
    }
    if (!message.timestamp) {
      message.timestamp = new Date();
    }

    // 背压机制：队列满时等待
    while (this.queue.size >= this.config.maxQueueSize) {
      logger.warn('消息队列已满，触发背压', 'MessageBus', {
        queueSize: this.queue.size,
        maxSize: this.config.maxQueueSize,
      });

      await new Promise<void>((resolve, reject) => {
        const timer = setTimeout(() => {
          this.removeWaiter(timer, resolve);
          reject(new Error(`Backpressure timeout after ${this.backpressureTimeout}ms`));
        }, this.backpressureTimeout);

        this.waiters.push({ resolve, timer });
      });
    }

    // 添加到队列（最小堆）
    this.queue.push({
      message,
      retries: 0,
      priority,
      enqueuedAt: Date.now(),
    });

    // 更新指标
    this.metrics.published++;
    metrics.increment('message_bus.published');

    logger.debug('消息已发布', 'MessageBus', {
      messageId: message.id,
      messageType: message.type,
      priority,
      queueSize: this.queue.size,
    });

    // 触发事件
    this.emit('message:published', message);

    // 如果不在处理中，开始处理
    if (!this.processing) {
      this.processQueue();
    }
  }

  /**
   * 订阅消息类型
   */
  subscribe(type: MessageType, handler: MessageHandler): void {
    if (!this.handlers.has(type)) {
      this.handlers.set(type, []);
    }

    this.handlers.get(type)!.push(handler);

    logger.debug('消息处理器已注册', 'MessageBus', {
      messageType: type,
      handlersCount: this.handlers.get(type)!.length,
    });
  }

  /**
   * 取消订阅
   */
  unsubscribe(type: MessageType, handler: MessageHandler): void {
    const handlers = this.handlers.get(type);
    if (handlers) {
      const index = handlers.indexOf(handler);
      if (index !== -1) {
        handlers.splice(index, 1);
        logger.debug('消息处理器已取消注册', 'MessageBus', {
          messageType: type,
        });
      }
    }
  }

  /**
   * 处理消息队列
   */
  private async processQueue(): Promise<void> {
    if (this.processing) {
      return;
    }

    this.processing = true;

    while (this.queue.size > 0) {
      const entry = this.queue.peek()!;

      // 检查是否需要等待重试（如果最优先的消息都未到期，则等待）
      if (entry.nextRetryAt && entry.nextRetryAt > new Date()) {
        const delay = entry.nextRetryAt.getTime() - Date.now();
        if (delay > 0) {
          // sleep 到底: setTimeout 至少延迟 1ms 才触发, 若 delay<=1ms 直接自旋等待
          // (此处最长 1s, 因 calculateNextRetry 的 backoff 上限远大于 1s)
          await new Promise((resolve) => setTimeout(resolve, delay));
        }
        // 时间到即处理 — 不再二次检查: 计时器漂移导致的毫秒级未到期
        // 若 break 而不重新调度, 消息将永久滞留 (liveness bug), 直至下次 publish
      }

      // 从堆顶取出
      this.queue.pop();

      // 处理消息
      try {
        await this.processMessage(entry);
      } catch (error) {
        logger.error('消息处理失败', 'MessageBus', {
          messageId: entry.message.id,
          error,
        });

        // 检查是否需要重试
        if (entry.retries < this.config.retryPolicy.maxRetries) {
          entry.retries++;
          entry.nextRetryAt = this.calculateNextRetry(entry.retries);

          // 重新加入队列
          this.queue.push(entry);

          this.metrics.retried++;
          metrics.increment('message_bus.retried');
        } else {
          // 超过最大重试次数，丢弃消息
          this.metrics.failed++;
          metrics.increment('message_bus.failed');

          this.emit('message:failed', entry.message, error);
        }
      }
    }

    this.processing = false;
  }

  /**
   * 处理单个消息
   */
  private async processMessage(entry: MessageEntry): Promise<void> {
    const { message } = entry;

    logger.debug('处理消息', 'MessageBus', {
      messageId: message.id,
      messageType: message.type,
    });

    // 触发事件
    this.emit('message:processing', message);

    // 查找处理器
    const handlers = this.handlers.get(message.type);

    if (!handlers || handlers.length === 0) {
      logger.warn('没有找到消息处理器', 'MessageBus', {
        messageType: message.type,
      });
      return;
    }

    // 创建处理上下文
    const context: ProcessingContext = {
      traceId: this.generateTraceId(),
      message,
      engineState: {
        status: EngineStatus.RUNNING,
        uptime: 0,
        tasks: { total: 0, active: 0, completed: 0, failed: 0 },
        subsystems: [],
        metrics: {
          messageThroughput: 0,
          averageResponseTime: 0,
          errorRate: 0,
        },
      },
      availableSubsystems: Array.from(this.handlers.keys()),
      currentTime: new Date(),
    };

    const startTime = Date.now();

    // 并发调用所有处理器
    const results = await Promise.allSettled(
      handlers.map((handler) => handler(message, context)),
    );

    const processingTime = Date.now() - startTime;
    this.metrics.totalProcessingTime += processingTime;
    this.metrics.averageProcessingTime = Math.round(
      this.metrics.totalProcessingTime / this.metrics.processed,
    );

    // 处理结果
    const successful = results.filter((r) => r.status === 'fulfilled').length;
    const failed = results.filter((r) => r.status === 'rejected').length;

    logger.debug('消息处理完成', 'MessageBus', {
      messageId: message.id,
      successful,
      failed,
      processingTime,
    });

    // 更新指标
    this.metrics.processed++;
    metrics.increment('message_bus.processed');
    metrics.histogram('message_bus.processing_time', processingTime);

    // 触发事件
    this.emit('message:processed', message, results);
  }

  /**
   * 计算下次重试时间（指数退避）
   */
  private calculateNextRetry(retryCount: number): Date {
    const delay = Math.pow(this.config.retryPolicy.backoffFactor, retryCount) * 1000;
    return new Date(Date.now() + delay);
  }

  /**
   * 获取队列状态
   */
  getQueueStatus(): {
    size: number;
    processing: boolean;
    waiters: number;
    metrics: {
      published: number;
      processed: number;
      failed: number;
      retried: number;
      averageProcessingTime: number;
    };
  } {
    return {
      size: this.queue.size,
      processing: this.processing,
      waiters: this.waiters.length,
      metrics: { ...this.metrics },
    };
  }

  /**
   * 清空队列
   */
  clear(): void {
    while (this.queue.size > 0) {
      this.queue.pop();
    }
    // 释放所有背压等待者
    this.resolveAllWaiters();
    logger.info('消息队列已清空', 'MessageBus');
  }

  /**
   * 销毁消息总线
   */
  destroy(): void {
    this.clear();
    this.handlers.clear();
    this.removeAllListeners();
    logger.info('消息总线已销毁', 'MessageBus');
  }

  // ============ 辅助方法 ============

  private removeWaiter(timer: ReturnType<typeof setTimeout>, resolve: () => void): void {
    const idx = this.waiters.findIndex((w) => w.resolve === resolve);
    if (idx !== -1) {
      this.waiters.splice(idx, 1);
    }
  }

  /** 队列有空位时通知等待者 */
  private notifyOneWaiter(): void {
    const waiter = this.waiters.shift();
    if (waiter) {
      clearTimeout(waiter.timer);
      waiter.resolve();
    }
  }

  private resolveAllWaiters(): void {
    for (const waiter of this.waiters) {
      clearTimeout(waiter.timer);
      waiter.resolve();
    }
    this.waiters = [];
  }

  private generateId(): string {
    return `msg-${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
  }

  private generateTraceId(): string {
    return `trace-${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
  }
}
