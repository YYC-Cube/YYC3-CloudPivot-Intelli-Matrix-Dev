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

import type { FamilySkill, SkillResult, SkillExecutionContext, SkillParameter } from '@yyc3/family-agents';
import type { FamilyMemberId, SkillCategory } from '@yyc3/family-agents';
import { EventEmitter } from 'events';
import { spawn, type ChildProcess } from 'child_process';

export interface MCPEndpoint {
  server: string;
  tool: string;
  transport: 'stdio' | 'http' | 'sse';
  url?: string;
  headers?: Record<string, string>;
  connected?: boolean;
  lastPing?: number;
}

export interface MCPToolCall {
  tool: string;
  arguments: Record<string, unknown>;
}

export interface MCPToolResult {
  content: Array<{ type: string; text: string }>;
  isError?: boolean;
}

export interface MCPResource {
  uri: string;
  name: string;
  description?: string;
  mimeType?: string;
}

export interface MCPResourceContent {
  uri: string;
  mimeType?: string;
  text?: string;
  blob?: string;
}

export interface MCPPrompt {
  name: string;
  description?: string;
  arguments?: Array<{ name: string; description?: string; required?: boolean }>;
}

export interface MCPPromptContent {
  description: string;
  messages: Array<{ role: string; content: { type: string; text: string } }>;
}

export interface MCPTransport {
  type: 'stdio' | 'http' | 'sse';
  connect(): Promise<void>;
  send(method: string, params?: Record<string, unknown>): Promise<unknown>;
  close(): Promise<void>;
}

export interface MCPServerConfig {
  id: string;
  name: string;
  transport: 'stdio' | 'http' | 'sse';
  url?: string;
  headers?: Record<string, string>;
  command?: string;
  args?: string[];
  tools?: MCPToolInfo[];
  resources?: MCPResource[];
  prompts?: MCPPrompt[];
}

export interface MCPToolInfo {
  name: string;
  description: string;
  parameters: SkillParameter[];
}

interface JsonRpcRequest {
  jsonrpc: '2.0';
  id: number;
  method: string;
  params?: Record<string, unknown>;
}

interface JsonRpcResponse {
  jsonrpc: '2.0';
  id: number;
  result?: unknown;
  error?: { code: number; message: string; data?: unknown };
}

class HTTPTransport implements MCPTransport {
  type = 'http' as const;
  private url: string;
  private headers: Record<string, string>;
  private requestId = 0;

  constructor(url: string, headers?: Record<string, string>) {
    this.url = url;
    this.headers = { 'Content-Type': 'application/json', ...headers };
  }

  async connect(): Promise<void> {
    const response = await this.sendRequest({ jsonrpc: '2.0', id: 0, method: 'initialize', params: { protocolVersion: '2024-11-05' } });
    if (response.error) {
      throw new Error(`MCP initialize failed: ${response.error.message}`);
    }
  }

  async send(method: string, params?: Record<string, unknown>): Promise<unknown> {
    const id = ++this.requestId;
    const request: JsonRpcRequest = { jsonrpc: '2.0', id, method, params };
    const response = await this.sendRequest(request);
    if (response.error) {
      throw new Error(response.error.message);
    }
    return response.result;
  }

  async close(): Promise<void> {
    // HTTP transport is stateless, nothing to close
  }

  private async sendRequest(request: JsonRpcRequest): Promise<JsonRpcResponse> {
    try {
      const response = await fetch(this.url, {
        method: 'POST',
        headers: this.headers,
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        return { jsonrpc: '2.0', id: request.id, error: { code: response.status, message: `HTTP ${response.status}: ${response.statusText}` } };
      }

      return await response.json() as JsonRpcResponse;
    } catch (error) {
      return { jsonrpc: '2.0', id: request.id, error: { code: -1, message: error instanceof Error ? error.message : 'Network error' } };
    }
  }
}

class SSETransport implements MCPTransport {
  type = 'sse' as const;
  private url: string;
  private headers: Record<string, string>;
  private eventSource: EventSource | null = null;
  private requestId = 0;
  private pendingRequests: Map<number, { resolve: (value: unknown) => void; reject: (error: Error) => void }> = new Map();

  constructor(url: string, headers?: Record<string, string>) {
    this.url = url;
    this.headers = headers ?? {};
  }

