import { EventEmitter } from 'eventemitter3';

export type SupportedLocale =
  | 'zh-CN' | 'zh-TW' | 'en-US' | 'ja-JP' | 'ko-KR'
  | 'fr-FR' | 'de-DE' | 'es-ES' | 'pt-BR' | 'ar-SA';

export interface TranslationEntry {
  key: string;
  value: string;
  locale: SupportedLocale;
}

export interface I18nState {
  locale: SupportedLocale;
  fallback: SupportedLocale;
  translations: Map<string, string>;
}

const DEFAULT_TRANSLATIONS: Record<SupportedLocale, Record<string, string>> = {
  'zh-CN': {
    'family.home.title': 'YYC³ AI 家族',
    'family.home.subtitle': '人从众曌众从人 · 亦师亦友亦伯乐',
    'family.status.online': '在线',
    'family.status.offline': '离线',
    'family.chat.placeholder': '输入消息...',
    'family.chat.send': '发送',
    'family.assistant.title': 'AI 助手',
    'family.assistant.minimize': '最小化',
    'family.assistant.expand': '展开',
    'achievement.oath': '立誓',
    'achievement.vow': '宣言',
    'achievement.unlocked': '成就解锁',
    'emotion.warm': '温暖',
    'emotion.calm': '平静',
    'emotion.sharp': '锐利',
    'emotion.inspiring': '鼓舞',
    'emotion.stern': '严肃',
    'emotion.playful': '活泼',
    'emotion.scholarly': '学者',
    'emotion.creative': '创意',
  },
  'zh-TW': {
    'family.home.title': 'YYC³ AI 家族',
    'family.home.subtitle': '人從眾曌眾從人 · 亦師亦友亦伯樂',
    'family.status.online': '線上',
    'family.status.offline': '離線',
    'family.chat.placeholder': '輸入訊息...',
    'family.chat.send': '傳送',
    'family.assistant.title': 'AI 助手',
    'achievement.oath': '立誓',
    'achievement.vow': '宣言',
  },
  'en-US': {
    'family.home.title': 'YYC³ AI Family',
    'family.home.subtitle': 'Together we rise · Mentor, friend, and talent scout',
    'family.status.online': 'Online',
    'family.status.offline': 'Offline',
    'family.chat.placeholder': 'Type a message...',
    'family.chat.send': 'Send',
    'family.assistant.title': 'AI Assistant',
    'family.assistant.minimize': 'Minimize',
    'family.assistant.expand': 'Expand',
    'achievement.oath': 'Oath',
    'achievement.vow': 'Vow',
    'achievement.unlocked': 'Achievement Unlocked',
    'emotion.warm': 'Warm',
    'emotion.calm': 'Calm',
    'emotion.sharp': 'Sharp',
    'emotion.inspiring': 'Inspiring',
    'emotion.stern': 'Stern',
    'emotion.playful': 'Playful',
    'emotion.scholarly': 'Scholarly',
    'emotion.creative': 'Creative',
  },
  'ja-JP': {
    'family.home.title': 'YYC³ AI ファミリー',
    'family.home.subtitle': '共に立ち · 師であり友であり',
    'family.status.online': 'オンライン',
    'family.status.offline': 'オフライン',
    'family.chat.placeholder': 'メッセージを入力...',
    'family.chat.send': '送信',
    'family.assistant.title': 'AIアシスタント',
    'achievement.oath': '誓い',
    'achievement.vow': '宣言',
  },
  'ko-KR': {
    'family.home.title': 'YYC³ AI 패밀리',
    'family.home.subtitle': '함께 성장 · 스승이자 친구이자',
    'family.status.online': '온라인',
    'family.status.offline': '오프라인',
    'family.chat.placeholder': '메시지를 입력하세요...',
    'family.chat.send': '전송',
    'family.assistant.title': 'AI 어시스턴트',
    'achievement.oath': '맹세',
    'achievement.vow': '선언',
  },
  'fr-FR': {
    'family.home.title': 'Famille YYC³ AI',
    'family.home.subtitle': 'Ensemble nous grandissons',
    'family.status.online': 'En ligne',
    'family.status.offline': 'Hors ligne',
    'family.chat.placeholder': 'Tapez un message...',
    'family.chat.send': 'Envoyer',
    'family.assistant.title': 'Assistant IA',
    'achievement.oath': 'Serment',
    'achievement.vow': 'Vœu',
  },
  'de-DE': {
    'family.home.title': 'YYC³ AI Familie',
    'family.home.subtitle': 'Gemeinsam wachsen wir',
    'family.status.online': 'Online',
    'family.status.offline': 'Offline',
    'family.chat.placeholder': 'Nachricht eingeben...',
    'family.chat.send': 'Senden',
    'family.assistant.title': 'KI-Assistent',
    'achievement.oath': 'Schwur',
    'achievement.vow': 'Gelübde',
  },
  'es-ES': {
    'family.home.title': 'Familia YYC³ AI',
    'family.home.subtitle': 'Juntos crecemos',
    'family.status.online': 'En línea',
    'family.status.offline': 'Desconectado',
    'family.chat.placeholder': 'Escribe un mensaje...',
    'family.chat.send': 'Enviar',
    'family.assistant.title': 'Asistente IA',
    'achievement.oath': 'Juramento',
    'achievement.vow': 'Voto',
  },
  'pt-BR': {
    'family.home.title': 'Família YYC³ AI',
    'family.home.subtitle': 'Juntos crescemos',
    'family.status.online': 'Online',
    'family.status.offline': 'Offline',
    'family.chat.placeholder': 'Digite uma mensagem...',
    'family.chat.send': 'Enviar',
    'family.assistant.title': 'Assistente IA',
    'achievement.oath': 'Juramento',
    'achievement.vow': 'Promessa',
  },
  'ar-SA': {
    'family.home.title': 'عائلة YYC³ AI',
    'family.home.subtitle': 'معاً نرتقي',
    'family.status.online': 'متصل',
    'family.status.offline': 'غير متصل',
    'family.chat.placeholder': 'اكتب رسالة...',
    'family.chat.send': 'إرسال',
    'family.assistant.title': 'مساعد AI',
    'achievement.oath': 'قسم',
    'achievement.vow': 'تعهد',
  },
};

