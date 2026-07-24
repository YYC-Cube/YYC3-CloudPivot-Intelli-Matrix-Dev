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

export const designSuggestionSkill = defineSkill(
  {
    id: 'grace:design-suggestion',
    name: 'Design Suggestion',
    version: '1.0.0',
    owner: 'grace',
    description: 'UI/UX design suggestions — provides layout, color, typography, and accessibility recommendations.',
    category: 'creative',
    parameters: [
      {
        name: 'context',
        type: 'string',
        required: true,
        description: 'Description of the UI/UX element or page to design.',
      },
      {
        name: 'platform',
        type: 'string',
        required: false,
        description: 'Target platform: web, mobile, desktop.',
        default: 'web',
      },
    ],
  },
  async (params) => {
    const context = String(params.context ?? '').toLowerCase();
    const platform = String(params.platform ?? 'web');

    const suggestions: Array<{ category: string; suggestion: string; priority: string }> = [];

    suggestions.push({
      category: 'layout',
      suggestion: platform === 'mobile'
        ? 'Use single-column layout with bottom navigation for mobile.'
        : 'Use responsive grid with max-width container (1200px).',
      priority: 'high',
    });

    if (context.includes('form') || context.includes('input') || context.includes('登录') || context.includes('注册')) {
      suggestions.push(
        { category: 'ux', suggestion: 'Group related form fields. Use inline validation.', priority: 'high' },
        { category: 'accessibility', suggestion: 'Label all inputs. Support keyboard navigation.', priority: 'high' },
      );
    }

    if (context.includes('dashboard') || context.includes('数据') || context.includes('chart')) {
      suggestions.push(
        { category: 'data-viz', suggestion: 'Use consistent color scales. Provide drill-down capability.', priority: 'high' },
        { category: 'layout', suggestion: 'Card-based layout with KPI summary at top.', priority: 'medium' },
      );
    }

    if (context.includes('list') || context.includes('table') || context.includes('列表')) {
      suggestions.push(
        { category: 'ux', suggestion: 'Add sorting, filtering, pagination. Support bulk actions.', priority: 'high' },
        { category: 'performance', suggestion: 'Use virtual scrolling for large datasets.', priority: 'medium' },
      );
    }

    suggestions.push(
      { category: 'color', suggestion: 'Use 60-30-10 rule: 60% primary, 30% secondary, 10% accent.', priority: 'medium' },
      { category: 'typography', suggestion: 'Limit to 2 typefaces. Use consistent scale (1.25 ratio).', priority: 'medium' },
      { category: 'accessibility', suggestion: 'Ensure WCAG 2.1 AA compliance. Min contrast ratio 4.5:1.', priority: 'high' },
    );

    return {
      platform,
      suggestions,
      suggestionCount: suggestions.length,
      highPriorityCount: suggestions.filter(s => s.priority === 'high').length,
    };
  },
  (params) => {
    const errors: string[] = [];
    if (!params.context || typeof params.context !== 'string') {
      errors.push('Parameter "context" is required and must be a string');
    }
    return { valid: errors.length === 0, errors: errors.length > 0 ? errors : undefined };
  },
);
