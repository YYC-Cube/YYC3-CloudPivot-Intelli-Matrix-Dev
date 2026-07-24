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
 * @file nim-chat.ts
 * @description NVIDIA NIM — LLM 推理微服务技能
 *              通过 NIM 端点调用 GPU 加速的 LLM 推理
 */

import { defineSkill } from '../../registry/SkillManifest.js';

export interface NIMChatConfig {
  endpoint: string;
  model: string;
  temperature?: number;
  maxTokens?: number;
  topP?: number;
  apiKey?: string;
}

export interface NIMChatResult {
  text: string;
  usage: { promptTokens: number; completionTokens: number; totalTokens: number };
  performance: { firstTokenLatencyMs: number; throughputTokensPerSec: number };
}

const defaultNIMConfig: NIMChatConfig = {
  endpoint: process.env.NVIDIA_NIM_ENDPOINT ?? 'http://localhost:8000/v1/chat/completions',
  model: process.env.NVIDIA_NIM_MODEL ?? 'meta/llama3-70b',
  temperature: 0.7,
  maxTokens: 2048,
  topP: 0.9,
};

/** NIM LLM 对话技能 */
export const nimChatSkill = defineSkill(
  {
    id: 'nim-llm-chat',
    name: 'NIM LLM Chat',
    version: '1.0.0',
    owner: '元启·天枢',
    description: '通过 NVIDIA NIM 微服务调用 GPU 优化的 LLM 推理',
    category: 'nvidia',
    tags: ['nim'],
    parameters: [
      { name: 'messages', type: 'object', required: true, description: '对话消息列表' },
      { name: 'config', type: 'object', required: false, description: 'NIM 配置覆盖项' },
    ],
  },
  async (params: Record<string, unknown>): Promise<unknown> => {
    const messages = (params.messages as Array<{ role: string; content: string }>) ?? [];
    const configOverride = (params.config ?? {}) as Partial<NIMChatConfig>;
    const config = { ...defaultNIMConfig, ...configOverride };
    const startTime = Date.now();

    try {
      const response = await fetch(config.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(config.apiKey ? { Authorization: `Bearer ${config.apiKey}` } : {}),
        },
        body: JSON.stringify({
          model: config.model,
          messages,
          temperature: config.temperature,
          max_tokens: config.maxTokens,
          top_p: config.topP,
          stream: false,
        }),
      });

      if (!response.ok) {
        throw new Error(`NIM API error: ${response.status}`);
      }

      const data = (await response.json()) as {
        choices: Array<{ message: { content: string } }>;
        usage: { prompt_tokens: number; completion_tokens: number; total_tokens: number };
      };

      return {
        text: data.choices[0]?.message?.content ?? '',
        usage: {
          promptTokens: data.usage?.prompt_tokens ?? 0,
          completionTokens: data.usage?.completion_tokens ?? 0,
          totalTokens: data.usage?.total_tokens ?? 0,
        },
        performance: {
          firstTokenLatencyMs: Date.now() - startTime,
          throughputTokensPerSec: ((data.usage?.completion_tokens ?? 0) / Math.max(1, Date.now() - startTime)) * 1000,
        },
      } satisfies NIMChatResult;
    } catch (error) {
      throw new Error(`NIM call failed: ${error instanceof Error ? error.message : String(error)}`, { cause: error });
    }
  },
);