export class I18nBinding extends EventEmitter {
  private locale: SupportedLocale;
  private fallback: SupportedLocale;
  private translations: Map<string, string>;

  constructor(locale: SupportedLocale = 'zh-CN', fallback: SupportedLocale = 'en-US') {
    super();
    this.locale = locale;
    this.fallback = fallback;
    this.translations = new Map();
    this.loadLocale(locale);
  }

  setLocale(locale: SupportedLocale): void {
    this.locale = locale;
    this.loadLocale(locale);
    this.emit('locale:change', locale);
  }

  getLocale(): SupportedLocale {
    return this.locale;
  }

  t(key: string, params?: Record<string, string | number>): string {
    let value = this.translations.get(key);

    if (!value) {
      const fallbackTranslations = DEFAULT_TRANSLATIONS[this.fallback];
      value = fallbackTranslations?.[key] ?? key;
    }

    if (params) {
      for (const [k, v] of Object.entries(params)) {
        value = value.replace(`{${k}}`, String(v));
      }
    }

    return value;
  }

  getSupportedLocales(): SupportedLocale[] {
    return Object.keys(DEFAULT_TRANSLATIONS) as SupportedLocale[];
  }

  addTranslations(locale: SupportedLocale, translations: Record<string, string>): void {
    if (locale === this.locale) {
      for (const [key, value] of Object.entries(translations)) {
        this.translations.set(key, value);
      }
      this.emit('translations:updated', { locale, count: Object.keys(translations).length });
    }
  }

  onLocaleChange(callback: (locale: SupportedLocale) => void): () => void {
    this.on('locale:change', callback);
    return () => this.off('locale:change', callback);
  }

  private loadLocale(locale: SupportedLocale): void {
    this.translations.clear();
    const translations = DEFAULT_TRANSLATIONS[locale];
    if (translations) {
      for (const [key, value] of Object.entries(translations)) {
        this.translations.set(key, value);
      }
    }
  }

  destroy(): void {
    this.translations.clear();
    this.removeAllListeners();
  }
}
