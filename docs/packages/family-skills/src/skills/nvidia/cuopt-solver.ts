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
 * @file cuopt-solver.ts
 * @description NVIDIA cuOpt — 数学优化求解技能
 *              支持 LP / MILP / QP / VRP 四类问题
 *              覆盖 12 条 cuopt-* 目录技能
 */

import { defineSkill } from '../../registry/SkillManifest.js';

export interface CuOptConfig {
  serverUrl?: string;
  problemType: 'LP' | 'MILP' | 'QP' | 'VRP';
  timeLimitSec?: number;
}

export interface CuOptResult {
  status: 'OPTIMAL' | 'FEASIBLE' | 'INFEASIBLE' | 'TIMEOUT';
  objectiveValue?: number;
  variables: Record<string, number>;
  solveTimeMs: number;
  gap?: number;
}

const DEFAULT_URL = process.env.CUOPT_SERVER_URL ?? 'http://localhost:5000';

/** cuOpt 数学优化求解技能 */
export const cuoptSolverSkill = defineSkill(
  {
    id: 'cuopt-solver',
    name: 'cuOpt Solver',
    version: '1.0.0',
    owner: '元启·天枢',
    description: '通过 NVIDIA cuOpt 求解 LP/MILP/QP/VRP 数学优化问题',
    category: 'nvidia',
    tags: ['cuopt', 'optimization', 'vrp', 'lp', 'milp'],
    parameters: [
      { name: 'problemData', type: 'object', required: true, description: '优化问题数据（约束、变量、目标）' },
      { name: 'config', type: 'object', required: false, description: '求解器配置' },
    ],
  },
  async (params: Record<string, unknown>): Promise<unknown> => {
    const problemData = params.problemData as Record<string, unknown>;
    const configOverride = (params.config ?? {}) as Partial<CuOptConfig>;
    const config: CuOptConfig = {
      serverUrl: DEFAULT_URL,
      problemType: (problemData.type as CuOptConfig['problemType']) ?? 'LP',
      timeLimitSec: 30,
      ...configOverride,
    };
    const startTime = Date.now();

    try {
      const endpoint = config.problemType === 'VRP'
        ? `${config.serverUrl}/v2/nls/cuopt/routes`
        : `${config.serverUrl}/v2/nls/cuopt/optimize`;

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          problem: problemData,
          solver_config: {
            time_limit: config.timeLimitSec,
            ...(config.problemType === 'MILP' ? { mip_gap: 0.01 } : {}),
          },
        }),
      });

      if (!response.ok) throw new Error(`cuOpt API error: ${response.status}`);

      const data = (await response.json()) as {
        status: string;
        objective_value?: number;
        solution?: Record<string, number>;
        gap?: number;
      };

      return {
        status: (data.status?.toUpperCase() ?? 'UNKNOWN') as CuOptResult['status'],
        objectiveValue: data.objective_value,
        variables: data.solution ?? {},
        solveTimeMs: Date.now() - startTime,
        gap: data.gap,
      } satisfies CuOptResult;
    } catch (error) {
      throw new Error(`cuOpt solve failed: ${error instanceof Error ? error.message : String(error)}`, { cause: error });
    }
  },
);
