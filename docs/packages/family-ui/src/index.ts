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

// 🎨 YYC³ Family UI — 表现层
// 人从众曌众从人 · 亦师亦友亦伯乐

// Bindings
export {
  AIAssistantBinding, AchievementBinding, AuthBinding, EmotionRippleBinding, FamilyBinding, FamilyChatBinding, FamilyHomeBinding, I18nBinding
} from './family-bindings/index.js';

// React Query — 数据请求层
export {
  QUERY_KEYS, QueryProvider,
  queryClient, useFamilyActivities, useFamilyDashboard, useFamilyMembers, useFamilyMessages,
  useSyncFamily
} from './query/index.js';
export type { QueryProviderProps } from './query/index.js';

// Binding Types
export type {
  Achievement, AchievementCallback, AchievementProgress, AssistantPosition,
  AssistantSession, AssistantState, AuthProvider, AuthSession, AuthState, AuthUser, BindingStatus, ChatMessage, EmotionChangeCallback, FamilyBindingState, FamilyMemberCard, HistoryCallback, I18nState, MembersChangeCallback, MessageCallback, RippleState, StateChangeCallback, SupportedLocale,
  TranslationEntry
} from './family-bindings/index.js';

// App Components
export {
  AIAssistant, AchievementPanel,
  EmotionRipple,
  EmotionRippleAnimator, FamilyChat, FamilyHome
} from './app/index.js';

// App Component Types
export type {
  AIAssistantProps, AchievementPanelProps,
  EmotionRippleProps, FamilyChatProps, FamilyHomeProps, ThemeSettingsProps
} from './app/index.js';

// Theme
export {
  BUILT_IN_THEMES, DARK_THEME,
  LIGHT_THEME, ThemeManager, applyThemeToDOM,
  removeThemeFromDOM, themeToCSSVariables, themeToStyleSheet
} from './theme/index.js';

export type {
  ThemeAnimation, ThemeBorderRadius, ThemeChangeCallback, ThemeColors, ThemeConfig, ThemeLayout, ThemeShadows, ThemeSpacing, ThemeTransitions, ThemeTypography
} from './theme/index.js';

// Persistence
export { LocalPersister } from './persistence/index.js';
