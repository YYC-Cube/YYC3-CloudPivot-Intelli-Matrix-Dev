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

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MCPSkillBridge } from '../src/registry/MCPSkillBridge.js';
import type { MCPEndpoint, MCPServerConfig, MCPToolInfo } from '../src/registry/MCPSkillBridge.js';

describe('MCPSkillBridge — HTTP/SSE Transport & Lifecycle', () => {
  let bridge: MCPSkillBridge;
  let fetchSpy: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    bridge = new MCPSkillBridge();
    fetchSpy = vi.fn();
    (globalThis as any).fetch = fetchSpy;
  });

  describe('endpoint registration', () => {
    it('should register an HTTP endpoint', () => {
      bridge.registerEndpoint('ep-1', {
        server: 'test-server',
        tool: 'test-tool',
        transport: 'http',
        url: 'http://localhost:8080/mcp',
      });
      expect(bridge.getEndpoints().size).toBe(1);
      expect(bridge.getEndpoints().get('ep-1')?.server).toBe('test-server');
    });

    it('should emit endpoint:registered', () => {
      let fired = false;
      bridge.on('endpoint:registered', () => { fired = true; });
      bridge.registerEndpoint('ep-1', {
        server: 'test',
        tool: '',
        transport: 'http',
        url: 'http://localhost:8080',
      });
      expect(fired).toBe(true);
    });

    it('should unregister endpoint', () => {
      bridge.registerEndpoint('ep-1', {
        server: 'test',
        tool: '',
        transport: 'http',
        url: 'http://localhost:8080',
      });
      bridge.unregisterEndpoint('ep-1');
      expect(bridge.getEndpoints().size).toBe(0);
    });
  });

  describe('server registration', () => {
    it('should register a server with tools', () => {
      const tools: MCPToolInfo[] = [
        { name: 'tool-1', description: 'Test tool 1', parameters: [] },
        { name: 'tool-2', description: 'Test tool 2', parameters: [] },
      ];
      bridge.registerServer({
        id: 'srv-1',
        name: 'Test Server',
        transport: 'http',
        url: 'http://localhost:8080/mcp',
        tools,
      });
      expect(bridge.getServers().size).toBe(1);
      expect(bridge.getEndpoints().size).toBe(1);
    });

    it('should emit server:registered', () => {
      let fired = false;
      bridge.on('server:registered', () => { fired = true; });
      bridge.registerServer({
        id: 'srv-1',
        name: 'Test',
        transport: 'http',
        url: 'http://localhost:8080',
      });
      expect(fired).toBe(true);
    });
  });

  describe('HTTP transport connect/disconnect', () => {
    it('should connect via HTTP transport', async () => {
      fetchSpy.mockResolvedValue({
        ok: true,
        json: async () => ({ jsonrpc: '2.0', id: 0, result: { capabilities: {} } }),
      });

      bridge.registerEndpoint('ep-http', {
        server: 'http-server',
        tool: '',
        transport: 'http',
        url: 'http://localhost:8080/mcp',
      });

      const connected = await bridge.connect('ep-http');
      expect(connected).toBe(true);
      expect(bridge.getConnectedEndpoints().length).toBe(1);
    });

    it('should fail connect when HTTP initialize fails', async () => {
      fetchSpy.mockResolvedValue({
        ok: true,
        json: async () => ({ jsonrpc: '2.0', id: 0, error: { code: -1, message: 'Failed' } }),
      });

      bridge.registerEndpoint('ep-http', {
        server: 'http-server',
        tool: '',
        transport: 'http',
        url: 'http://localhost:8080/mcp',
      });

      const connected = await bridge.connect('ep-http');
      expect(connected).toBe(false);
    });

    it('should disconnect cleanly', async () => {
      fetchSpy.mockResolvedValue({
        ok: true,
        json: async () => ({ jsonrpc: '2.0', id: 0, result: {} }),
      });

      bridge.registerEndpoint('ep-http', {
        server: 'http-server',
        tool: '',
        transport: 'http',
        url: 'http://localhost:8080/mcp',
      });
      await bridge.connect('ep-http');
      await bridge.disconnect('ep-http');
      expect(bridge.getConnectedEndpoints().length).toBe(0);
    });

    it('should fail connect for stdio transport', async () => {
      bridge.registerEndpoint('ep-stdio', {
        server: 'stdio-server',
        tool: '',
        transport: 'stdio',
      });
      const connected = await bridge.connect('ep-stdio');
      expect(connected).toBe(false);
    });

    it('should fail connect for missing URL', async () => {
      bridge.registerEndpoint('ep-no-url', {
        server: 'no-url',
        tool: '',
        transport: 'http',
      });
      const connected = await bridge.connect('ep-no-url');
      expect(connected).toBe(false);
    });
  });

  describe('callMCPTool', () => {
    it('should return error for non-existent endpoint', async () => {
      const result = await bridge.callMCPTool('nonexistent', { tool: 'test', arguments: {} });
      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain('not found');
    });

    it('should use transport when connected', async () => {
      fetchSpy
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ jsonrpc: '2.0', id: 0, result: { capabilities: {} } }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            jsonrpc: '2.0',
            id: 1,
            result: {
              content: [{ type: 'text', text: 'Hello from MCP' }],
            },
          }),
        });

      bridge.registerServer({
        id: 'srv-1',
        name: 'Test Server',
        transport: 'http',
        url: 'http://localhost:8080/mcp',
        tools: [{ name: 'greet', description: 'Say hello', parameters: [] }],
      });

      await bridge.connect('srv-1');

      const result = await bridge.callMCPTool('srv-1', { tool: 'greet', arguments: {} });
      expect(result.isError).toBeFalsy();
      expect(result.content[0].text).toBe('Hello from MCP');
    });

    it('should return fallback when not connected', async () => {
      bridge.registerEndpoint('ep-1', {
        server: 'test-server',
        tool: 'my-tool',
        transport: 'http',
        url: 'http://localhost:8080',
      });

      const result = await bridge.callMCPTool('ep-1', { tool: 'my-tool', arguments: {} });
      expect(result.isError).toBe(false);
      expect(result.content[0].text).toContain('not connected');
    });

    it('should return error for tool not found on server', async () => {
      bridge.registerServer({
        id: 'srv-2',
        name: 'Test Server',
        transport: 'http',
        url: 'http://localhost:8080',
        tools: [{ name: 'existing-tool', description: 'A tool', parameters: [] }],
      });

      const result = await bridge.callMCPTool('srv-2', { tool: 'nonexistent-tool', arguments: {} });
      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain('not found');
    });

    it('should emit mcp:calling and mcp:called events', async () => {
      let callingFired = false;
      let calledFired = false;
      bridge.on('mcp:calling', () => { callingFired = true; });
      bridge.on('mcp:called', () => { calledFired = true; });

      fetchSpy
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ jsonrpc: '2.0', id: 0, result: {} }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            jsonrpc: '2.0',
            id: 1,
            result: { content: [{ type: 'text', text: 'ok' }] },
          }),
        });

      bridge.registerServer({
        id: 'srv-3',
        name: 'Test',
        transport: 'http',
        url: 'http://localhost:8080/mcp',
        tools: [{ name: 'tool-1', description: 'desc', parameters: [] }],
      });
      await bridge.connect('srv-3');
      await bridge.callMCPTool('srv-3', { tool: 'tool-1', arguments: {} });

      expect(callingFired).toBe(true);
      expect(calledFired).toBe(true);
    });
  });

  describe('discoverTools', () => {
    it('should return cached tools', async () => {
      bridge.registerServer({
        id: 'srv-tools',
        name: 'Tool Server',
        transport: 'http',
        url: 'http://localhost:8080',
        tools: [
          { name: 'a', description: 'A', parameters: [] },
          { name: 'b', description: 'B', parameters: [] },
        ],
      });

      const tools = await bridge.discoverTools('srv-tools');
      expect(tools.length).toBe(2);
      expect(tools[0].name).toBe('a');
    });

    it('should query transport if no cache', async () => {
      fetchSpy
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ jsonrpc: '2.0', id: 0, result: {} }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            jsonrpc: '2.0',
            id: 1,
            result: {
              tools: [
                { name: 'dynamic-1', description: 'Dynamic tool 1' },
                { name: 'dynamic-2', description: 'Dynamic tool 2' },
              ],
            },
          }),
        });

      bridge.registerServer({
        id: 'srv-dynamic',
        name: 'Dynamic Server',
        transport: 'http',
        url: 'http://localhost:8080/mcp',
      });
      await bridge.connect('srv-dynamic');

      const tools = await bridge.discoverTools('srv-dynamic');
      expect(tools.length).toBe(2);
      expect(tools[0].name).toBe('dynamic-1');
    });

    it('should return empty array for unknown server', async () => {
      const tools = await bridge.discoverTools('unknown');
      expect(tools).toEqual([]);
    });
  });

  describe('wrapAsSkill', () => {
    it('should create a FamilySkill from endpoint', async () => {
      bridge.registerEndpoint('ep-wrap', {
        server: 'wrap-server',
        tool: 'test-tool',
        transport: 'http',
        url: 'http://localhost:8080',
      });

      const skill = bridge.wrapAsSkill(
        'skill-1',
        'Test Skill',
        'qianhang',
        'analysis',
        'ep-wrap',
        'test-tool',
        'A test skill',
      );

      expect(skill.id).toBe('skill-1');
      expect(skill.name).toBe('Test Skill');
      expect(skill.owner).toBe('qianhang');
      expect(skill.category).toBe('analysis');
    });

    it('should execute skill and return result', async () => {
      bridge.registerEndpoint('ep-exec', {
        server: 'exec-server',
        tool: 'exec-tool',
        transport: 'http',
        url: 'http://localhost:8080',
      });

      const skill = bridge.wrapAsSkill(
        'skill-exec',
        'Exec Skill',
        'qianhang',
        'analysis',
        'ep-exec',
        'exec-tool',
      );

      const result = await skill.execute({ params: {}, context: {} } as any);
      expect(result.success).toBe(true);
      expect(result.executionTime).toBeGreaterThanOrEqual(0);
    });
  });

  describe('stats & health', () => {
    it('should report correct stats', () => {
      bridge.registerServer({
        id: 'srv-stats',
        name: 'Stats',
        transport: 'http',
        url: 'http://localhost:8080',
        tools: [{ name: 't1', description: '', parameters: [] }],
      });

      const stats = bridge.getStats();
      expect(stats.totalEndpoints).toBe(1);
      expect(stats.totalServers).toBe(1);
      expect(stats.totalTools).toBe(1);
      expect(stats.connected).toBe(0);
    });

    it('should report health status', () => {
      bridge.registerEndpoint('ep-h', {
        server: 'health-server',
        tool: '',
        transport: 'http',
        url: 'http://localhost:8080',
      });

      const health = bridge.getHealthStatus();
      expect(health.length).toBe(1);
      expect(health[0].connected).toBe(false);
    });

    it('should list connected endpoints', async () => {
      fetchSpy.mockResolvedValue({
        ok: true,
        json: async () => ({ jsonrpc: '2.0', id: 0, result: {} }),
      });

      bridge.registerEndpoint('ep-c', {
        server: 'connected-server',
        tool: '',
        transport: 'http',
        url: 'http://localhost:8080/mcp',
      });
      await bridge.connect('ep-c');
      const connected = bridge.getConnectedEndpoints();
      expect(connected.length).toBe(1);
      expect(connected[0].server).toBe('connected-server');
    });
  });
});
