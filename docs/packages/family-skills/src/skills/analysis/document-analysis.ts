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

import { defineSkill } from '../../registry/SkillManifest.js';

export const documentAnalysisSkill = defineSkill(
  {
    id: 'thinker:document-analysis',
    name: 'Document Smart Analysis',
    version: '1.0.0',
    owner: 'thinker',
    description: '自动提取、比较、总结各类文档内容，支持结构化信息抽取与关键指标识别。',
    category: 'analysis',
    tags: ['document', 'extraction', 'summarization', 'comparison'],
    parameters: [
      {
        name: 'documents',
        type: 'array',
        required: true,
        description: '待分析的文档内容数组，每个元素为 { id, title, content }。',
      },
      {
        name: 'operation',
        type: 'string',
        required: false,
        description: '操作类型：extract | compare | summarize | classify',
        default: 'summarize',
      },
      {
        name: 'keywords',
        type: 'array',
        required: false,
        description: '关注关键词列表，用于定向信息抽取。',
      },
    ],
  },
  async (params) => {
    const docs = (params.documents as Array<{ id: string; title: string; content: string }>) ?? [];
    const operation = String(params.operation ?? 'summarize');
    const keywords = (params.keywords as string[]) ?? [];

    if (docs.length === 0) {
      return { result: null, operation, message: 'No documents to analyze.' };
    }

    switch (operation) {
      case 'extract': {
        const extracted = docs.map((doc) => {
          const sentences = doc.content.split(/[。.！!？?\n]/).filter((s) => s.trim().length > 5);
          const keySentences = keywords.length > 0
            ? sentences.filter((s) => keywords.some((kw) => s.toLowerCase().includes(kw.toLowerCase())))
            : sentences.slice(0, 3);
          return { docId: doc.id, title: doc.title, extracted: keySentences };
        });
        return { operation: 'extract', results: extracted, totalExtracted: extracted.reduce((c, r) => c + r.extracted.length, 0) };
      }

      case 'compare': {
        if (docs.length < 2) {
          return { operation: 'compare', message: 'At least 2 documents required for comparison.' };
        }
        const docSets = docs.map((d) => new Set(d.content.toLowerCase().split(/\s+/)));
        const commonTerms = docSets.reduce((acc, set) => {
          return new Set([...acc].filter((t) => set.has(t)));
        });
        const uniqueTerms = docs.map((d, i) => {
          const others = docSets.filter((_, j) => j !== i);
          const allOthers = new Set(others.flatMap((s) => [...s]));
          return {
            docId: d.id,
            title: d.title,
            unique: [...new Set(d.content.toLowerCase().split(/\s+/))].filter((t) => !allOthers.has(t) && t.length > 3),
          };
        });
        return {
          operation: 'compare',
          commonTerms: [...commonTerms].filter((t) => t.length > 3).slice(0, 20),
          uniqueTerms,
        };
      }

      case 'classify': {
        const categories: Record<string, string[]> = {
          '财务报告': ['营收', '利润', '成本', '预算', 'revenue', 'profit', 'cost'],
          '技术文档': ['架构', '代码', '系统', 'API', '部署', 'architecture', 'code'],
          '运营分析': ['用户', '流量', '转化', '留存', 'conversion', 'retention'],
          '风险评估': ['风险', '威胁', '漏洞', '合规', 'risk', 'threat'],
        };
        const results = docs.map((doc) => {
          const scores: Record<string, number> = {};
          for (const [cat, kws] of Object.entries(categories)) {
            scores[cat] = kws.reduce((count, kw) => count + (doc.content.toLowerCase().includes(kw.toLowerCase()) ? 1 : 0), 0);
          }
          const bestCategory = Object.entries(scores).sort((a, b) => b[1] - a[1])[0];
          return { docId: doc.id, title: doc.title, category: bestCategory?.[0] ?? '未分类', confidence: bestCategory?.[1] ?? 0 };
        });
        return { operation: 'classify', results };
      }

      default: { // summarize
        const summaries = docs.map((doc) => {
          const sentences = doc.content.split(/[。.！!？?\n]/).filter((s) => s.trim().length > 5);
          const wordFreq: Record<string, number> = {};
          for (const s of sentences) {
            for (const w of s.toLowerCase().split(/\s+/)) {
              if (w.length > 2) wordFreq[w] = (wordFreq[w] ?? 0) + 1;
            }
          }
          const topWords = Object.entries(wordFreq).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([w]) => w);
          const scored = sentences.map((s) => ({
            sentence: s.trim(),
            score: topWords.reduce((sc, w) => sc + (s.toLowerCase().includes(w) ? 1 : 0), 0),
          }));
          const topSentences = scored.sort((a, b) => b.score - a.score).slice(0, 3).map((s) => s.sentence);
          return {
            docId: doc.id,
            title: doc.title,
            summary: topSentences.join('。'),
            keyTopics: topWords,
            originalLength: doc.content.length,
            summaryRatio: topSentences.join('。').length / Math.max(doc.content.length, 1),
          };
        });
        return { operation: 'summarize', results: summaries };
      }
    }
  },
  (params) => {
    const errors: string[] = [];
    if (!Array.isArray(params.documents) || params.documents.length === 0) {
      errors.push('Parameter "documents" is required and must be a non-empty array');
    }
    return { valid: errors.length === 0, errors: errors.length > 0 ? errors : undefined };
  },
);
