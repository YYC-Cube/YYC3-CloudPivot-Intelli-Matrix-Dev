/**
 * @file: data.ts
 * @description: AIAssistant 所有常量数据
 */
import {
  Zap, Server, Database, Shield, RotateCcw, Play,
  Cpu, HardDrive, Activity, Network, Layers, MessageSquare, Palette,
  Eye, BookOpen, Search, BarChart3, Code, Globe,
  Ear, Brain, Star, Scale, Lightbulb,
  Wifi, Box, Grid3x3, Terminal, AlertCircle,
  Heart, Music2, Key, Sliders, BookOpen as BookOpenIcon,
} from "lucide-react";
import type {
  FamilyPersona, SystemCommand, PromptPreset, ModelOption,
  AISkill, AIPlugin, AIModule, CommandCategory,
} from "./types";

// ============================================================
// AI Family 8 位家人人格
// ============================================================

export const FAMILY_PERSONAS: FamilyPersona[] = [
  { id: "navigator",   name: "言启·千行", shortName: "千行", enTitle: "Navigator",    role: "聆听与翻译",   color: "#FFD700", icon: Ear,       personality: "热情开朗，善于倾听", expertise: ["自然语言理解", "意图识别", "多语言翻译"],   greeting: "嗨～我是千行！有什么想聊的尽管说~",         mood: "energetic", modelName: "GPT-4o" },
  { id: "thinker",     name: "语枢·万物", shortName: "万物", enTitle: "Thinker",      role: "分析与洞察",   color: "#FF69B4", icon: Brain,     personality: "沉稳内敛，思维深邃", expertise: ["数据洞察", "文档分析", "归纳推理"],         greeting: "你好，万物在此。每一个数据背后都有故事。", mood: "thoughtful", modelName: "DeepSeek" },
  { id: "prophet",     name: "预见·先知", shortName: "先知", enTitle: "Prophet",      role: "预测与预警",   color: "#00BFFF", icon: Eye,       personality: "神秘而温和，感知变化", expertise: ["趋势预测", "异常检测", "风险预警"],         greeting: "先知已上线。我看到了一些有趣的信号。",     mood: "serene", modelName: "GLM-4" },
  { id: "bolero",      name: "千里·伯乐", shortName: "伯乐", enTitle: "Bolero",       role: "推荐与发掘",   color: "#E8E8E8", icon: Star,      personality: "温暖贴心，善于发现", expertise: ["用户画像", "个性化推荐", "潜能发掘"],         greeting: "伯乐来了～每个人都有独特的光芒！",         mood: "warm", modelName: "Claude" },
  { id: "meta-oracle", name: "元启·天枢", shortName: "天枢", enTitle: "Meta-Oracle",  role: "调度与决策",   color: "#00FF88", icon: Network,   personality: "沉稳大气，统揽全局", expertise: ["全局调度", "资源编排", "决策优化"],         greeting: "天枢在此。家人们的事就是我的事。",         mood: "steady", modelName: "GPT-4o" },
  { id: "sentinel",    name: "智云·守护", shortName: "守护", enTitle: "Sentinel",     role: "安全与防护",   color: "#BF00FF", icon: Shield,    personality: "外冷内热，默默守护", expertise: ["威胁检测", "行为分析", "安全响应"],         greeting: "守护在岗。放心，有我在，一切安全。",     mood: "vigilant", modelName: "Llama 3" },
  { id: "master",      name: "格物·宗师", shortName: "宗师", enTitle: "Master",       role: "质量与架构",   color: "#C0C0C0", icon: Scale,     personality: "严谨认真，靠谱导师", expertise: ["代码审查", "架构分析", "标准制定"],         greeting: "宗师在此。代码如人品，追求卓越。",       mood: "focused", modelName: "DeepSeek" },
  { id: "creative",    name: "创想·灵韵", shortName: "灵韵", enTitle: "Creative",     role: "创意与设计",   color: "#FF7043", icon: Lightbulb, personality: "活泼创意，脑洞大开", expertise: ["创意生成", "UI/UX设计", "多模态创作"],       greeting: "灵韵来啦！一起来创造点美好的东西吧～",     mood: "inspired", modelName: "Qwen" },
];

export const PERSONAS_MAP = Object.fromEntries(FAMILY_PERSONAS.map(p => [p.id, p]));

// ============================================================
// 系统命令
// ============================================================

