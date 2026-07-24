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

import type { FamilySkill, SkillCategory, SkillParameter } from '@yyc3/family-agents';

export interface SkillManifestConfig {
  id: string;
  name: string;
  version: string;
  owner: string;
  description: string;
  category: SkillCategory;
  tags?: string[];
  parameters: SkillParameter[];
  mcp?: {
    server: string;
    tool: string;
  };
}

export function defineSkill(
  config: SkillManifestConfig,
  execute: (params: Record<string, unknown>) => Promise<unknown>,
  validate?: (params: Record<string, unknown>) => { valid: boolean; errors?: string[] },
): FamilySkill {
  return {
    id: config.id,
    name: config.name,
    version: config.version,
    owner: config.owner,
    description: config.description,
    category: config.category,
    tags: config.tags,
    parameters: config.parameters,
    mcp: config.mcp,
    execute: async (ctx) => {
      const startTime = Date.now();
      try {
        const data = await execute(ctx.params);
        return { success: true, data, executionTime: Date.now() - startTime };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : String(error),
          executionTime: Date.now() - startTime,
        };
      }
    },
    validate,
  };
}
