/**
 * @file: AIAssistant.tsx
 * @description: AI 智能助理浮窗组件 v3.0 - 模块化重构 + 双模式 (floating/inline)
 * @version: v3.0.0 (modular)
 * @created: 2026-06-12
 * @status: active
 * @tags: [component],[ai],[floating-window],[ai-family],[skills],[plugins],[modules]
 *
 * @dependencies:
 *   - react (^18 || ^19)
 *   - lucide-react (^0.500+)
 *
 * @usage:
 *   <AIAssistant />               ← 浮动按钮+面板 (默认)
 *   <AIAssistant mode="inline" /> ← 内嵌面板 (嵌入 AI Family 页面等)
 */
import React, { useState, useCallback } from "react";
import { Sparkles, X, Minimize2, Maximize2, Trash2, MessageSquare, Zap, Star, Code, Box, Grid3x3, BookOpen, Sliders } from "lucide-react";
import type { AIAssistantProps, TabKey, ChatMessage, AISkill, AIPlugin, AIModule } from "./types";
import { FAMILY_PERSONAS, PERSONAS_MAP, DEFAULT_MODELS, AI_SKILLS, AI_PLUGINS, AI_MODULES, PROMPT_PRESETS, INITIAL_TIMESTAMP, moodEmoji, generateMessageId, getCurrentTimestamp, ALL_TABS } from "./data";
import { getPersonaResponse, getPersonaGreeting } from "./mock";
import { AILogo } from "./components";
import { ChatPanel, CommandsPanel, PeoplePanel, SkillsPanel, PluginsPanel, ModulesPanel, PromptsPanel, SettingsPanel } from "./panels";

export { AIAssistantProps };

