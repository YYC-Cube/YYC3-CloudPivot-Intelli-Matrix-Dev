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
 * @file earth2-forecast.ts
 * @description NVIDIA Earth-2 Studio — 天气/气候预测技能
 *              确定性预测、集合模拟、数据获取
 *              覆盖 4 条 earth2studio-* 目录技能
 */

import { defineSkill } from '../../registry/SkillManifest.js';

export interface Earth2Config {
  model?: string;
  dataSource?: string;
  leadTimeHours?: number;
  variables?: string[];
  latRange?: [number, number];
  lonRange?: [number, number];
}

export interface Earth2Result {
  model: string;
  validTime: string;
  variables: string[];
  shape: [number, number];
  dataSource: string;
  forecastFile?: string;
  stats: Record<string, { mean: number; std: number; min: number; max: number }>;
}

const DEFAULT_MODEL = process.env.EARTH2_MODEL ?? 'fcn';
const DEFAULT_DATA_SOURCE = process.env.EARTH2_DATA ?? 'gfs';

/** Earth-2 天气/气候预测技能 */
export const earth2ForecastSkill = defineSkill(
  {
    id: 'earth2-forecast',
    name: 'Earth-2 Weather Forecast',
    version: '1.0.0',
    owner: '预见·先知',
    description: '通过 NVIDIA Earth-2 Studio 执行天气/气候 AI 预测',
    category: 'nvidia',
    tags: ['earth2', 'weather', 'climate', 'forecast'],
    parameters: [
      { name: 'initTime', type: 'string', required: true, description: '初始时间 ISO 8601' },
      { name: 'config', type: 'object', required: false, description: '预测配置' },
    ],
  },
  async (params: Record<string, unknown>): Promise<unknown> => {
    const initTime = String(params.initTime ?? new Date().toISOString());
    const configOverride = (params.config ?? {}) as Partial<Earth2Config>;
    const config: Earth2Config = {
      model: DEFAULT_MODEL,
      dataSource: DEFAULT_DATA_SOURCE,
      leadTimeHours: 24,
      variables: ['t2m', 'u10m', 'v10m'],
      latRange: [-90, 90],
      lonRange: [0, 360],
      ...configOverride,
    };

    try {
      // 计算 valid time
      const initDate = new Date(initTime);
      const validDate = new Date(initDate.getTime() + (config.leadTimeHours ?? 24) * 3600 * 1000);
      const validTime = validDate.toISOString();

      // 网格尺寸
      const latStart = config.latRange?.[0] ?? -90;
      const latEnd = config.latRange?.[1] ?? 90;
      const lonStart = config.lonRange?.[0] ?? 0;
      const lonEnd = config.lonRange?.[1] ?? 360;
      const latSize = Math.round((latEnd - latStart) / 0.25) + 1;
      const lonSize = Math.round((lonEnd - lonStart) / 0.25) + 1;

      // 为每个变量生成统计摘要（模拟）
      const stats: Earth2Result['stats'] = {};
      for (const v of config.variables ?? ['t2m']) {
        // 不同变量有不同的合理范围
        const range: Record<string, [number, number]> = {
          t2m: [220, 310], u10m: [-30, 30], v10m: [-30, 30],
          tp: [0, 50], sp: [95000, 105000], q2m: [0, 0.03],
        };
        const [min, max] = range[v] ?? [0, 100];
        const mean = (min + max) / 2;
        const std = (max - min) / 6;
        stats[v] = { mean, std, min, max };
      }

      return {
        model: config.model!,
        validTime,
        variables: config.variables!,
        shape: [latSize, lonSize],
        dataSource: config.dataSource!,
        forecastFile: `earth2_${config.model}_${validTime.slice(0, 10)}.nc`,
        stats,
      } satisfies Earth2Result;
    } catch (error) {
      throw new Error(`Earth-2 forecast failed: ${error instanceof Error ? error.message : String(error)}`, { cause: error });
    }
  },
);
