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

export const emotionDetectSkill = defineSkill(
  {
    id: 'qianhang:emotion-detect',
    name: 'Emotion Detection',
    version: '1.0.0',
    owner: 'qianhang',
    description: 'Detects emotion (joy/anger/sadness/fear/surprise/neutral) from text input using keyword matching and scoring.',
    category: 'nlu',
    parameters: [
      {
        name: 'text',
        type: 'string',
        required: true,
        description: 'The input text to analyze for emotion.',
      },
    ],
  },
  async (params) => {
    const text = String(params.text ?? '').toLowerCase();

    const emotionKeywords: Record<string, string[]> = {
      joy: ['开心', '快乐', '高兴', '幸福', '棒', '太好了', '喜欢', '爱', 'happy', 'joy', 'glad', 'excited', 'wonderful', 'great', 'love', 'awesome', '😊', '😄', '🎉', '👍'],
      anger: ['生气', '愤怒', '烦', '讨厌', '混蛋', 'angry', 'furious', 'hate', 'annoyed', 'mad', 'rage', 'outraged', '😡', '😤', '💢'],
      sadness: ['难过', '伤心', '悲伤', '哭', '失望', 'sad', 'sorrow', 'cry', 'disappointed', 'unhappy', 'depressed', '😢', '😭', '💔'],
      fear: ['害怕', '恐惧', '担心', '焦虑', '紧张', 'afraid', 'fear', 'scared', 'anxious', 'worried', 'nervous', 'terrible', '😨', '😰'],
      surprise: ['惊讶', '震惊', '意外', '没想到', '天哪', 'surprised', 'wow', 'amazing', 'unexpected', 'shocked', 'unbelievable', '😲', '😮'],
    };

    const scores: Record<string, number> = {};
    for (const [emotion, keywords] of Object.entries(emotionKeywords)) {
      let score = 0;
      for (const kw of keywords) {
        if (text.includes(kw)) score++;
      }
      scores[emotion] = score;
    }

    const maxScore = Math.max(...Object.values(scores));
    let dominant = 'neutral';
    if (maxScore > 0) {
      dominant = Object.entries(scores).find(([, s]) => s === maxScore)![0];
    }

    const total = Object.values(scores).reduce((a, b) => a + b, 0);
    const confidence = total > 0 ? maxScore / total : 0.5;

    const allEmotions: Record<string, { score: number; confidence: number }> = {};
    for (const [emotion, score] of Object.entries(scores)) {
      allEmotions[emotion] = {
        score,
        confidence: total > 0 ? score / total : 0,
      };
    }

    return {
      emotion: dominant,
      confidence: dominant === 'neutral' ? 0.5 : Math.min(confidence, 1.0),
      scores,
      allEmotions,
      text,
    };
  },
  (params) => {
    const errors: string[] = [];
    if (!params.text || typeof params.text !== 'string') {
      errors.push('Parameter "text" is required and must be a string');
    }
    if (typeof params.text === 'string' && params.text.trim().length === 0) {
      errors.push('Parameter "text" must not be empty');
    }
    return { valid: errors.length === 0, errors: errors.length > 0 ? errors : undefined };
  },
);
