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

export { lstmPredictionSkill } from './lstm-prediction'
export { anomalyDetectionSkill } from './anomaly-detection'
export { trendForecastSkill } from './trend-forecast'
export { probabilityEstimationSkill } from './probability-estimation'

import { lstmPredictionSkill } from './lstm-prediction'
import { anomalyDetectionSkill } from './anomaly-detection'
import { trendForecastSkill } from './trend-forecast'
import { probabilityEstimationSkill } from './probability-estimation'
import type { FamilySkill } from '@yyc3/family-agents';

export const predictionSkills: FamilySkill[] = [
  lstmPredictionSkill,
  anomalyDetectionSkill,
  trendForecastSkill,
  probabilityEstimationSkill,
];
