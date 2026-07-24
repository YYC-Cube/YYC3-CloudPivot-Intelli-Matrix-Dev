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
import type { AgentResponse } from '@yyc3/family-core';
import { FamilyBinding } from './FamilyBinding.js';

export interface ChatMessage {
  id: string;
  role: 'user' | 'agent' | 'system';
  text: string;
  timestamp: number;
  metadata?: {
    executionTime?: number;
    emotion?: string;
    intent?: string;
  };
}

export type MessageCallback = (message: ChatMessage) => void;
export type HistoryCallback = (history: ChatMessage[]) => void;

export class FamilyChatBinding extends EventEmitter {
  private binding: FamilyBinding;
  private history: ChatMessage[] = [];
  private typing: boolean = false;

  constructor(binding: FamilyBinding) {
    super();
    this.binding = binding;
  }

  async sendMessage(text: string): Promise<AgentResponse> {
    const userMessage: ChatMessage = {
      id: `chat-${Date.now()}-user-${Math.random().toString(36).substring(2, 6)}`,
      role: 'user',
      text,
      timestamp: Date.now(),
    };

    this.history.push(userMessage);
    this.emit('message', userMessage);
    this.setTyping(true);

    const response = await this.binding.sendMessage(text);

    this.setTyping(false);

    const agentMessage: ChatMessage = {
      id: `chat-${Date.now()}-agent-${Math.random().toString(36).substring(2, 6)}`,
      role: 'agent',
      text: response.success
        ? (typeof response.data === 'string' ? response.data : JSON.stringify(response.data))
        : `[Error] ${response.error?.message ?? 'Unknown error'}`,
      timestamp: Date.now(),
      metadata: {
        executionTime: response.executionTime,
        emotion: this.binding.getEmotion().tone,
      },
    };

    this.history.push(agentMessage);
    this.emit('message', agentMessage);
    this.emit('history:change', this.getHistory());

    return response;
  }

  getHistory(): ChatMessage[] {
    return [...this.history];
  }

  clearHistory(): void {
    this.history = [];
    this.emit('history:cleared');
    this.emit('history:change', []);
  }

  isTyping(): boolean {
    return this.typing;
  }

  getMemberId(): FamilyMemberId {
    return this.binding.getMemberId();
  }

  getBinding(): FamilyBinding {
    return this.binding;
  }

  onMessage(callback: MessageCallback): () => void {
    this.on('message', callback);
    return () => this.off('message', callback);
  }

  onHistoryChange(callback: HistoryCallback): () => void {
    this.on('history:change', callback);
    return () => this.off('history:change', callback);
  }

  private setTyping(value: boolean): void {
    this.typing = value;
    this.emit('typing:change', value);
  }

  destroy(): void {
    this.history = [];
    this.removeAllListeners();
  }
}
