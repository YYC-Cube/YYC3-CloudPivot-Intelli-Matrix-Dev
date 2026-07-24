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

export const intentParseSkill = defineSkill(
  {
    id: 'qianhang:intent-parse',
    name: 'Intent Parsing',
    version: '1.0.0',
    owner: 'qianhang',
    description: 'Deep intent parsing — extracts structured intent, entities, and slot values from user utterances.',
    category: 'nlu',
    parameters: [
      {
        name: 'text',
        type: 'string',
        required: true,
        description: 'The user utterance to parse.',
      },
      {
        name: 'context',
        type: 'object',
        required: false,
        description: 'Optional conversation context for disambiguation.',
      },
    ],
  },
  async (params) => {
    const text = String(params.text ?? '');
    const lower = text.toLowerCase();

    const intentMap: Array<{ intent: string; patterns: RegExp[]; slots: string[] }> = [
      {
        intent: 'create_task',
        patterns: [/创建(.+)任务/, /新建(.+)/, /create\s+(?:a\s+)?task/i, /add\s+(?:a\s+)?new/i],
        slots: ['task_name', 'task_type'],
      },
      {
        intent: 'query_data',
        patterns: [/查询(.+)/, /显示(.+)数据/, /show\s+(?:me\s+)?/i, /get\s+/i, /query\s+/i],
        slots: ['data_type', 'filter'],
      },
      {
        intent: 'deploy',
        patterns: [/部署(.+)/, /发布(.+)/, /deploy/i, /release/i, /publish/i],
        slots: ['target', 'environment'],
      },
      {
        intent: 'analyze',
        patterns: [/分析(.+)/, /评估(.+)/, /analyz/i, /evaluat/i, /assess/i],
        slots: ['subject', 'depth'],
      },
      {
        intent: 'help',
        patterns: [/帮助/, /怎么用/, /help/i, /how\s+to/i, /guide/i],
        slots: ['topic'],
      },
    ];

    let bestIntent = 'general';
    let bestConfidence = 0.2;
    const matchedSlots: Record<string, string> = {};

    for (const entry of intentMap) {
      for (const pattern of entry.patterns) {
        const match = text.match(pattern);
        if (match) {
          const confidence = match[1] ? 0.85 : 0.7;
          if (confidence > bestConfidence) {
            bestIntent = entry.intent;
            bestConfidence = confidence;
            for (const slot of entry.slots) {
              if (match[1]) {
                matchedSlots[slot] = match[1].trim();
              }
            }
          }
        }
      }
    }

    const entities = extractEntities(lower);

    return {
      intent: bestIntent,
      confidence: bestConfidence,
      slots: matchedSlots,
      entities,
      rawText: text,
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

function extractEntities(text: string): Array<{ type: string; value: string; start: number; end: number }> {
  const entities: Array<{ type: string; value: string; start: number; end: number }> = [];

  const timePatterns = [
    { re: /今天/g, type: 'date' },
    { re: /明天/g, type: 'date' },
    { re: /昨天/g, type: 'date' },
    { re: /\d{4}-\d{2}-\d{2}/g, type: 'date' },
    { re: /(?:next|this|last)\s+(?:week|month|year)/gi, type: 'date' },
    { re: /\d+(?:分钟|小时|天|周|月|年)/g, type: 'duration' },
    { re: /\d+\s*(?:min|hour|day|week|month|year)s?/gi, type: 'duration' },
  ];

  for (const { re, type } of timePatterns) {
    let match: RegExpExecArray | null;
    while ((match = re.exec(text)) !== null) {
      entities.push({
        type,
        value: match[0],
        start: match.index,
        end: match.index + match[0].length,
      });
    }
  }

  return entities;
}
