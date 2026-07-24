/**
 * @file: panels.tsx
 * @description: AIAssistant 8 个 Tab 面板组件
 */
import React, { useRef, useEffect } from "react";
import {
  X, Send, Play, Copy, Check, Cpu, Trash2, Activity, Heart, Music2,
  User, Mic, MicOff, Volume2, MessageSquare as MessageSquareIcon,
  ToggleLeft, ToggleRight, Key, RotateCcw, Sliders,
} from "lucide-react";
import {
  FAMILY_PERSONAS, PERSONAS_MAP, PROMPT_PRESETS, cmdCategories,
  SYSTEM_COMMANDS, moodEmoji, getCurrentTimestamp,
} from "./data";
import { AILogo, EmotionRipple, useSpeechRecognition } from "./components";
import type { ChatMessage, SystemCommand, PromptPreset, AISkill, AIPlugin, AIModule, TabKey } from "./types";

// ============================================================
// 统一面板 Props 接口
// ============================================================

export interface PanelProps {
  /** 当前活跃标签 */
  activeTab: TabKey;
  setActiveTab: (tab: TabKey) => void;
  /** 消息 */
  messages: ChatMessage[];
  setMessages: React.Dispatch<React.SetStateAction<ChatMessage[]>>;
  inputValue: string;
  setInputValue: (v: string) => void;
  isTyping: boolean;
  sendMessage: (content: string) => Promise<void>;
  /** 人格 */
  activePersona: string;
  setActivePersona: (id: string) => void;
  /** 命令过滤 */
  cmdFilter: string;
  setCmdFilter: (v: string) => void;
  personaFilter: string;
  setPersonaFilter: (v: string) => void;
  /** 技能/插件/模块 */
  skills: AISkill[];
  setSkills: React.Dispatch<React.SetStateAction<AISkill[]>>;
  plugins: AIPlugin[];
  setPlugins: React.Dispatch<React.SetStateAction<AIPlugin[]>>;
  modules: AIModule[];
  setModules: React.Dispatch<React.SetStateAction<AIModule[]>>;
  skillFilter: string;
  setSkillFilter: (v: string) => void;
  pluginFilter: string;
  setPluginFilter: (v: string) => void;
  /** 配置 */
  systemPrompt: string;
  setSystemPrompt: (v: string) => void;
  localApiKey: string;
  setLocalApiKey: (v: string) => void;
  selectedModel: string;
  setLocalModel: (v: string) => void;
  availableModels: { id: string; name: string; provider: string; isLocal: boolean }[];
  localTemperature: number;
  setLocalTemperature: (v: number) => void;
  localTopP: number;
  setLocalTopP: (v: number) => void;
  localMaxTokens: number;
  setLocalMaxTokens: (v: number) => void;
  showApiKey: boolean;
  setShowApiKey: (v: boolean) => void;
  persist: (k: string, v: string) => void;
  copyToClipboard: (text: string, id: string) => void;
  copiedId: string | null;
  clearChat: () => void;
}

// ============================================================
// Chat Panel
// ============================================================

