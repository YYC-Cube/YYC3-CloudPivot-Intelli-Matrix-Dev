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

/**
 * @file nemo-guardrails.ts
 * @description NVIDIA NeMo — 护栏技能
 *              内容安全过滤、话题管控、合规检查
 */

import { defineSkill } from '../../registry/SkillManifest.js';

export interface NeMoGuardrailConfig {
  endpoint: string;
  topics?: string[];
  sensitivity?: number;
  actions: Array<'block' | 'warn' | 'log'>;
  apiKey?: string;
}

export interface NeMoGuardrailResult {
  passed: boolean;
  violations: Array<{ topic: string; severity: number; action: 'block' | 'warn' | 'log' }>;
}

const defaultNeMoConfig: NeMoGuardrailConfig = {
  endpoint: process.env.NVIDIA_NEMO_ENDPOINT ?? 'http://localhost:8001/v1/guardrails',
  sensitivity: 0.7,
  actions: ['block', 'warn'],
};

/** NeMo 护栏技能 — 内容安全过滤 */
export const nemoGuardrailsSkill = defineSkill(
  {
    id: 'nemo-guardrails',
    name: 'NeMo Guardrails',
    version: '1.0.0',
    owner: '智云·守护',
    description: '基于 NVIDIA NeMo Guardrails 的内容安全过滤与合规检查',
    category: 'nvidia',
    tags: ['guardrails'],
    parameters: [
      { name: 'text', type: 'string', required: true, description: '待检查文本' },
      { name: 'context', type: 'object', required: false, description: '上下文信息' },
      { name: 'config', type: 'object', required: false, description: '护栏配置覆盖项' },
    ],
  },
  async (params: Record<string, unknown>): Promise<unknown> => {
    const text = String(params.text ?? '');
    const contextOverride = (params.context ?? {}) as Record<string, unknown>;
    const configOverride = (params.config ?? {}) as Partial<NeMoGuardrailConfig>;
    const config = { ...defaultNeMoConfig, ...configOverride };

    try {
      const response = await fetch(config.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(config.apiKey ? { Authorization: `Bearer ${config.apiKey}` } : {}),
        },
        body: JSON.stringify({
          text,
          topics: config.topics,
          sensitivity: config.sensitivity,
          context: contextOverride,
        }),
      });

      if (!response.ok) {
        throw new Error(`Guardrails API error: ${response.status}`);
      }

      const data = (await response.json()) as NeMoGuardrailResult;
      return data;
    } catch (error) {
      throw new Error(`Guardrails call failed: ${error instanceof Error ? error.message : String(error)}`, { cause: error });
    }
  },
);
