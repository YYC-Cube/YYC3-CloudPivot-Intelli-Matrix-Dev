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

export { FamilyBinding } from './FamilyBinding.js';
export type { BindingStatus, FamilyBindingState, StateChangeCallback, EmotionChangeCallback } from './FamilyBinding.js';

export { FamilyHomeBinding } from './FamilyHomeBinding.js';
export type { FamilyMemberCard, MembersChangeCallback } from './FamilyHomeBinding.js';

export { FamilyChatBinding } from './FamilyChatBinding.js';
export type { ChatMessage, MessageCallback, HistoryCallback } from './FamilyChatBinding.js';

export { AIAssistantBinding } from './AIAssistantBinding.js';
export type { AssistantState, AssistantPosition, AssistantSession } from './AIAssistantBinding.js';

export { EmotionRippleBinding } from './EmotionRippleBinding.js';
export type { RippleState } from './EmotionRippleBinding.js';

export { AchievementBinding } from './AchievementBinding.js';
export type { Achievement, AchievementProgress, AchievementCallback } from './AchievementBinding.js';

export { I18nBinding } from './I18nBinding.js';
export type { SupportedLocale, TranslationEntry, I18nState } from './I18nBinding.js';

export { AuthBinding } from './AuthBinding.js';
export type { AuthState, AuthProvider, AuthUser, AuthSession } from './AuthBinding.js';
