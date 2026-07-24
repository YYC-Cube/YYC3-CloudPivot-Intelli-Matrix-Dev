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
import { AgentCardRegistry } from '../src/AgentCardRegistry';
import { TaskManager } from '../src/TaskManager';
import type { AgentCard } from '../src/types';

function makeCard(id = 'agent-1'): AgentCard {
  return {
    id,
    name: `Agent ${id}`,
    description: 'Test agent',
    archetype: 'family',
    url: 'internal://default',
    version: '1.0.0',
    status: 'active',
    lastHeartbeat: Date.now(),
    capabilities: [],
    skills: [],
  };
}

describe('TaskManager', () => {
  let registry: AgentCardRegistry;
  let manager: TaskManager;

  beforeEach(() => {
    registry = new AgentCardRegistry({ autoCleanup: false });
    manager = new TaskManager(registry, { maxConcurrent: 5, autoCleanup: false, defaultTimeout: 5000 });
  });

  afterEach(() => {
    manager.dispose();
    registry.dispose();
  });

  describe('submit', () => {
    it('should reject task when target agent not found', async () => {
      const task = await manager.submit({
        from: 'me',
        to: 'ghost',
        action: 'ping',
        input: {},
        priority: 0,
      });
      expect(task.state).toBe('failed');
      expect(task.result?.error?.code).toBe('AGENT_NOT_FOUND');
    });

    it('should execute task when executor is registered', async () => {
      registry.register(makeCard('echo-bot'));
      manager.registerExecutor('echo-bot', async (task, emit) => {
        emit({ id: '', type: 'info', content: 'Working...', timestamp: 0 });
        return { success: true, data: `Echo: ${JSON.stringify(task.input)}` };
      });

      const task = await manager.submit({
        from: 'me', to: 'echo-bot', action: 'echo', input: { msg: 'Hello' }, priority: 0,
      });

      // submit returns immediately with 'working' state (fire-and-forget)
      expect(task.state).toBe('working');

      // Wait for async execution to complete
      await new Promise<void>(resolve => {
        manager.on('task:completed', () => resolve());
        manager.on('task:failed', () => resolve());
      });

      const updated = manager.getTask(task.id)!;
      expect(updated.state).toBe('completed');
      expect(updated.result?.success).toBe(true);
      expect(updated.result?.data).toContain('Hello');
    });

    it('should handle executor that throws', async () => {
      registry.register(makeCard('broken'));
      manager.registerExecutor('broken', async () => {
        throw new Error('Internal error');
      });

      await manager.submit({ from: 'me', to: 'broken', action: 'fail', input: {}, priority: 0 });

      await new Promise<void>(resolve => {
        manager.on('task:failed', () => resolve());
      });
    });

    it('should cancel a running task', async () => {
      registry.register(makeCard('cancellable'));
      manager.registerExecutor('cancellable', async () => {
        await new Promise(() => {});
        return { success: true, data: 'done' };
      });

      const task = await manager.submit({
        from: 'me', to: 'cancellable', action: 'long', input: {}, priority: 0,
      });

      expect(task.state).toBe('working');
      const cancelled = manager.cancel(task.id);
      expect(cancelled).toBe(true);
    });
  });

  describe('query', () => {
    it('should find completed tasks', async () => {
      registry.register(makeCard('fast'));
      manager.registerExecutor('fast', async () => ({ success: true, data: 'ok' }));

      await manager.submit({ from: 'me', to: 'fast', action: 't', input: {}, priority: 0 });

      await new Promise<void>(resolve => {
        manager.on('task:completed', () => resolve());
      });

      const completed = manager.query({ state: 'completed' });
      expect(completed.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('getStats', () => {
    it('should return task statistics', () => {
      const stats = manager.getStats();
      expect(stats).toHaveProperty('total');
      expect(stats).toHaveProperty('pending');
      expect(stats).toHaveProperty('completed');
      expect(stats).toHaveProperty('failed');
    });
  });

  describe('events', () => {
    it('should emit task:progress when executor sends messages', async () => {
      registry.register(makeCard('progress-bot'));
      manager.registerExecutor('progress-bot', async (task, emit) => {
        emit({ id: '', type: 'progress', content: '50%', timestamp: 0 });
        return { success: true, data: 'done' };
      });

      const progressHandler = vi.fn();
      manager.on('task:progress', progressHandler);

      await manager.submit({ from: 'me', to: 'progress-bot', action: 'work', input: {}, priority: 0 });

      await new Promise<void>(resolve => {
        manager.on('task:completed', () => resolve());
      });

      expect(progressHandler).toHaveBeenCalled();
    });

    it('should emit task:started event', async () => {
      registry.register(makeCard('event-bot'));
      manager.registerExecutor('event-bot', async () => ({ success: true, data: 'ok' }));

      const handler = vi.fn();
      manager.on('task:started', handler);

      await manager.submit({ from: 'me', to: 'event-bot', action: 'work', input: {}, priority: 0 });

      await new Promise<void>(resolve => {
        manager.on('task:completed', () => resolve());
      });

      expect(handler).toHaveBeenCalled();
    });
  });
});
