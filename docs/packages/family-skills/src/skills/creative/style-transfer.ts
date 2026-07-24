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

export const styleTransferSkill = defineSkill(
  {
    id: 'grace:style-transfer',
    name: 'Style Transfer',
    version: '1.0.0',
    owner: 'grace',
    description: 'Creative style transfer — transforms content between different styles (formal/casual/technical/poetic).',
    category: 'creative',
    parameters: [
      {
        name: 'content',
        type: 'string',
        required: true,
        description: 'The content to transform.',
      },
      {
        name: 'targetStyle',
        type: 'string',
        required: true,
        description: 'Target style: formal, casual, technical, poetic, concise, elaborate.',
      },
    ],
  },
  async (params) => {
    const content = String(params.content ?? '');
    const targetStyle = String(params.targetStyle ?? 'formal').toLowerCase();

    const styleTransforms: Record<string, (text: string) => { transformed: string; changes: string[] }> = {
      formal: (text) => ({
        transformed: text.replace(/咱们/g, '我们').replace(/咋/g, '如何').replace(/搞定/g, '完成'),
        changes: ['Replaced colloquial terms with formal equivalents'],
      }),
      casual: (text) => ({
        transformed: text.replace(/因此/g, '所以').replace(/然而/g, '但是').replace(/此外/g, '还有'),
        changes: ['Replaced formal connectors with casual alternatives'],
      }),
      technical: (text) => ({
        transformed: text,
        changes: ['Technical style applied — maintain precise terminology'],
      }),
      poetic: (text) => ({
        transformed: text.replace(/。/g, '，\n').replace(/！/g, '！\n'),
        changes: ['Added line breaks for poetic rhythm'],
      }),
      concise: (text) => {
        const sentences = text.split(/[。！？.!?]+/).filter(s => s.trim());
        return {
          transformed: sentences.slice(0, Math.ceil(sentences.length * 0.6)).join('。'),
          changes: [`Reduced from ${sentences.length} to ${Math.ceil(sentences.length * 0.6)} sentences`],
        };
      },
      elaborate: (text) => ({
        transformed: text.replace(/。/g, '。具体来说，这一点非常重要。'),
        changes: ['Added elaborative phrases'],
      }),
    };

    const transform = styleTransforms[targetStyle] ?? styleTransforms['formal']!;
    const result = transform(content);

    return {
      originalContent: content,
      transformedContent: result.transformed,
      targetStyle,
      changesApplied: result.changes,
      originalLength: content.length,
      transformedLength: result.transformed.length,
    };
  },
  (params) => {
    const errors: string[] = [];
    if (!params.content || typeof params.content !== 'string') {
      errors.push('Parameter "content" is required and must be a string');
    }
    if (!params.targetStyle || typeof params.targetStyle !== 'string') {
      errors.push('Parameter "targetStyle" is required and must be a string');
    }
    return { valid: errors.length === 0, errors: errors.length > 0 ? errors : undefined };
  },
);
