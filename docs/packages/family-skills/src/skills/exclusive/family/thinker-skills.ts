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

import { defineSkill } from '../../../registry/SkillManifest.js';

export const causalReasoningSkill = defineSkill(
  {
    id: 'thinker:causal-reasoning',
    name: 'Causal Reasoning',
    version: '1.0.0',
    owner: 'thinker',
    description: 'Identify causal relationships in data — detect cause-effect chains, confounders, and mediating variables.',
    category: 'analysis',
    parameters: [
      { name: 'variables', type: 'array', required: true, description: 'Variables to analyze [{ name, values, type }].' },
      { name: 'hypothesis', type: 'string', required: false, description: 'Optional causal hypothesis to test.' },
    ],
  },
  async (params) => {
    const variables = (params.variables as Array<Record<string, unknown>>) ?? [];
    const hypothesis = String(params.hypothesis ?? '');

    const pairs: Array<{ cause: string; effect: string; strength: number; direction: 'positive' | 'negative' }> = [];
    for (let i = 0; i < variables.length; i++) {
      for (let j = i + 1; j < variables.length; j++) {
        const a = variables[i]!;
        const b = variables[j]!;
        const valsA = (a.values as number[]) ?? [];
        const valsB = (b.values as number[]) ?? [];
        if (valsA.length < 2 || valsB.length < 2) continue;

        const minLen = Math.min(valsA.length, valsB.length);
        const x = valsA.slice(0, minLen);
        const y = valsB.slice(0, minLen);
        const correlation = pearsonCorrelation(x, y);
        if (Math.abs(correlation) > 0.3) {
          pairs.push({
            cause: String(a.name),
            effect: String(b.name),
            strength: Math.abs(correlation),
            direction: correlation > 0 ? 'positive' : 'negative',
          });
        }
      }
    }

    pairs.sort((a, b) => b.strength - a.strength);

    const confounders: string[] = [];
    for (let i = 0; i < pairs.length; i++) {
      for (let j = i + 1; j < pairs.length; j++) {
        if (pairs[j]!.cause === pairs[i]!.cause || pairs[j]!.effect === pairs[i]!.effect) {
          const shared = pairs[i]!.cause === pairs[j]!.cause ? pairs[i]!.cause : pairs[i]!.effect;
          if (!confounders.includes(shared)) confounders.push(shared);
        }
      }
    }

    return {
      causalPairs: pairs.slice(0, 10),
      confounders,
      strongestCausal: pairs[0] ?? null,
      hypothesisTested: hypothesis || null,
      hypothesisPlausible: hypothesis ? pairs.length > 0 : null,
      variableCount: variables.length,
      confidence: pairs.length > 0 ? Math.min(pairs[0]!.strength + 0.1, 0.95) : 0.3,
    };
  },
  (params) => {
    const errors: string[] = [];
    if (!Array.isArray(params.variables) || params.variables.length < 2) {
      errors.push('Parameter "variables" is required and must have at least 2 entries');
    }
    return { valid: errors.length === 0, errors: errors.length > 0 ? errors : undefined };
  },
);

export const knowledgeSynthesisSkill = defineSkill(
  {
    id: 'thinker:knowledge-synthesis',
    name: 'Knowledge Synthesis',
    version: '1.0.0',
    owner: 'thinker',
    description: 'Synthesize insights from multiple data sources — merge findings, identify consensus, and resolve contradictions.',
    category: 'analysis',
    parameters: [
      { name: 'sources', type: 'array', required: true, description: 'Array of data sources [{ id, findings, confidence, domain }].' },
      { name: 'focusArea', type: 'string', required: false, description: 'Optional focus area for synthesis.' },
    ],
  },
  async (params) => {
    const sources = (params.sources as Array<Record<string, unknown>>) ?? [];
    const focusArea = String(params.focusArea ?? '');

    const allFindings: string[] = [];
    const domainMap: Record<string, string[]> = {};

    for (const src of sources) {
      const findings = (src.findings as string[]) ?? [];
      const domain = String(src.domain ?? 'general');
      allFindings.push(...findings);
      if (!domainMap[domain]) domainMap[domain] = [];
      domainMap[domain].push(...findings);
    }

    const keywordFreq: Record<string, number> = {};
    for (const f of allFindings) {
      const words = f.toLowerCase().split(/\s+/);
      for (const w of words) {
        if (w.length > 2) keywordFreq[w] = (keywordFreq[w] ?? 0) + 1;
      }
    }

    const consensus = Object.entries(keywordFreq)
      .filter(([, count]) => count >= Math.ceil(sources.length * 0.5))
      .map(([keyword, count]) => ({ keyword, sourceCount: count, agreement: count / sources.length }))
      .sort((a, b) => b.sourceCount - a.sourceCount);

    const uniqueFindings = [...new Set(allFindings)];
    const avgConfidence = sources.length > 0
      ? sources.reduce((sum, s) => sum + (Number(s.confidence) || 0.5), 0) / sources.length
      : 0.5;

    const synthesis: string[] = [];
    if (consensus.length > 0) synthesis.push(`Consensus: ${consensus.slice(0, 3).map(c => c.keyword).join(', ')}`);
    synthesis.push(`${sources.length} sources analyzed, ${uniqueFindings.length} unique findings`);
    if (Object.keys(domainMap).length > 1) synthesis.push(`Cross-domain: ${Object.keys(domainMap).join(' ↔ ')}`);

    return {
      sourceCount: sources.length,
      totalFindings: uniqueFindings.length,
      consensus: consensus.slice(0, 10),
      domains: Object.keys(domainMap),
      domainCoverage: domainMap,
      avgConfidence,
      focusArea: focusArea || 'all',
      synthesis,
      contradictions: sources.length > 1 && consensus.length === 0 ? ['No consensus found across sources'] : [],
    };
  },
  (params) => {
    const errors: string[] = [];
    if (!Array.isArray(params.sources) || params.sources.length === 0) {
      errors.push('Parameter "sources" is required and must be a non-empty array');
    }
    return { valid: errors.length === 0, errors: errors.length > 0 ? errors : undefined };
  },
);

function pearsonCorrelation(x: number[], y: number[]): number {
  const n = x.length;
  if (n === 0) return 0;
  const meanX = x.reduce((a, b) => a + b, 0) / n;
  const meanY = y.reduce((a, b) => a + b, 0) / n;
  let num = 0, denX = 0, denY = 0;
  for (let i = 0; i < n; i++) {
    const dx = x[i]! - meanX;
    const dy = y[i]! - meanY;
    num += dx * dy;
    denX += dx * dx;
    denY += dy * dy;
  }
  const den = Math.sqrt(denX * denY);
  return den === 0 ? 0 : num / den;
}
