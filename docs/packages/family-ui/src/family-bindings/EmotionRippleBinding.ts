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
import type { FamilyMemberId, EmotionTone, FamilyEmotionState } from '@yyc3/family-agents';

export interface RippleState {
  memberId: FamilyMemberId;
  tone: EmotionTone;
  temperature: number;
  engagement: number;
  intensity: number;
  color: string;
  phase: 'idle' | 'pulse' | 'wave' | 'surge';
  lastUpdated: number;
}

const TONE_COLORS: Record<EmotionTone, string> = {
  warm: '#ff6b35',
  calm: '#4fc3f7',
  sharp: '#ab47bc',
  inspiring: '#ffd54f',
  stern: '#78909c',
  playful: '#69f0ae',
  scholarly: '#90a4ae',
  creative: '#ff8c00',
};

export class EmotionRippleBinding extends EventEmitter {
  private ripples: Map<FamilyMemberId, RippleState> = new Map();

  constructor() {
    super();
  }

  updateFromEmotion(emotion: FamilyEmotionState, color?: string): RippleState {
    const intensity = this.calculateIntensity(emotion);
    const phase = this.determinePhase(emotion, intensity);

    const ripple: RippleState = {
      memberId: emotion.memberId,
      tone: emotion.tone,
      temperature: emotion.temperature,
      engagement: emotion.engagement,
      intensity,
      color: color ?? TONE_COLORS[emotion.tone],
      phase,
      lastUpdated: Date.now(),
    };

    this.ripples.set(emotion.memberId, ripple);
    this.emit('ripple:update', ripple);
    this.emit('ripples:change', this.getAllRipples());

    return ripple;
  }

  getRipple(memberId: FamilyMemberId): RippleState | undefined {
    return this.ripples.get(memberId);
  }

  getAllRipples(): RippleState[] {
    return Array.from(this.ripples.values());
  }

  removeRipple(memberId: FamilyMemberId): void {
    this.ripples.delete(memberId);
    this.emit('ripple:remove', memberId);
    this.emit('ripples:change', this.getAllRipples());
  }

  onRippleUpdate(callback: (ripple: RippleState) => void): () => void {
    this.on('ripple:update', callback);
    return () => this.off('ripple:update', callback);
  }

  onRipplesChange(callback: (ripples: RippleState[]) => void): () => void {
    this.on('ripples:change', callback);
    return () => this.off('ripples:change', callback);
  }

  private calculateIntensity(emotion: FamilyEmotionState): number {
    return Math.min(1, (emotion.temperature * 0.6 + Math.min(emotion.engagement / 20, 1) * 0.4));
  }

  private determinePhase(emotion: FamilyEmotionState, intensity: number): RippleState['phase'] {
    if (intensity > 0.8) return 'surge';
    if (intensity > 0.5) return 'wave';
    if (intensity > 0.2) return 'pulse';
    return 'idle';
  }

  destroy(): void {
    this.ripples.clear();
    this.removeAllListeners();
  }
}
