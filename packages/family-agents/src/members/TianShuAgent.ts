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

import type { AgentResponse } from '../base/FamilyBaseAgent';
import { FamilyBaseAgent } from '../base/FamilyBaseAgent';
import type {
  FamilyIntent,
  FamilyMemberId,
  FamilyMessage,
} from '../base/FamilyTypes';
import { FAMILY_PROFILES } from '../base/FamilyTypes';
import type {
  ActionResult,
  DecisionResult,
  MemoryEntry,
  PerceptionResult,
  ReflectionResult,
} from '../base/PDAMRCycle';
import { PDAMRCycle } from '../base/PDAMRCycle';

const INTENT_MEMBER_MAP: Record<string, FamilyMemberId> = {
  code: 'grandmaster',
  analysis: 'thinker',
  prediction: 'prophet',
  recommendation: 'bole',
  security: 'guardian',
  quality: 'grandmaster',
  creative: 'grace',
  orchestrate: 'tianshu',
  general: 'thinker',
};

interface TaskPlan {
  id: string;
  description: string;
  assignee: FamilyMemberId;
  priority: 'low' | 'medium' | 'high';
  dependencies?: string[];
}

class TianShuPDAMR extends PDAMRCycle {
  constructor() { super('tianshu'); }

  async perceive(input: unknown): Promise<PerceptionResult> {
    return { raw: input, filtered: input };
  }

  async decide(perception: PerceptionResult): Promise<DecisionResult> {
    const intent = perception.filtered as FamilyIntent;
    const assignee = INTENT_MEMBER_MAP[intent.primary] ?? 'thinker';
    const needsMulti = intent.secondary && intent.secondary !== intent.primary;

    return {
      action: 'route_task',
      parameters: { intent, assignee, needsMulti, secondaryAssignee: needsMulti ? INTENT_MEMBER_MAP[intent.secondary!] : undefined },
      confidence: 0.92,
      reasoning: `意图 ${intent.primary} → ${assignee}${needsMulti ? ` + ${intent.secondary} → ${INTENT_MEMBER_MAP[intent.secondary!]}` : ''}`,
    };
  }

  async act(decision: DecisionResult): Promise<ActionResult> {
    const { intent, assignee, needsMulti, secondaryAssignee } = decision.parameters;
    const tasks: TaskPlan[] = [
      { id: `task-${Date.now()}-1`, description: `处理 ${(intent as FamilyIntent).primary} 相关请求`, assignee: assignee as FamilyMemberId, priority: 'high' },
    ];
    if (needsMulti && secondaryAssignee) {
      const firstTask = tasks[0];
      tasks.push({ id: `task-${Date.now()}-2`, description: `处理 ${(intent as FamilyIntent).secondary} 相关请求`, assignee: secondaryAssignee as FamilyMemberId, priority: 'medium', dependencies: firstTask ? [firstTask.id] : [] });
    }
    return { success: true, data: { tasks, orchestrationId: `orch-${Date.now()}` }, executionTime: 0 };
  }

  remember(entry: Omit<MemoryEntry, 'timestamp'>): void {
    this.memory.push({ ...entry, timestamp: Date.now() });
  }

  async reflect(memory: MemoryEntry[]): Promise<ReflectionResult> {
    return { score: 0.9, observations: [`已编排 ${memory.length} 个任务`], improvements: [] };
  }
}

export class TianShuAgent extends FamilyBaseAgent {
  constructor() {
    super('tianshu', FAMILY_PROFILES.tianshu, new TianShuPDAMR());
  }

  protected setupCapabilities(): void {
    this.addCapability({ id: 'task-decompose', name: '任务分解', description: '将复杂任务分解为子任务', version: '1.0.0', enabled: true });
    this.addCapability({ id: 'smart-orchestrate', name: '智能编排', description: '动态编排家人协作流程', version: '1.0.0', enabled: true });
    this.addCapability({ id: 'crisis-control', name: '危机总控', description: 'P0 级故障应急响应', version: '1.0.0', enabled: true });
  }

  protected setupCommandHandlers(): void {
    this.registerCommandHandler('route', async (params) => this.route(params.intent as FamilyIntent));
    this.registerCommandHandler('decompose', async (params) => this.decompose(params.intent as FamilyIntent));
  }

  async route(intent: FamilyIntent): Promise<{ assignee: FamilyMemberId; reasoning: string }> {
    await this.pdamr.run(intent);
    const memory = this.pdamr.getMemory();
    const lastDecision = memory[memory.length - 1]?.decision;
    return {
      assignee: (lastDecision?.parameters.assignee as FamilyMemberId) ?? 'thinker',
      reasoning: lastDecision?.reasoning ?? '默认路由',
    };
  }

  async decompose(intent: FamilyIntent): Promise<{ tasks: TaskPlan[]; orchestrationId: string }> {
    await this.pdamr.run(intent);
    const memory = this.pdamr.getMemory();
    const lastAction = memory[memory.length - 1]?.action;
    if (lastAction?.success && lastAction.data) return lastAction.data as { tasks: TaskPlan[]; orchestrationId: string };
    return { tasks: [], orchestrationId: `orch-${Date.now()}` };
  }

  async handleFamilyMessage(message: FamilyMessage): Promise<AgentResponse> {
    const payload = message.payload;
    const intent = 'intent' in payload ? (payload as { intent: FamilyIntent }).intent : undefined;
    if (!intent) return { success: false, data: null, executionTime: 0, timestamp: Date.now() };
    const route = await this.route(intent);
    return { success: true, data: route, executionTime: 0, timestamp: Date.now() };
  }
}
