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

import { defineSkill } from '../../../registry/SkillManifest'

export const userProfilingSkill = defineSkill(
  {
    id: 'bole:user-profiling',
    name: 'User Profiling',
    version: '1.0.0',
    owner: 'bole',
    description: 'Build multi-dimensional user profiles from behavior data — track interests, skill level, activity patterns, and preferences.',
    category: 'recommendation',
    parameters: [
      { name: 'userId', type: 'string', required: true, description: 'User identifier.' },
      { name: 'behaviors', type: 'array', required: true, description: 'Behavior events [{ action, target, timestamp, metadata }].' },
      { name: 'existingProfile', type: 'object', required: false, description: 'Existing profile to merge with.' },
    ],
  },
  async (params) => {
    const userId = String(params.userId);
    const behaviors = (params.behaviors as Array<Record<string, unknown>>) ?? [];
    const existing = (params.existingProfile as Record<string, unknown>) ?? {};

    const actionFreq: Record<string, number> = {};
    const targetCategories: Record<string, number> = {};
    const hourlyActivity: number[] = new Array(24).fill(0);
    const interests: Record<string, number> = {};

    const categoryMap: Record<string, string[]> = {
      code: ['代码', '编程', '开发', 'debug', 'code', 'develop'],
      data: ['数据', '报表', '分析', 'data', 'report', 'analytics'],
      design: ['设计', 'UI', '样式', 'design', 'style', 'layout'],
      security: ['安全', '审计', '防护', 'security', 'audit'],
      learning: ['学习', '教程', '文档', 'learn', 'tutorial', 'docs'],
    };

    for (const b of behaviors) {
      const action = String(b.action ?? '');
      actionFreq[action] = (actionFreq[action] ?? 0) + 1;

      const target = String(b.target ?? '').toLowerCase();
      for (const [cat, keywords] of Object.entries(categoryMap)) {
        if (keywords.some(kw => target.includes(kw))) {
          targetCategories[cat] = (targetCategories[cat] ?? 0) + 1;
          interests[cat] = (interests[cat] ?? 0) + 1;
        }
      }

      const ts = Number(b.timestamp) || Date.now();
      const hour = new Date(ts).getHours();
      hourlyActivity[hour]!++;
    }

    const topActions = Object.entries(actionFreq).sort((a, b) => b[1] - a[1]).slice(0, 5);
    const topInterests = Object.entries(interests).sort((a, b) => b[1] - a[1]).slice(0, 5);
    const peakHour = hourlyActivity.indexOf(Math.max(...hourlyActivity));
    const totalActions = Object.values(actionFreq).reduce((a, b) => a + b, 0);

    const skillLevel = totalActions > 100 ? 'expert' : totalActions > 30 ? 'intermediate' : totalActions > 5 ? 'beginner' : 'newcomer';

    const existingInterests = (existing.interests as Record<string, number>) ?? {};
    const mergedInterests = { ...existingInterests };
    for (const [k, v] of Object.entries(interests)) {
      mergedInterests[k] = (mergedInterests[k] ?? 0) + v;
    }

    return {
      userId,
      interests: mergedInterests,
      topInterests,
      skillLevel,
      activityPattern: { peakHour, hourlyActivity, totalActions },
      topActions: topActions.map(([action, count]) => ({ action, count })),
      profileVersion: Number(existing.version ?? 0) + 1,
      updatedAt: Date.now(),
    };
  },
  (params) => {
    const errors: string[] = [];
    if (!params.userId || typeof params.userId !== 'string') errors.push('Parameter "userId" is required');
    if (!Array.isArray(params.behaviors)) errors.push('Parameter "behaviors" is required and must be an array');
    return { valid: errors.length === 0, errors: errors.length > 0 ? errors : undefined };
  },
);

export const skillMatchingSkill = defineSkill(
  {
    id: 'bole:skill-matching',
    name: 'Skill Matching',
    version: '1.0.0',
    owner: 'bole',
    description: 'Match user needs to the best-fit skills or agents — score compatibility and rank candidates.',
    category: 'recommendation',
    parameters: [
      { name: 'needs', type: 'array', required: true, description: 'User need descriptors [{ keywords, priority, domain }].' },
      { name: 'candidates', type: 'array', required: true, description: 'Skill/agent candidates [{ id, capabilities, domain }].' },
    ],
  },
  async (params) => {
    const needs = (params.needs as Array<Record<string, unknown>>) ?? [];
    const candidates = (params.candidates as Array<Record<string, unknown>>) ?? [];

    const matches: Array<{ candidateId: string; score: number; matchedNeeds: string[]; reasoning: string }> = [];

    for (const candidate of candidates) {
      const capabilities = ((candidate.capabilities as string[]) ?? []).map(c => c.toLowerCase());
      const candidateDomain = String(candidate.domain ?? '').toLowerCase();
      let totalScore = 0;
      const matchedNeeds: string[] = [];

      for (const need of needs) {
        const keywords = ((need.keywords as string[]) ?? []).map(k => k.toLowerCase());
        const needDomain = String(need.domain ?? '').toLowerCase();
        let needScore = 0;

        for (const kw of keywords) {
          for (const cap of capabilities) {
            if (cap.includes(kw) || kw.includes(cap)) needScore += 2;
          }
        }

        if (needDomain && candidateDomain && needDomain === candidateDomain) needScore += 3;

        if (needScore > 0) {
          totalScore += needScore;
          matchedNeeds.push(keywords.slice(0, 3).join('+'));
        }
      }

      if (totalScore > 0) {
        matches.push({
          candidateId: String(candidate.id ?? ''),
          score: totalScore,
          matchedNeeds: [...new Set(matchedNeeds)],
          reasoning: `Matched ${matchedNeeds.length} needs via ${capabilities.slice(0, 3).join(', ')}`,
        });
      }
    }

    matches.sort((a, b) => b.score - a.score);

    return {
      topMatch: matches[0] ?? null,
      allMatches: matches,
      unmatchedNeeds: needs.length - new Set(matches.flatMap(m => m.matchedNeeds)).size,
      totalCandidates: candidates.length,
      matchRate: candidates.length > 0 ? matches.length / candidates.length : 0,
    };
  },
  (params) => {
    const errors: string[] = [];
    if (!Array.isArray(params.needs) || params.needs.length === 0) errors.push('Parameter "needs" is required and non-empty');
    if (!Array.isArray(params.candidates) || params.candidates.length === 0) errors.push('Parameter "candidates" is required and non-empty');
    return { valid: errors.length === 0, errors: errors.length > 0 ? errors : undefined };
  },
);
