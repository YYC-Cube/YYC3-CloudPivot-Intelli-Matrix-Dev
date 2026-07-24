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

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { AgentManager, AgentStatusType } from '../src/orchestration/AgentManager';
import { BaseAgent } from '../src/orchestration/BaseAgent';
import type { AgentMessage, AgentResponse, AgentConfig, AgentCapability } from '../src/types/AgentProtocol';

/** 可测试的 BaseAgent 子类 — 实现所有抽象方法 */
class TestAgent extends BaseAgent {
  handleMessageMock = vi.fn();

  protected setupCapabilities(): void {
    const cap: AgentCapability = {
      id: 'test-cap',
      name: 'test',
      version: '1.0',
      description: 'Test capability',
      enabled: true,
    };
    this.addCapability(cap);
  }

  protected setupCommandHandlers(): void {
    this.registerCommandHandler('echo', async (params) => params);
  }

  async handleMessage(message: AgentMessage): Promise<AgentResponse> {
    return this.handleMessageMock(message);
  }
}

function makeConfig(id?: string): AgentConfig {
  return {
    id: id ?? `agent-${Date.now()}`,
    name: 'TestAgent',
    description: 'A test agent',
    capabilities: [],
    policies: {
      maxConcurrentRequests: 5,
      rateLimit: 100,
      privacyLevel: 'medium',
      dataRetention: 86400,
    },
  };
}

