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

export const summaryGenerationSkill = defineSkill(
  {
    id: 'thinker:summary-generation',
    name: 'Text Summary Generation',
    version: '1.0.0',
    owner: 'thinker',
    description: '文本摘要生成：从长文本中提取核心信息，支持抽取式与抽象式摘要策略。',
    category: 'analysis',
    tags: ['summarization', 'nlp', 'compression', 'insight'],
    parameters: [
      {
        name: 'text',
        type: 'string',
        required: true,
        description: '需要生成摘要的原始文本。',
      },
      {
        name: 'strategy',
        type: 'string',
        required: false,
        description: '摘要策略：extractive（抽取式）| abstractive（抽象式）| bullet（要点式）',
        default: 'extractive',
      },
      {
        name: 'maxSentences',
        type: 'number',
        required: false,
        description: '摘要最大句子数。',
        default: 3,
      },
    ],
  },
  async (params) => {
    const text = String(params.text ?? '');
    const strategy = String(params.strategy ?? 'extractive');
    const maxSentences = Number(params.maxSentences ?? 3);

    if (text.length === 0) {
      return { result: null, message: 'Empty text provided.' };
    }

    // 分句
    const sentences = text
      .split(/[。.！!？?\n；;]/)
      .map((s) => s.trim())
      .filter((s) => s.length > 5);

    // 词频统计
    const wordFreq: Record<string, number> = {};
    for (const s of sentences) {
      for (const w of s.toLowerCase().split(/[\s,，、]+/)) {
        if (w.length > 2) wordFreq[w] = (wordFreq[w] ?? 0) + 1;
      }
    }
    const topWords = Object.entries(wordFreq)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([w]) => w);

    // 句子评分
    const scored = sentences.map((s, idx) => {
      let score = 0;
      for (const w of topWords) {
        if (s.toLowerCase().includes(w)) score += wordFreq[w] ?? 0;
      }
      // 位置加权：首句和末句通常更重要
      if (idx === 0) score *= 1.2;
      if (idx === sentences.length - 1) score *= 1.1;
      return { sentence: s, score, index: idx };
    });

    switch (strategy) {
      case 'abstractive': {
        // 模拟抽象式摘要：提取关键主题，构建综合描述
        const keyPoints = scored
          .sort((a, b) => b.score - a.score)
          .slice(0, maxSentences)
          .map((s) => s.sentence);
        const themes = topWords.slice(0, 5);
        return {
          strategy: 'abstractive',
          summary: `本文围绕「${themes.join('、')}」展开。${keyPoints.join('；')}。`,
          themes,
          originalLength: text.length,
          summaryLength: keyPoints.join('').length,
          compressionRatio: 1 - keyPoints.join('').length / text.length,
        };
      }

      case 'bullet': {
        const bullets = scored
          .sort((a, b) => b.score - a.score)
          .slice(0, maxSentences)
          .sort((a, b) => a.index - b.index)
          .map((s, i) => `${i + 1}. ${s.sentence}`);
        return {
          strategy: 'bullet',
          summary: bullets.join('\n'),
          bulletCount: bullets.length,
          keyTopics: topWords.slice(0, 5),
        };
      }

      default: { // extractive
        const topSentences = scored
          .sort((a, b) => b.score - a.score)
          .slice(0, maxSentences)
          .sort((a, b) => a.index - b.index)
          .map((s) => s.sentence);
        return {
          strategy: 'extractive',
          summary: topSentences.join('。') + '。',
          selectedIndices: scored.sort((a, b) => b.score - a.score).slice(0, maxSentences).map((s) => s.index),
          keyTopics: topWords.slice(0, 5),
          originalLength: text.length,
          summaryLength: topSentences.join('').length,
        };
      }
    }
  },
  (params) => {
    const errors: string[] = [];
    if (typeof params.text !== 'string' || params.text.trim().length === 0) {
      errors.push('Parameter "text" is required and must be a non-empty string');
    }
    return { valid: errors.length === 0, errors: errors.length > 0 ? errors : undefined };
  },
);
