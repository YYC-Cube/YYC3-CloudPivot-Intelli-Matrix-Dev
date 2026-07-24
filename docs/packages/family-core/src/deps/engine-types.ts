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

export type MessageType = string;

export interface AgentMessage {
  id: string;
  type: MessageType;
  from: string;
  to: string;
  timestamp: Date;
  payload: unknown;
  metadata?: {
    priority?: 'low' | 'normal' | 'high' | 'critical';
    ttl?: number;
    requiresResponse?: boolean;
    correlationId?: string;
  };
}

export type MessageHandler = (message: AgentMessage, context: ProcessingContext) => Promise<void>;

export interface ProcessingContext {
  traceId: string;
  message: AgentMessage;
  engineState: {
    status: EngineStatus;
    uptime: number;
    tasks: { total: number; active: number; completed: number; failed: number };
    subsystems: string[];
    metrics: { messageThroughput: number; averageResponseTime: number; errorRate: number };
  };
  availableSubsystems: string[];
  currentTime: Date;
}

export enum EngineStatus {
  RUNNING = 'running',
  STOPPED = 'stopped',
  ERROR = 'error'
}
