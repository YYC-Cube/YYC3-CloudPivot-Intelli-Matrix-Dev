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

import { EventEmitter } from 'eventemitter3';
import type { FamilyBaseAgent } from '@yyc3/family-agents';
import type { FamilyMemberId, FamilyEmotionState, FamilyMemberProfile } from '@yyc3/family-agents';
import { FAMILY_PROFILES } from '@yyc3/family-agents';
import type { AgentCapability, AgentResponse } from '@yyc3/family-core';

export type BindingStatus = 'idle' | 'bound' | 'active' | 'error';

export interface FamilyBindingState {
  memberId: FamilyMemberId;
  status: BindingStatus;
  emotion: FamilyEmotionState;
  capabilities: AgentCapability[];
  profile: FamilyMemberProfile;
  messageCount: number;
  lastActivity: number | null;
}

export type StateChangeCallback = (state: FamilyBindingState) => void;
export type EmotionChangeCallback = (emotion: FamilyEmotionState) => void;

export class FamilyBinding extends EventEmitter {
  private agent: FamilyBaseAgent | null = null;
  private state: FamilyBindingState;
  private unsubscribers: Array<() => void> = [];

  constructor(memberId: FamilyMemberId) {
    super();
    const profile = FAMILY_PROFILES[memberId];
    this.state = {
      memberId,
      status: 'idle',
      emotion: {
        memberId,
        tone: profile.emotionTone,
        temperature: 0.5,
        engagement: 0,
        lastUpdated: Date.now(),
      },
      capabilities: [],
      profile,
      messageCount: 0,
      lastActivity: null,
    };
  }

  bind(agent: FamilyBaseAgent): void {
    this.agent = agent;
    this.state.status = 'bound';
    this.state.emotion = agent.getEmotion();
    this.state.capabilities = agent.getCapabilities();

    const onEmotionUpdated = (emotion: FamilyEmotionState) => {
      this.state.emotion = emotion;
      this.emit('emotion:change', emotion);
      this.emit('state:change', this.getState());
    };

    const onMessageProcessed = () => {
      this.state.messageCount++;
      this.state.lastActivity = Date.now();
      this.state.status = 'active';
      this.emit('state:change', this.getState());
    };

    const onAgentDestroyed = () => {
      this.state.status = 'idle';
      this.agent = null;
      this.emit('state:change', this.getState());
    };

    agent.on('emotion:updated', onEmotionUpdated);
    agent.on('message:processed', onMessageProcessed);
    agent.on('agent:destroyed', onAgentDestroyed);

    this.unsubscribers = [
      () => agent.off('emotion:updated', onEmotionUpdated),
      () => agent.off('message:processed', onMessageProcessed),
      () => agent.off('agent:destroyed', onAgentDestroyed),
    ];

    this.emit('state:change', this.getState());
    this.emit('bound', { memberId: this.state.memberId });
  }

  unbind(): void {
    for (const unsub of this.unsubscribers) {
      unsub();
    }
    this.unsubscribers = [];
    this.agent = null;
    this.state.status = 'idle';
    this.emit('unbound', { memberId: this.state.memberId });
    this.emit('state:change', this.getState());
  }

  async sendMessage(text: string): Promise<AgentResponse> {
    if (!this.agent) {
      return {
        success: false,
        error: { code: 'NOT_BOUND', message: 'No agent bound to this binding' },
        timestamp: Date.now(),
      };
    }

    const message = {
      id: `msg-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
      type: 'USER_REQUEST' as const,
      from: 'user' as FamilyMemberId,
      to: this.state.memberId,
      timestamp: Date.now(),
      payload: { text },
    };

    try {
      const response = await this.agent.handleFamilyMessage(message);
      this.state.messageCount++;
      this.state.lastActivity = Date.now();
      this.state.status = 'active';
      this.emit('message:sent', { message, response });
      this.emit('state:change', this.getState());
      return response;
    } catch (error) {
      this.state.status = 'error';
      this.emit('error', { error, message });
      this.emit('state:change', this.getState());
      return {
        success: false,
        error: { code: 'SEND_FAILED', message: String(error) },
        timestamp: Date.now(),
      };
    }
  }

  getState(): FamilyBindingState {
    return { ...this.state };
  }

  getMemberId(): FamilyMemberId {
    return this.state.memberId;
  }

  getStatus(): BindingStatus {
    return this.state.status;
  }

  getEmotion(): FamilyEmotionState {
    return { ...this.state.emotion };
  }

  getCapabilities(): AgentCapability[] {
    return [...this.state.capabilities];
  }

  getProfile(): FamilyMemberProfile {
    return this.state.profile;
  }

  getAgent(): FamilyBaseAgent | null {
    return this.agent;
  }

  onStateChange(callback: StateChangeCallback): () => void {
    this.on('state:change', callback);
    return () => this.off('state:change', callback);
  }

  onEmotionChange(callback: EmotionChangeCallback): () => void {
    this.on('emotion:change', callback);
    return () => this.off('emotion:change', callback);
  }

  destroy(): void {
    this.unbind();
    this.removeAllListeners();
  }
}