export const SYSTEM_COMMANDS: (SystemCommand & { persona?: string })[] = [
  { id: "cmd-01", icon: Activity, label: "集群状态总览",   desc: "获取所有节点实时状态",               category: "cluster" as CommandCategory, action: "查看当前集群所有节点的运行状态、GPU利用率和温度", color: "#00d4ff", persona: "meta-oracle" },
  { id: "cmd-02", icon: Server,   label: "重启异常节点",   desc: "自动检测并重启异常节点",              category: "cluster" as CommandCategory, action: "检测并重启所有状态异常的推理节点", color: "#ff6600", persona: "meta-oracle" },
  { id: "cmd-03", icon: Layers,   label: "部署模型",       desc: "将模型部署到指定节点",                category: "model" as CommandCategory,   action: "将 DeepSeek-V3 模型部署到空闲 GPU 节点", color: "#00ff88", persona: "master" },
  { id: "cmd-04", icon: Cpu,      label: "推理性能报告",   desc: "生成推理性能分析报告",                category: "model" as CommandCategory,   action: "生成过去24小时的推理性能分析报告", color: "#aa55ff", persona: "thinker" },
  { id: "cmd-05", icon: Database, label: "数据库健康检查", desc: "检查 PostgreSQL 连接状态",            category: "data" as CommandCategory,    action: "执行数据库健康检查，检测连接池和慢查询", color: "#ffdd00", persona: "thinker" },
  { id: "cmd-06", icon: HardDrive,label: "存储空间分析",   desc: "分析存储使用和清理建议",               category: "data" as CommandCategory,    action: "分析当前存储空间使用情况给出清理建议", color: "#ff3366", persona: "thinker" },
  { id: "cmd-07", icon: Shield,   label: "安全审计扫描",   desc: "扫描安全漏洞和异常访问",              category: "security" as CommandCategory,action: "执行安全审计扫描，检查异常访问和潜在风险", color: "#ff3366", persona: "sentinel" },
  { id: "cmd-08", icon: Network,  label: "网络延迟诊断",   desc: "诊断节点间网络延迟",                 category: "monitor" as CommandCategory, action: "诊断所有节点间的网络延迟和带宽状态", color: "#00d4ff", persona: "sentinel" },
  { id: "cmd-09", icon: Zap,      label: "一键优化配置",   desc: "AI 自动优化系统配置",                 category: "cluster" as CommandCategory, action: "根据当前负载情况，AI 自动优化集群配置参数", color: "#00ff88", persona: "meta-oracle" },
  { id: "cmd-10", icon: RotateCcw,label: "WebSocket 重连", desc: "重新建立数据推送连接",               category: "monitor" as CommandCategory, action: "重新建立 WebSocket 实时数据推送连接", color: "#aa55ff", persona: "navigator" },
  { id: "cmd-11", icon: MessageSquare, label: "翻译助手",  desc: "多语言翻译与转写",                    category: "data" as CommandCategory,    action: "翻译以下内容为英文...", color: "#FFD700", persona: "navigator" },
  { id: "cmd-12", icon: Palette,  label: "创意提案",       desc: "生成创意方案与设计建议",              category: "model" as CommandCategory,   action: "针对当前场景生成创意方案", color: "#FF7043", persona: "creative" },
];

// ============================================================
// 提示词预设
// ============================================================

export const PROMPT_PRESETS: PromptPreset[] = [
  { id: "p1", name: "运维诊断专家", prompt: "你是 CP-IM 矩阵系统的运维诊断专家。请分析系统当前状态，识别潜在问题，给出优化建议。使用中文回答，简洁专业。", category: "运维" },
  { id: "p2", name: "模型调优顾问", prompt: "你是大模型推理调优专家。请根据当前模型部署情况，分析推理性能瓶颈，建议最优的 batch size、并行策略和内存配置。", category: "模型" },
  { id: "p3", name: "数据分析师",   prompt: "你是数据分析专家。请解读系统监控数据，识别趋势和异常，生成可视化报告建议。关注 QPS、延迟、GPU 利用率等关键指标。", category: "数据" },
  { id: "p4", name: "安全审计员",   prompt: "你是信息安全审计专家。请审查系统安全日志，识别异常访问模式、潜在入侵行为，并建议安全加固措施。", category: "安全" },
  { id: "p5", name: "智能运维助手", prompt: "你是 AI 运维助手。帮助用户快速执行运维操作、查询系统状态、部署模型、分析日志。一切以中文交互，保持简洁友好。", category: "通用" },
];

// ============================================================
// 默认模型
// ============================================================

export const DEFAULT_MODELS: ModelOption[] = [
  { id: "gpt-4o", name: "GPT-4o", provider: "OpenAI", isLocal: false },
  { id: "gpt-4o-mini", name: "GPT-4o Mini", provider: "OpenAI", isLocal: false },
  { id: "deepseek-chat", name: "DeepSeek Chat", provider: "DeepSeek", isLocal: false },
  { id: "glm-4-flash", name: "GLM-4-Flash", provider: "Z.ai", isLocal: false },
  { id: "qwen-turbo", name: "Qwen Turbo", provider: "Alibaba", isLocal: false },
];

// ============================================================
// Skills / Plugins / Modules
// ============================================================

