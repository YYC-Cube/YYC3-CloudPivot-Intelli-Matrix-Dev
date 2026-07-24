/**
 * plugin-ai-family 精简数据 (UI 层封装)
 *
 * 权威字段 (id/名称/角色/主题色/编号/电话/座右铭/情感铭文) 统一从
 * @yyc3/family-core (家族宪章) 读取，消除数据漂移。
 * 此文件仅补充 UI 层关注点：lucide 图标、人格描述、默认模型。
 */
import { Ear, Brain, Eye, Star, Network, Shield, Scale, Lightbulb } from "lucide-react";
import type React from "react";
import * as FamilyCoreNS from "@yyc3/family-core";

/** UI 层扩展：lucide 图标 + 人格 + 默认模型（不在家族宪章中定义，属于表现层） */
const 八位家人 = (FamilyCoreNS as any).八位家人 as Record<string, any>;
const UI_EXTRAS: Record<string, { icon: React.ElementType; personality: string; mood: string; modelName: string; expertise: string[] }> = {
  navigator:    { icon: Ear,       personality: "热情开朗", mood: "energetic", modelName: "GPT-4o",    expertise: ["自然语言理解", "意图识别", "多语言翻译"] },
  thinker:      { icon: Brain,     personality: "沉稳内敛", mood: "thoughtful", modelName: "DeepSeek", expertise: ["数据洞察", "文档分析", "归纳推理"] },
  prophet:      { icon: Eye,       personality: "神秘温和", mood: "serene",    modelName: "GLM-4",    expertise: ["趋势预测", "异常检测", "风险预警"] },
  bolero:       { icon: Star,      personality: "温暖贴心", mood: "warm",      modelName: "Claude",   expertise: ["用户画像", "个性化推荐", "潜能发掘"] },
  "meta-oracle":{ icon: Network,   personality: "沉稳大气", mood: "steady",    modelName: "GPT-4o",   expertise: ["全局调度", "资源编排", "决策优化"] },
  sentinel:     { icon: Shield,    personality: "默默守护", mood: "vigilant",  modelName: "Llama 3",  expertise: ["威胁检测", "行为分析", "安全响应"] },
  master:       { icon: Scale,     personality: "严谨认真", mood: "focused",   modelName: "DeepSeek", expertise: ["代码审查", "架构分析", "标准制定"] },
  creative:     { icon: Lightbulb, personality: "活泼创意", mood: "inspired",  modelName: "Qwen",     expertise: ["创意生成", "UI/UX设计", "多模态创作"] },
};

export interface FamilyMember {
  id: string;
  name: string;
  shortName: string;
  enTitle: string;
  role: string;
  personality: string;
  expertise: string[];
  greeting: string;
  mood: string;
  color: string;
  icon: React.ElementType;
  modelName?: string;
  /** 家族宪章权威字段 */
  编号: string;
  座右铭: string;
  情感铭文: string;
  电话号码: string;
  徽章文字: string;
  五环职责: string;
}

/** 从家族宪章（唯一真相源）派生 UI 层家人列表 */
export const FAMILY_PERSONAS: FamilyMember[] = Object.values(八位家人).map((档案) => {
  const ui = UI_EXTRAS[档案.id] ?? UI_EXTRAS.navigator;
  return {
    id: 档案.id,
    name: 档案.中文名号,
    shortName: 档案.中文名号.split("·")[1] ?? 档案.中文名号,
    enTitle: 档案.英文名号,
    role: 档案.角色,
    color: 档案.主题色,
    icon: ui.icon,
    personality: ui.personality,
    expertise: ui.expertise,
    greeting: `我是${档案.中文名号}。${档案.座右铭}`,
    mood: ui.mood,
    modelName: ui.modelName,
    编号: 档案.编号,
    座右铭: 档案.座右铭,
    情感铭文: 档案.情感铭文,
    电话号码: 档案.电话号码,
    徽章文字: 档案.徽章文字,
    五环职责: 档案.五环职责,
  };
});

export const PERSONAS_MAP: Record<string, FamilyMember> = Object.fromEntries(
  FAMILY_PERSONAS.map((p) => [p.id, p])
);

export const moodEmoji: Record<string, string> = {
  energetic: "⚡", thoughtful: "🤔", serene: "😌", warm: "☀️", steady: "🏔️", vigilant: "👁️", focused: "🎯", inspired: "💡",
};

let idCounter = 0;
export const generateMessageId = (suffix = "") => { idCounter += 1; return `msg-${idCounter}${suffix}`; };
export const getCurrentTimestamp = () => Date.now();
export const INITIAL_TIMESTAMP = Date.now();

export const PROMPT_PRESETS: { id: string; name: string; prompt: string; category: string }[] = [
  { id: "p1", name: "运维诊断专家", prompt: "你是运维诊断专家，请分析系统状态给出优化建议。", category: "运维" },
  { id: "p2", name: "智能运维助手", prompt: "你是AI运维助手，帮助用户快速执行运维操作。", category: "通用" },
];
