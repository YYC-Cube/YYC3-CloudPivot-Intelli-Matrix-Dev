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


export type FamilyMemberId =
  | 'qianhang'
  | 'thinker'
  | 'prophet'
  | 'bole'
  | 'tianshu'
  | 'guardian'
  | 'grandmaster'
  | 'grace';

export type FamilyMessageType =
  | 'USER_REQUEST'
  | 'INTENT_RESULT'
  | 'TASK_DISPATCH'
  | 'SKILL_EXECUTE'
  | 'SKILL_RESULT'
  | 'COLLABORATE'
  | 'ALERT'
  | 'QUALITY_REPORT'
  | 'REFLECT';

export type SkillCategory =
  | 'nlu'
  | 'analysis'
  | 'prediction'
  | 'recommendation'
  | 'orchestration'
  | 'security'
  | 'quality'
  | 'creative'
  | 'nvidia'
  | 'meta';

export type FamilyOrchestrationMode =
  | 'family-only';

export type EmotionTone =
  | 'warm'
  | 'calm'
  | 'sharp'
  | 'inspiring'
  | 'stern'
  | 'playful'
  | 'scholarly'
  | 'creative';

export interface FamilyIntent {
  primary: string;
  secondary?: string;
  confidence: number;
  entities?: Record<string, unknown>;
  raw: string;
}

export interface FamilySkill {
  id: string;
  name: string;
  version: string;
  owner: string;
  description: string;
  parameters: SkillParameter[];
  execute: (params: SkillExecutionContext) => Promise<SkillResult>;
  validate?: (params: Record<string, unknown>) => SkillValidationResult;
  category: SkillCategory;
  tags?: string[];
  mcp?: {
    server: string;
    tool: string;
  };
}

export interface SkillParameter {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'object' | 'array';
  required: boolean;
  description: string;
  default?: unknown;
  enum?: unknown[];
}

export interface SkillResult {
  success: boolean;
  data?: unknown;
  error?: string;
  executionTime: number;
}

export interface SkillValidationResult {
  valid: boolean;
  errors?: string[];
}

export interface SkillExecutionContext {
  params: Record<string, unknown>;
  memberId: FamilyMemberId;
  sessionId: string;
  modelRouter?: unknown;
}

export interface FamilyMessage {
  id: string;
  type: FamilyMessageType;
  from: FamilyMemberId;
  to: FamilyMemberId | '*';
  timestamp: number;
  payload: FamilyMessagePayload;
  correlationId?: string;
  priority?: 'low' | 'normal' | 'high' | 'critical';
}

export type FamilyMessagePayload =
  | UserRequestPayload
  | IntentResultPayload
  | TaskDispatchPayload
  | SkillExecutePayload
  | SkillResultPayload
  | CollaboratePayload
  | AlertPayload
  | QualityReportPayload
  | ReflectPayload;

export interface UserRequestPayload {
  text: string;
  channel?: string;
  attachments?: unknown[];
}

export interface IntentResultPayload {
  intent: FamilyIntent;
  raw: string;
}

export interface TaskDispatchPayload {
  taskId: string;
  description: string;
  assignedTo: FamilyMemberId[];
  skillIds?: string[];
  deadline?: number;
  parentTaskId?: string;
}

export interface SkillExecutePayload {
  skillId: string;
  params: Record<string, unknown>;
}

export interface SkillResultPayload {
  skillId: string;
  taskId: string;
  result: SkillResult;
}

export interface CollaboratePayload {
  requestType: string;
  description: string;
  requesterData?: unknown;
}

export interface AlertPayload {
  level: 'info' | 'warning' | 'error' | 'critical';
  source: string;
  message: string;
  data?: unknown;
}

export interface QualityReportPayload {
  targetId: string;
  score: number;
  issues?: string[];
  suggestions?: string[];
}

export interface ReflectPayload {
  memberId: FamilyMemberId;
  cycleId: string;
  observations: string;
  improvements?: string[];
}