  async connect(): Promise<void> {
    this.eventSource = new EventSource(this.url);

    this.eventSource.onmessage = (event) => {
      try {
        const response = JSON.parse(event.data) as JsonRpcResponse;
        const pending = this.pendingRequests.get(response.id);
        if (pending) {
          this.pendingRequests.delete(response.id);
          if (response.error) {
            pending.reject(new Error(response.error.message));
          } else {
            pending.resolve(response.result);
          }
        }
      } catch {
        // ignore parse errors
      }
    };

    return new Promise((resolve, reject) => {
      if (!this.eventSource) return reject(new Error('EventSource not created'));
      this.eventSource.onopen = () => resolve();
      this.eventSource.onerror = () => reject(new Error('SSE connection failed'));
      setTimeout(() => reject(new Error('SSE connection timeout')), 5000);
    });
  }

  async send(method: string, params?: Record<string, unknown>): Promise<unknown> {
    const id = ++this.requestId;
    const request: JsonRpcRequest = { jsonrpc: '2.0', id, method, params };

    return new Promise((resolve, reject) => {
      this.pendingRequests.set(id, { resolve, reject });

      fetch(this.url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...this.headers },
        body: JSON.stringify(request),
      }).catch(err => {
        this.pendingRequests.delete(id);
        reject(err);
      });

      setTimeout(() => {
        if (this.pendingRequests.has(id)) {
          this.pendingRequests.delete(id);
          reject(new Error('SSE request timeout'));
        }
      }, 30000);
    });
  }

  async close(): Promise<void> {
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
    }
    for (const [, pending] of this.pendingRequests) {
      pending.reject(new Error('Transport closed'));
    }
    this.pendingRequests.clear();
  }
}

class StdioTransport implements MCPTransport {
  type = 'stdio' as const;
  private command: string;
  private args: string[];
  private child: ChildProcess | null = null;
  private requestId = 0;
  private pendingRequests: Map<number, { resolve: (value: unknown) => void; reject: (error: Error) => void }> = new Map();
  private buffer = '';
  private closed = false;

  constructor(command: string, args: string[] = []) {
    this.command = command;
    this.args = args;
  }

  async connect(): Promise<void> {
    if (this.child) {
      throw new Error('Stdio transport already connected');
    }

    this.child = spawn(this.command, this.args, {
      stdio: ['pipe', 'pipe', 'pipe'],
      env: { ...process.env, MCP_TRANSPORT: 'stdio' },
    });

    this.child.stdout?.on('data', (data: Buffer) => {
      this.buffer += data.toString('utf-8');
      this.processBuffer();
    });

    this.child.stderr?.on('data', (data: Buffer) => {
       
      console.error(`[MCP stdio stderr] ${data.toString('utf-8').trim()}`);
    });

    this.child.on('error', (error) => {
      this.rejectAllPending(error);
    });

    this.child.on('close', (code) => {
      this.rejectAllPending(new Error(`MCP server process exited with code ${code}`));
      this.child = null;
    });

    // Send initialize handshake
    const initResult = await this.send('initialize', { protocolVersion: '2024-11-05', capabilities: {}, clientInfo: { name: 'yyc3-mcp-client', version: '1.0.0' } });
    if (!initResult) {
      throw new Error('MCP stdio initialize failed: empty response');
    }
  }

  async send(method: string, params?: Record<string, unknown>): Promise<unknown> {
    if (!this.child || this.child.killed || this.closed) {
      throw new Error('Stdio transport not connected');
    }

    const id = ++this.requestId;
    const request: JsonRpcRequest = { jsonrpc: '2.0', id, method, params };
    const json = JSON.stringify(request) + '\n';

    return new Promise((resolve, reject) => {
      this.pendingRequests.set(id, { resolve, reject });

      this.child!.stdin!.write(json, (err) => {
        if (err) {
          this.pendingRequests.delete(id);
          reject(err);
        }
      });

      setTimeout(() => {
        if (this.pendingRequests.has(id)) {
          this.pendingRequests.delete(id);
          reject(new Error('Stdio request timeout'));
        }
      }, 30000);
    });
  }

  async close(): Promise<void> {
    this.closed = true;
    this.rejectAllPending(new Error('Transport closed'));

    if (this.child && !this.child.killed) {
      this.child.kill('SIGTERM');
      // Force kill after 5s if still alive
      setTimeout(() => {
        if (this.child && !this.child.killed) {
          this.child.kill('SIGKILL');
        }
      }, 5000);
    }
    this.child = null;
  }

