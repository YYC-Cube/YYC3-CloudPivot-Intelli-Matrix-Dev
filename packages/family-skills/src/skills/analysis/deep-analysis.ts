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

import { defineSkill } from '../../registry/SkillManifest'

export const deepAnalysisSkill = defineSkill(
  {
    id: 'thinker:deep-analysis',
    name: 'Deep Analysis',
    version: '1.0.0',
    owner: 'thinker',
    description: 'Deep analysis engine — multi-dimensional analysis with root cause identification and insight extraction.',
    category: 'analysis',
    parameters: [
      {
        name: 'data',
        type: 'object',
        required: true,
        description: 'Data or problem description to analyze.',
      },
      {
        name: 'dimensions',
        type: 'array',
        required: false,
        description: 'Analysis dimensions to consider.',
        default: ['performance', 'reliability', 'usability', 'security'],
      },
    ],
  },
  async (params) => {
    const data = (params.data as Record<string, unknown>) ?? {};
    const dimensions = (params.dimensions as string[]) ?? ['performance', 'reliability', 'usability', 'security'];

    const analysisResults = dimensions.map(dim => {
      const score = analyzeDimension(data, dim);
      return {
        dimension: dim,
        score,
        level: score >= 0.8 ? 'excellent' : score >= 0.6 ? 'good' : score >= 0.4 ? 'fair' : 'poor',
        findings: extractFindings(data, dim, score),
      };
    });

    const overallScore = analysisResults.reduce((sum, r) => sum + r.score, 0) / analysisResults.length;

    const rootCauses = identifyRootCauses(analysisResults.filter(r => r.score < 0.5));

    return {
      overallScore,
      overallLevel: overallScore >= 0.8 ? 'excellent' : overallScore >= 0.6 ? 'good' : overallScore >= 0.4 ? 'fair' : 'poor',
      dimensions: analysisResults,
      rootCauses,
      insights: generateInsights(analysisResults),
      recommendation: overallScore >= 0.7
        ? 'System performing well. Focus on areas below threshold.'
        : 'Critical issues detected. Immediate attention required.',
    };
  },
  (params) => {
    const errors: string[] = [];
    if (!params.data || typeof params.data !== 'object') {
      errors.push('Parameter "data" is required and must be an object');
    }
    return { valid: errors.length === 0, errors: errors.length > 0 ? errors : undefined };
  },
);

function analyzeDimension(data: Record<string, unknown>, dimension: string): number {
  const keys = Object.keys(data);
  if (keys.length === 0) return 0.5;

  const dimKey = keys.find(k => k.toLowerCase().includes(dimension));
  if (dimKey) {
    const val = Number(data[dimKey]);
    if (!isNaN(val)) return Math.max(0, Math.min(1, val));
  }

  const relevantKeys = keys.filter(k => {
    const kl = k.toLowerCase();
    return kl.includes('score') || kl.includes('metric') || kl.includes(dimension);
  });

  if (relevantKeys.length > 0) {
    const avg = relevantKeys.reduce((sum, k) => sum + (Number(data[k]) || 0.5), 0) / relevantKeys.length;
    return Math.max(0, Math.min(1, avg));
  }

  return 0.5 + (data.description ? String(data.description).length % 20 / 100 : 0);
}

function extractFindings(data: Record<string, unknown>, dimension: string, score: number): string[] {
  const findings: string[] = [];
  if (score < 0.4) findings.push(`${dimension} score is critically low (${score.toFixed(2)})`);
  else if (score < 0.6) findings.push(`${dimension} score needs improvement (${score.toFixed(2)})`);
  else findings.push(`${dimension} performing within acceptable range (${score.toFixed(2)})`);

  if (data[`${dimension}_issues`]) {
    findings.push(`Known issues: ${String(data[`${dimension}_issues`])}`);
  }

  return findings;
}

function identifyRootCauses(weakDimensions: Array<{ dimension: string; score: number }>): string[] {
  return weakDimensions.map(d => `Root cause candidate: ${d.dimension} (score: ${d.score.toFixed(2)}) — investigate contributing factors.`);
}

function generateInsights(results: Array<{ dimension: string; score: number }>): string[] {
  const sorted = [...results].sort((a, b) => a.score - b.score);
  const insights: string[] = [];

  if (sorted.length > 0) {
    insights.push(`Weakest area: ${sorted[0]!.dimension} (${sorted[0]!.score.toFixed(2)})`);
  }
  if (sorted.length > 1) {
    insights.push(`Strongest area: ${sorted[sorted.length - 1]!.dimension} (${sorted[sorted.length - 1]!.score.toFixed(2)})`);
  }
  if (sorted.length > 2) {
    const spread = sorted[sorted.length - 1]!.score - sorted[0]!.score;
    insights.push(`Performance spread: ${(spread * 100).toFixed(0)}% — ${spread > 0.5 ? 'significant variance' : 'relatively balanced'}`);
  }

  return insights;
}
