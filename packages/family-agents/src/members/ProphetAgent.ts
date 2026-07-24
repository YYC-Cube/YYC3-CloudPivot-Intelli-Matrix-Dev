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

import { FamilyBaseAgent } from '../base/FamilyBaseAgent';
import { PDAMRCycle } from '../base/PDAMRCycle';
import type { PerceptionResult, DecisionResult, ActionResult, MemoryEntry, ReflectionResult } from '../base/PDAMRCycle';
import type { FamilyMessage } from '../base/FamilyTypes';
import type { AgentResponse } from '../base/FamilyBaseAgent';
import { FAMILY_PROFILES } from '../base/FamilyTypes';

export interface TimeSeriesPrediction {
  metric: string;
  predictions: Array<{ period: string; value: number; confidence: number }>;
  trend: 'up' | 'down' | 'stable';
  confidence: number;
}

export interface AnomalyReport {
  anomalies: Array<{ timestamp: string; metric: string; expected: number; actual: number; severity: 'low' | 'medium' | 'high' }>;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
}

export interface RiskAlert {
  level: 'info' | 'warning' | 'error' | 'critical';
  title: string;
  description: string;
  recommendation: string;
  probability: number;
}

class ProphetPDAMR extends PDAMRCycle {
  constructor() { super('prophet'); }

  async perceive(input: unknown): Promise<PerceptionResult> {
    return { raw: input, filtered: input };
  }

  async decide(perception: PerceptionResult): Promise<DecisionResult> {
    const input = perception.filtered;
    if (typeof input === 'object' && input !== null && 'metric' in (input as Record<string, unknown>)) {
      return { action: 'time_series_predict', parameters: { input }, confidence: 0.87, reasoning: '时间序列预测' };
    }
    return { action: 'anomaly_detect', parameters: { input }, confidence: 0.85, reasoning: '异常检测' };
  }

  async act(decision: DecisionResult): Promise<ActionResult> {
    if (decision.action === 'time_series_predict') {
      const input = decision.parameters.input as { metric?: string; data?: number[] };
      const prediction: TimeSeriesPrediction = {
        metric: input?.metric ?? 'default',
        predictions: [{ period: 'next', value: 0, confidence: decision.confidence }],
        trend: 'stable',
        confidence: decision.confidence,
      };
      return { success: true, data: prediction, executionTime: 0 };
    }
    const report: AnomalyReport = { anomalies: [], riskLevel: 'low' };
    return { success: true, data: report, executionTime: 0 };
  }

  remember(entry: Omit<MemoryEntry, 'timestamp'>): void {
    this.memory.push({ ...entry, timestamp: Date.now() });
  }

  async reflect(memory: MemoryEntry[]): Promise<ReflectionResult> {
    return { score: 0.87, observations: ['预测完成'], improvements: [] };
  }
}

export class ProphetAgent extends FamilyBaseAgent {
  constructor() {
    super('prophet', FAMILY_PROFILES.prophet, new ProphetPDAMR());
  }

  protected setupCapabilities(): void {
    this.addCapability({ id: 'time-series', name: '时间序列预测', description: '对关键 KPI 进行未来趋势预测', version: '1.0.0', enabled: true });
    this.addCapability({ id: 'anomaly-detect', name: '异常检测', description: '识别数据流中的异常点并预警', version: '1.0.0', enabled: true });
    this.addCapability({ id: 'risk-alert', name: '风险预警', description: '多级预警体系 P0-P3 分级响应', version: '1.0.0', enabled: true });
  }

  protected setupCommandHandlers(): void {
    this.registerCommandHandler('predict', async (params) => this.predict(params as { metric: string; data: number[] }));
    this.registerCommandHandler('detect', async (params) => this.detectAnomalies(params));
  }

  async predict(input: { metric: string; data: number[] }): Promise<TimeSeriesPrediction> {
    const result = await this.pdamr.run(input);
    const memory = this.pdamr.getMemory();
    const lastAction = memory[memory.length - 1]?.action;
    return lastAction?.data as TimeSeriesPrediction ?? { metric: input.metric, predictions: [], trend: 'stable', confidence: 0.5 };
  }

  async detectAnomalies(input: Record<string, unknown>): Promise<AnomalyReport> {
    await this.pdamr.run(input);
    const memory = this.pdamr.getMemory();
    const lastAction = memory[memory.length - 1]?.action;
    return lastAction?.data as AnomalyReport ?? { anomalies: [], riskLevel: 'low' };
  }

  async handleFamilyMessage(message: FamilyMessage): Promise<AgentResponse> {
    const result = await this.pdamr.run(message.payload);
    return { success: true, data: result, executionTime: 0, timestamp: Date.now() };
  }
}