  private processBuffer(): void {
    const lines = this.buffer.split('\n');
    this.buffer = lines.pop() ?? '';

    for (const line of lines) {
      if (!line.trim()) continue;
      try {
        const response = JSON.parse(line) as JsonRpcResponse;
        const pending = this.pendingRequests.get(response.id);
        if (pending) {
          this.pendingRequests.delete(response.id);
          if (response.error) {
            pending.reject(new Error(response.error.message));
          } else {
            pending.resolve(response.result);
          }
        }
      } catch {
        // ignore parse errors
      }
    }
  }

  private rejectAllPending(error: Error): void {
    for (const [, pending] of this.pendingRequests) {
      pending.reject(error);
    }
    this.pendingRequests.clear();
  }
}

export class MCPSkillBridge extends EventEmitter {
  private endpoints: Map<string, MCPEndpoint> = new Map();
  private servers: Map<string, MCPServerConfig> = new Map();
  private toolCache: Map<string, MCPToolInfo[]> = new Map();
  private resourceCache: Map<string, MCPResource[]> = new Map();
  private promptCache: Map<string, MCPPrompt[]> = new Map();
  private connectionPool: Map<string, { connected: boolean; lastActivity: number }> = new Map();
  private transports: Map<string, MCPTransport> = new Map();

  registerEndpoint(id: string, endpoint: MCPEndpoint): void {
    this.endpoints.set(id, { ...endpoint, connected: false });
    this.connectionPool.set(id, { connected: false, lastActivity: Date.now() });
    this.emit('endpoint:registered', { id, endpoint });
  }

  unregisterEndpoint(id: string): void {
    this.endpoints.delete(id);
    this.connectionPool.delete(id);
    this.servers.delete(id);
    this.toolCache.delete(id);
    this.resourceCache.delete(id);
    this.promptCache.delete(id);
    const transport = this.transports.get(id);
    if (transport) {
      transport.close().catch(() => {});
      this.transports.delete(id);
    }
    this.emit('endpoint:unregistered', { id });
  }

  registerServer(config: MCPServerConfig): void {
    this.servers.set(config.id, config);
    if (config.tools) {
      this.toolCache.set(config.id, config.tools);
    }
    if (config.resources) {
      this.resourceCache.set(config.id, config.resources);
    }
    if (config.prompts) {
      this.promptCache.set(config.id, config.prompts);
    }
    this.registerEndpoint(config.id, {
      server: config.name,
      tool: '',
      transport: config.transport,
      url: config.url,
      headers: config.headers,
    });
    this.emit('server:registered', { id: config.id, name: config.name });
  }

  unregisterServer(id: string): void {
    this.unregisterEndpoint(id);
  }

  private createTransport(endpointId: string): MCPTransport | null {
    const endpoint = this.endpoints.get(endpointId);
    if (!endpoint) return null;

    switch (endpoint.transport) {
      case 'http':
        if (!endpoint.url) return null;
        return new HTTPTransport(endpoint.url, endpoint.headers);
      case 'sse':
        if (!endpoint.url) return null;
        return new SSETransport(endpoint.url, endpoint.headers);
      case 'stdio': {
        const server = this.servers.get(endpointId);
        if (!server?.command) return null;
        return new StdioTransport(server.command, server.args);
      }
      default:
        return null;
    }
  }

  async connect(endpointId: string): Promise<boolean> {
    const transport = this.createTransport(endpointId);
    if (!transport) return false;

    try {
      await transport.connect();
      this.transports.set(endpointId, transport);
      const pool = this.connectionPool.get(endpointId);
      if (pool) pool.connected = true;
      const endpoint = this.endpoints.get(endpointId);
      if (endpoint) endpoint.connected = true;
      this.emit('endpoint:connected', { id: endpointId });
      return true;
    } catch {
      return false;
    }
  }

  async disconnect(endpointId: string): Promise<void> {
    const transport = this.transports.get(endpointId);
    if (transport) {
      await transport.close();
      this.transports.delete(endpointId);
    }
    const pool = this.connectionPool.get(endpointId);
    if (pool) pool.connected = false;
    const endpoint = this.endpoints.get(endpointId);
    if (endpoint) endpoint.connected = false;
    this.emit('endpoint:disconnected', { id: endpointId });
  }

