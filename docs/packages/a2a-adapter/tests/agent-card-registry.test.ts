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
    capabilities: [
      { id: 'cap-1', name: 'chat', description: 'Chat capability' },
    ],
    skills: [
      { id: 'skill-1', name: 'nlp', description: 'NLP processing', category: 'language' },
    ],
  };
}

describe('AgentCardRegistry', () => {
  let registry: AgentCardRegistry;

  beforeEach(() => {
    registry = new AgentCardRegistry({ heartbeatInterval: 30000, autoCleanup: false });
  });

  afterEach(() => {
    registry.dispose();
  });

  describe('register', () => {
    it('should register a new card', () => {
      registry.register(makeCard());
      expect(registry.get('agent-1')).toBeDefined();
      expect(registry.getActiveCount()).toBe(1);
    });

    it('should emit card:registered event for new cards', () => {
      const handler = vi.fn();
      registry.on('card:registered', handler);
      registry.register(makeCard());
      expect(handler).toHaveBeenCalled();
    });

    it('should emit card:updated event for existing cards', () => {
      registry.register(makeCard());
      const handler = vi.fn();
      registry.on('card:updated', handler);
      registry.register(makeCard());
      expect(handler).toHaveBeenCalled();
    });
  });

  describe('unregister', () => {
    it('should remove a registered card', () => {
      registry.register(makeCard());
      expect(registry.unregister('agent-1')).toBe(true);
      expect(registry.get('agent-1')).toBeUndefined();
    });

    it('should return false for non-existent card', () => {
      expect(registry.unregister('nobody')).toBe(false);
    });

    it('should emit card:removed event', () => {
      registry.register(makeCard());
      const handler = vi.fn();
      registry.on('card:removed', handler);
      registry.unregister('agent-1');
      expect(handler).toHaveBeenCalled();
    });
  });

  describe('update', () => {
    it('should update card fields', () => {
      registry.register(makeCard());
      const updated = registry.update('agent-1', { status: 'inactive' });
      expect(updated?.status).toBe('inactive');
      expect(registry.get('agent-1')?.status).toBe('inactive');
    });

    it('should return undefined for unknown agent', () => {
      expect(registry.update('nobody', {})).toBeUndefined();
    });
  });

  describe('heartbeat', () => {
    it('should update lastHeartbeat and set status to active', () => {
      registry.register(makeCard('agent-1'));
      const before = registry.get('agent-1')!.lastHeartbeat;
      registry.heartbeat('agent-1');
      const after = registry.get('agent-1')!.lastHeartbeat;
      expect(after).toBeGreaterThanOrEqual(before);
      expect(registry.get('agent-1')?.status).toBe('active');
    });

    it('should return false for unknown agent', () => {
      expect(registry.heartbeat('nobody')).toBe(false);
    });
  });

  describe('query methods', () => {
    beforeEach(() => {
      const f1 = makeCard('family-1');
      const f2 = makeCard('family-2');
      registry.register(f1);
      registry.register(f2);
    });

    it('getAll should return all cards', () => {
      expect(registry.getAll()).toHaveLength(2);
    });

    it('getByArchetype should filter by archetype', () => {
      expect(registry.getByArchetype('family')).toHaveLength(2);
    });

    it('findByCapability should search by capability name', () => {
      const results = registry.findByCapability('chat');
      expect(results.length).toBeGreaterThanOrEqual(1);
    });

    it('findBySkill should search by skill name', () => {
      const results = registry.findBySkill('nlp');
      expect(results.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('heartbeat check (autoCleanup)', () => {
    it('should mark agents inactive after heartbeat timeout', async () => {
      const autoRegistry = new AgentCardRegistry({ heartbeatTimeout: 100, heartbeatInterval: 50, autoCleanup: true });
      autoRegistry.register(makeCard('agent-a'));

      // Use real timers — wait for heartbeat check to run
      await new Promise(r => setTimeout(r, 200));
      expect(autoRegistry.get('agent-a')?.status).toBe('inactive');
      autoRegistry.dispose();
    });
  });
});