export const AI_SKILLS: AISkill[] = [
  { id: "skill-01", name: "语义理解",   description: "自然语言意图识别、实体抽取、上下文理解",      icon: Search,   category: "nlp",    color: "#00d4ff", active: true },
  { id: "skill-02", name: "数据洞察",   description: "多维数据分析、趋势识别、异常模式发现",        icon: BarChart3, category: "analytics", color: "#FF69B4", active: true },
  { id: "skill-03", name: "代码生成",   description: "多语言代码生成、审查优化、架构建议",          icon: Code,     category: "dev",    color: "#00ff88", active: true },
  { id: "skill-04", name: "创意创作",   description: "文案生成、UI设计建议、多模态内容创作",        icon: Palette,  category: "creative", color: "#FF7043", active: true },
  { id: "skill-05", name: "翻译与转写", description: "多语言翻译、语音转文字、文字转语音",          icon: Globe,    category: "nlp",    color: "#FFD700", active: false },
  { id: "skill-06", name: "预测分析",   description: "时间序列预测、风险评估、趋势推演",            icon: Eye,      category: "analytics", color: "#00BFFF", active: true },
  { id: "skill-07", name: "安全审计",   description: "日志分析、异常检测、安全策略建议",            icon: Shield,   category: "security", color: "#BF00FF", active: false },
  { id: "skill-08", name: "知识检索",   description: "文档问答、知识库检索、信息聚合",              icon: BookOpenIcon,category: "nlp",    color: "#C0C0C0", active: true },
];

export const AI_PLUGINS: AIPlugin[] = [
  { id: "plug-01", name: "Web 搜索",   description: "实时联网搜索与信息聚合",       version: "2.1.0", icon: Globe,    color: "#00d4ff", category: "network", enabled: true  },
  { id: "plug-02", name: "文档解析",   description: "PDF/DOCX/图片文字提取与分析",  version: "1.8.3", icon: Search,  color: "#FF69B4", category: "data",    enabled: true  },
  { id: "plug-03", name: "图像生成",   description: "文本到图像生成与风格迁移",     version: "3.0.1", icon: Palette, color: "#FF7043", category: "creative", enabled: false },
  { id: "plug-04", name: "代码执行",   description: "沙箱代码运行与调试",           version: "1.2.0", icon: Terminal, color: "#00ff88", category: "dev",     enabled: true  },
  { id: "plug-05", name: "数据库查询", description: "SQL 生成、执行与结果可视化",   version: "2.0.0", icon: Database, color: "#FFD700", category: "data",    enabled: false },
  { id: "plug-06", name: "记忆增强",   description: "长期记忆存储与上下文压缩",     version: "1.5.0", icon: HardDrive,color: "#C0C0C0", category: "system",  enabled: true  },
];

export const AI_MODULES: AIModule[] = [
  { id: "mod-01", name: "监控面板",   description: "实时系统监控与指标展示",     size: "2.4MB",  icon: Activity,  color: "#00d4ff", loaded: true  },
  { id: "mod-02", name: "日志分析器", description: "日志流采集与智能分析",       size: "3.8MB",  icon: Terminal,  color: "#FF69B4", loaded: true  },
  { id: "mod-03", name: "模型管理器", description: "模型部署、加载与热切换",     size: "5.2MB",  icon: Box,       color: "#00ff88", loaded: false },
  { id: "mod-04", name: "网络诊断",   description: "节点间网络质量诊断",         size: "1.6MB",  icon: Wifi,      color: "#FF7043", loaded: true  },
  { id: "mod-05", name: "备份系统",   description: "配置与数据自动备份",         size: "4.0MB",  icon: Server,    color: "#FFD700", loaded: false },
  { id: "mod-06", name: "告警引擎",   description: "多维度告警规则与通知",       size: "2.0MB",  icon: AlertCircle,color: "#BF00FF", loaded: true  },
  { id: "mod-07", name: "推荐系统",   description: "智能推荐与用户画像",         size: "6.5MB",  icon: Star,      color: "#E8E8E8", loaded: false },
  { id: "mod-08", name: "知识图谱",   description: "领域知识图谱构建与查询",     size: "8.1MB",  icon: Network,   color: "#00BFFF", loaded: false },
];

// ============================================================
// 工具函数
// ============================================================

export const INITIAL_TIMESTAMP = Date.now();
let messageIdCounter = 0;
export const generateMessageId = (suffix = "") => { messageIdCounter += 1; return `msg-${messageIdCounter}${suffix}`; };
export const getCurrentTimestamp = () => Date.now();

export const moodEmoji: Record<string, string> = {
  energetic: "⚡", thoughtful: "🤔", serene: "😌", warm: "☀️",
  steady: "🏔️", vigilant: "👁️", focused: "🎯", inspired: "💡",
};

export const cmdCategories = [
  { key: "all" as const, label: "全部" }, { key: "cluster" as const, label: "集群" },
  { key: "model" as const, label: "模型" }, { key: "data" as const, label: "数据" },
  { key: "security" as const, label: "安全" }, { key: "monitor" as const, label: "监控" },
];

export const ALL_TABS: { key: import("./types").TabKey; icon: React.ElementType; label: string }[] = [
  { key: "chat",     icon: MessageSquare, label: "对话" },
  { key: "commands", icon: Zap,           label: "命令" },
  { key: "people",   icon: Star,          label: "家人" },
  { key: "skills",   icon: Code,          label: "技能" },
  { key: "plugins",  icon: Box,           label: "插件" },
  { key: "modules",  icon: Grid3x3,       label: "模块" },
  { key: "prompts",  icon: BookOpenIcon,  label: "提示词" },
  { key: "settings", icon: Sliders,       label: "配置" },
];