export function ChatPanel(p: PanelProps) {
  const chatEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const { isListening, transcript, supported: voiceSupported, startListening, stopListening } = useSpeechRecognition();
  useEffect(() => { if (transcript) p.setInputValue(transcript); }, [transcript]);
  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [p.messages, p.isTyping]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); p.sendMessage(p.inputValue); }
  };

  return (
    <>
      <div className="flex-1 overflow-auto p-3 space-y-3">
        {p.messages.map(msg => {
          const isUser = msg.role === "user";
          const isSystem = msg.role === "system";
          const pColor = msg.personaId ? PERSONAS_MAP[msg.personaId]?.color : "#00d4ff";
          return (
            <div key={msg.id} className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[85%] relative group ${isUser
                  ? "bg-[rgba(0,212,255,0.12)] border border-[rgba(0,212,255,0.2)] rounded-2xl rounded-br-sm"
                  : isSystem
                    ? "bg-[rgba(255,221,0,0.08)] border border-[rgba(255,221,0,0.15)] rounded-2xl text-center"
                    : "rounded-2xl rounded-bl-sm"
              }`} style={!isUser && !isSystem ? { background: `${pColor}10`, border: `1px solid ${pColor}20` } : {}}>
                {!isUser && !isSystem && <EmotionRipple color={pColor ?? "#00d4ff"} active={!!msg.emotion} />}
                <div className="relative px-3.5 py-2.5" style={{ zIndex: 1 }}>
                  {!isUser && msg.personaId && (
                    <div className="flex items-center gap-1 mb-1">
                      <span style={{ fontSize: "0.6rem", color: pColor }}>{PERSONAS_MAP[msg.personaId]?.shortName}</span>
                    </div>
                  )}
                  <div className={`whitespace-pre-wrap ${isUser ? "text-[#e0f0ff]" : isSystem ? "text-[#ffdd00]" : "text-[#c0dcf0]"}`}
                    style={{ fontSize: "0.78rem", lineHeight: "1.6" }}>
                    {msg.content}
                  </div>
                  {msg.role === "assistant" && (
                    <button onClick={() => p.copyToClipboard(msg.content, msg.id)}
                      className="absolute top-2 right-2 p-1 rounded opacity-0 group-hover:opacity-100 hover:bg-[rgba(0,212,255,0.1)] transition-all">
                      {p.copiedId === msg.id ? <Check className="w-3 h-3 text-[#00ff88]" /> : <Copy className="w-3 h-3 text-[rgba(0,212,255,0.3)]" />}
                    </button>
                  )}
                  <div className="text-[rgba(0,212,255,0.2)] mt-1" style={{ fontSize: "0.58rem" }}>
                    {new Date(msg.timestamp).toLocaleTimeString("zh-CN")}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
        {p.isTyping && (
          <div className="flex justify-start">
            <div className="bg-[rgba(0,40,80,0.3)] border border-[rgba(0,180,255,0.1)] rounded-2xl rounded-bl-sm px-4 py-3">
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-[#00d4ff] animate-bounce" style={{ animationDelay: "0ms" }} />
                <div className="w-2 h-2 rounded-full bg-[#00d4ff] animate-bounce" style={{ animationDelay: "150ms" }} />
                <div className="w-2 h-2 rounded-full bg-[#00d4ff] animate-bounce" style={{ animationDelay: "300ms" }} />
              </div>
            </div>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      {/* Input */}
      <div className="shrink-0 p-3 border-t border-[rgba(0,180,255,0.1)]">
        <div className="flex items-end gap-2">
          {voiceSupported && (
            <button onClick={isListening ? stopListening : startListening}
              className={`p-2.5 rounded-xl transition-all min-w-[40px] min-h-[40px] flex items-center justify-center ${
                isListening ? "bg-[rgba(255,60,60,0.2)] border border-[rgba(255,60,60,0.4)] animate-pulse"
                  : "bg-[rgba(0,40,80,0.4)] border border-[rgba(0,180,255,0.15)] hover:border-[rgba(0,180,255,0.3)]"
              }`}
              title={isListening ? "点击停止" : "语音输入"}>
              {isListening ? <MicOff className="w-4 h-4 text-[#ff6060]" /> : <Mic className="w-4 h-4 text-[rgba(0,212,255,0.5)]" />}
            </button>
          )}
          <textarea ref={inputRef} value={p.inputValue}
            onChange={e => p.setInputValue(e.target.value)} onKeyDown={handleKeyDown}
            placeholder={isListening ? "🎤 正在聆听..." : "输入指令... (Enter 发送, Shift+Enter 换行)"}
            rows={1}
            className="flex-1 px-3 py-2.5 rounded-xl bg-[rgba(0,40,80,0.4)] border border-[rgba(0,180,255,0.15)] text-[#e0f0ff] placeholder-[rgba(0,212,255,0.25)] focus:outline-none focus:border-[rgba(0,212,255,0.4)] resize-none"
            style={{ fontSize: "0.8rem", maxHeight: "100px" }}
          />
          <button onClick={() => p.sendMessage(p.inputValue)} disabled={!p.inputValue.trim() || p.isTyping}
            className="p-2.5 rounded-xl bg-gradient-to-r from-[#00d4ff] to-[#0066ff] text-white hover:shadow-[0_0_15px_rgba(0,180,255,0.3)] transition-all disabled:opacity-30 disabled:cursor-not-allowed min-w-[44px] min-h-[44px] flex items-center justify-center">
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </>
  );
}

// ============================================================
// Commands Panel
// ============================================================

export function CommandsPanel(p: PanelProps) {
  const executeCommand = (cmd: SystemCommand) => {
    p.setActiveTab("chat");
    if (cmd.persona) p.setActivePersona(cmd.persona);
    p.sendMessage(cmd.action);
  };
  const filteredCommands = SYSTEM_COMMANDS.filter(c => {
    if (p.cmdFilter !== "all" && c.category !== p.cmdFilter) return false;
    if (p.personaFilter !== "all" && c.persona !== p.personaFilter) return false;
    return true;
  });
  return (
    <div className="flex-1 overflow-auto p-3">
      <div className="flex items-center gap-1 mb-2 flex-wrap">
        {cmdCategories.map(cat => (
          <button key={cat.key} onClick={() => p.setCmdFilter(cat.key)}
            className={`px-2.5 py-1 rounded-lg transition-all ${p.cmdFilter === cat.key ? "bg-[rgba(0,212,255,0.12)] text-[#00d4ff] border border-[rgba(0,212,255,0.25)]" : "text-[rgba(0,212,255,0.4)] hover:text-[#00d4ff] border border-transparent"}`}
            style={{ fontSize: "0.68rem" }}>{cat.label}</button>
        ))}
      </div>
      <div className="flex items-center gap-1 mb-3 flex-wrap">
        <span className="text-[rgba(0,212,255,0.25)]" style={{ fontSize: "0.6rem" }}>按家人:</span>
        {[{ id: "all", shortName: "全部", color: "rgba(0,212,255,0.4)" } as any, ...FAMILY_PERSONAS.map(p => ({ id: p.id, shortName: p.shortName, color: p.color }))].map(f => (
          <button key={f.id} onClick={() => p.setPersonaFilter(f.id)}
            className={`px-2 py-0.5 rounded transition-all ${p.personaFilter === f.id ? "border" : "border border-transparent hover:border"}`}
            style={{ fontSize: "0.6rem", background: p.personaFilter === f.id ? `${f.color}18` : "transparent", borderColor: p.personaFilter === f.id ? f.color : "transparent", color: p.personaFilter === f.id ? f.color : "rgba(0,212,255,0.3)" }}
          >{f.shortName}</button>
        ))}
      </div>
      <div className="space-y-2">
        {filteredCommands.map(cmd => {
          const Icon = cmd.icon;
          const pColor = cmd.persona ? PERSONAS_MAP[cmd.persona]?.color : cmd.color;
          return (
            <button key={cmd.id} onClick={() => executeCommand(cmd)}
              className="w-full flex items-center gap-3 p-3 rounded-xl bg-[rgba(0,40,80,0.2)] border border-[rgba(0,180,255,0.08)] hover:border-[rgba(0,180,255,0.25)] hover:bg-[rgba(0,40,80,0.3)] transition-all text-left group">
              <div className="p-2 rounded-lg shrink-0" style={{ backgroundColor: `${pColor}18` }}>
                <Icon className="w-4 h-4" style={{ color: pColor }} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[#e0f0ff] group-hover:text-[#00d4ff] transition-colors" style={{ fontSize: "0.8rem" }}>{cmd.label}</p>
                <p className="text-[rgba(0,212,255,0.35)] truncate" style={{ fontSize: "0.68rem" }}>{cmd.desc} {cmd.persona ? `· ${PERSONAS_MAP[cmd.persona]?.shortName}` : ""}</p>
              </div>
              <Play className="w-4 h-4 text-[rgba(0,212,255,0.2)] group-hover:text-[#00d4ff] transition-colors shrink-0" />
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ============================================================
// People Panel
// ============================================================

export function PeoplePanel(p: PanelProps) {
  return (
    <div className="flex-1 overflow-auto p-3 space-y-3">
      <h4 className="text-[#e0f0ff]" style={{ fontSize: "0.82rem" }}>AI Family · 家人档案</h4>
      <p className="text-[rgba(0,212,255,0.3)]" style={{ fontSize: "0.62rem" }}>点击切换当前对话的家人</p>
      {FAMILY_PERSONAS.map(persona => {
        const Icon = persona.icon;
        const isActive = p.activePersona === persona.id;
        return (
          <div key={persona.id} onClick={() => { p.setActivePersona(persona.id); p.setActiveTab("chat"); }}
            className={`p-3 rounded-xl border cursor-pointer transition-all ${isActive ? "bg-[rgba(0,212,255,0.06)] border-[rgba(0,212,255,0.2)]" : "bg-[rgba(0,40,80,0.15)] border-[rgba(0,180,255,0.06)] hover:border-[rgba(0,180,255,0.15)]"}`}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${persona.color}22`, border: `1.5px solid ${persona.color}` }}>
                <Icon size={20} style={{ color: persona.color }} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-[#e0f0ff]" style={{ fontSize: "0.85rem" }}>{persona.name}</span>
                  <span className="text-[rgba(0,212,255,0.3)]" style={{ fontSize: "0.55rem" }}>{persona.enTitle}</span>
                  {isActive && <Check className="w-3.5 h-3.5 text-[#00ff88]" />}
                </div>
                <p className="text-[rgba(0,212,255,0.4)]" style={{ fontSize: "0.65rem" }}>{persona.role} · {persona.personality}</p>
                <div className="flex flex-wrap gap-1 mt-1">
                  {persona.expertise.map(exp => (
                    <span key={exp} className="px-1.5 py-0.5 rounded" style={{ background: `${persona.color}12`, fontSize: "0.55rem", color: persona.color }}>{exp}</span>
                  ))}
                </div>
              </div>
            </div>
            {persona.modelName && (
              <div className="mt-2 flex items-center gap-2 text-[rgba(0,212,255,0.25)]" style={{ fontSize: "0.6rem" }}>
                <Cpu className="w-3 h-3" /> <span>绑定模型: {persona.modelName}</span>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ============================================================
// Skills Panel
// ============================================================

export function SkillsPanel(p: PanelProps) {
  const skillCategories = [...new Set(p.skills.map(s => s.category))];
  const filteredSkills = p.skillFilter === "all" ? p.skills : p.skills.filter(s => s.category === p.skillFilter);
  return (
    <div className="flex-1 overflow-auto p-3">
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-[#e0f0ff]" style={{ fontSize: "0.82rem" }}>AI 技能系统</h4>
        <span className="text-[rgba(0,212,255,0.3)]" style={{ fontSize: "0.62rem" }}>{p.skills.filter(s => s.active).length}/{p.skills.length} 启用</span>
      </div>
      <div className="flex items-center gap-1 mb-3 flex-wrap">
        <button onClick={() => p.setSkillFilter("all")}
          className={`px-2.5 py-1 rounded-lg transition-all ${p.skillFilter === "all" ? "bg-[rgba(0,212,255,0.12)] text-[#00d4ff] border border-[rgba(0,212,255,0.25)]" : "text-[rgba(0,212,255,0.4)] border border-transparent hover:text-[#00d4ff]"}`}
          style={{ fontSize: "0.65rem" }}>全部</button>
        {skillCategories.map(cat => (
          <button key={cat} onClick={() => p.setSkillFilter(cat)}
            className={`px-2.5 py-1 rounded-lg ${p.skillFilter === cat ? "bg-[rgba(0,212,255,0.12)] text-[#00d4ff] border border-[rgba(0,212,255,0.25)]" : "text-[rgba(0,212,255,0.4)] border border-transparent hover:text-[#00d4ff]"}`}
            style={{ fontSize: "0.65rem" }}>{cat}</button>
        ))}
      </div>
      <div className="space-y-2">
        {filteredSkills.map(skill => {
          const Icon = skill.icon;
          return (
            <div key={skill.id} className="flex items-center gap-3 p-3 rounded-xl bg-[rgba(0,40,80,0.2)] border border-[rgba(0,180,255,0.08)]">
              <div className="p-2 rounded-lg shrink-0" style={{ background: `${skill.color}18` }}>
                <Icon className="w-4 h-4" style={{ color: skill.color }} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-[#e0f0ff]" style={{ fontSize: "0.8rem" }}>{skill.name}</span>
                  <span className="px-1.5 py-0.5 rounded" style={{ background: `${skill.color}12`, fontSize: "0.5rem", color: skill.color }}>{skill.category}</span>
                </div>
                <p className="text-[rgba(0,212,255,0.35)] truncate" style={{ fontSize: "0.65rem" }}>{skill.description}</p>
              </div>
              <button onClick={() => p.setSkills(prev => prev.map(s => s.id === skill.id ? { ...s, active: !s.active } : s))} className="shrink-0">
                {skill.active ? <ToggleRight className="w-5 h-5 text-[#00ff88]" /> : <ToggleLeft className="w-5 h-5 text-[rgba(0,212,255,0.2)]" />}
              </button>
            </div>
          );
        })}
      </div>
      <div className="mt-3 p-2.5 rounded-xl bg-[rgba(0,255,136,0.04)] border border-[rgba(0,255,136,0.1)]">
        <p className="text-[rgba(0,255,136,0.4)] flex items-center gap-1" style={{ fontSize: "0.6rem" }}>
          <Activity className="w-3 h-3" />
          {p.skills.filter(s => s.active).map(s => s.name).join(" · ")} 等 {p.skills.filter(s => s.active).length} 项技能活跃中
        </p>
      </div>
    </div>
  );
}

// ============================================================
// Plugins Panel
// ============================================================

export function PluginsPanel(p: PanelProps) {
  const pluginCategories = [...new Set(p.plugins.map(pl => pl.category))];
  const filteredPlugins = p.pluginFilter === "all" ? p.plugins : p.plugins.filter(pl => pl.category === p.pluginFilter);
  return (
    <div className="flex-1 overflow-auto p-3">
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-[#e0f0ff]" style={{ fontSize: "0.82rem" }}>插件管理</h4>
        <span className="text-[rgba(0,212,255,0.3)]" style={{ fontSize: "0.62rem" }}>{p.plugins.filter(pl => pl.enabled).length}/{p.plugins.length} 启用</span>
      </div>
      <div className="flex items-center gap-1 mb-3 flex-wrap">
        {[{ key: "all", label: "全部" }, ...pluginCategories.map(c => ({ key: c, label: c }))].map(cat => (
          <button key={cat.key} onClick={() => p.setPluginFilter(cat.key)}
            className={`px-2.5 py-1 rounded-lg ${p.pluginFilter === cat.key ? "bg-[rgba(0,212,255,0.12)] text-[#00d4ff] border border-[rgba(0,212,255,0.25)]" : "text-[rgba(0,212,255,0.4)] border border-transparent hover:text-[#00d4ff]"}`}
            style={{ fontSize: "0.65rem" }}>{cat.label}</button>
        ))}
      </div>
      <div className="space-y-2">
        {filteredPlugins.map(plug => {
          const Icon = plug.icon;
          return (
            <div key={plug.id} className="flex items-center gap-3 p-3 rounded-xl bg-[rgba(0,40,80,0.2)] border border-[rgba(0,180,255,0.08)]">
              <div className="p-2 rounded-lg shrink-0" style={{ background: `${plug.color}18` }}>
                <Icon className="w-4 h-4" style={{ color: plug.color }} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-[#e0f0ff]" style={{ fontSize: "0.8rem" }}>{plug.name}</span>
                  <span className="text-[rgba(0,212,255,0.2)]" style={{ fontSize: "0.55rem" }}>v{plug.version}</span>
                </div>
                <p className="text-[rgba(0,212,255,0.35)] truncate" style={{ fontSize: "0.65rem" }}>{plug.description}</p>
              </div>
              <button onClick={() => p.setPlugins(prev => prev.map(pl => pl.id === plug.id ? { ...pl, enabled: !pl.enabled } : pl))} className="shrink-0">
                {plug.enabled ? <ToggleRight className="w-5 h-5 text-[#00ff88]" /> : <ToggleLeft className="w-5 h-5 text-[rgba(0,212,255,0.2)]" />}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ============================================================
// Modules Panel
// ============================================================

export function ModulesPanel(p: PanelProps) {
  return (
    <div className="flex-1 overflow-auto p-3">
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-[#e0f0ff]" style={{ fontSize: "0.82rem" }}>系统模块</h4>
        <span className="text-[rgba(0,212,255,0.3)]" style={{ fontSize: "0.62rem" }}>{p.modules.filter(m => m.loaded).length}/{p.modules.length} 已加载</span>
      </div>
      <div className="space-y-2">
        {p.modules.map(mod => {
          const Icon = mod.icon;
          return (
            <div key={mod.id} className="flex items-center gap-3 p-3 rounded-xl bg-[rgba(0,40,80,0.2)] border border-[rgba(0,180,255,0.08)]">
              <div className="p-2 rounded-lg shrink-0" style={{ background: `${mod.color}18` }}>
                <Icon className="w-4 h-4" style={{ color: mod.color }} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-[#e0f0ff]" style={{ fontSize: "0.8rem" }}>{mod.name}</span>
                  <span className="text-[rgba(0,212,255,0.2)]" style={{ fontSize: "0.55rem" }}>{mod.size}</span>
                </div>
                <p className="text-[rgba(0,212,255,0.35)] truncate" style={{ fontSize: "0.65rem" }}>{mod.description}</p>
              </div>
              <button onClick={() => p.setModules(prev => prev.map(m => m.id === mod.id ? { ...m, loaded: !m.loaded } : m))}
                className={`px-2.5 py-1 rounded-lg text-xs ${mod.loaded ? "text-[#00ff88] border border-[#00ff88] bg-[rgba(0,255,136,0.08)]" : "text-[rgba(0,212,255,0.3)] border border-[rgba(0,180,255,0.1)] hover:border-[rgba(0,180,255,0.2)]"}`}
                style={{ fontSize: "0.62rem" }}>{mod.loaded ? "已加载" : "未加载"}</button>
            </div>
          );
        })}
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2">
        <div className="p-2.5 rounded-xl bg-[rgba(0,255,136,0.04)] border border-[rgba(0,255,136,0.1)]">
          <div className="flex items-center gap-1.5 text-[rgba(0,255,136,0.5)]" style={{ fontSize: "0.6rem" }}>
            <Heart className="w-3 h-3" /> 系统健康
          </div>
          <span className="text-[#00ff88]" style={{ fontSize: "1rem", fontFamily: "monospace" }}>96%</span>
        </div>
        <div className="p-2.5 rounded-xl bg-[rgba(0,212,255,0.04)] border border-[rgba(0,212,255,0.1)]">
          <div className="flex items-center gap-1.5 text-[rgba(0,212,255,0.5)]" style={{ fontSize: "0.6rem" }}>
            <Music2 className="w-3 h-3" /> 音乐状态
          </div>
          <span className="text-[#e0f0ff]" style={{ fontSize: "0.7rem" }}>🎵 星际协奏曲</span>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// Prompts Panel
// ============================================================

export function PromptsPanel(p: PanelProps) {
  const applyPreset = (preset: PromptPreset) => {
    p.setSystemPrompt(preset.prompt);
    p.setActiveTab("chat");
    p.setMessages(prev => [...prev, {
      id: `sys-${Date.now()}`,
      role: "system" as const,
      content: `✅ 已切换系统角色为「${preset.name}」`,
      timestamp: getCurrentTimestamp(),
    }]);
  };
  return (
    <div className="flex-1 overflow-auto p-3">
      <h4 className="text-[#e0f0ff] mb-3" style={{ fontSize: "0.82rem" }}>系统提示词预设</h4>
      <div className="space-y-2 mb-4">
        {PROMPT_PRESETS.map(preset => (
          <div key={preset.id} onClick={() => applyPreset(preset)}
            className={`p-3 rounded-xl border cursor-pointer transition-all ${p.systemPrompt === preset.prompt
              ? "bg-[rgba(0,212,255,0.1)] border-[rgba(0,212,255,0.3)]"
              : "bg-[rgba(0,40,80,0.15)] border-[rgba(0,180,255,0.08)] hover:border-[rgba(0,180,255,0.2)]"}`}>
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-2">
                <span className="text-[#e0f0ff]" style={{ fontSize: "0.8rem" }}>{preset.name}</span>
                <span className="px-1.5 py-0.5 rounded bg-[rgba(0,212,255,0.06)] text-[rgba(0,212,255,0.4)]" style={{ fontSize: "0.58rem" }}>{preset.category}</span>
              </div>
              {p.systemPrompt === preset.prompt && <Check className="w-4 h-4 text-[#00ff88]" />}
            </div>
            <p className="text-[rgba(0,212,255,0.35)]" style={{ fontSize: "0.68rem", lineHeight: 1.5 }}>{preset.prompt.slice(0, 80)}...</p>
          </div>
        ))}
      </div>
      <h4 className="text-[#e0f0ff] mb-2" style={{ fontSize: "0.82rem" }}>自定义系统提示词</h4>
      <textarea value={p.systemPrompt} onChange={e => p.setSystemPrompt(e.target.value)}
        className="w-full px-3 py-2.5 rounded-xl bg-[rgba(0,40,80,0.4)] border border-[rgba(0,180,255,0.15)] text-[#e0f0ff] placeholder-[rgba(0,212,255,0.25)] focus:outline-none focus:border-[rgba(0,212,255,0.4)] resize-none"
        style={{ fontSize: "0.75rem", lineHeight: 1.6 }} rows={5} placeholder="输入自定义系统提示词..." />
      <p className="text-[rgba(0,212,255,0.25)] mt-1" style={{ fontSize: "0.62rem" }}>字数: {p.systemPrompt.length}</p>
    </div>
  );
}

// ============================================================
// Settings Panel
// ============================================================

export function SettingsPanel(p: PanelProps) {
  return (
    <div className="flex-1 overflow-auto p-3 space-y-4">
      <div>
        <h4 className="text-[#e0f0ff] mb-2 flex items-center gap-2" style={{ fontSize: "0.82rem" }}>
          <Key className="w-4 h-4 text-[#ffdd00]" /> API Key
        </h4>
        <div className="relative">
          <input type={p.showApiKey ? "text" : "password"} value={p.localApiKey}
            onChange={e => { p.setLocalApiKey(e.target.value); p.persist("ai_assistant_api_key", e.target.value); }}
            placeholder="sk-xxxxxxxxxxxxxxxxxxxxxxxx"
            className="w-full px-3 py-2.5 rounded-xl bg-[rgba(0,40,80,0.4)] border border-[rgba(0,180,255,0.15)] text-[#e0f0ff] placeholder-[rgba(0,212,255,0.2)] focus:outline-none focus:border-[rgba(0,212,255,0.4)]"
            style={{ fontSize: "0.78rem", fontFamily: "monospace" }} />
          <button onClick={() => p.setShowApiKey(!p.showApiKey)} className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded hover:bg-[rgba(0,212,255,0.1)]">
            <span className="text-[rgba(0,212,255,0.4)]" style={{ fontSize: "0.65rem" }}>{p.showApiKey ? "隐藏" : "显示"}</span>
          </button>
        </div>
        <p className="text-[rgba(0,212,255,0.25)] mt-1" style={{ fontSize: "0.62rem" }}>
          {p.localApiKey ? "✅ API Key 已配置" : "⚠️ 未配置 Key，将使用本地模拟模式"}
        </p>
      </div>

      <div>
        <h4 className="text-[#e0f0ff] mb-2 flex items-center gap-2" style={{ fontSize: "0.82rem" }}><Cpu className="w-4 h-4 text-[#00d4ff]" /> 模型选择</h4>
        {p.availableModels.length > 0 ? (
          <div className="space-y-1">
            {p.availableModels.map(model => (
              <button key={model.id} onClick={() => { p.setLocalModel(model.id); p.persist("ai_assistant_model", model.id); }}
                className={`w-full px-3 py-2 rounded-lg text-left transition-all flex items-center gap-2 ${p.selectedModel === model.id ? "bg-[rgba(0,212,255,0.12)] border border-[rgba(0,212,255,0.3)] text-[#00d4ff]" : "bg-[rgba(0,40,80,0.2)] border border-[rgba(0,180,255,0.08)] text-[rgba(0,212,255,0.5)] hover:border-[rgba(0,180,255,0.2)]"}`}
                style={{ fontSize: "0.72rem" }}>
                {model.isLocal && <span className="text-[#00ff88] shrink-0" style={{ fontSize: "0.58rem" }}>本地</span>}
                <span className="truncate flex-1">{model.name}</span>
                <span className="text-[rgba(0,212,255,0.25)] shrink-0" style={{ fontSize: "0.55rem" }}>{model.provider}</span>
              </button>
            ))}
          </div>
        ) : <p className="text-[rgba(0,212,255,0.25)] text-center py-3" style={{ fontSize: "0.72rem" }}>暂无可用模型</p>}
      </div>

      <div>
        <h4 className="text-[#e0f0ff] mb-2" style={{ fontSize: "0.78rem" }}>家人模型绑定</h4>
        {FAMILY_PERSONAS.slice(0, 4).map(per => (
          <div key={per.id} className="flex items-center justify-between px-3 py-1.5 rounded-lg bg-[rgba(0,40,80,0.15)] border border-[rgba(0,180,255,0.06)]">
            <span className="text-[rgba(0,212,255,0.5)]" style={{ fontSize: "0.65rem" }}>{per.shortName}</span>
            <span className="text-[#e0f0ff]" style={{ fontSize: "0.62rem" }}>{per.modelName ?? "默认"}</span>
          </div>
        ))}
      </div>

      {/* Temperature */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <h4 className="text-[#e0f0ff]" style={{ fontSize: "0.82rem" }}>温度 (Temperature)</h4>
          <span className="text-[#00d4ff]" style={{ fontSize: "0.8rem" }}>{p.localTemperature.toFixed(2)}</span>
        </div>
        <input type="range" min="0" max="2" step="0.05" value={p.localTemperature}
          onChange={e => { p.setLocalTemperature(Number(e.target.value)); p.persist("ai_assistant_temperature", e.target.value); }}
          className="w-full accent-[#00d4ff]" />
      </div>
      {/* Top-P */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <h4 className="text-[#e0f0ff]" style={{ fontSize: "0.82rem" }}>Top-P (核采样)</h4>
          <span className="text-[#00d4ff]" style={{ fontSize: "0.8rem" }}>{p.localTopP.toFixed(2)}</span>
        </div>
        <input type="range" min="0" max="1" step="0.05" value={p.localTopP}
          onChange={e => { p.setLocalTopP(Number(e.target.value)); p.persist("ai_assistant_top_p", e.target.value); }}
          className="w-full accent-[#aa55ff]" />
      </div>
      {/* Max Tokens */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <h4 className="text-[#e0f0ff]" style={{ fontSize: "0.82rem" }}>最大 Token 数</h4>
          <span className="text-[#00d4ff]" style={{ fontSize: "0.8rem" }}>{p.localMaxTokens}</span>
        </div>
        <input type="range" min="256" max="8192" step="256" value={p.localMaxTokens}
          onChange={e => { p.setLocalMaxTokens(Number(e.target.value)); p.persist("ai_assistant_max_tokens", e.target.value); }}
          className="w-full accent-[#00ff88]" />
      </div>
      <button onClick={() => { p.setLocalTemperature(0.7); p.setLocalTopP(0.9); p.setLocalMaxTokens(2048); }}
        className="w-full py-2.5 rounded-xl bg-[rgba(0,40,80,0.2)] border border-[rgba(0,180,255,0.1)] text-[rgba(0,212,255,0.5)] hover:text-[#00d4ff] hover:border-[rgba(0,180,255,0.2)] transition-all" style={{ fontSize: "0.78rem" }}>
        <RotateCcw className="w-3.5 h-3.5 inline mr-2" /> 恢复默认参数
      </button>
    </div>
  );
}
