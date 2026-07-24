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
import { BaseAgent } from '../src/orchestration/BaseAgent.js';
import type { AgentConfig, AgentMessage, AgentCapability } from '../src/types/AgentProtocol';

class TestAgent extends BaseAgent {
  protected setupCapabilities(): void {
    this.addCapability({
      id: 'test-cap',
      name: 'Test Capability',
      description: 'A test capability',
      version: '1.0.0',
      enabled: true,
    });
  }

  protected setupCommandHandlers(): void {
    this.registerCommandHandler('greet', async (params) => ({
      greeting: `Hello, ${params.name}!`,
    }));
    this.registerCommandHandler('fail', async () => {
      throw new Error('Command failed');
    });
  }
}

function createConfig(overrides?: Partial<AgentConfig>): AgentConfig {
  return {
    id: 'test-agent',
    name: 'Test Agent',
    description: 'A test agent',
    capabilities: [],
    policies: {
      maxConcurrentRequests: 10,
      rateLimit: 100,
      privacyLevel: 'medium',
      dataRetention: 86400,
    },
    ...overrides,
  };
}

describe('BaseAgent', () => {
  let agent: TestAgent;

  beforeEach(() => {
    agent = new TestAgent(createConfig());
  });

  afterEach(() => {
    agent.destroy();
  });

  it('should initialize with config', () => {
    expect(agent.getId()).toBe('test-agent');
    expect(agent.getName()).toBe('Test Agent');
    expect(agent.config.id).toBe('test-agent');
  });

  it('should use name from config', () => {
    const named = new TestAgent(createConfig({ name: 'Custom Name' }));
    expect(named.getName()).toBe('Custom Name');
    named.destroy();
  });

  it('should setup capabilities during construction', () => {
    expect(agent.getCapabilities()).toHaveLength(1);
    expect(agent.hasCapability('test-cap')).toBe(true);
    expect(agent.hasCapability('nonexistent')).toBe(false);
  });

  it('should return capability objects', () => {
    const caps = agent.getCapabilities();
    expect(caps[0]).toMatchObject({
      id: 'test-cap',
      name: 'Test Capability',
      version: '1.0.0',
      enabled: true,
    });
  });

  it('should add capabilities dynamically', () => {
    const newCap: AgentCapability = {
      id: 'dynamic-cap',
      name: 'Dynamic',
      description: 'Added at runtime',
      version: '1.0.0',
      enabled: true,
    };
    agent.addCapability(newCap);
    expect(agent.hasCapability('dynamic-cap')).toBe(true);
    expect(agent.getCapabilities()).toHaveLength(2);
  });

  it('should emit capability:added event', () => {
    const listener = vi.fn();
    agent.on('capability:added', listener);
    agent.addCapability({
      id: 'emit-cap',
      name: 'Emit',
      description: 'Event test',
      version: '1.0.0',
      enabled: true,
    });
    expect(listener).toHaveBeenCalledWith(
      expect.objectContaining({ capabilityId: 'emit-cap' }),
    );
  });

  it('should remove capabilities', () => {
    agent.removeCapability('test-cap');
    expect(agent.hasCapability('test-cap')).toBe(false);
    expect(agent.getCapabilities()).toHaveLength(0);
  });

  it('should emit capability:removed event', () => {
    const listener = vi.fn();
    agent.on('capability:removed', listener);
    agent.removeCapability('test-cap');
    expect(listener).toHaveBeenCalledWith(
      expect.objectContaining({ capabilityId: 'test-cap' }),
    );
  });

  it('should handle command messages', async () => {
    const message: AgentMessage = {
      id: 'msg-1',
      type: 'command',
      from: 'sender',
      to: 'test-agent',
      timestamp: Date.now(),
      payload: { action: 'greet', parameters: { name: 'World' } },
    };
    const response = await agent.handleMessage(message);
    expect(response.success).toBe(true);
    expect(response.data).toEqual({ greeting: 'Hello, World!' });
    expect(response.executionTime).toBeGreaterThanOrEqual(0);
  });

  it('should handle command execution failures', async () => {
    const message: AgentMessage = {
      id: 'msg-2',
      type: 'command',
      from: 'sender',
      to: 'test-agent',
      timestamp: Date.now(),
      payload: { action: 'fail', parameters: {} },
    };
    const response = await agent.handleMessage(message);
    expect(response.success).toBe(false);
    expect(response.error?.code).toBe('COMMAND_EXECUTION_FAILED');
  });

  it('should return error for unsupported commands', async () => {
    const message: AgentMessage = {
      id: 'msg-3',
      type: 'command',
      from: 'sender',
      to: 'test-agent',
      timestamp: Date.now(),
      payload: { action: 'unknown-action', parameters: {} },
    };
    const response = await agent.handleMessage(message);
    expect(response.success).toBe(false);
    expect(response.error?.code).toBe('COMMAND_NOT_SUPPORTED');
  });

  it('should return error for unsupported message type', async () => {
    const message: AgentMessage = {
      id: 'msg-4',
      type: 'notification',
      from: 'sender',
      to: 'test-agent',
      timestamp: Date.now(),
      payload: {},
    };
    const response = await agent.handleMessage(message);
    expect(response.success).toBe(false);
    expect(response.error?.code).toBe('UNSUPPORTED_MESSAGE_TYPE');
  });

  it('should return error for query type (not implemented)', async () => {
    const message: AgentMessage = {
      id: 'msg-5',
      type: 'query',
      from: 'sender',
      to: 'test-agent',
      timestamp: Date.now(),
      payload: { question: 'test' },
    };
    const response = await agent.handleMessage(message);
    expect(response.success).toBe(false);
    expect(response.error?.code).toBe('QUERY_NOT_SUPPORTED');
  });

  it('should emit message:processed event', async () => {
    const listener = vi.fn();
    agent.on('message:processed', listener);
    const message: AgentMessage = {
      id: 'msg-6',
      type: 'command',
      from: 'sender',
      to: 'test-agent',
      timestamp: Date.now(),
      payload: { action: 'greet', parameters: { name: 'Event' } },
    };
    await agent.handleMessage(message);
    expect(listener).toHaveBeenCalledWith(
      expect.objectContaining({ messageId: 'msg-6' }),
    );
  });

  it('should track message history', async () => {
    const msg: AgentMessage = {
      id: 'msg-h1',
      type: 'command',
      from: 'sender',
      to: 'test-agent',
      timestamp: Date.now(),
      payload: { action: 'greet', parameters: { name: 'A' } },
    };
    await agent.handleMessage(msg);
    const status = agent.getStatus();
    expect(status.messageHistoryCount).toBe(1);
  });

  it('should cap message history at maxHistorySize', async () => {
    for (let i = 0; i < 105; i++) {
      const msg: AgentMessage = {
        id: `msg-hist-${i}`,
        type: 'command',
        from: 'sender',
        to: 'test-agent',
        timestamp: Date.now(),
        payload: { action: 'greet', parameters: { name: `N${i}` } },
      };
      await agent.handleMessage(msg);
    }
    const status = agent.getStatus();
    expect(status.messageHistoryCount).toBe(100);
  });

  it('should bind to popup', async () => {
    const popup = {
      id: 'popup-1',
      title: 'Test',
      content: null,
      position: { x: 0, y: 0 },
      size: { width: 400, height: 300 },
      visible: true,
      zIndex: 1,
    };
    const listener = vi.fn();
    agent.on('agent:bound', listener);
    await agent.bindToPopup(popup);
    expect(listener).toHaveBeenCalledWith(
      expect.objectContaining({ popupId: 'popup-1', agentId: 'test-agent' }),
    );
    const status = agent.getStatus();
    expect(status.isBound).toBe(true);
    expect(status.popupId).toBe('popup-1');
    expect(status.context).toBeTruthy();
    expect(status.context?.sessionId).toBeTruthy();
  });

  it('should return correct status', () => {
    const status = agent.getStatus();
    expect(status.agentId).toBe('test-agent');
    expect(status.isBound).toBe(false);
    expect(status.popupId).toBeNull();
    expect(status.context).toBeNull();
    expect(status.capabilities).toHaveLength(1);
  });

  it('should destroy cleanly', () => {
    agent.destroy();
    expect(agent.getStatus().capabilities).toHaveLength(0);
    expect(agent.getStatus().messageHistoryCount).toBe(0);
    expect(agent.getStatus().isBound).toBe(false);
  });

  it('should emit agent:destroyed on destroy', () => {
    const listener = vi.fn();
    agent.on('agent:destroyed', listener);
    agent.destroy();
    expect(listener).toHaveBeenCalledWith(
      expect.objectContaining({ agentId: 'test-agent' }),
    );
  });
});
