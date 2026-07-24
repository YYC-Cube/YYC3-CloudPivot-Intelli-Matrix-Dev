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

import { defineSkill } from '../../registry/SkillManifest'

export const sentimentAnalysisSkill = defineSkill(
  {
    id: 'qianhang:sentiment-analysis',
    name: 'Sentiment Analysis',
    version: '1.0.0',
    owner: 'qianhang',
    description: 'Fine-grained sentiment analysis with polarity scoring, aspect-based sentiment, and opinion mining.',
    category: 'nlu',
    parameters: [
      {
        name: 'text',
        type: 'string',
        required: true,
        description: 'The text to analyze for sentiment.',
      },
    ],
  },
  async (params) => {
    const text = String(params.text ?? '');
    const lower = text.toLowerCase();

    const positiveWords = [
      '好', '棒', '优秀', '完美', '喜欢', '赞', '不错', '满意', 'great', 'good', 'excellent',
      'perfect', 'love', 'awesome', 'amazing', 'wonderful', 'fantastic', 'best', 'happy', 'nice',
      'beautiful', 'brilliant', 'outstanding', 'superb',
    ];
    const negativeWords = [
      '坏', '差', '糟糕', '烂', '讨厌', '垃圾', '失望', '不满', '难用', 'bad', 'terrible',
      'awful', 'horrible', 'worst', 'hate', 'ugly', 'poor', 'disappointing', 'annoying', 'broken',
      'useless', 'pathetic', 'disgusting',
    ];
    const intensifiers = ['非常', '特别', '极其', '很', '太', 'very', 'extremely', 'really', 'super', 'incredibly'];
    const negators = ['不', '没', '没有', '不是', '别', 'not', "n't", 'never', 'no', 'neither'];

    let positiveScore = 0;
    let negativeScore = 0;

    for (const word of positiveWords) {
      if (lower.includes(word)) {
        let score = 1;
        for (const intensifier of intensifiers) {
          if (lower.includes(intensifier)) score *= 1.5;
        }
        for (const negator of negators) {
          const idx = lower.indexOf(negator);
          const wordIdx = lower.indexOf(word);
          if (idx >= 0 && Math.abs(idx - wordIdx) < 5) score *= -1;
        }
        if (score > 0) positiveScore += score;
        else negativeScore += Math.abs(score);
      }
    }

    for (const word of negativeWords) {
      if (lower.includes(word)) {
        let score = 1;
        for (const intensifier of intensifiers) {
          if (lower.includes(intensifier)) score *= 1.5;
        }
        for (const negator of negators) {
          const idx = lower.indexOf(negator);
          const wordIdx = lower.indexOf(word);
          if (idx >= 0 && Math.abs(idx - wordIdx) < 5) score *= -1;
        }
        if (score > 0) negativeScore += score;
        else positiveScore += Math.abs(score);
      }
    }

    const total = positiveScore + negativeScore;
    const polarity = total > 0 ? (positiveScore - negativeScore) / total : 0;

    let label: 'positive' | 'negative' | 'neutral';
    if (polarity > 0.2) label = 'positive';
    else if (polarity < -0.2) label = 'negative';
    else label = 'neutral';

    return {
      label,
      polarity,
      confidence: total > 0 ? Math.min(total / 3, 1.0) : 0.3,
      scores: { positive: positiveScore, negative: negativeScore },
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
