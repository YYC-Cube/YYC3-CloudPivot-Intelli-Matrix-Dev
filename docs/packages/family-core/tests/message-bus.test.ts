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

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { MessageBus } from '../src/engine/MessageBus.js';
import type { AgentMessage } from '../src/deps/engine-types.js';

/** MessageType 现在是 type 别名（type MessageType = string），用字符串字面量 */
const SYS_TYPE = 'system';

function makeMsg(overrides?: Partial<AgentMessage>): AgentMessage {
  return {
    id: `msg-${Date.now()}`,
    type: SYS_TYPE,
    from: 'test',
    to: 'all',
    timestamp: new Date(),
    payload: { data: 'test' },
    ...overrides,
  };
}

describe('MessageBus', () => {
  let bus: MessageBus;

  beforeEach(() => {
    bus = new MessageBus({
      maxQueueSize: 10,
      retryPolicy: { maxRetries: 2, backoffFactor: 2 },
      backpressureTimeout: 100,
    });
  });

  afterEach(() => {
    bus.destroy();
  });

  describe('publish and subscribe', () => {
    it('should publish and deliver messages', async () => {
      const handler = vi.fn();
      bus.subscribe(SYS_TYPE, handler);

      const msg = makeMsg();
      await bus.publish(msg, 1);

      await new Promise((r) => setTimeout(r, 50));
      expect(handler).toHaveBeenCalledTimes(1);
      expect(handler).toHaveBeenCalledWith(msg, expect.any(Object));
    });

    it('should handle messages with default priority', async () => {
      const handler = vi.fn();
      bus.subscribe(SYS_TYPE, handler);

      await bus.publish(makeMsg());
      await new Promise((r) => setTimeout(r, 50));
      expect(handler).toHaveBeenCalledTimes(1);
    });

    it('should handle unsubscribe', async () => {
      const handler = vi.fn();
      bus.subscribe(SYS_TYPE, handler);
      bus.unsubscribe(SYS_TYPE, handler);

      await bus.publish(makeMsg());
      await new Promise((r) => setTimeout(r, 50));
      expect(handler).not.toHaveBeenCalled();
    });

    it('should auto-generate id if not provided', async () => {
      const msg = { type: SYS_TYPE, from: 'test', to: 'all', timestamp: new Date(), payload: {} } as AgentMessage;
      await bus.publish(msg);
      expect(msg.id).toBeTruthy();
    });

    it('should auto-generate timestamp if not provided', async () => {
      const msg = { id: 'msg-1', type: SYS_TYPE, from: 'test', to: 'all', payload: {} } as AgentMessage;
      await bus.publish(msg);
      expect(msg.timestamp).toBeInstanceOf(Date);
    });
  });

  describe('priority queue (MinHeap)', () => {
    it('should respect priority ordering when messages are queued before processing', async () => {
      const order: string[] = [];
      const handler = vi.fn().mockImplementation(async (msg: AgentMessage) => {
        await new Promise(r => setTimeout(r, 30));
        order.push(msg.id!);
      });

      bus.subscribe(SYS_TYPE, handler);

      // 先发一条"引子"消息启动 processQueue
      await bus.publish(makeMsg({ id: 'primer' }), 100);
      // 等 processQueue 弹出引子开始处理后，再发布测试消息
      await new Promise(r => setTimeout(r, 20));

      // 此时 processQueue 正在处理引子（慢 handler），堆中有空位
      bus.publish(makeMsg({ id: 'low' }), 100);
      bus.publish(makeMsg({ id: 'high' }), 1);
      bus.publish(makeMsg({ id: 'mid' }), 50);

      await new Promise(r => setTimeout(r, 300));
      // primer 先入，之后按优先级排序
      expect(order[0]).toBe('primer');
      expect(order[1]).toBe('high');
      expect(order[2]).toBe('mid');
      expect(order[3]).toBe('low');
    });
  });

  describe('retry mechanism', () => {
    it('should retry failed messages', async () => {
      let attempts = 0;
      const handler = vi.fn().mockImplementation(() => {
        attempts++;
        if (attempts <= 2) throw new Error('temporary error');
      });

      bus.subscribe(SYS_TYPE, handler);

      await bus.publish(makeMsg({ id: 'retry-1' }), 1);
      await new Promise((r) => setTimeout(r, 150));
      expect(handler).toHaveBeenCalledTimes(attempts);
    });

    it('should emit failed event after max retries', async () => {
      const failHandler = vi.fn();
      // 使用 backoffFactor=1 使重试快速完成
      const retryBus = new MessageBus({
        maxQueueSize: 10,
        retryPolicy: { maxRetries: 2, backoffFactor: 1 },
        backpressureTimeout: 100,
      });
      retryBus.on('message:failed', failHandler);

      const handler = vi.fn().mockImplementation(() => {
        throw new Error('persistent error');
      });
      retryBus.subscribe(SYS_TYPE, handler);

      await retryBus.publish(makeMsg({ id: 'fail-1' }), 1);
      await new Promise((r) => setTimeout(r, 3000));
      expect(failHandler).toHaveBeenCalled();
      retryBus.destroy();
    });
  });

  describe('backpressure', () => {
    it('should block publish when queue is full', async () => {
      // 使用慢 handler（500ms），保证 processQueue 在处理过程中不会弹出新消息
      const slowHandler = vi.fn().mockImplementation(
        () => new Promise((r) => setTimeout(r, 500)),
      );

      const smallBus = new MessageBus({
        maxQueueSize: 2,
        retryPolicy: { maxRetries: 0, backoffFactor: 1 },
        backpressureTimeout: 500,
      });

      smallBus.subscribe(SYS_TYPE, slowHandler);

      // 第1条：启动 processQueue（开始处理 bp-1，耗时 500ms）
      await smallBus.publish(makeMsg({ id: 'bp-1' }), 1);
      // 等 processQueue 弹出 bp-1 开始处理
      await new Promise(r => setTimeout(r, 20));

      // 此时 processQueue 被慢 handler 阻塞，无法从堆中弹出
      // 堆为空，填满他
      await smallBus.publish(makeMsg({ id: 'bp-2' }), 1);
      await smallBus.publish(makeMsg({ id: 'bp-3' }), 1);

      // 堆已满（size=2=maxQueueSize），第4条触发背压
      const publishPromise = smallBus.publish(makeMsg({ id: 'bp-4' }), 1);
      await expect(publishPromise).rejects.toThrow('Backpressure timeout');

      smallBus.destroy();
    });
  });

  describe('queue status and lifecycle', () => {
    it('should provide queue status', () => {
      const status = bus.getQueueStatus();
      expect(status).toHaveProperty('size');
      expect(status).toHaveProperty('processing');
      expect(status).toHaveProperty('metrics');
      expect(status.metrics).toHaveProperty('published');
      expect(status.metrics).toHaveProperty('processed');
    });

    it('should clear queue', async () => {
      const handler = vi.fn();
      bus.subscribe(SYS_TYPE, handler);

      await bus.publish(makeMsg({ id: 'c-1' }), 1);
      await bus.publish(makeMsg({ id: 'c-2' }), 1);

      bus.clear();
      expect(bus.getQueueStatus().size).toBe(0);
    });

    it('should destroy cleanly', () => {
      const handler = vi.fn();
      bus.subscribe(SYS_TYPE, handler);
      bus.destroy();
      expect(bus.getQueueStatus().size).toBe(0);
    });
  });
});
