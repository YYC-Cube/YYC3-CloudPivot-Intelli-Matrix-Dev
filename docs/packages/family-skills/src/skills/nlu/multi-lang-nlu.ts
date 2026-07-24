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

import { defineSkill } from '../../registry/SkillManifest.js';

export const multiLangNluSkill = defineSkill(
  {
    id: 'qianhang:multi-lang-nlu',
    name: 'Multi-Language NLU',
    version: '1.0.0',
    owner: 'qianhang',
    description: 'Multi-language natural language understanding — language detection, tokenization, and intent extraction.',
    category: 'nlu',
    parameters: [
      {
        name: 'text',
        type: 'string',
        required: true,
        description: 'The input text to analyze.',
      },
    ],
  },
  async (params) => {
    const text = String(params.text ?? '');

    const lang = detectLanguage(text);
    const tokens = tokenize(text, lang);
    const intent = extractIntent(text, tokens);

    return {
      language: lang,
      tokens,
      tokenCount: tokens.length,
      intent,
      text,
    };
  },
  (params) => {
    const errors: string[] = [];
    if (!params.text || typeof params.text !== 'string') {
      errors.push('Parameter "text" is required and must be a string');
    }
    return { valid: errors.length === 0, errors: errors.length > 0 ? errors : undefined };
  },
);

type DetectedLanguage = 'zh' | 'en' | 'ja' | 'ko' | 'mixed' | 'unknown';

function detectLanguage(text: string): DetectedLanguage {
  let zhCount = 0;
  let enCount = 0;
  let jaCount = 0;
  let koCount = 0;

  for (const ch of text) {
    const code = ch.codePointAt(0)!;
    if ((code >= 0x4E00 && code <= 0x9FFF) || (code >= 0x3400 && code <= 0x4DBF)) {
      zhCount++;
    } else if ((code >= 0x3040 && code <= 0x309F) || (code >= 0x30A0 && code <= 0x30FF)) {
      jaCount++;
    } else if (code >= 0xAC00 && code <= 0xD7AF) {
      koCount++;
    } else if ((code >= 0x41 && code <= 0x5A) || (code >= 0x61 && code <= 0x7A)) {
      enCount++;
    }
  }

  const total = zhCount + enCount + jaCount + koCount;
  if (total === 0) return 'unknown';

  const zhRatio = zhCount / total;
  const enRatio = enCount / total;
  const jaRatio = jaCount / total;
  const koRatio = koCount / total;

  if (jaCount > 0 && jaRatio > 0.1) return 'ja';
  if (koCount > 0 && koRatio > 0.1) return 'ko';
  if (zhRatio > 0.3 && enRatio > 0.3) return 'mixed';
  if (zhRatio >= enRatio && zhCount > 0) return 'zh';
  if (enCount > 0) return 'en';
  return 'unknown';
}

function tokenize(text: string, lang: DetectedLanguage): string[] {
  switch (lang) {
    case 'zh':
    case 'ja':
      return Array.from(text).filter(ch => /\p{L}|\p{N}/u.test(ch));
    case 'ko':
      return text.split(/\s+/).filter(t => t.length > 0);
    case 'en':
      return text.toLowerCase().split(/\s+/).filter(t => t.length > 0).map(t => t.replace(/[^a-z0-9]/g, '')).filter(t => t.length > 0);
    default:
      return text.split(/\s+/).filter(t => t.length > 0);
  }
}

interface ExtractedIntent {
  primary: string;
  confidence: number;
  keywords: string[];
}

function extractIntent(text: string, tokens: string[]): ExtractedIntent {
  const intentPatterns: Array<{ intent: string; keywords: string[] }> = [
    { intent: 'query', keywords: ['什么', '怎么', '如何', '为什么', 'where', 'what', 'how', 'why', 'when', 'who', '哪个', '吗'] },
    { intent: 'command', keywords: ['请', '帮我', '执行', '运行', '创建', '删除', 'please', 'run', 'execute', 'create', 'delete', 'do', 'make'] },
    { intent: 'greeting', keywords: ['你好', '嗨', '早上好', 'hello', 'hi', 'hey', 'good morning', '您好'] },
    { intent: 'feedback', keywords: ['不好', '好', '差', '优秀', 'bad', 'good', 'great', 'terrible', 'improve', '改进', '建议'] },
    { intent: 'request', keywords: ['需要', '想要', '能不能', '可以', 'need', 'want', 'can', 'could', 'would'] },
  ];

  const lowerText = text.toLowerCase();
  let bestIntent = 'general';
  let bestScore = 0;
  let matchedKeywords: string[] = [];

  for (const pattern of intentPatterns) {
    const matched = pattern.keywords.filter(kw => lowerText.includes(kw));
    if (matched.length > bestScore) {
      bestScore = matched.length;
      bestIntent = pattern.intent;
      matchedKeywords = matched;
    }
  }

  return {
    primary: bestIntent,
    confidence: bestScore > 0 ? Math.min(bestScore / 3, 1.0) : 0.3,
    keywords: matchedKeywords,
  };
}
