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

export const personalizeRenderSkill = defineSkill(
  {
    id: 'bole:personalize-render',
    name: 'Personalized Render',
    version: '1.0.0',
    owner: 'bole',
    description: 'Personalized content rendering — adapts output format, detail level, and emphasis based on user preferences.',
    category: 'recommendation',
    parameters: [
      {
        name: 'content',
        type: 'string',
        required: true,
        description: 'The content to personalize.',
      },
      {
        name: 'preferences',
        type: 'object',
        required: true,
        description: 'User preferences for rendering (style, detailLevel, language, emphasis).',
      },
    ],
  },
  async (params) => {
    const content = String(params.content ?? '');
    const preferences = (params.preferences as Record<string, unknown>) ?? {};

    const style = String(preferences.style ?? 'standard');
    const detailLevel = String(preferences.detailLevel ?? 'medium');
    const language = String(preferences.language ?? 'zh');
    const emphasis = (preferences.emphasis as string[]) ?? [];

    let adapted = content;

    if (detailLevel === 'brief') {
      const sentences = adapted.split(/[。！？.!?]+/).filter(s => s.trim());
      adapted = sentences.slice(0, 3).join('。');
      if (language === 'en') adapted = sentences.slice(0, 3).join('. ');
    }

    const highlights = emphasis.map(e => {
      const regex = new RegExp(e, 'gi');
      return { keyword: e, found: regex.test(content) };
    });

    return {
      adaptedContent: adapted,
      style,
      detailLevel,
      language,
      highlights,
      personalizationApplied: [
        style !== 'standard' ? `Style: ${style}` : null,
        detailLevel !== 'medium' ? `Detail level: ${detailLevel}` : null,
        language !== 'zh' ? `Language: ${language}` : null,
        highlights.length > 0 ? `Emphasis: ${highlights.filter(h => h.found).map(h => h.keyword).join(', ')}` : null,
      ].filter(Boolean),
    };
  },
  (params) => {
    const errors: string[] = [];
    if (!params.content || typeof params.content !== 'string') {
      errors.push('Parameter "content" is required and must be a string');
    }
    if (!params.preferences || typeof params.preferences !== 'object') {
      errors.push('Parameter "preferences" is required and must be an object');
    }
    return { valid: errors.length === 0, errors: errors.length > 0 ? errors : undefined };
  },
);
