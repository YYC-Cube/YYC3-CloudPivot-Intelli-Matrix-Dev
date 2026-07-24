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

export const diversityRankingSkill = defineSkill(
  {
    id: 'bole:diversity-ranking',
    name: 'Diversity Ranking',
    version: '1.0.0',
    owner: 'bole',
    description: 'Diversifies and re-ranks recommendation results using MMR (Maximal Marginal Relevance) strategy.',
    category: 'recommendation',
    parameters: [
      {
        name: 'items',
        type: 'array',
        required: true,
        description: 'Array of items with id, score, and optional features.',
      },
      {
        name: 'lambda',
        type: 'number',
        required: false,
        description: 'Relevance-diversity trade-off (0=all diverse, 1=all relevant).',
        default: 0.7,
      },
      {
        name: 'topK',
        type: 'number',
        required: false,
        description: 'Number of diversified results to return.',
        default: 10,
      },
    ],
  },
  async (params) => {
    const items = (params.items as Array<Record<string, unknown>>) ?? [];
    const lambda = Number(params.lambda ?? 0.7);
    const topK = Number(params.topK ?? 10);

    if (items.length === 0) {
      return { diversified: [], originalCount: 0 };
    }

    const scored = items.map(item => ({
      id: String(item.id ?? ''),
      relevance: Number(item.score ?? item.relevance ?? 0.5),
      features: item.features as number[] ?? [],
    }));

    const selected: typeof scored = [];
    const remaining = [...scored];

    while (selected.length < topK && remaining.length > 0) {
      let bestIdx = 0;
      let bestMMR = -Infinity;

      for (let i = 0; i < remaining.length; i++) {
        const relevance = remaining[i]!.relevance;
        const maxSimilarity = selected.length === 0
          ? 0
          : Math.max(...selected.map(s => itemSimilarity(remaining[i]!, s)));
        const mmr = lambda * relevance - (1 - lambda) * maxSimilarity;

        if (mmr > bestMMR) {
          bestMMR = mmr;
          bestIdx = i;
        }
      }

      selected.push(remaining.splice(bestIdx, 1)[0]!);
    }

    return {
      diversified: selected.map(s => ({ id: s.id, relevance: s.relevance })),
      originalCount: items.length,
      selectedCount: selected.length,
      lambda,
    };
  },
  (params) => {
    const errors: string[] = [];
    if (!Array.isArray(params.items)) {
      errors.push('Parameter "items" is required and must be an array');
    }
    return { valid: errors.length === 0, errors: errors.length > 0 ? errors : undefined };
  },
);

function itemSimilarity(a: { features: number[] }, b: { features: number[] }): number {
  if (a.features.length === 0 || b.features.length === 0) return 0;
  const minLen = Math.min(a.features.length, b.features.length);
  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < minLen; i++) {
    dot += a.features[i]! * b.features[i]!;
    normA += a.features[i]! ** 2;
    normB += b.features[i]! ** 2;
  }
  const denom = Math.sqrt(normA) * Math.sqrt(normB);
  return denom === 0 ? 0 : dot / denom;
}
