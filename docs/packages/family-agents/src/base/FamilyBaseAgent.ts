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

import { BaseAgent } from '@yyc3/family-core';
import type { AgentConfig, AgentMessage, AgentResponse } from '@yyc3/family-core';
import { AgentPersona } from './AgentPersona';
import { PDAMRCycle } from './PDAMRCycle';
import type {
  FamilyMemberId,
  FamilyMemberProfile,
  FamilyMessage,
  FamilyEmotionState,
} from './FamilyTypes';

export abstract class FamilyBaseAgent extends BaseAgent {
  public readonly memberId: FamilyMemberId;
  public readonly persona: AgentPersona;
  protected readonly pdamr: PDAMRCycle;
  protected emotion: FamilyEmotionState;

  constructor(
    memberId: FamilyMemberId,
    profile: FamilyMemberProfile,
    pdamr: PDAMRCycle,
    config?: Partial<AgentConfig>,
  ) {
    const fullConfig: AgentConfig = {
      id: `family-${memberId}`,
      name: profile.name,
      description: `${profile.role} — ${profile.motto}`,
      capabilities: [],
      policies: {
        maxConcurrentRequests: 10,
        rateLimit: 100,
        privacyLevel: 'medium',
        dataRetention: 86400,
      },
      ...config,
    };
    super(fullConfig);

    this.memberId = memberId;
    this.persona = new AgentPersona(profile);
    this.pdamr = pdamr;
    this.emotion = {
      memberId,
      tone: profile.emotionTone,
      temperature: 0.5,
      engagement: 0,
      lastUpdated: Date.now(),
    };
  }

  protected setupCapabilities(): void {
    this.setupFamilyCapabilities();
  }

  protected setupCommandHandlers(): void {
    this.setupFamilyCommandHandlers();
  }

  protected abstract setupFamilyCapabilities(): void;

  protected abstract setupFamilyCommandHandlers(): void;

  abstract handleFamilyMessage(message: FamilyMessage): Promise<AgentResponse>;

  getEmotion(): FamilyEmotionState {
    return { ...this.emotion };
  }

  updateEmotion(updates: Partial<Pick<FamilyEmotionState, 'tone' | 'temperature' | 'engagement'>>): void {
    this.emotion = {
      ...this.emotion,
      ...updates,
      lastUpdated: Date.now(),
    };
    this.emit('emotion:updated', this.emotion);
  }

  async handleMessage(message: AgentMessage): Promise<AgentResponse> {
    const startTime = Date.now();

    try {
      this.messageHistory.push(message);
      if (this.messageHistory.length > this.maxHistorySize) {
        this.messageHistory.shift();
      }

      const response = await this.pdamr.run(message.payload);

      this.updateEmotion({ engagement: this.emotion.engagement + 1 });

      return {
        success: true,
        data: response,
        executionTime: Date.now() - startTime,
        timestamp: Date.now(),
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'FAMILY_AGENT_ERROR',
          message: `${this.persona.config.name} 处理失败: ${error}`,
        },
        executionTime: Date.now() - startTime,
        timestamp: Date.now(),
      };
    }
  }

  greet(): string {
    return this.persona.pickPhrase('greeting');
  }

  getPersona(): AgentPersona {
    return this.persona;
  }
}