  async reconnect(endpointId: string): Promise<boolean> {
    await this.disconnect(endpointId);
    return this.connect(endpointId);
  }

  async discoverTools(serverId: string): Promise<MCPToolInfo[]> {
    const cached = this.toolCache.get(serverId);
    if (cached) return cached;

    const server = this.servers.get(serverId);
    if (server?.tools) {
      this.toolCache.set(serverId, server.tools);
      return server.tools;
    }

    const transport = this.transports.get(serverId);
    if (transport) {
      try {
        const result = await transport.send('tools/list') as { tools?: Array<{ name: string; description?: string; inputSchema?: Record<string, unknown> }> };
        if (result?.tools) {
          const tools: MCPToolInfo[] = result.tools.map(t => ({
            name: t.name,
            description: t.description ?? '',
            parameters: [],
          }));
          this.toolCache.set(serverId, tools);
          return tools;
        }
      } catch {
        // discovery via transport failed
      }
    }

    return [];
  }

  async discoverResources(serverId: string): Promise<MCPResource[]> {
    const cached = this.resourceCache.get(serverId);
    if (cached) return cached;

    const server = this.servers.get(serverId);
    if (server?.resources) {
      this.resourceCache.set(serverId, server.resources);
      return server.resources;
    }

    const transport = this.transports.get(serverId);
    if (transport) {
      try {
        const result = await transport.send('resources/list') as { resources?: MCPResource[] };
        if (result?.resources) {
          this.resourceCache.set(serverId, result.resources);
          return result.resources;
        }
      } catch {
        // discovery via transport failed
      }
    }

    return [];
  }

  async discoverPrompts(serverId: string): Promise<MCPPrompt[]> {
    const cached = this.promptCache.get(serverId);
    if (cached) return cached;

    const server = this.servers.get(serverId);
    if (server?.prompts) {
      this.promptCache.set(serverId, server.prompts);
      return server.prompts;
    }

    const transport = this.transports.get(serverId);
    if (transport) {
      try {
        const result = await transport.send('prompts/list') as { prompts?: MCPPrompt[] };
        if (result?.prompts) {
          this.promptCache.set(serverId, result.prompts);
          return result.prompts;
        }
      } catch {
        // discovery via transport failed
      }
    }

    return [];
  }

  async readResource(endpointId: string, uri: string): Promise<MCPResourceContent> {
    const endpoint = this.endpoints.get(endpointId);
    if (!endpoint) {
      return { uri, text: `MCP endpoint ${endpointId} not found` };
    }

    const transport = this.transports.get(endpointId);
    if (transport) {
      try {
        const result = await transport.send('resources/read', { uri }) as { contents?: MCPResourceContent[] };
        if (result?.contents?.[0]) {
          return result.contents[0];
        }
      } catch (error) {
        return { uri, text: error instanceof Error ? error.message : 'Resource read failed' };
      }
    }

    return { uri, text: `Resource ${uri} not available — transport not connected` };
  }

  async subscribeResource(endpointId: string, uri: string): Promise<boolean> {
    const transport = this.transports.get(endpointId);
    if (!transport) return false;

    try {
      await transport.send('resources/subscribe', { uri });
      this.emit('resource:subscribed', { endpointId, uri });
      return true;
    } catch {
      return false;
    }
  }

  async getPrompt(endpointId: string, name: string, args?: Record<string, unknown>): Promise<MCPPromptContent> {
    const endpoint = this.endpoints.get(endpointId);
    if (!endpoint) {
      throw new Error(`MCP endpoint ${endpointId} not found`);
    }

    const transport = this.transports.get(endpointId);
    if (transport) {
      try {
        const result = await transport.send('prompts/get', { name, arguments: args }) as MCPPromptContent;
        return result;
      } catch (error) {
        throw new Error(error instanceof Error ? error.message : 'Prompt retrieval failed', { cause: error });
      }
    }

    throw new Error(`Prompt ${name} not available — transport not connected`);
  }

