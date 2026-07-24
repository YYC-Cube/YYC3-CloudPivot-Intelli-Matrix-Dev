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
import type { FamilyEmotionState } from '@yyc3/family-agents';

export interface Achievement {
  id: string;
  memberId: FamilyMemberId;
  type: 'oath' | 'milestone' | 'collaboration' | 'skill_mastery' | 'vow';
  title: string;
  description: string;
  unlockedAt: number;
  emotion: FamilyEmotionState | null;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
}

export interface AchievementProgress {
  achievementId: string;
  current: number;
  target: number;
  percentage: number;
}

export type AchievementCallback = (achievement: Achievement) => void;

export class AchievementBinding extends EventEmitter {
  private achievements: Map<string, Achievement> = new Map();
  private progress: Map<string, AchievementProgress> = new Map();
  private counter = 0;

  constructor() {
    super();
  }

  unlockAchievement(
    memberId: FamilyMemberId,
    type: Achievement['type'],
    title: string,
    description: string,
    emotion?: FamilyEmotionState,
    rarity: Achievement['rarity'] = 'common',
  ): Achievement {
    const id = `achievement-${Date.now()}-${++this.counter}`;
    const achievement: Achievement = {
      id,
      memberId,
      type,
      title,
      description,
      unlockedAt: Date.now(),
      emotion: emotion ?? null,
      rarity,
    };

    this.achievements.set(id, achievement);
    this.emit('achievement:unlocked', achievement);
    this.emit('achievements:change', this.getAchievements());

    return achievement;
  }

  triggerOath(memberId: FamilyMemberId, oathText: string, emotion?: FamilyEmotionState): Achievement {
    return this.unlockAchievement(
      memberId,
      'oath',
      `${memberId} 立誓`,
      oathText,
      emotion,
      'epic',
    );
  }

  triggerVow(memberId: FamilyMemberId, vowText: string, emotion?: FamilyEmotionState): Achievement {
    return this.unlockAchievement(
      memberId,
      'vow',
      `${memberId} 宣言`,
      vowText,
      emotion,
      'legendary',
    );
  }

  setProgress(achievementId: string, current: number, target: number): void {
    const progress: AchievementProgress = {
      achievementId,
      current,
      target,
      percentage: target > 0 ? Math.min(100, (current / target) * 100) : 0,
    };
    this.progress.set(achievementId, progress);
    this.emit('progress:update', progress);
  }

  getAchievements(): Achievement[] {
    return Array.from(this.achievements.values());
  }

  getAchievementsByMember(memberId: FamilyMemberId): Achievement[] {
    return Array.from(this.achievements.values()).filter(a => a.memberId === memberId);
  }

  getProgress(achievementId: string): AchievementProgress | undefined {
    return this.progress.get(achievementId);
  }

  onAchievementUnlocked(callback: AchievementCallback): () => void {
    this.on('achievement:unlocked', callback);
    return () => this.off('achievement:unlocked', callback);
  }

  destroy(): void {
    this.achievements.clear();
    this.progress.clear();
    this.removeAllListeners();
  }
}
