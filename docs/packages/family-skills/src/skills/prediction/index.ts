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

export { lstmPredictionSkill } from './lstm-prediction.js';
export { anomalyDetectionSkill } from './anomaly-detection.js';
export { trendForecastSkill } from './trend-forecast.js';
export { probabilityEstimationSkill } from './probability-estimation.js';
export { proactiveAdvisorySkill } from './proactive-advisory.js';

import { lstmPredictionSkill } from './lstm-prediction.js';
import { anomalyDetectionSkill } from './anomaly-detection.js';
import { trendForecastSkill } from './trend-forecast.js';
import { probabilityEstimationSkill } from './probability-estimation.js';
import { proactiveAdvisorySkill } from './proactive-advisory.js';
import type { FamilySkill } from '@yyc3/family-agents';

export const predictionSkills: FamilySkill[] = [
  lstmPredictionSkill,
  anomalyDetectionSkill,
  trendForecastSkill,
  probabilityEstimationSkill,
  proactiveAdvisorySkill,
];
