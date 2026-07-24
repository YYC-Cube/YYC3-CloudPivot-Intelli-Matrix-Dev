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
import type { FamilyMemberId, FamilyEmotionState } from '@yyc3/family-agents';
import { FAMILY_PROFILES } from '@yyc3/family-agents';
import { FamilyBinding } from './FamilyBinding.js';
import type { BindingStatus } from './FamilyBinding.js';

export interface FamilyMemberCard {
  id: FamilyMemberId;
  name: string;
  icon: string;
  color: string;
  role: string;
  motto: string;
  layer: number;
  status: BindingStatus;
  emotion: FamilyEmotionState;
  isOnline: boolean;
}

export type MembersChangeCallback = (members: FamilyMemberCard[]) => void;

const ALL_MEMBER_IDS: FamilyMemberId[] = [
  'qianhang', 'thinker', 'prophet', 'bole',
  'tianshu', 'guardian', 'grandmaster', 'grace',
];

export class FamilyHomeBinding extends EventEmitter {
  private bindings: Map<FamilyMemberId, FamilyBinding> = new Map();
  private members: FamilyMemberCard[];

  constructor() {
    super();
    this.members = ALL_MEMBER_IDS.map(id => {
      const profile = FAMILY_PROFILES[id];
      return {
        id,
        name: profile.name,
        icon: profile.icon,
        color: profile.color,
        role: profile.role,
        motto: profile.motto,
        layer: profile.layer,
        status: 'idle' as BindingStatus,
        emotion: {
          memberId: id,
          tone: profile.emotionTone,
          temperature: 0.5,
          engagement: 0,
          lastUpdated: Date.now(),
        },
        isOnline: false,
      };
    });
  }

  registerBinding(binding: FamilyBinding): void {
    const memberId = binding.getMemberId();
    this.bindings.set(memberId, binding);

    const updateMember = () => {
      this.syncMemberFromBinding(memberId);
      this.emit('members:change', this.getMembers());
    };

    binding.on('state:change', updateMember);
    binding.on('emotion:change', updateMember);
    binding.on('bound', updateMember);
    binding.on('unbound', updateMember);

    this.syncMemberFromBinding(memberId);
    this.emit('members:change', this.getMembers());
  }

  unregisterBinding(memberId: FamilyMemberId): void {
    this.bindings.delete(memberId);
    const member = this.members.find(m => m.id === memberId);
    if (member) {
      member.status = 'idle';
      member.isOnline = false;
    }
    this.emit('members:change', this.getMembers());
  }

  getBinding(memberId: FamilyMemberId): FamilyBinding | undefined {
    return this.bindings.get(memberId);
  }

  getMembers(): FamilyMemberCard[] {
    return this.members.map(m => ({ ...m }));
  }

  getMember(memberId: FamilyMemberId): FamilyMemberCard | undefined {
    const m = this.members.find(m => m.id === memberId);
    return m ? { ...m } : undefined;
  }

  getOnlineMembers(): FamilyMemberCard[] {
    return this.members.filter(m => m.isOnline).map(m => ({ ...m }));
  }

  getOfflineMembers(): FamilyMemberCard[] {
    return this.members.filter(m => !m.isOnline).map(m => ({ ...m }));
  }

  onMembersChange(callback: MembersChangeCallback): () => void {
    this.on('members:change', callback);
    return () => this.off('members:change', callback);
  }

  private syncMemberFromBinding(memberId: FamilyMemberId): void {
    const binding = this.bindings.get(memberId);
    const member = this.members.find(m => m.id === memberId);
    if (!member) return;

    if (binding) {
      const state = binding.getState();
      member.status = state.status;
      member.emotion = state.emotion;
      member.isOnline = state.status !== 'idle';
    } else {
      member.status = 'idle';
      member.isOnline = false;
    }
  }

  destroy(): void {
    for (const binding of this.bindings.values()) {
      binding.destroy();
    }
    this.bindings.clear();
    this.removeAllListeners();
  }
}
