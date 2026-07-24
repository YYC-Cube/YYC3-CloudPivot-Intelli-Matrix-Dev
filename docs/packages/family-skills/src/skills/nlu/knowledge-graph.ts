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

export const knowledgeGraphSkill = defineSkill(
  {
    id: 'qianhang:knowledge-graph',
    name: 'Knowledge Graph',
    version: '1.0.0',
    owner: 'qianhang',
    description: 'Knowledge graph construction — entity extraction, relationship mapping, and graph query from text.',
    category: 'nlu',
    parameters: [
      {
        name: 'text',
        type: 'string',
        required: true,
        description: 'The input text to extract entities and relationships from.',
      },
      {
        name: 'operation',
        type: 'string',
        required: false,
        description: 'Operation type: extract (default), query.',
        default: 'extract',
      },
    ],
  },
  async (params) => {
    const text = String(params.text ?? '');
    const operation = String(params.operation ?? 'extract');

    if (operation === 'query') {
      return queryKnowledgeGraph(text);
    }

    return extractKnowledgeGraph(text);
  },
  (params) => {
    const errors: string[] = [];
    if (!params.text || typeof params.text !== 'string') {
      errors.push('Parameter "text" is required and must be a string');
    }
    return { valid: errors.length === 0, errors: errors.length > 0 ? errors : undefined };
  },
);

interface KGEntity {
  id: string;
  text: string;
  type: 'person' | 'org' | 'location' | 'tech' | 'concept' | 'unknown';
  confidence: number;
}

interface KGRelation {
  source: string;
  target: string;
  type: string;
  confidence: number;
}

interface KGResult {
  entities: KGEntity[];
  relations: KGRelation[];
  summary: string;
}

const ENTITY_PATTERNS: Array<{ pattern: RegExp; type: KGEntity['type'] }> = [
  { pattern: /[A-Z][a-z]+(?:\s[A-Z][a-z]+)+/g, type: 'person' },
  { pattern: /[\u4e00-\u9fff]{2,4}(?=说|表示|认为|指出|强调|表示)/g, type: 'person' },
  { pattern: /(?:公司|集团|机构|组织|部门|协会|研究院|实验室|大学|Inc\.|Corp\.|Ltd\.)/g, type: 'org' },
  { pattern: /[\u4e00-\u9fff]{1,3}(?:市|省|区|县|镇|路|街|道)/g, type: 'location' },
  { pattern: /(?:Python|TypeScript|JavaScript|React|Vue|Node\.js|Docker|Kubernetes|AI|ML|API|REST|GraphQL|SQL|NoSQL|Redis|MongoDB)/g, type: 'tech' },
];

function extractEntities(text: string): KGEntity[] {
  const entities: KGEntity[] = [];
  const seen = new Set<string>();

  for (const { pattern, type } of ENTITY_PATTERNS) {
    const globalPattern = new RegExp(pattern.source, pattern.flags);
    let match: RegExpExecArray | null;
    while ((match = globalPattern.exec(text)) !== null) {
      const entityText = match[0];
      if (!seen.has(entityText)) {
        seen.add(entityText);
        entities.push({
          id: `e${entities.length}`,
          text: entityText,
          type,
          confidence: 0.7 + Math.random() * 0.3,
        });
      }
    }
  }

  return entities;
}

function extractRelations(text: string, entities: KGEntity[]): KGRelation[] {
  const relations: KGRelation[] = [];
  const relationPatterns = [
    /(.+?)(?:是|为|属于|包含|使用|依赖|基于)(.+?)/g,
    /(.+?)(?:is|are|has|uses|depends on|based on|contains)(.+?)/gi,
  ];

  for (const pattern of relationPatterns) {
    let match: RegExpExecArray | null;
    while ((match = pattern.exec(text)) !== null) {
      const sourceText = match[1]!.trim();
      const targetText = match[2]!.trim();

      const sourceEntity = entities.find(e => sourceText.includes(e.text));
      const targetEntity = entities.find(e => targetText.includes(e.text));

      if (sourceEntity && targetEntity && sourceEntity.id !== targetEntity.id) {
        relations.push({
          source: sourceEntity.id,
          target: targetEntity.id,
          type: 'related_to',
          confidence: 0.6 + Math.random() * 0.3,
        });
      }
    }
  }

  return relations;
}

function extractKnowledgeGraph(text: string): KGResult {
  const entities = extractEntities(text);
  const relations = extractRelations(text, entities);

  return {
    entities,
    relations,
    summary: `Extracted ${entities.length} entities and ${relations.length} relations.`,
  };
}

function queryKnowledgeGraph(query: string): { query: string; results: KGEntity[]; message: string } {
  return {
    query,
    results: [],
    message: `Knowledge graph query for "${query}" — no persistent store connected yet.`,
  };
}