  async callMCPTool(endpointId: string, call: MCPToolCall): Promise<MCPToolResult> {
    const endpoint = this.endpoints.get(endpointId);
    if (!endpoint) {
      return {
        content: [{ type: 'text', text: `MCP endpoint ${endpointId} not found` }],
        isError: true,
      };
    }

    const pool = this.connectionPool.get(endpointId);
    if (pool) {
      pool.lastActivity = Date.now();
    }

    this.emit('mcp:calling', { endpointId, tool: call.tool });

    const server = this.servers.get(endpointId);
    if (server) {
      const tools = await this.discoverTools(endpointId);
      const tool = tools.find(t => t.name === call.tool);
      if (!tool) {
        return {
          content: [{ type: 'text', text: `Tool "${call.tool}" not found on server "${server.name}"` }],
          isError: true,
        };
      }
    }

    // Try real transport first
    const transport = this.transports.get(endpointId);
    if (transport) {
      try {
        const result = await transport.send('tools/call', {
          name: call.tool,
          arguments: call.arguments,
        }) as { content?: Array<{ type: string; text: string }>; isError?: boolean };

        if (result?.content) {
          this.emit('mcp:called', { endpointId, tool: call.tool, success: true });
          return {
            content: result.content,
            isError: result.isError,
          };
        }
      } catch (error) {
        this.emit('mcp:error', { endpointId, tool: call.tool, error });
        return {
          content: [{ type: 'text', text: error instanceof Error ? error.message : 'MCP transport error' }],
          isError: true,
        };
      }
    }

    // Fallback: descriptive response when no transport connected
    return {
      content: [{ type: 'text', text: `MCP call to ${endpoint.server}/${call.tool} — transport: ${endpoint.transport} (not connected)` }],
      isError: false,
    };
  }

  wrapAsSkill(
    id: string,
    name: string,
    owner: string,
    category: string,
    endpointId: string,
    toolName: string,
    description?: string,
    parameters?: SkillParameter[],
  ): FamilySkill {
    const endpoint = this.endpoints.get(endpointId);

    return {
      id,
      name,
      version: '1.0.0',
      owner: owner as FamilyMemberId,
      description: description ?? `MCP skill bridged from ${endpoint?.server ?? endpointId}/${toolName}`,
      parameters: parameters ?? [],
      category: category as SkillCategory,
      mcp: { server: endpointId, tool: toolName },
      execute: async (ctx: SkillExecutionContext): Promise<SkillResult> => {
        const startTime = Date.now();
        const result = await this.callMCPTool(endpointId, {
          tool: toolName,
          arguments: ctx.params,
        });
        return {
          success: !result.isError,
          data: result.content,
          executionTime: Date.now() - startTime,
        };
      },
    };
  }

  wrapServerAsSkills(serverId: string, owner: FamilyMemberId, category: SkillCategory): FamilySkill[] {
    const server = this.servers.get(serverId);
    if (!server) return [];

    const tools = this.toolCache.get(serverId) ?? [];
    return tools.map(tool =>
      this.wrapAsSkill(
        `mcp:${serverId}:${tool.name}`,
        tool.name,
        owner,
        category,
        serverId,
        tool.name,
        tool.description,
        tool.parameters,
      ),
    );
  }

  getEndpoints(): Map<string, MCPEndpoint> {
    return new Map(this.endpoints);
  }

  getServers(): Map<string, MCPServerConfig> {
    return new Map(this.servers);
  }

  getConnectedEndpoints(): MCPEndpoint[] {
    return Array.from(this.endpoints.values()).filter(e => e.connected);
  }

  getHealthStatus(): Array<{ id: string; connected: boolean; lastActivity: number }> {
    return Array.from(this.connectionPool.entries()).map(([id, pool]) => ({
      id,
      connected: pool.connected,
      lastActivity: pool.lastActivity,
    }));
  }

  getStats(): {
    totalEndpoints: number;
    totalServers: number;
    totalTools: number;
    totalResources: number;
    totalPrompts: number;
    connected: number;
  } {
    let totalTools = 0;
    for (const tools of this.toolCache.values()) totalTools += tools.length;
    let totalResources = 0;
    for (const resources of this.resourceCache.values()) totalResources += resources.length;
    let totalPrompts = 0;
    for (const prompts of this.promptCache.values()) totalPrompts += prompts.length;

    return {
      totalEndpoints: this.endpoints.size,
      totalServers: this.servers.size,
      totalTools,
      totalResources,
      totalPrompts,
      connected: Array.from(this.connectionPool.values()).filter(p => p.connected).length,
    };
  }

  async shutdown(): Promise<void> {
    const disconnects: Promise<void>[] = [];
    for (const [id] of this.transports) {
      disconnects.push(this.disconnect(id));
    }
    await Promise.all(disconnects);
    this.emit('shutdown');
  }
}
