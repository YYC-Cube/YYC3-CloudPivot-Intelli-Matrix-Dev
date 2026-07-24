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

import type { PDAMRState, FamilyMemberId } from './FamilyTypes';

export interface PDAMRConfig {
  maxMemorySize?: number;
  maxHistorySize?: number;
}

export interface PDAMRContext {
  input: unknown;
  state: PDAMRState;
  history: PDAMRState[];
}

export interface PerceptionResult {
  raw: unknown;
  filtered: unknown;
  metadata?: Record<string, unknown>;
}

export interface DecisionResult {
  action: string;
  parameters: Record<string, unknown>;
  confidence: number;
  reasoning?: string;
}

export interface ActionResult {
  success: boolean;
  data?: unknown;
  error?: string;
  executionTime: number;
}

export interface MemoryEntry {
  timestamp: number;
  cycleId: string;
  perception: PerceptionResult;
  decision: DecisionResult;
  action: ActionResult;
  tags?: string[];
}

export interface ReflectionResult {
  score: number;
  observations: string[];
  improvements: string[];
  learnings?: string[];
}

export abstract class PDAMRCycle {
  protected memberId: FamilyMemberId;
  protected cycleId: string;
  protected state: PDAMRState;
  protected history: PDAMRState[] = [];
  protected memory: MemoryEntry[] = [];
  protected readonly maxMemorySize: number;
  protected readonly maxHistorySize: number;

  constructor(memberId: FamilyMemberId, config?: PDAMRConfig) {
    this.memberId = memberId;
    this.maxMemorySize = config?.maxMemorySize ?? 100;
    this.maxHistorySize = config?.maxHistorySize ?? 500;
    this.cycleId = `cycle-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
    this.state = {
      phase: 'perceive',
      startedAt: Date.now(),
    };
  }

  abstract perceive(input: unknown): Promise<PerceptionResult>;

  abstract decide(perception: PerceptionResult): Promise<DecisionResult>;

  abstract act(decision: DecisionResult): Promise<ActionResult>;

  abstract remember(entry: Omit<MemoryEntry, 'timestamp'>): void;

  abstract reflect(memory: MemoryEntry[]): Promise<ReflectionResult>;

  async run(input: unknown): Promise<ReflectionResult> {
    this.state = { phase: 'perceive', startedAt: Date.now(), input };

    const perception = await this.perceive(input);
    this.state.perception = perception;
    this.history.push({ ...this.state });

    this.state = { ...this.state, phase: 'decide' };
    const decision = await this.decide(perception);
    this.state.decision = decision;
    this.history.push({ ...this.state });

    this.state = { ...this.state, phase: 'act' };
    const action = await this.act(decision);
    this.state.action = action;
    this.history.push({ ...this.state });

    this.state = { ...this.state, phase: 'memory' };
    this.remember({
      cycleId: this.cycleId,
      perception,
      decision,
      action,
    });
    this.evictMemory();
    this.history.push({ ...this.state });

    this.state = { ...this.state, phase: 'reflect' };
    const reflection = await this.reflect(this.memory);
    this.state.reflection = reflection;
    this.state.completedAt = Date.now();
    this.history.push({ ...this.state });

    this.evictHistory();

    return reflection;
  }

  protected evictMemory(): void {
    while (this.memory.length > this.maxMemorySize) {
      this.memory.shift();
    }
  }

  protected evictHistory(): void {
    while (this.history.length > this.maxHistorySize) {
      this.history.shift();
    }
  }

  getState(): PDAMRState {
    return { ...this.state };
  }

  getHistory(): PDAMRState[] {
    return [...this.history];
  }

  getMemory(): MemoryEntry[] {
    return [...this.memory];
  }

  reset(options?: { clearMemory?: boolean }): void {
    this.cycleId = `cycle-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
    this.state = { phase: 'perceive', startedAt: Date.now() };
    this.history = [];
    if (options?.clearMemory) {
      this.memory = [];
    }
  }
}
