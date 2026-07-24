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
import type {
  FamilyIntent,
  FamilyMessage,
  UserRequestPayload,
} from '../base/FamilyTypes';
import type {
  AgentResponse,
} from '@yyc3/family-core';
import type {
  PerceptionResult,
  DecisionResult,
  ActionResult,
  MemoryEntry,
  ReflectionResult,
} from '../base/PDAMRCycle';
import { FAMILY_PROFILES } from '../base/FamilyTypes';

const INTENT_KEYWORDS: Record<string, string[]> = {
  code: ['代码', 'bug', 'fix', '修复', '开发', '编程', '函数', 'class', 'debug'],
  analysis: ['分析', '数据', '报表', '洞察', '统计', '总结', '文档', '解读'],
  prediction: ['预测', '趋势', '未来', '走势', '时间序列', '异常', '预警'],
  recommendation: ['推荐', '建议', '合适', '选择', '画像', '兴趣', '知遇'],
  security: ['安全', '审计', '威胁', '漏洞', '攻击', '合规', '防护'],
  quality: ['质量', '测试', '标准', '规范', '重构', '性能', '代码质量'],
  creative: ['创意', '设计', '文案', '方案', '灵感', '生成', '创作'],
  orchestrate: ['编排', '调度', '流程', '协作', '全家', '任务'],
};

export class QianHangPDAMR extends PDAMRCycle {
  constructor() { super('qianhang'); }

  private classificationHistory: Array<{ text: string; intent: string; correct: boolean }> = [];

  async perceive(input: unknown): Promise<PerceptionResult> {
    const text = typeof input === 'string' ? input : JSON.stringify(input);
    const normalized = text.toLowerCase().trim();
    return { raw: input, filtered: normalized, metadata: { length: normalized.length } };
  }

  async decide(perception: PerceptionResult): Promise<DecisionResult> {
    const text = String(perception.filtered);
    const scores: Record<string, number> = {};
    let maxScore = 0;
    let primary = 'general';

    for (const [intent, keywords] of Object.entries(INTENT_KEYWORDS)) {
      let score = 0;
      for (const kw of keywords) {
        if (text.includes(kw)) score += kw.length;
      }
      scores[intent] = score;
      if (score > maxScore) {
        maxScore = score;
        primary = intent;
      }
    }

    const totalScore = Object.values(scores).reduce((a, b) => a + b, 0);
    const confidence = totalScore > 0 ? Math.min(0.95, maxScore / totalScore + 0.3) : 0.3;

    let secondary: string | undefined;
    const sorted = Object.entries(scores).sort((a, b) => b[1] - a[1]);
    const second = sorted[1];
    if (sorted.length > 1 && second && second[1] > 0) {
      secondary = second[0];
    }

    return {
      action: 'classify_intent',
      parameters: { primary, secondary, text: perception.filtered, scores },
      confidence,
      reasoning: `关键词匹配: ${primary}${secondary ? ` + ${secondary}` : ''}, 置信度 ${confidence.toFixed(2)}`,
    };
  }

  async act(decision: DecisionResult): Promise<ActionResult> {
    const intent: FamilyIntent = {
      primary: decision.parameters.primary as string,
      secondary: decision.parameters.secondary as string | undefined,
      confidence: decision.confidence,
      raw: decision.parameters.text as string,
      entities: { scores: decision.parameters.scores },
    };
    return { success: true, data: intent, executionTime: 0 };
  }

  remember(entry: Omit<MemoryEntry, 'timestamp'>): void {
    this.memory.push({ ...entry, timestamp: Date.now() });
  }

  async reflect(memory: MemoryEntry[]): Promise<ReflectionResult> {
    const observations: string[] = [];
    const improvements: string[] = [];

    if (memory.length > 10) {
      observations.push(`已处理 ${memory.length} 条意图分类`);
    }

    const avgConfidence = memory.length > 0
      ? memory.filter(m => m.decision).reduce((sum, m) => sum + m.decision.confidence, 0) / memory.filter(m => m.decision).length
      : 0;

    if (avgConfidence < 0.7) {
      improvements.push('平均置信度偏低，考虑增加更多关键词或引入 LLM 辅助');
    }

    return { score: avgConfidence, observations, improvements };
  }
}

export class QianHangAgent extends FamilyBaseAgent {
  constructor() {
    super('qianhang', FAMILY_PROFILES.qianhang, new QianHangPDAMR());
  }

  protected setupFamilyCapabilities(): void {
    this.addCapability({
      id: 'intent-classify',
      name: '意图分类',
      description: '识别用户输入的意图类型，支持 8 大领域分类',
      version: '1.0.0',
      enabled: true,
    });
    this.addCapability({
      id: 'semantic-parse',
      name: '语义解析',
      description: '从自然语言中提取实体和结构化信息',
      version: '1.0.0',
      enabled: true,
    });
    this.addCapability({
      id: 'route-dispatch',
      name: '路由分发',
      description: '将识别后的意图路由到对应家人',
      version: '1.0.0',
      enabled: true,
    });
  }

  protected setupFamilyCommandHandlers(): void {
    this.registerCommandHandler('classify', async (params) => {
      return await this.pdamr.run(params.text);
    });
    this.registerCommandHandler('semantic-parse', async (params) => {
      return this.parseSemantics(params.text);
    });
  }

  async classifyIntent(text: string): Promise<FamilyIntent> {
    const result = await this.pdamr.run(text);
    const memory = this.pdamr.getMemory();
    const lastAction = memory[memory.length - 1]?.action;
    if (lastAction?.success && lastAction.data) {
      return lastAction.data as FamilyIntent;
    }
    return { primary: 'general', confidence: 0.3, raw: text };
  }

  private parseSemantics(text: string): { entities: Record<string, string>; intent: string } {
    const entities: Record<string, string> = {};
    const patterns: Array<[string, RegExp]> = [
      ['time', /(今天|昨天|本周|上周|本月|上月|最近\s*\d+\s*[天月周])/],
      ['metric', /(销售额|收入|利润|用户数|转化率|DAU|MAU)/],
      ['dimension', /(按|按照|根据)\s*(地区|部门|产品|渠道|时间)/],
      ['action', /(分析|预测|推荐|生成|创建|删除|修改)/],
    ];
    for (const [name, regex] of patterns) {
      const match = text.match(regex);
      if (match && match[1] !== undefined) entities[name] = match[1];
    }
    return { entities, intent: 'parsed' };
  }

  async handleFamilyMessage(message: FamilyMessage): Promise<AgentResponse> {
    const text = message.payload && typeof message.payload === 'object' && 'text' in message.payload ? (message.payload as UserRequestPayload).text : String(message.payload);
    const intent = await this.classifyIntent(typeof text === 'string' ? text : JSON.stringify(text));
    return { success: true, data: { intent }, executionTime: 0, timestamp: Date.now() };
  }
}
