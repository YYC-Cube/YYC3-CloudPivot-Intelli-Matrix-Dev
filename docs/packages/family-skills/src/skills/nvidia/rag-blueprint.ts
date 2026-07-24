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
 * @file rag-blueprint.ts
 * @description NVIDIA RAG Blueprint — 检索增强生成编排技能
 *              部署、查询、评估 RAG 管道
 *              覆盖 rag-blueprint / rag-eval / rag-perf 目录技能
 */

import { defineSkill } from '../../registry/SkillManifest.js';

export interface RAGBlueprintConfig {
  endpoint?: string;
  collection?: string;
  topK?: number;
  rerank?: boolean;
  temperature?: number;
}

export interface RAGBlueprintResult {
  answer: string;
  sources: Array<{ docId: string; score: number; snippet: string }>;
  retrieved: number;
  reranked: boolean;
  latencyMs: number;
}

const DEFAULT_ENDPOINT = process.env.RAG_ENDPOINT ?? 'http://localhost:8080/retrieve';

/** RAG Blueprint 检索增强生成技能 */
export const ragBlueprintSkill = defineSkill(
  {
    id: 'rag-blueprint-query',
    name: 'RAG Blueprint Query',
    version: '1.0.0',
    owner: '元启·天枢',
    description: '通过 NVIDIA RAG Blueprint 执行检索增强生成查询',
    category: 'nvidia',
    tags: ['rag', 'retrieval', 'blueprint'],
    parameters: [
      { name: 'query', type: 'string', required: true, description: '用户查询文本' },
      { name: 'config', type: 'object', required: false, description: 'RAG 配置覆盖项' },
    ],
  },
  async (params: Record<string, unknown>): Promise<unknown> => {
    const query = String(params.query ?? '');
    const configOverride = (params.config ?? {}) as Partial<RAGBlueprintConfig>;
    const config: RAGBlueprintConfig = {
      endpoint: DEFAULT_ENDPOINT,
      collection: 'default',
      topK: 5,
      rerank: true,
      temperature: 0.1,
      ...configOverride,
    };
    const startTime = Date.now();

    try {
      const response = await fetch(config.endpoint!, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query,
          collection: config.collection,
          top_k: config.topK,
          rerank: config.rerank,
          temperature: config.temperature,
        }),
      });

      if (!response.ok) throw new Error(`RAG API error: ${response.status}`);

      const data = (await response.json()) as {
        answer?: string;
        sources?: Array<{ doc_id: string; score: number; snippet: string }>;
        total_retrieved?: number;
      };

      return {
        answer: data.answer ?? '',
        sources: (data.sources ?? []).map(s => ({
          docId: s.doc_id,
          score: s.score,
          snippet: s.snippet,
        })),
        retrieved: data.total_retrieved ?? 0,
        reranked: config.rerank ?? false,
        latencyMs: Date.now() - startTime,
      } satisfies RAGBlueprintResult;
    } catch (error) {
      throw new Error(`RAG query failed: ${error instanceof Error ? error.message : String(error)}`, { cause: error });
    }
  },
);
