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

export const documentationSkill = defineSkill(
  {
    id: 'grandmaster:documentation',
    name: 'Rites Documentation',
    version: '1.0.0',
    owner: 'grandmaster',
    description: 'Generates structured documentation in various formats.',
    category: 'quality',
    parameters: [
      {
        name: 'subject',
        type: 'string',
        required: true,
        description: 'Subject to document.',
      },
      {
        name: 'docType',
        type: 'string',
        required: false,
        description: 'Document type: api_doc, technical_spec, tutorial, changelog.',
        default: 'api_doc',
      },
    ],
  },
  async (params) => {
    const subject = String(params.subject ?? '');
    const docType = String(params.docType ?? 'api_doc');

    const templates: Record<string, string> = {
      api_doc: `# ${subject} API Documentation\n\n## Overview\n${subject} provides the following endpoints:\n\n## Endpoints\n\n### GET /api/${subject.toLowerCase().replace(/\s+/g, '-')}\nDescription: Retrieve ${subject} information.\n\n**Parameters:**\n- \`id\` (string, required): Resource identifier\n\n**Response:**\n\`\`\`json\n{ "success": true, "data": {} }\n\`\`\``,
      technical_spec: `# Technical Specification: ${subject}\n\n## 1. System Overview\n${subject} is designed to...\n\n## 2. Architecture\n- Component diagram\n- Data flow\n- Integration points\n\n## 3. Requirements\n- Functional requirements\n- Non-functional requirements`,
      tutorial: `# Tutorial: ${subject}\n\n## Prerequisites\n- Basic knowledge of ${subject}\n\n## Step 1: Setup\nBegin by configuring ${subject}...\n\n## Step 2: Implementation\nImplement the core functionality...\n\n## Step 3: Testing\nVerify the implementation...`,
      changelog: `# Changelog: ${subject}\n\n## [Unreleased]\n\n## [1.0.0] - ${new Date().toISOString().split('T')[0]}\n### Added\n- Initial release of ${subject}\n### Features\n- Core functionality\n- Basic API`,
    };

    const content = templates[docType] ?? templates["api_doc"]!;

    return {
      content,
      docType,
      subject,
      wordCount: content.split(/\s+/).length,
      generatedAt: Date.now(),
    };
  },
  (params) => {
    const errors: string[] = [];
    if (!params.subject || typeof params.subject !== 'string') {
      errors.push('Parameter "subject" is required and must be a string');
    }
    return { valid: errors.length === 0, errors: errors.length > 0 ? errors : undefined };
  },
);
