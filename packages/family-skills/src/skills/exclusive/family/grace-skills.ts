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

export const contentPolishSkill = defineSkill(
  {
    id: 'grace:content-polish',
    name: 'Content Polish',
    version: '1.0.0',
    owner: 'grace',
    description: 'Refine and polish content for quality — improve readability, tone consistency, and structural flow.',
    category: 'creative',
    parameters: [
      { name: 'content', type: 'string', required: true, description: 'Content text to polish.' },
      { name: 'tone', type: 'string', required: false, description: 'Target tone: professional, warm, concise, engaging.', default: 'professional' },
      { name: 'language', type: 'string', required: false, description: 'Content language: zh, en.', default: 'zh' },
    ],
  },
  async (params) => {
    const content = String(params.content ?? '');
    const tone = String(params.tone ?? 'professional');
    const language = String(params.language ?? 'zh');

    const issues: Array<{ type: string; description: string; suggestion: string }> = [];

    const sentences = content.split(/[。！？.!?]+/).filter(s => s.trim().length > 0);
    if (sentences.some(s => s.length > 100)) {
      issues.push({ type: 'readability', description: 'Some sentences exceed 100 characters', suggestion: 'Break into shorter sentences for better readability' });
    }

    const paragraphs = content.split(/\n\n+/).filter(p => p.trim().length > 0);
    if (paragraphs.length === 1 && content.length > 200) {
      issues.push({ type: 'structure', description: 'Single long paragraph detected', suggestion: 'Divide into multiple paragraphs with clear topic sentences' });
    }

    if (content.includes('  ')) {
      issues.push({ type: 'formatting', description: 'Multiple consecutive spaces found', suggestion: 'Normalize spacing to single spaces' });
    }

    const TONE_MODIFIERS: Record<string, { additions: string[]; removals: string[] }> = {
      professional: { additions: ['建议', '推荐', '优化'], removals: ['超级', '无敌', '巨'] },
      warm: { additions: ['希望', '一起', '共同'], removals: ['必须', '强制', '禁止'] },
      concise: { additions: [], removals: ['其实', '总的来说', '综上所述'] },
      engaging: { additions: ['想象一下', '你知道吗', '试试看'], removals: [] },
    };

    const modifier = TONE_MODIFIERS[tone] ?? TONE_MODIFIERS['professional']!;
    let polished = content;
    for (const word of modifier.removals) {
      polished = polished.replace(new RegExp(word, 'g'), '');
    }
    polished = polished.replace(/\s+/g, ' ').trim();

    const readabilityScore = sentences.length > 0
      ? Math.max(0, 1 - (sentences.reduce((sum, s) => sum + s.length, 0) / sentences.length - 30) * 0.01)
      : 0.5;

    return {
      polished,
      issues,
      readabilityScore: Math.round(readabilityScore * 100) / 100,
      tone,
      language,
      originalLength: content.length,
      polishedLength: polished.length,
      improvement: issues.length === 0 ? 'Content is well-polished' : `${issues.length} improvement(s) applied`,
    };
  },
  (params) => {
    const errors: string[] = [];
    if (!params.content || typeof params.content !== 'string') errors.push('Parameter "content" is required');
    if (typeof params.content === 'string' && params.content.trim().length === 0) errors.push('Content must not be empty');
    return { valid: errors.length === 0, errors: errors.length > 0 ? errors : undefined };
  },
);

export const multimodalComposeSkill = defineSkill(
  {
    id: 'grace:multimodal-compose',
    name: 'Multimodal Compose',
    version: '1.0.0',
    owner: 'grace',
    description: 'Compose multi-format creative content — generate structured outputs for text, image prompts, and layout specifications.',
    category: 'creative',
    parameters: [
      { name: 'brief', type: 'string', required: true, description: 'Creative brief or concept description.' },
      { name: 'formats', type: 'array', required: false, description: 'Output formats: text, image_prompt, layout_spec.', default: ['text', 'image_prompt'] },
      { name: 'style', type: 'string', required: false, description: 'Visual style: minimal, vibrant, elegant, bold.', default: 'elegant' },
    ],
  },
  async (params) => {
    const brief = String(params.brief ?? '');
    const formats = (params.formats as string[]) ?? ['text', 'image_prompt'];
    const style = String(params.style ?? 'elegant');

    const outputs: Record<string, unknown> = {};

    if (formats.includes('text')) {
      const STYLE_TEMPLATES: Record<string, { voice: string; structure: string }> = {
        minimal: { voice: '简洁直接', structure: '一句话核心 + 三个要点' },
        vibrant: { voice: '热情洋溢', structure: '钩子开头 + 故事展开 + 号召性结尾' },
        elegant: { voice: '优雅从容', structure: '意境铺垫 + 核心阐述 + 余韵收束' },
        bold: { voice: '大胆有力', structure: '震撼主张 + 三个论据 + 强力结论' },
      };
      const template = STYLE_TEMPLATES[style] ?? STYLE_TEMPLATES['elegant']!;
      outputs.text = {
        headline: `${brief.substring(0, 30)}—${style}风格文案`,
        body: `【${template.voice}】\n\n基于「${brief}」的概念，${template.structure}。`,
        style,
        wordCount: brief.length * 3,
      };
    }

    if (formats.includes('image_prompt')) {
      outputs.image_prompt = {
        prompt: `${style} style: ${brief}. High quality, professional, modern design, harmonious color palette`,
        negativePrompt: 'low quality, blurry, cluttered, unprofessional',
        dimensions: '1024x1024',
        styleKeywords: [style, 'professional', 'modern', 'harmonious'],
      };
    }

    if (formats.includes('layout_spec')) {
      outputs.layout_spec = {
        sections: [
          { type: 'header', position: 'top', proportion: 0.15 },
          { type: 'hero', position: 'center', proportion: 0.45 },
          { type: 'content', position: 'middle', proportion: 0.3 },
          { type: 'footer', position: 'bottom', proportion: 0.1 },
        ],
        colorPalette: style === 'minimal' ? ['#FFFFFF', '#333333', '#666666'] : style === 'vibrant' ? ['#FF6B6B', '#4ECDC4', '#FFE66D'] : style === 'bold' ? ['#1A1A2E', '#E94560', '#F5F5F5'] : ['#2C3E50', '#E67E22', '#ECF0F1'],
        typography: { heading: 'Playfair Display', body: 'Inter', mono: 'JetBrains Mono' },
      };
    }

    return {
      brief: brief.substring(0, 100),
      formats: Object.keys(outputs),
      outputs,
      style,
      createdAt: Date.now(),
    };
  },
  (params) => {
    const errors: string[] = [];
    if (!params.brief || typeof params.brief !== 'string') errors.push('Parameter "brief" is required');
    return { valid: errors.length === 0, errors: errors.length > 0 ? errors : undefined };
  },
);