function makeMessage(to: string, overrides?: Partial<AgentMessage>): AgentMessage {
  return {
    id: `msg-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    from: 'test',
    to,
    type: 'command',
    timestamp: Date.now(),
    payload: { action: 'echo', parameters: { text: 'Hello' } },
    ...overrides,
  };
}

describe('AgentManager', () => {
  let manager: AgentManager;
  let agent: TestAgent;
  let agentId: string;

  beforeEach(() => {
    manager = new AgentManager({ enableMetrics: false, enableLogging: false });
    agent = new TestAgent(makeConfig());
    agentId = manager.registerAgent(agent, makeConfig(agent.config.id));
  });

  describe('registerAgent', () => {
    it('should register an agent and return an ID', () => {
      expect(agentId).toBeTruthy();
      expect(manager.getRegisteredAgentCount()).toBe(1);
    });

    it('should throw when registering duplicate agent ID', () => {
      expect(() => manager.registerAgent(agent, makeConfig(agentId))).toThrow('已存在');
    });

    it('should emit agent:registered event', () => {
      const handler = vi.fn();
      manager.on('agent:registered', handler);
      const a = new TestAgent(makeConfig('new-id'));
      manager.registerAgent(a, makeConfig('new-id'));
      expect(handler).toHaveBeenCalled();
    });
  });

  describe('unregisterAgent', () => {
    it('should unregister an existing agent', () => {
      const result = manager.unregisterAgent(agentId);
      expect(result).toBe(true);
      expect(manager.getRegisteredAgentCount()).toBe(0);
    });

    it('should return false for non-existent agent', () => {
      expect(manager.unregisterAgent('nonexistent')).toBe(false);
    });

    it('should emit agent:unregistered event', () => {
      const handler = vi.fn();
      manager.on('agent:unregistered', handler);
      manager.unregisterAgent(agentId);
      expect(handler).toHaveBeenCalled();
    });
  });

  describe('getAgent / getAllAgents / getAgentIds', () => {
    it('should retrieve agent by ID', () => {
      expect(manager.getAgent(agentId)).toBe(agent);
    });

    it('should return undefined for missing agent', () => {
      expect(manager.getAgent('nope')).toBeUndefined();
    });

    it('should list all agents', () => {
      const all = manager.getAllAgents();
      expect(all).toHaveLength(1);
      expect(all[0]).toBe(agent);
    });

    it('should list all agent IDs', () => {
      const ids = manager.getAgentIds();
      expect(ids).toContain(agentId);
    });
  });

  describe('sendMessage', () => {
    it('should send message to agent and return response', async () => {
      agent.handleMessageMock.mockResolvedValue({ success: true, timestamp: Date.now() });

      const response = await manager.sendMessage(makeMessage(agentId));
      expect(response.success).toBe(true);
      expect(agent.handleMessageMock).toHaveBeenCalled();
    });

    it('should return error for non-existent agent', async () => {
      const response = await manager.sendMessage(makeMessage('ghost'));
      expect(response.success).toBe(false);
      expect(response.error?.code).toBe('AGENT_NOT_FOUND');
    });

    it('should handle agent processing error', async () => {
      agent.handleMessageMock.mockRejectedValue(new Error('Processing failed'));

      const response = await manager.sendMessage(makeMessage(agentId));
      expect(response.success).toBe(false);
      expect(response.error?.code).toBe('PROCESSING_ERROR');
    });

    it('should handle timeout when agent takes too long', async () => {
      vi.useFakeTimers();
      agent.handleMessageMock.mockImplementation(async () => {
        await new Promise(r => setTimeout(r, 100000));
        return { success: true, timestamp: Date.now() };
      });

      const sendPromise = manager.sendMessage(makeMessage(agentId));
      vi.advanceTimersByTime(31000);

      const response = await sendPromise;
      expect(response.success).toBe(false);
      vi.useRealTimers();
    });
  });

  describe('broadcastMessage', () => {
    it('should send message to all agents', async () => {
      agent.handleMessageMock.mockResolvedValue({ success: true, timestamp: Date.now() });

      const responses = await manager.broadcastMessage(makeMessage('broadcast', { to: '' }));
      expect(responses).toHaveLength(1);
      expect(responses[0].success).toBe(true);
    });
  });

  describe('queueMessage', () => {
    it('should queue a message and process it', async () => {
      agent.handleMessageMock.mockResolvedValue({ success: true, timestamp: Date.now() });

      // processQueue shifts items synchronously, so queue appears empty after enqueue
      manager.queueMessage(makeMessage(agentId), 1);
      expect(manager.getQueueSize()).toBe(0);

      await new Promise(r => setTimeout(r, 50));
      expect(agent.handleMessageMock).toHaveBeenCalled();
    });
  });

  describe('routes', () => {
    it('should add and remove routes', () => {
      manager.addRoute({ id: 'route-1', from: agentId, to: 'target', routes: [] });
      manager.removeRoute('route-1');
    });

    it('should route message based on conditions', async () => {
      const targetAgent = new TestAgent(makeConfig('target-id'));
      const targetId = manager.registerAgent(targetAgent, makeConfig('target-id'));
      targetAgent.handleMessageMock.mockResolvedValue({ success: true, timestamp: Date.now() });

      manager.addRoute({
        id: 'r1', from: agentId, to: targetId, routes: [],
        conditions: { messageTypes: ['command'] },
      });

      // message.from must match route.from
      const responses = await manager.routeMessage(makeMessage(agentId, { from: agentId }));
      expect(responses).toHaveLength(1);
    });

    it('should respect message type conditions', async () => {
      const targetAgent = new TestAgent(makeConfig('target2'));
      manager.registerAgent(targetAgent, makeConfig('target2'));

      manager.addRoute({
        id: 'r2', from: agentId, to: 'target2', routes: [],
        conditions: { messageTypes: ['urgent'] },
      });

      const responses = await manager.routeMessage(makeMessage(agentId, { from: agentId, type: 'command' }));
      expect(responses).toHaveLength(0);
    });
  });

  describe('capabilities & statistics', () => {
    it('should get agent capabilities', () => {
      const caps = manager.getAgentCapabilities(agentId);
      expect(caps).toHaveLength(1);
      expect(caps[0].name).toBe('test');
    });

    it('should return empty capabilities for unknown agent', () => {
      expect(manager.getAgentCapabilities('nobody')).toEqual([]);
    });

    it('should get all capabilities', () => {
      const all = manager.getAllCapabilities();
      expect(all.size).toBe(1);
    });

    it('should get agent statistics', () => {
      const stats = manager.getAgentStatistics(agentId);
      expect(stats).toBeDefined();
      expect(stats?.totalMessages).toBe(0);
    });

    it('should return undefined statistics for unknown agent', () => {
      expect(manager.getAgentStatistics('nobody')).toBeUndefined();
    });

    it('should get all statistics', () => {
      const stats = manager.getAllStatistics();
      expect(stats.size).toBe(1);
    });
  });

  describe('status', () => {
    it('should get agent status', () => {
      expect(manager.getAgentStatus(agentId)).toBe(AgentStatusType.IDLE);
    });

    it('should return undefined for unknown agent', () => {
      expect(manager.getAgentStatus('nobody')).toBeUndefined();
    });

    it('should get all statuses', () => {
      const statuses = manager.getAllStatuses();
      expect(statuses.get(agentId)).toBe(AgentStatusType.IDLE);
    });
  });

  describe('message history', () => {
    it('should track message history', async () => {
      agent.handleMessageMock.mockResolvedValue({ success: true, timestamp: Date.now() });
      await manager.sendMessage(makeMessage(agentId));

      const history = manager.getMessageHistory();
      expect(history).toHaveLength(1);
    });

    it('should filter history by agent ID', async () => {
      agent.handleMessageMock.mockResolvedValue({ success: true, timestamp: Date.now() });
      await manager.sendMessage(makeMessage(agentId));

      const filtered = manager.getMessageHistory(agentId);
      expect(filtered).toHaveLength(1);
      expect(manager.getMessageHistory('other')).toHaveLength(0);
    });
  });

  describe('shutdown', () => {
    it('should shut down and clear all agents', async () => {
      let emitted = false;
      manager.on('manager:shutdown', () => { emitted = true; });

      await manager.shutdown();
      expect(manager.getRegisteredAgentCount()).toBe(0);
      expect(manager.getQueueSize()).toBe(0);
      expect(emitted).toBe(true);
    });
  });
});
