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

import { defineSkill } from '../../../registry/SkillManifest.js';

export const intentEnrichmentSkill = defineSkill(
  {
    id: 'qianhang:intent-enrichment',
    name: 'Intent Enrichment',
    version: '1.0.0',
    owner: 'qianhang',
    description: 'Enrich classified intent with context awareness, entity linkage, sentiment overlay, and confidence boosting.',
    category: 'nlu',
    parameters: [
      { name: 'intent', type: 'object', required: true, description: 'Raw intent result from QianHang classification.' },
      { name: 'context', type: 'object', required: false, description: 'Dialogue context (history, sessionId, userPrefs).' },
    ],
  },
  async (params) => {
    const intent = (params.intent as Record<string, unknown>) ?? {};
    const context = (params.context as Record<string, unknown>) ?? {};
    const raw = String(intent.raw ?? '');
    const primary = String(intent.primary ?? 'general');
    const secondary = intent.secondary as string | undefined;
    const baseConfidence = Number(intent.confidence) || 0.5;

    const enrichedEntities: Record<string, string[]> = {};
    const entityPatterns: Array<[string, RegExp]> = [
      ['time', /(今天|昨天|本周|上周|本月|上月|最近|tomorrow|yesterday|today|this week|this month)/gi],
      ['metric', /(收入|利润|用户数|DAU|MAU|revenue|profit|users)/gi],
      ['action', /(分析|预测|推荐|创建|修改|删除|analyze|predict|recommend|create|update|delete)/gi],
      ['system', /(服务器|数据库|API|前端|后端|server|database|frontend|backend)/gi],
    ];
    for (const [name, regex] of entityPatterns) {
      const matches = raw.match(regex);
      if (matches) enrichedEntities[name] = [...new Set(matches)];
    }

    const sentimentKeywords = {
      positive: ['好', '棒', '优秀', 'great', 'good', 'awesome', 'excellent'],
      negative: ['差', '烂', '问题', 'bad', 'poor', 'issue', 'broken'],
      urgent: ['紧急', '立刻', '马上', 'urgent', 'asap', 'critical'],
    };
    const sentiment: Record<string, number> = {};
    const lowerRaw = raw.toLowerCase();
    for (const [tone, keywords] of Object.entries(sentimentKeywords)) {
      sentiment[tone] = keywords.filter(kw => lowerRaw.includes(kw)).length;
    }
    const dominantSentiment = Object.entries(sentiment).sort((a, b) => b[1] - a[1])[0];

    const historySize = Array.isArray(context.history) ? context.history.length : 0;
    const contextBoost = Math.min(historySize * 0.02, 0.1);
    const enrichedConfidence = Math.min(baseConfidence + contextBoost, 0.99);

    return {
      primary,
      secondary,
      confidence: enrichedConfidence,
      entities: enrichedEntities,
      sentiment: dominantSentiment ? dominantSentiment[0] : 'neutral',
      sentimentScores: sentiment,
      contextAware: historySize > 0,
      enrichedAt: Date.now(),
    };
  },
  (params) => {
    const errors: string[] = [];
    if (!params.intent || typeof params.intent !== 'object') {
      errors.push('Parameter "intent" is required and must be an object');
    }
    return { valid: errors.length === 0, errors: errors.length > 0 ? errors : undefined };
  },
);

export const dialogueContextSkill = defineSkill(
  {
    id: 'qianhang:dialogue-context',
    name: 'Dialogue Context Manager',
    version: '1.0.0',
    owner: 'qianhang',
    description: 'Manage multi-turn dialogue context: track topic continuity, detect topic shifts, and maintain conversational state.',
    category: 'nlu',
    parameters: [
      { name: 'messages', type: 'array', required: true, description: 'Array of messages [{ role, text, timestamp }].' },
      { name: 'maxTurns', type: 'number', required: false, description: 'Max context window size.', default: 10 },
    ],
  },
  async (params) => {
    const messages = (params.messages as Array<Record<string, unknown>>) ?? [];
    const maxTurns = Number(params.maxTurns) || 10;
    const windowed = messages.slice(-maxTurns);

    const topics: string[] = [];
    const topicKeywords: Record<string, string[]> = {
      data: ['数据', '报表', '统计', 'data', 'report', 'stats'],
      code: ['代码', '开发', 'bug', 'code', 'develop', 'fix'],
      security: ['安全', '审计', '威胁', 'security', 'audit', 'threat'],
      design: ['设计', 'UI', '界面', 'design', 'layout', 'style'],
      planning: ['计划', '排期', '里程碑', 'plan', 'schedule', 'milestone'],
    };

    for (const msg of windowed) {
      const text = String(msg.text ?? '').toLowerCase();
      for (const [topic, keywords] of Object.entries(topicKeywords)) {
        if (keywords.some(kw => text.includes(kw))) {
          topics.push(topic);
        }
      }
    }

    const topicFreq: Record<string, number> = {};
    for (const t of topics) topicFreq[t] = (topicFreq[t] ?? 0) + 1;
    const dominantTopic = Object.entries(topicFreq).sort((a, b) => b[1] - a[1])[0]?.[0];

    let topicShift = false;
    if (windowed.length >= 2) {
      const lastText = String(windowed[windowed.length - 1]!.text ?? '').toLowerCase();
      const prevText = String(windowed[windowed.length - 2]!.text ?? '').toLowerCase();
      const lastTopics = Object.entries(topicKeywords).filter(([, kws]) => kws.some(kw => lastText.includes(kw))).map(([t]) => t);
      const prevTopics = Object.entries(topicKeywords).filter(([, kws]) => kws.some(kw => prevText.includes(kw))).map(([t]) => t);
      topicShift = lastTopics.length > 0 && prevTopics.length > 0 && !lastTopics.some(t => prevTopics.includes(t));
    }

    return {
      turnCount: windowed.length,
      dominantTopic: dominantTopic ?? 'general',
      topicDistribution: topicFreq,
      topicShift,
      contextWindow: maxTurns,
      coherence: topics.length > 0 ? (dominantTopic ? topicFreq[dominantTopic]! / topics.length : 0) : 0,
      summary: `${windowed.length} turns, dominant: ${dominantTopic ?? 'general'}${topicShift ? ' (shift detected)' : ''}`,
    };
  },
  (params) => {
    const errors: string[] = [];
    if (!Array.isArray(params.messages)) {
      errors.push('Parameter "messages" is required and must be an array');
    }
    return { valid: errors.length === 0, errors: errors.length > 0 ? errors : undefined };
  },
);
