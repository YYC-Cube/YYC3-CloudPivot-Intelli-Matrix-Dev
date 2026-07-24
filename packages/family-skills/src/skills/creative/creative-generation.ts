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

export const creativeGenerationSkill = defineSkill(
  {
    id: 'grace:creative-generation',
    name: 'Creative Generation',
    version: '1.0.0',
    owner: 'grace',
    description: 'Creative content generation — generates marketing copy, UI text, naming suggestions, and creative briefs.',
    category: 'creative',
    parameters: [
      {
        name: 'brief',
        type: 'string',
        required: true,
        description: 'Creative brief describing what to generate.',
      },
      {
        name: 'type',
        type: 'string',
        required: false,
        description: 'Content type: copy, naming, slogan, description.',
        default: 'copy',
      },
      {
        name: 'tone',
        type: 'string',
        required: false,
        description: 'Desired tone: professional, playful, bold, warm.',
        default: 'professional',
      },
    ],
  },
  async (params) => {
    const brief = String(params.brief ?? '');
    const type = String(params.type ?? 'copy');
    const tone = String(params.tone ?? 'professional');

    const templates: Record<string, string[]> = {
      copy: [
        `发现无限可能 — ${brief}`,
        `让${brief}成为你的下一个突破`,
        `${brief}：重新定义未来的选择`,
      ],
      naming: [
        `${brief}Pro`, `${brief}X`, `灵${brief}`, `${brief}Hub`,
      ],
      slogan: [
        `${brief}，不止于此`,
        `选择${brief}，选择卓越`,
        `${brief}，为未来而生`,
      ],
      description: [
        `${brief}是一款创新解决方案，致力于提升用户体验和效率。`,
        `通过${brief}，您可以轻松实现目标，享受无缝体验。`,
      ],
    };

    const toneModifiers: Record<string, (text: string) => string> = {
      professional: (t) => t,
      playful: (t) => `${t} ✨`,
      bold: (t) => `【${t}】`,
      warm: (t) => `~ ${t} ~`,
    };

    const modifier = toneModifiers[tone] ?? toneModifiers['professional']!;
    const options = (templates[type] ?? templates['copy']!).map(t => modifier(t));

    return {
      brief,
      type,
      tone,
      options,
      optionCount: options.length,
      recommendation: options[0],
    };
  },
  (params) => {
    const errors: string[] = [];
    if (!params.brief || typeof params.brief !== 'string') {
      errors.push('Parameter "brief" is required and must be a string');
    }
    return { valid: errors.length === 0, errors: errors.length > 0 ? errors : undefined };
  },
);
