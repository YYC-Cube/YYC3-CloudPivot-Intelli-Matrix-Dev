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
 * @file riva-tts.ts
 * @description NVIDIA RIVA — 语音合成技能 (Text-to-Speech)
 *              GPU 加速的自然语音生成
 */

import { defineSkill } from '../../registry/SkillManifest.js';

export interface RIVATTSConfig {
  endpoint: string;
  languageCode: string;
  voiceName: string;
  speakingRate: number;
  apiKey?: string;
}

export interface RIVATTSResult {
  audioBase64: string;
  audioFormat: string;
  durationMs: number;
}

const defaultRIVAConfig: RIVATTSConfig = {
  endpoint: process.env.NVIDIA_RIVA_ENDPOINT ?? 'http://localhost:50051',
  languageCode: 'zh-CN',
  voiceName: 'zh-CN-Wavenet-A',
  speakingRate: 1.0,
};

/** RIVA 语音合成技能 */
export const rivaTTSSkill = defineSkill(
  {
    id: 'riva-tts',
    name: 'RIVA TTS',
    version: '1.0.0',
    owner: '言启·千行',
    description: '基于 NVIDIA RIVA 的 GPU 加速语音合成',
    category: 'nvidia',
    tags: ['tts'],
    parameters: [
      { name: 'text', type: 'string', required: true, description: '待合成文本' },
      { name: 'config', type: 'object', required: false, description: 'RIVA 配置覆盖项' },
    ],
  },
  async (params: Record<string, unknown>): Promise<unknown> => {
    const text = String(params.text ?? '');
    const configOverride = (params.config ?? {}) as Partial<RIVATTSConfig>;
    const config = { ...defaultRIVAConfig, ...configOverride };
    const startTime = Date.now();

    try {
      const response = await fetch(`${config.endpoint}/v1/tts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(config.apiKey ? { Authorization: `Bearer ${config.apiKey}` } : {}),
        },
        body: JSON.stringify({
          text,
          language_code: config.languageCode,
          voice_name: config.voiceName,
          speaking_rate: config.speakingRate,
        }),
      });

      if (!response.ok) {
        throw new Error(`RIVA TTS error: ${response.status}`);
      }

      const data = (await response.json()) as RIVATTSResult;
      return {
        audioBase64: data.audioBase64,
        audioFormat: data.audioFormat ?? 'wav',
        durationMs: data.durationMs ?? (Date.now() - startTime),
      };
    } catch (error) {
      throw new Error(`RIVA TTS failed: ${error instanceof Error ? error.message : String(error)}`, { cause: error });
    }
  },
);
