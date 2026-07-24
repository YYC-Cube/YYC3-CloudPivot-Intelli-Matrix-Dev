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
 * index.ts
 * ========
 * A2A 协议适配器 — 统一导出
 */

// Types
export type {
  AgentCard,
  AgentCapability,
  AgentSkill,
  AgentAuth,
  Task,
  TaskState,
  TaskResult,
  TaskMessage,
  TaskQuery,
  A2AEvent,
  A2AEventType,
} from './types';

// Agent Card Registry
export { AgentCardRegistry } from './AgentCardRegistry';
export type { RegistryConfig } from './AgentCardRegistry';

// Task Manager
export { TaskManager } from './TaskManager';
export type { TaskManagerConfig, TaskExecutor } from './TaskManager';