export interface PDAMRState {
  phase: 'perceive' | 'decide' | 'act' | 'memory' | 'reflect';
  input?: unknown;
  perception?: unknown;
  decision?: unknown;
  action?: unknown;
  memory?: unknown;
  reflection?: unknown;
  startedAt: number;
  completedAt?: number;
}

export interface FamilyEmotionState {
  memberId: FamilyMemberId;
  tone: EmotionTone;
  temperature: number;
  engagement: number;
  lastUpdated: number;
}

export interface FamilyMemberProfile {
  id: FamilyMemberId;
  name: string;
  role: string;
  layer: number;
  layerName: string;
  color: string;
  icon: string;
  ext: string;
  motto: string;
  emotionTone: EmotionTone;
  skillCategories: SkillCategory[];
}

export const FAMILY_PROFILES: Record<FamilyMemberId, FamilyMemberProfile> = {
  qianhang: {
    id: 'qianhang',
    name: '言启·千行',
    role: '导航员',
    layer: 5,
    layerName: '言启千行',
    color: '#0088cc',
    icon: '🧭',
    ext: '0379-0106',
    motto: '我聆听万千言语，为您指引航向。',
    emotionTone: 'warm',
    skillCategories: ['nlu'],
  },
  thinker: {
    id: 'thinker',
    name: '语枢·万物',
    role: '思考者',
    layer: 4,
    layerName: '语枢万物',
    color: '#c0c0c0',
    icon: '🤔',
    ext: '0379-0107',
    motto: '我于喧嚣数据中，沉思，而后揭示真理。',
    emotionTone: 'scholarly',
    skillCategories: ['analysis'],
  },
  prophet: {
    id: 'prophet',
    name: '预见·先知',
    role: '预言家',
    layer: 3,
    layerName: '预见先知',
    color: '#4b0082',
    icon: '🔮',
    ext: '0379-0108',
    motto: '我观过往之脉络，预见未来之可能。',
    emotionTone: 'calm',
    skillCategories: ['prediction'],
  },
  bole: {
    id: 'bole',
    name: '千里·伯乐',
    role: '推荐官',
    layer: 2,
    layerName: '千里伯乐',
    color: '#dc143c',
    icon: '🎯',
    ext: '0379-0109',
    motto: '我知您之所需，荐您之所未识。',
    emotionTone: 'inspiring',
    skillCategories: ['recommendation'],
  },
  tianshu: {
    id: 'tianshu',
    name: '元启·天枢',
    role: '总指挥',
    layer: 9,
    layerName: '万象归元',
    color: '#5e2c8a',
    icon: '🧠',
    ext: '0379-0206',
    motto: '我观全局之流转，调度万物以归元。',
    emotionTone: 'sharp',
    skillCategories: ['orchestration', 'meta'],
  },
  guardian: {
    id: 'guardian',
    name: '智云·守护',
    role: '安全官',
    layer: 8,
    layerName: '智云守护',
    color: '#2c3e50',
    icon: '🛡️',
    ext: '0379-0207',
    motto: '我于无声处警戒，御威胁于国门之外。',
    emotionTone: 'stern',
    skillCategories: ['security'],
  },
  grandmaster: {
    id: 'grandmaster',
    name: '格物·宗师',
    role: '质量官',
    layer: 7,
    layerName: '格物致知',
    color: '#2e8b57',
    icon: '📚',
    ext: '0379-0208',
    motto: '我究万物之理，定标准以传世。',
    emotionTone: 'scholarly',
    skillCategories: ['quality'],
  },
  grace: {
    id: 'grace',
    name: '创想·灵韵',
    role: '创意官',
    layer: 6,
    layerName: '创想灵韵',
    color: '#ff8c00',
    icon: '🎨',
    ext: '0379-0209',
    motto: '我以灵感为墨，绘就无限可能。',
    emotionTone: 'creative',
    skillCategories: ['creative'],
  },
};

export const FAMILY_ORCHESTRATION_FLOW: FamilyMemberId[] = [
  'qianhang',
  'tianshu',
];
