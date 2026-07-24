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

export const collaborativeFilterSkill = defineSkill(
  {
    id: 'bole:collaborative-filter',
    name: 'Collaborative Filtering',
    version: '1.0.0',
    owner: 'bole',
    description: 'Collaborative filtering — finds similar users and generates recommendations based on user-item interaction matrix.',
    category: 'recommendation',
    parameters: [
      {
        name: 'targetUser',
        type: 'string',
        required: true,
        description: 'The user ID to generate recommendations for.',
      },
      {
        name: 'userItemMatrix',
        type: 'object',
        required: true,
        description: 'User-item interaction matrix: { userId: { itemId: rating } }.',
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
    const targetUser = String(params.targetUser ?? '');
    const matrix = (params.userItemMatrix as Record<string, Record<string, number>>) ?? {};
    const topK = Number(params.topK ?? 5);

    const targetRatings = matrix[targetUser];
    if (!targetRatings) {
      return { recommendations: [], similarUsers: [], message: `User ${targetUser} not found in matrix.` };
    }

    const similarUsers = findSimilarUsers(targetUser, matrix);
    const recommendations = generateRecommendations(targetUser, similarUsers, matrix, topK);

    return {
      recommendations,
      similarUsers: similarUsers.slice(0, 5).map(su => ({ userId: su.userId, similarity: su.similarity })),
      targetUser,
      confidence: similarUsers.length > 0 ? 0.7 : 0.1,
    };
  },
  (params) => {
    const errors: string[] = [];
    if (!params.targetUser || typeof params.targetUser !== 'string') {
      errors.push('Parameter "targetUser" is required and must be a string');
    }
    if (!params.userItemMatrix || typeof params.userItemMatrix !== 'object') {
      errors.push('Parameter "userItemMatrix" is required and must be an object');
    }
    return { valid: errors.length === 0, errors: errors.length > 0 ? errors : undefined };
  },
);

interface SimilarUser { userId: string; similarity: number }

function findSimilarUsers(target: string, matrix: Record<string, Record<string, number>>): SimilarUser[] {
  const targetRatings = matrix[target]!;
  if (!targetRatings) return [];
  const results: SimilarUser[] = [];

  for (const [userId, ratings] of Object.entries(matrix)) {
    if (userId === target) continue;

    const commonItems = Object.keys(targetRatings).filter(k => k in ratings);
    if (commonItems.length === 0) continue;

    const similarity = cosineSimilarity(
      commonItems.map(k => targetRatings[k]!),
      commonItems.map(k => ratings[k]!),
    );

    if (similarity > 0) {
      results.push({ userId, similarity });
    }
  }

  results.sort((a, b) => b.similarity - a.similarity);
  return results;
}

function cosineSimilarity(a: number[], b: number[]): number {
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i]! * b[i]!;
    normA += a[i]! ** 2;
    normB += b[i]! ** 2;
  }
  const denom = Math.sqrt(normA) * Math.sqrt(normB);
  return denom === 0 ? 0 : dotProduct / denom;
}

function generateRecommendations(
  target: string,
  similarUsers: SimilarUser[],
  matrix: Record<string, Record<string, number>>,
  topK: number,
): Array<{ itemId: string; predictedRating: number; reason: string }> {
  const targetItems = new Set(Object.keys(matrix[target]!));
  const scores: Record<string, { total: number; weight: number }> = {};

  for (const { userId, similarity } of similarUsers) {
    const ratings = matrix[userId]!;
    for (const [itemId, rating] of Object.entries(ratings)) {
      if (targetItems.has(itemId)) continue;
      if (!scores[itemId]) scores[itemId] = { total: 0, weight: 0 };
      scores[itemId].total += similarity * rating;
      scores[itemId].weight += similarity;
    }
  }

  return Object.entries(scores)
    .map(([itemId, { total, weight }]) => ({
      itemId,
      predictedRating: weight > 0 ? total / weight : 0,
      reason: `Predicted from ${similarUsers.length} similar users`,
    }))
    .sort((a, b) => b.predictedRating - a.predictedRating)
    .slice(0, topK);
}
