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

export const coldStartSkill = defineSkill(
  {
    id: 'bole:cold-start',
    name: 'Cold Start Strategy',
    version: '1.0.0',
    owner: 'bole',
    description: 'Cold start recommendation strategy — generates initial recommendations for new users based on demographic and context signals.',
    category: 'recommendation',
    parameters: [
      {
        name: 'userProfile',
        type: 'object',
        required: true,
        description: 'New user profile with demographic and context signals.',
      },
      {
        name: 'candidatePool',
        type: 'array',
        required: false,
        description: 'Candidate items to recommend from.',
      },
      {
        name: 'topK',
        type: 'number',
        required: false,
        description: 'Number of recommendations to return.',
        default: 5,
      },
    ],
  },
  async (params) => {
    const userProfile = (params.userProfile as Record<string, unknown>) ?? {};
    const candidatePool = (params.candidatePool as Array<Record<string, unknown>>) ?? [];
    const topK = Number(params.topK ?? 5);

    const scored = candidatePool.map((item, idx) => {
      let score = 0.5;

      if (userProfile.interests && Array.isArray(userProfile.interests)) {
        const interests = userProfile.interests as string[];
        const tags = (item.tags as string[]) ?? [];
        const overlap = interests.filter(i => tags.some(t => t.toLowerCase().includes(i.toLowerCase())));
        score += overlap.length * 0.15;
      }

      if (userProfile.level && item.difficulty) {
        const levelDiff = Math.abs(Number(userProfile.level) - Number(item.difficulty));
        score -= levelDiff * 0.1;
      }

      if (item.popularity) {
        score += Number(item.popularity) * 0.1;
      }

      return { item: item.id ?? `item-${idx}`, score: Math.max(0, Math.min(1, score)), reason: `Score: ${score.toFixed(2)}` };
    });

    scored.sort((a, b) => b.score - a.score);

    return {
      recommendations: scored.slice(0, topK),
      strategy: 'cold-start',
      candidateCount: candidatePool.length,
      topK,
      confidence: candidatePool.length > 0 ? 0.6 : 0.1,
      userProfile,
    };
  },
  (params) => {
    const errors: string[] = [];
    if (!params.userProfile || typeof params.userProfile !== 'object') {
      errors.push('Parameter "userProfile" is required and must be an object');
    }
    return { valid: errors.length === 0, errors: errors.length > 0 ? errors : undefined };
  },
);
