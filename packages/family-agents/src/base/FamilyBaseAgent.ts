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
 *
 * @file FamilyBaseAgent.ts
 * @description 轻量家人 Agent 基类 — 自带 capabilities + commandHandlers
 *              不依赖重型编排框架 (eventemitter3/ioredis)，
 *              保留 PDAMR 认知环 + AgentPersona 人格 + 能力/命令管理。
 */

import { AgentPersona } from './AgentPersona';
import type {
  FamilyEmotionState,
  FamilyMemberId,
  FamilyMemberProfile,
  FamilyMessage,
} from './FamilyTypes';
import { PDAMRCycle } from './PDAMRCycle';

/** 能力声明 */
export interface AgentCapability {
  id: string;
  name: string;
  description: string;
  version: string;
  enabled: boolean;
}

/** 命令处理函数 (params 为宽松类型，各 Agent 内部知晓自身参数结构) */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type CommandHandler = (params: Record<string, any>) => Promise<unknown>;

/** 统一的 Agent 响应格式 */
export interface AgentResponse {
  success: boolean;
  data?: unknown;
  error?: string;
  executionTime: number;
  timestamp: number;
}

/** Agent 配置 */
export interface AgentConfig {
  id: string;
  name: string;
  description: string;
  capabilities: AgentCapability[];
}

/**
 * FamilyBaseAgent — 家人 Agent 抽象基类
 *
 * 职责：
 * 1. 持有 PDAMR 认知环（感知→决策→行动→记忆→反思）
 * 2. 持有 AgentPersona 人格（语调、特征、系统提示词）
 * 3. 管理 capabilities 能力注册表
 * 4. 管理 commandHandlers 命令路由
 * 5. 维护情感状态 (FamilyEmotionState)
 */
export abstract class FamilyBaseAgent {
  public readonly memberId: FamilyMemberId;
  public readonly persona: AgentPersona;
  protected readonly pdamr: PDAMRCycle;
  protected emotion: FamilyEmotionState;
  protected capabilities: Map<string, AgentCapability> = new Map();
  protected commandHandlers: Map<string, CommandHandler> = new Map();
  protected readonly config: AgentConfig;

  constructor(
    memberId: FamilyMemberId,
    profile: FamilyMemberProfile,
    pdamr: PDAMRCycle,
  ) {
    this.memberId = memberId;
    this.persona = new AgentPersona(profile);
    this.pdamr = pdamr;
    this.config = {
      id: `family-${memberId}`,
      name: profile.name,
      description: `${profile.role} — ${profile.motto}`,
      capabilities: [],
    };
    this.emotion = {
      memberId,
      tone: profile.emotionTone,
      temperature: 0.5,
      engagement: 0,
      lastUpdated: Date.now(),
    };
    this.setupCapabilities();
    this.setupCommandHandlers();
  }

  /** 子类实现：注册能力 */
  protected abstract setupCapabilities(): void;

  /** 子类实现：注册命令处理 */
  protected abstract setupCommandHandlers(): void;

  /** 子类实现：处理家人消息 */
  abstract handleFamilyMessage(message: FamilyMessage): Promise<AgentResponse>;

  /** 添加能力 */
  protected addCapability(cap: AgentCapability): void {
    this.capabilities.set(cap.id, cap);
    this.config.capabilities.push(cap);
  }

  /** 注册命令处理器 */
  protected registerCommandHandler(command: string, handler: CommandHandler): void {
    this.commandHandlers.set(command, handler);
  }

  /** 执行命令 */
  async executeCommand(command: string, params: Record<string, unknown> = {}): Promise<AgentResponse> {
    const start = Date.now();
    const handler = this.commandHandlers.get(command);
    if (!handler) {
      return { success: false, error: `未注册命令: ${command}`, executionTime: 0, timestamp: start };
    }
    try {
      const data = await handler(params);
      return { success: true, data, executionTime: Date.now() - start, timestamp: start };
    } catch (err) {
      return { success: false, error: String(err), executionTime: Date.now() - start, timestamp: start };
    }
  }

  /** 获取能力列表 */
  getCapabilities(): AgentCapability[] {
    return Array.from(this.capabilities.values());
  }

  /** 获取人格问候 */
  greet(): string {
    return this.persona.pickPhrase('greeting');
  }

  /** 获取情感状态 */
  getEmotion(): FamilyEmotionState {
    return { ...this.emotion };
  }

  /** 获取配置 */
  getConfig(): AgentConfig {
    return { ...this.config };
  }
}
