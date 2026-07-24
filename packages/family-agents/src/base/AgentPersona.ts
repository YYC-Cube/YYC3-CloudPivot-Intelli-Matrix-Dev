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

import type { FamilyMemberId, EmotionTone, FamilyMemberProfile } from './FamilyTypes';

export interface PersonaTraits {
  formality: number;
  warmth: number;
  directness: number;
  creativity: number;
  precision: number;
  humor: number;
}

export interface TonePattern {
  greeting: string[];
  acknowledgment: string[];
  thinking: string[];
  success: string[];
  error: string[];
  farewell: string[];
}

export interface AgentPersonaConfig {
  memberId: FamilyMemberId;
  name: string;
  role: string;
  motto: string;
  icon: string;
  color: string;
  emotionTone: EmotionTone;
  traits: PersonaTraits;
  tonePatterns: TonePattern;
  systemPrompt: string;
}

const DEFAULT_TRAITS: PersonaTraits = {
  formality: 0.5,
  warmth: 0.5,
  directness: 0.5,
  creativity: 0.5,
  precision: 0.5,
  humor: 0.3,
};

const DEFAULT_TONES: Record<EmotionTone, Partial<PersonaTraits>> = {
  warm: { warmth: 0.9, formality: 0.3, humor: 0.5 },
  calm: { precision: 0.8, formality: 0.6, directness: 0.4 },
  sharp: { directness: 0.9, precision: 0.9, formality: 0.5 },
  inspiring: { warmth: 0.8, creativity: 0.7, directness: 0.7 },
  stern: { formality: 0.9, directness: 0.8, precision: 0.8 },
  playful: { humor: 0.8, creativity: 0.7, warmth: 0.7 },
  scholarly: { precision: 0.9, formality: 0.7, creativity: 0.4 },
  creative: { creativity: 0.95, warmth: 0.6, humor: 0.6 },
};

export class AgentPersona {
  public readonly config: AgentPersonaConfig;

  constructor(profile: FamilyMemberProfile, overrides?: Partial<AgentPersonaConfig>) {
    const traits = { ...DEFAULT_TRAITS, ...DEFAULT_TONES[profile.emotionTone], ...overrides?.traits };
    this.config = {
      memberId: profile.id,
      name: profile.name,
      role: profile.role,
      motto: profile.motto,
      icon: profile.icon,
      color: profile.color,
      emotionTone: profile.emotionTone,
      traits,
      tonePatterns: overrides?.tonePatterns ?? this.buildDefaultTones(profile),
      systemPrompt: overrides?.systemPrompt ?? this.buildSystemPrompt(profile),
      ...overrides,
    };
  }

  private buildDefaultTones(profile: FamilyMemberProfile): TonePattern {
    const name = profile.name;
    return {
      greeting: [`${profile.icon} 你好！我是${name}，${profile.motto}`],
      acknowledgment: ['收到，正在处理...', '明白，这就来。', '了解，交给我。'],
      thinking: ['让我想想...', '分析中...', '正在思考...'],
      success: ['完成了！', '搞定！', '任务完成。'],
      error: ['抱歉，出了点问题。', '遇到了一些困难。', '请稍等，需要调整。'],
      farewell: ['有事随时找我。', '期待下次协作！', '再见！'],
    };
  }

  private buildSystemPrompt(profile: FamilyMemberProfile): string {
    return `你是 YYC³ AI Family 的${profile.name}（${profile.role}）。
你的座右铭是：${profile.motto}
你的职责层是第${profile.layer}层（${profile.layerName}）。
请始终以${profile.name}的人格和语气回应。
保持专业但温暖的态度，体现"亦师亦友亦伯乐"的家族精神。`;
  }

  pickPhrase(category: keyof TonePattern): string {
    const patterns = this.config.tonePatterns[category];
    return patterns[Math.floor(Math.random() * patterns.length)] ?? patterns[0] ?? '';
  }

  formatResponse(content: string): string {
    return `${this.config.icon} ${content}`;
  }
}
