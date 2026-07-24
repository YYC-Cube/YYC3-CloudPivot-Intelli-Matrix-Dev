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
 * AgentCardRegistry.ts
 * ======================
 * Agent Card 注册中心 — 管理所有智能体的名片
 * 支持注册、发现、心跳检测、健康状态更新
 */

import EventEmitter from 'eventemitter3';
import type { AgentCard, A2AEvent } from './types';

export interface RegistryConfig {
  /** 心跳检查间隔(ms) */
  heartbeatInterval?: number;
  /** 最大心跳超时(ms)，超时标记为 inactive */
  heartbeatTimeout?: number;
  /** 是否自动清理过期卡片 */
  autoCleanup?: boolean;
}

const DEFAULT_CONFIG: Required<RegistryConfig> = {
  heartbeatInterval: 30_000,
  heartbeatTimeout: 90_000,
  autoCleanup: true,
};

export class AgentCardRegistry extends EventEmitter {
  private cards: Map<string, AgentCard> = new Map();
  private config: Required<RegistryConfig>;
  private heartbeatTimer: ReturnType<typeof setInterval> | null = null;

  constructor(config: RegistryConfig = {}) {
    super();
    this.config = { ...DEFAULT_CONFIG, ...config };

    if (this.config.autoCleanup) {
      this.heartbeatTimer = setInterval(() => this.checkHeartbeats(), this.config.heartbeatInterval);
    }
  }

  // ═══ 注册管理 ═══

  /** 注册一个新的 Agent Card */
  register(card: AgentCard): void {
    if (this.cards.has(card.id)) {
      this.emit('card:updated', { card, timestamp: Date.now() } as unknown as A2AEvent);
    } else {
      this.emit('card:registered', { card, timestamp: Date.now() } as unknown as A2AEvent);
    }
    this.cards.set(card.id, { ...card, lastHeartbeat: Date.now() });
  }

  /** 注销 Agent Card */
  unregister(agentId: string): boolean {
    const removed = this.cards.delete(agentId);
    if (removed) {
      this.emit('card:removed', { agentId, timestamp: Date.now() } as unknown as A2AEvent);
    }
    return removed;
  }

  /** 更新 Agent Card 部分字段 */
  update(agentId: string, partial: Partial<AgentCard>): AgentCard | undefined {
    const existing = this.cards.get(agentId);
    if (!existing) return undefined;

    const updated: AgentCard = { ...existing, ...partial, id: agentId, lastHeartbeat: Date.now() };
    this.cards.set(agentId, updated);
    this.emit('card:updated', { card: updated, timestamp: Date.now() } as unknown as A2AEvent);
    return updated;
  }

  /** 更新心跳时间戳 */
  heartbeat(agentId: string): boolean {
    const card = this.cards.get(agentId);
    if (!card) return false;
    card.lastHeartbeat = Date.now();
    card.status = 'active';
    this.emit('heartbeat', { agentId, timestamp: Date.now() } as unknown as A2AEvent);
    return true;
  }

  // ═══ 查询接口 ═══

  /** 获取指定 Agent Card */
  get(agentId: string): AgentCard | undefined {
    return this.cards.get(agentId);
  }

  /** 列出所有 Agent Card */
  getAll(): AgentCard[] {
    return Array.from(this.cards.values());
  }

  /** 按架构类型筛选 */
  getByArchetype(archetype: 'family'): AgentCard[] {
    return this.getAll().filter(c => c.archetype === archetype);
  }

  /** 按能力搜索 */
  findByCapability(capabilityName: string): AgentCard[] {
    return this.getAll().filter(c =>
      c.capabilities.some(cap => cap.name.toLowerCase().includes(capabilityName.toLowerCase()))
    );
  }

  /** 按技能搜索 */
  findBySkill(skillName: string): AgentCard[] {
    return this.getAll().filter(c =>
      c.skills.some(s => s.name.toLowerCase().includes(skillName.toLowerCase()))
    );
  }

  /** 获取活跃 Agent 数量 */
  getActiveCount(): number {
    return this.getAll().filter(c => c.status === 'active').length;
  }

  // ═══ 内部方法 ═══

  /** 心跳检查 — 标记超时 agent 为 inactive */
  private checkHeartbeats(): void {
    const now = Date.now();
    for (const [id, card] of this.cards) {
      if (now - card.lastHeartbeat > this.config.heartbeatTimeout) {
        card.status = 'inactive';
        this.emit('card:updated', { card, timestamp: now } as unknown as A2AEvent);
      }
    }
  }

  /** 销毁注册中心，释放资源 */
  dispose(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
    this.cards.clear();
    this.removeAllListeners();
  }
}
