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

export const contentRecommendationSkill = defineSkill(
  {
    id: 'bole:content-recommendation',
    name: 'Content-Based Recommendation',
    version: '1.0.0',
    owner: 'bole',
    description: '基于内容特征的推荐：通过 TF-IDF / 标签匹配 / 特征相似度进行个性化推荐。',
    category: 'recommendation',
    tags: ['content-based', 'tfidf', 'similarity', 'personalization'],
    parameters: [
      {
        name: 'userProfile',
        type: 'object',
        required: true,
        description: '用户画像，包含 tags 和 preferences。',
      },
      {
        name: 'items',
        type: 'array',
        required: true,
        description: '候选项目数组，每个元素为 { id, title, tags, features }。',
      },
      {
        name: 'topK',
        type: 'number',
        required: false,
        description: '返回 Top-K 推荐结果。',
        default: 5,
      },
    ],
  },
  async (params) => {
    const userProfile = params.userProfile as { tags?: string[]; preferences?: Record<string, number> };
    const items = (params.items as Array<{
      id: string;
      title: string;
      tags: string[];
      features?: Record<string, number>;
    }>) ?? [];
    const topK = Number(params.topK ?? 5);

    if (items.length === 0 || !userProfile) {
      return { result: null, message: 'Missing user profile or items.' };
    }

    const userTags = new Set((userProfile.tags ?? []).map((t) => t.toLowerCase()));
    const userPrefs = userProfile.preferences ?? {};

    // 计算每个项目的综合匹配分
    const scored = items.map((item) => {
      // 1. 标签 Jaccard 相似度
      const itemTags = new Set(item.tags.map((t) => t.toLowerCase()));
      const intersection = [...userTags].filter((t) => itemTags.has(t));
      const union = new Set([...userTags, ...itemTags]);
      const tagScore = union.size > 0 ? intersection.length / union.size : 0;

      // 2. 特征余弦相似度
      let featureScore = 0;
      if (item.features && Object.keys(userPrefs).length > 0) {
        let dotProduct = 0;
        let userNorm = 0;
        let itemNorm = 0;
        for (const [key, value] of Object.entries(userPrefs)) {
          userNorm += value ** 2;
          if (key in item.features) {
            dotProduct += value * (item.features[key] ?? 0);
          }
        }
        for (const value of Object.values(item.features)) {
          itemNorm += value ** 2;
        }
        if (userNorm > 0 && itemNorm > 0) {
          featureScore = dotProduct / (Math.sqrt(userNorm) * Math.sqrt(itemNorm));
        }
      }

      // 3. 综合评分
      const totalScore = tagScore * 0.6 + featureScore * 0.4;
      const matchedTags = intersection;

      return {
        id: item.id,
        title: item.title,
        score: Number(totalScore.toFixed(4)),
        tagScore: Number(tagScore.toFixed(4)),
        featureScore: Number(featureScore.toFixed(4)),
        matchedTags,
        reason: matchedTags.length > 0
          ? `匹配标签：${matchedTags.join('、')}`
          : '基于特征相似度推荐',
      };
    });

    // 排序并取 Top-K
    const recommendations = scored
      .sort((a, b) => b.score - a.score)
      .slice(0, topK);

    return {
      recommendations,
      total: recommendations.length,
      avgScore: Number((recommendations.reduce((s, r) => s + r.score, 0) / Math.max(recommendations.length, 1)).toFixed(4)),
      strategy: 'content-based',
    };
  },
  (params) => {
    const errors: string[] = [];
    if (!params.userProfile || typeof params.userProfile !== 'object') {
      errors.push('Parameter "userProfile" is required and must be an object');
    }
    if (!Array.isArray(params.items) || params.items.length === 0) {
      errors.push('Parameter "items" is required and must be a non-empty array');
    }
    return { valid: errors.length === 0, errors: errors.length > 0 ? errors : undefined };
  },
);