export function AIAssistant({
  isMobile = false,
  models: externalModels,
  apiKey: externalApiKey = "",
  baseUrl: _baseUrl = "",
  loading: _loading = false,
  mode = "floating",
  defaultOpen = true,
}: AIAssistantProps) {
  // ---- Panel state ----
  const [isOpen, setIsOpen] = useState(mode === "inline" ? defaultOpen : false);
  const [isMaximized, setIsMaximized] = useState(false);
  const [activeTab, setActiveTab] = useState<TabKey>("chat");

  // ---- AI Family 人格 ----
  const [activePersona, setActivePersona] = useState("meta-oracle");
  const currentPersona = PERSONAS_MAP[activePersona];

  // ---- Settings ----
  const availableModels = externalModels ?? DEFAULT_MODELS;
  const [localApiKey, setLocalApiKey] = useState(() => { try { return localStorage.getItem("ai_assistant_api_key") ?? externalApiKey; } catch { return externalApiKey; } });
  const [localModel, setLocalModel] = useState(() => { try { return localStorage.getItem("ai_assistant_model") ?? ""; } catch { return ""; } });
  const [localTemperature, setLocalTemperature] = useState(() => { try { return parseFloat(localStorage.getItem("ai_assistant_temperature") ?? "0.7"); } catch { return 0.7; } });
  const [localTopP, setLocalTopP] = useState(() => { try { return parseFloat(localStorage.getItem("ai_assistant_top_p") ?? "0.9"); } catch { return 0.9; } });
  const [localMaxTokens, setLocalMaxTokens] = useState(() => { try { return parseInt(localStorage.getItem("ai_assistant_max_tokens") ?? "2048"); } catch { return 2048; } });
  const persist = (key: string, value: string) => { try { localStorage.setItem(key, value); } catch {} };

  // ---- Chat state ----
  const [messages, setMessages] = useState<ChatMessage[]>([
    { id: "welcome", role: "assistant", content: getPersonaGreeting(activePersona), timestamp: INITIAL_TIMESTAMP, personaId: activePersona },
  ]);
  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);

  // ---- Other state ----
  const [showApiKey, setShowApiKey] = useState(false);
  const [systemPrompt, setSystemPrompt] = useState(PROMPT_PRESETS[4].prompt);
  const [cmdFilter, setCmdFilter] = useState("all");
  const [personaFilter, setPersonaFilter] = useState("all");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [skills, setSkills] = useState<AISkill[]>(AI_SKILLS);
  const [plugins, setPlugins] = useState<AIPlugin[]>(AI_PLUGINS);
  const [modules, setModules] = useState<AIModule[]>(AI_MODULES);
  const [skillFilter, setSkillFilter] = useState("all");
  const [pluginFilter, setPluginFilter] = useState("all");

  const selectedModel = localModel || availableModels[0]?.id || "";

  // ---- Actions ----
  const sendMessage = useCallback(async (content: string) => {
    if (!content.trim()) return;
    const userMsg: ChatMessage = { id: generateMessageId(), role: "user", content: content.trim(), timestamp: getCurrentTimestamp(), personaId: activePersona };
    setMessages(prev => [...prev, userMsg]);
    setInputValue("");
    setIsTyping(true);
    await new Promise(r => setTimeout(r, 800 + Math.random() * 1200));
    const response = getPersonaResponse(activePersona, content);
    const assistantMsg: ChatMessage = { id: generateMessageId("-resp"), role: "assistant", content: response, timestamp: getCurrentTimestamp(), personaId: activePersona, emotion: PERSONAS_MAP[activePersona]?.mood };
    setMessages(prev => [...prev, assistantMsg]);
    setIsTyping(false);
  }, [activePersona]);

  const switchPersona = (personaId: string) => {
    setActivePersona(personaId);
    const p = PERSONAS_MAP[personaId];
    if (!p) return;
    setMessages(prev => [...prev, { id: generateMessageId("-persona"), role: "system", content: `👤 已切换至「${p.name}」\n${p.greeting}\n\n角色: ${p.role} | 专长: ${p.expertise.join("、")}`, timestamp: getCurrentTimestamp() }]);
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text).catch(() => {});
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const clearChat = () => {
    setMessages([{ id: "welcome-new", role: "assistant", content: "对话已清空，请选择家人开始对话。", timestamp: getCurrentTimestamp(), personaId: activePersona }]);
  };

  // ---- Build shared panel props ----
  const panelProps = {
    activeTab, setActiveTab,
    messages, setMessages,
    inputValue, setInputValue,
    isTyping, sendMessage,
    activePersona, setActivePersona: switchPersona,
    cmdFilter, setCmdFilter,
    personaFilter, setPersonaFilter,
    skills, setSkills,
    plugins, setPlugins,
    modules, setModules,
    skillFilter, setSkillFilter,
    pluginFilter, setPluginFilter,
    systemPrompt, setSystemPrompt,
    localApiKey, setLocalApiKey,
    selectedModel,
    setLocalModel,
    availableModels,
    localTemperature, setLocalTemperature,
    localTopP, setLocalTopP,
    localMaxTokens, setLocalMaxTokens,
    showApiKey, setShowApiKey,
    persist,
    copyToClipboard, copiedId, clearChat,
  };

  const PersonaIcon = currentPersona?.icon ?? AILogo;

  // ---- Panel class (floating vs inline) ----
  const panelClass = mode === "inline"
    ? "w-full h-full rounded-2xl bg-[rgba(8,25,55,0.95)] backdrop-blur-2xl border border-[rgba(0,180,255,0.2)] shadow-[0_0_60px_rgba(0,180,255,0.12)] flex flex-col overflow-hidden"
    : isMaximized
      ? "fixed inset-4 md:inset-8 z-[60]"
      : isMobile
        ? "fixed inset-0 z-[60]"
        : "fixed bottom-20 right-4 w-[520px] h-[680px] z-[60]";

  // ========== FLOATING BUTTON (floating mode, closed) ==========
  if (mode === "floating" && !isOpen) {
    return (
      <button onClick={() => setIsOpen(true)} data-testid="ai-assistant-float-btn"
        className="fixed z-[60] group" style={{ bottom: isMobile ? 80 : 24, right: isMobile ? 16 : 24 }}>
        <div className="relative rounded-2xl bg-gradient-to-br from-[#00d4ff] to-[#7b2ff7] flex items-center justify-center shadow-[0_0_30px_rgba(0,180,255,0.4)] hover:shadow-[0_0_40px_rgba(0,180,255,0.6)] transition-all hover:scale-105 active:scale-95"
          style={{ width: isMobile ? 48 : 56, height: isMobile ? 48 : 56 }}>
          {currentPersona
            ? <PersonaIcon className="text-white" size={isMobile ? 22 : 26} style={{ color: currentPersona.color }} />
            : <AILogo size={isMobile ? 24 : 28} />}
          <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-[#00d4ff] to-[#7b2ff7] animate-ping opacity-20" />
          <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-[#00ff88] flex items-center justify-center shadow-[0_0_8px_rgba(0,255,136,0.5)]">
            <Sparkles className="w-3 h-3 text-[#060e1f]" />
          </div>
        </div>
        <div className="absolute bottom-full right-0 mb-2 px-3 py-1.5 rounded-lg bg-[rgba(8,25,55,0.95)] border border-[rgba(0,180,255,0.2)] opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
          <span className="text-[#00d4ff]" style={{ fontSize: "0.72rem" }}>{currentPersona?.shortName ?? "AI"} 智能助理</span>
        </div>
      </button>
    );
  }

  // ========== MAIN PANEL ==========
  return (
    <div className={mode === "floating" ? panelClass : ""}>
      <div className={mode === "floating" ? panelClass : "w-full h-full rounded-2xl bg-[rgba(8,25,55,0.95)] backdrop-blur-2xl border border-[rgba(0,180,255,0.2)] shadow-[0_0_60px_rgba(0,180,255,0.12)] flex flex-col overflow-hidden"}>
        {/* ===== HEADER + Persona Bar ===== */}
        <div className="shrink-0 border-b border-[rgba(0,180,255,0.12)] bg-[rgba(0,40,80,0.2)]">
          <div className="flex items-center justify-between px-4 py-2.5">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center shadow-[0_0_15px_rgba(0,180,255,0.3)] overflow-hidden"
                style={{ background: `linear-gradient(135deg, ${currentPersona?.color ?? "#00d4ff"}, ${currentPersona?.color ? `${currentPersona.color}88` : "#7b2ff7"})` }}>
                {currentPersona ? <PersonaIcon className="text-white" size={18} /> : <AILogo size={20} />}
              </div>
              <div>
                <h3 className="text-[#e0f0ff] flex items-center gap-1.5" style={{ fontSize: "0.85rem" }}>
                  {currentPersona?.shortName ?? "AI"}
                  <span className="text-[rgba(0,212,255,0.3)]" style={{ fontSize: "0.55rem" }}>{currentPersona?.enTitle ?? "Assistant"}</span>
                  {currentPersona?.mood && <span className="text-xs">{moodEmoji[currentPersona.mood] ?? "✨"}</span>}
                </h3>
                <div className="flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#00ff88] animate-pulse" />
                  <span className="text-[rgba(0,212,255,0.35)] truncate" style={{ fontSize: "0.6rem" }}>
                    {currentPersona?.expertise[0] ?? (availableModels.find(m => m.id === selectedModel)?.name ?? "就绪")}
                  </span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-1">
              {mode === "floating" && (
                <>
                  <button onClick={clearChat} className="p-1.5 rounded-lg hover:bg-[rgba(0,212,255,0.1)] transition-all" title="清空">
                    <Trash2 className="w-4 h-4 text-[rgba(0,212,255,0.4)]" />
                  </button>
                  {!isMobile && (
                    <button onClick={() => setIsMaximized(!isMaximized)} className="p-1.5 rounded-lg hover:bg-[rgba(0,212,255,0.1)] transition-all">
                      {isMaximized ? <Minimize2 className="w-4 h-4 text-[rgba(0,212,255,0.4)]" /> : <Maximize2 className="w-4 h-4 text-[rgba(0,212,255,0.4)]" />}
                    </button>
                  )}
                  <button onClick={() => { setIsOpen(false); setIsMaximized(false); }} className="p-1.5 rounded-lg hover:bg-[rgba(255,51,102,0.1)] transition-all">
                    <X className="w-4 h-4 text-[rgba(0,212,255,0.5)]" />
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Persona Avatar Bar */}
          <div className="flex items-center gap-1 px-3 pb-2.5 overflow-x-auto hide-scrollbar">
            {FAMILY_PERSONAS.map(p => {
              const Icon = p.icon;
              const isActive = activePersona === p.id;
              return (
                <button key={p.id} onClick={() => switchPersona(p.id)} className="flex flex-col items-center gap-0.5 shrink-0 transition-all" style={{ minWidth: "44px" }} title={`${p.name} - ${p.role}`}>
                  <div className="rounded-lg flex items-center justify-center transition-all" style={{
                    width: 32, height: 32,
                    background: isActive ? `${p.color}22` : "rgba(0,40,80,0.3)",
                    border: `1.5px solid ${isActive ? p.color : "rgba(0,180,255,0.08)"}`,
                    boxShadow: isActive ? `0 0 12px ${p.color}44` : "none",
                  }}>
                    <Icon size={16} style={{ color: p.color }} />
                  </div>
                  <span style={{ fontSize: "0.5rem", color: isActive ? p.color : "rgba(0,212,255,0.3)", fontWeight: isActive ? 600 : 400 }}>{p.shortName}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* ===== Tab Bar ===== */}
        <div className="shrink-0 flex items-center gap-0.5 px-2 py-1.5 border-b border-[rgba(0,180,255,0.08)] bg-[rgba(0,40,80,0.1)] overflow-x-auto hide-scrollbar">
          {ALL_TABS.map(tab => (
            <button key={tab.key} onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg transition-all shrink-0 ${activeTab === tab.key ? "bg-[rgba(0,212,255,0.12)] text-[#00d4ff] border border-[rgba(0,212,255,0.25)]" : "text-[rgba(0,212,255,0.4)] hover:text-[#00d4ff] border border-transparent"}`}
              style={{ fontSize: "0.68rem" }}>
              <tab.icon className="w-3 h-3" /> {tab.label}
            </button>
          ))}
        </div>

        {/* ===== Content Area (Tab Switch) ===== */}
        <div className="flex-1 overflow-hidden flex flex-col">
          {activeTab === "chat"     && <ChatPanel {...panelProps} />}
          {activeTab === "commands" && <CommandsPanel {...panelProps} />}
          {activeTab === "people"   && <PeoplePanel {...panelProps} />}
          {activeTab === "skills"   && <SkillsPanel {...panelProps} />}
          {activeTab === "plugins"  && <PluginsPanel {...panelProps} />}
          {activeTab === "modules"  && <ModulesPanel {...panelProps} />}
          {activeTab === "prompts"  && <PromptsPanel {...panelProps} />}
          {activeTab === "settings" && <SettingsPanel {...panelProps} />}
        </div>
      </div>
    </div>
  );
}

export default AIAssistant;
