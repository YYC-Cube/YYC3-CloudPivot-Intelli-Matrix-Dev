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
import type { FamilyMemberId } from '@yyc3/family-agents';
import { FamilyBinding } from './FamilyBinding.js';
import { FamilyChatBinding } from './FamilyChatBinding.js';

export type AssistantState = 'closed' | 'minimized' | 'expanded' | 'fullscreen';
export type AssistantPosition = { x: number; y: number };

export interface AssistantSession {
  id: string;
  activeMember: FamilyMemberId;
  startedAt: number;
  messageCount: number;
}

export class AIAssistantBinding extends EventEmitter {
  private state: AssistantState = 'closed';
  private position: AssistantPosition = { x: 20, y: 20 };
  private chatBinding: FamilyChatBinding | null = null;
  private binding: FamilyBinding;
  private session: AssistantSession | null = null;
  private sessionCounter = 0;

  constructor(binding: FamilyBinding) {
    super();
    this.binding = binding;
  }

  open(): void {
    this.state = 'expanded';
    if (!this.chatBinding) {
      this.chatBinding = new FamilyChatBinding(this.binding);
    }
    this.session = {
      id: `session-${Date.now()}-${++this.sessionCounter}`,
      activeMember: this.binding.getMemberId(),
      startedAt: Date.now(),
      messageCount: 0,
    };
    this.emit('state:change', this.state);
    this.emit('session:start', this.session);
  }

  close(): void {
    this.state = 'closed';
    if (this.session) {
      this.emit('session:end', this.session);
      this.session = null;
    }
    this.emit('state:change', this.state);
  }

  minimize(): void {
    if (this.state !== 'closed') {
      this.state = 'minimized';
      this.emit('state:change', this.state);
    }
  }

  expand(): void {
    if (this.state !== 'closed') {
      this.state = 'expanded';
      this.emit('state:change', this.state);
    }
  }

  toggleFullscreen(): void {
    if (this.state === 'fullscreen') {
      this.state = 'expanded';
    } else if (this.state !== 'closed') {
      this.state = 'fullscreen';
    }
    this.emit('state:change', this.state);
  }

  setPosition(x: number, y: number): void {
    this.position = { x, y };
    this.emit('position:change', this.position);
  }

  async sendMessage(text: string) {
    if (!this.chatBinding) return null;
    if (this.session) {
      this.session.messageCount++;
    }
    return this.chatBinding.sendMessage(text);
  }

  getState(): AssistantState {
    return this.state;
  }

  getPosition(): AssistantPosition {
    return { ...this.position };
  }

  getChatBinding(): FamilyChatBinding | null {
    return this.chatBinding;
  }

  getSession(): AssistantSession | null {
    return this.session ? { ...this.session } : null;
  }

  getMemberId(): FamilyMemberId {
    return this.binding.getMemberId();
  }

  isOpen(): boolean {
    return this.state !== 'closed';
  }

  onStateChange(callback: (state: AssistantState) => void): () => void {
    this.on('state:change', callback);
    return () => this.off('state:change', callback);
  }

  destroy(): void {
    this.close();
    if (this.chatBinding) {
      this.chatBinding.destroy();
      this.chatBinding = null;
    }
    this.removeAllListeners();
  }
}
