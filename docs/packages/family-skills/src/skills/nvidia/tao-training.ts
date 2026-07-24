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
 * @file tao-training.ts
 * @description NVIDIA TAO Toolkit — 视觉模型训练/微调技能
 *              支持分类/检测/分割三大任务族
 *              覆盖 48 条 tao-* 目录技能
 */

import { defineSkill } from '../../registry/SkillManifest.js';

export interface TAOTrainingConfig {
  apiEndpoint?: string;
  ngcApiKey?: string;
  network: string;
  action: 'train' | 'evaluate' | 'prune' | 'export' | 'inference';
  experimentSpec?: Record<string, unknown>;
  gpuCount?: number;
}

export interface TAOTrainingResult {
  jobId: string;
  status: 'submitted' | 'running' | 'done' | 'error';
  action: string;
  modelPath?: string;
  metrics?: Record<string, number>;
}

const DEFAULT_ENDPOINT = process.env.TAO_API_ENDPOINT ?? 'http://localhost:9000/api/v1';

/** TAO 视觉模型训练技能 */
export const taoTrainingSkill = defineSkill(
  {
    id: 'tao-training',
    name: 'TAO Visual Training',
    version: '1.0.0',
    owner: '创想·灵韵',
    description: '通过 NVIDIA TAO Toolkit 执行视觉模型训练、评估、剪枝和导出',
    category: 'nvidia',
    tags: ['tao', 'vision', 'training', 'classification', 'detection'],
    parameters: [
      { name: 'network', type: 'string', required: true, description: '模型网络名（如 detectnet_v2 / yolo_v4 / mask_rcnn）' },
      { name: 'action', type: 'string', required: true, description: '操作类型: train/evaluate/prune/export/inference' },
      { name: 'spec', type: 'object', required: false, description: '实验规格 (experiment spec)' },
      { name: 'config', type: 'object', required: false, description: 'TAO API 配置覆盖项' },
    ],
  },
  async (params: Record<string, unknown>): Promise<unknown> => {
    const configOverride = (params.config ?? {}) as Partial<TAOTrainingConfig>;
    const config: TAOTrainingConfig = {
      apiEndpoint: DEFAULT_ENDPOINT,
      ngcApiKey: process.env.NGC_API_KEY,
      network: String(params.network ?? 'detectnet_v2'),
      action: (params.action as TAOTrainingConfig['action']) ?? 'train',
      experimentSpec: (params.spec as Record<string, unknown>) ?? {},
      gpuCount: 1,
      ...configOverride,
    };

    try {
      const response = await fetch(`${config.apiEndpoint}/${config.network}/${config.action}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(config.ngcApiKey ? { Authorization: `Bearer ${config.ngcApiKey}` } : {}),
        },
        body: JSON.stringify({
          spec: config.experimentSpec,
          gpu_count: config.gpuCount,
        }),
      });

      if (!response.ok) throw new Error(`TAO API error: ${response.status}`);

      const data = (await response.json()) as {
        job_id?: string;
        status?: string;
        model_path?: string;
        metrics?: Record<string, number>;
      };

      return {
        jobId: data.job_id ?? 'unknown',
        status: (data.status ?? 'submitted') as TAOTrainingResult['status'],
        action: config.action,
        modelPath: data.model_path,
        metrics: data.metrics,
      } satisfies TAOTrainingResult;
    } catch (error) {
      throw new Error(`TAO training failed: ${error instanceof Error ? error.message : String(error)}`, { cause: error });
    }
  },
);
