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
 * types.ts
 * ========
 * A2A 协议核心类型定义
 *
 * 参考: Google Agent-to-Agent Protocol 规范
 * https://github.com/google/A2A
 */


// ═══ Agent Card — 智能体名片 ═══

export interface AgentCard {
  /** 唯一标识 */
  id: string;
  /** 显示名称 */
  name: string;
  /** 简短描述 */
  description: string;
  /** 所属架构: family */
  archetype: 'family';
  /** API 端点（本进程内用 internal:// 协议） */
  url: string;
  /** 能力列表 */
  capabilities: AgentCapability[];
  /** 技能列表 */
  skills: AgentSkill[];
  /** 认证方式 */
  authentication?: AgentAuth;
  /** 额外元数据 */
  metadata?: Record<string, unknown>;
  /** 版本 */
  version: string;
  /** 健康状态 */
  status: 'active' | 'inactive' | 'degraded';
  /** 最后心跳时间 */
  lastHeartbeat: number;
}

export interface AgentCapability {
  id: string;
  name: string;
  description: string;
  /** 输入参数 schema（JSON Schema 格式） */
  inputSchema?: Record<string, unknown>;
  /** 输出参数 schema */
  outputSchema?: Record<string, unknown>;
}

export interface AgentSkill {
  id: string;
  name: string;
  description: string;
  /** 触发关键词 / 匹配模式 */
  triggers?: string[];
  /** 所属类别 */
  category: string;
}

export interface AgentAuth {
  type: 'none' | 'bearer' | 'api-key' | 'oauth2';
  credentials?: Record<string, string>;
}

// ═══ Task 协议 ═══

export type TaskState =
  | 'submitted'
  | 'working'
  | 'awaiting_input'
  | 'completed'
  | 'failed'
  | 'cancelled';

export interface Task {
  id: string;
  /** 发送方 agent ID */
  from: string;
  /** 目标 agent ID */
  to: string;
  /** 请求的动作 */
  action: string;
  /** 输入参数 */
  input: Record<string, unknown>;
  /** 当前状态 */
  state: TaskState;
  /** 创建时间 */
  createdAt: number;
  /** 更新时间 */
  updatedAt: number;
  /** 执行结果 */
  result?: TaskResult;
  /** 进度消息流 */
  messages?: TaskMessage[];
  /** 优先级 */
  priority: number;
  /** 超时时间(ms) */
  timeout?: number;
}

export interface TaskResult {
  success: boolean;
  data?: unknown;
  error?: {
    code: string;
    message: string;
  };
  /** 执行耗时(ms) */
  processingTime?: number;
}

export interface TaskMessage {
  id: string;
  type: 'progress' | 'info' | 'warning' | 'error' | 'thought';
  content: string;
  timestamp: number;
  metadata?: Record<string, unknown>;
}

// ═══ Task 查询 ═══

export interface TaskQuery {
  from?: string;
  to?: string;
  state?: TaskState;
  action?: string;
  since?: number;
  limit?: number;
}

// ═══ 事件类型 ═══

export type A2AEventType =
  | 'card:registered'
  | 'card:updated'
  | 'card:removed'
  | 'task:submitted'
  | 'task:started'
  | 'task:progress'
  | 'task:completed'
  | 'task:failed'
  | 'task:cancelled'
  | 'heartbeat';

export interface A2AEvent {
  type: A2AEventType;
  payload: unknown;
  timestamp: number;
}
