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
 * @file ai/AgentProtocol.ts
 * @description Agent Protocol 模块
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.0.0
 * @created 2026-03-07
 * @updated 2026-03-07
 * @status stable
 * @license MIT
 * @copyright Copyright (c) 2026 YanYuCloudCube Team
 * @tags typescript
 */

export interface AgentCapability {
  id: string;
  name: string;
  description: string;
  version: string;
  enabled: boolean;
  parameters?: Record<string, any>;
}

export interface AgentMessage {
  id: string;
  type: 'command' | 'query' | 'response' | 'notification' | 'error';
  from: string;
  to: string;
  timestamp: number;
  payload: any;
  metadata?: {
    priority: 'low' | 'normal' | 'high' | 'critical';
    ttl?: number;
    requiresResponse?: boolean;
    correlationId?: string;
  };
}

export interface AgentCommand {
  type: 'popup_control' | 'layout_control' | 'content_update' | 'behavior_change' | 'custom';
  action: string;
  parameters: Record<string, any>;
  constraints?: {
    timeout?: number;
    retryCount?: number;
    fallbackAction?: string;
  };
}

export interface AgentResponse {
  success: boolean;
  data?: any;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  executionTime?: number;
  timestamp: number;
}

export interface AgentContext {
  popupId: string;
  userId?: string;
  sessionId: string;
  environment: {
    screenSize: { width: number; height: number };
    deviceType: 'mobile' | 'tablet' | 'desktop';
    platform: string;
    language: string;
  };
  preferences: Record<string, any>;
  history: AgentMessage[];
}

export interface AgentConfig {
  id: string;
  name: string;
  description: string;
  capabilities: AgentCapability[];
  endpoint?: string;
  localModel?: boolean;
  modelConfig?: {
    provider: 'openai' | 'azure' | 'anthropic' | 'local' | 'custom';
    model: string;
    apiKey?: string;
    endpoint?: string;
  };
  policies: {
    maxConcurrentRequests: number;
    rateLimit: number;
    privacyLevel: 'high' | 'medium' | 'low';
    dataRetention: number;
  };
}

export interface AgentEvent {
  type: 'agent_created' | 'agent_updated' | 'agent_deleted' |
        'capability_added' | 'capability_removed' |
        'message_sent' | 'message_received' |
        'command_executed' | 'error_occurred';
  data: any;
  timestamp: number;
}

export interface AgentStats {
  totalMessages: number;
  messagesReceived: number;
  messagesProcessed: number;
  messagesFailed: number;
  successfulCommands: number;
  failedCommands: number;
  avgResponseTime: number;
  activeAgents: number;
  totalAgents: number;
  queueLength: number;
  isQueueProcessing: boolean;
  lastError?: {
    code: string;
    message: string;
    timestamp: number;
  };
  uptime?: number;
}

export interface MessageRoute {
  target: string;
  routes: string[];
}

export interface AgentStatus {
  agentId: string;
  popupId: string | null;
  capabilities: AgentCapability[];
  messageHistoryCount: number;
  isBound: boolean;
  context: AgentContext | null;
  config: AgentConfig;
}
