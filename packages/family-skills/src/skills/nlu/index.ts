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

export { emotionDetectSkill } from './emotion-detect'
export { multiLangNluSkill } from './multi-lang-nlu'
export { knowledgeGraphSkill } from './knowledge-graph'
export { intentParseSkill } from './intent-parse'
export { sentimentAnalysisSkill } from './sentiment-analysis'

import { emotionDetectSkill } from './emotion-detect'
import { multiLangNluSkill } from './multi-lang-nlu'
import { knowledgeGraphSkill } from './knowledge-graph'
import { intentParseSkill } from './intent-parse'
import { sentimentAnalysisSkill } from './sentiment-analysis'
import type { FamilySkill } from '@yyc3/family-agents';

export const nluSkills: FamilySkill[] = [
  emotionDetectSkill,
  multiLangNluSkill,
  knowledgeGraphSkill,
  intentParseSkill,
  sentimentAnalysisSkill,
];
