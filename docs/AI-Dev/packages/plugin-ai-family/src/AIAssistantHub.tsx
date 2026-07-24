/**
 * @file: AIAssistantHub.tsx
 * @description: AI Family 中枢浮窗 — 统一协同所有系统的入口
 *
 * 相比原 AIAssistant 的变化:
 * 1. 全局事件总线 → 接收/发送跨系统事件
 * 2. Hub Command Tab → 显示所有注册系统的快捷命令
 * 3. 统一存储 → 使用 yyc3:ai-family 命名空间
 * 4. 不再内联数据 → 通过 SystemRegistration 注入
 */
import React, { useState, useCallback, useEffect } from "react";
import {
  Sparkles, X, Minimize2, Maximize2, Command, Send,
  MessageSquare, Star, BookOpen, Sliders, Grid3x3, Activity,
  Zap, Plus,
} from "lucide-react";
import { eventBus, Events, storage, StorageKeys } from "@yyc3/shell";
import type { HubCommand } from "@yyc3/shell";
import { FAMILY_PERSONAS, PERSONAS_MAP, PROMPT_PRESETS, DEFAULT_MODELS, INITIAL_TIMESTAMP, moodEmoji, generateMessageId, getCurrentTimestamp } from "./data";
import { getPersonaResponse, getPersonaGreeting } from "./mock";
import type { ChatMessage, TabKey } from "./types";
import { AILogo, EmotionRipple, useSpeechRecognition } from "./components";
import { ChatPanel, PeoplePanel, PromptsPanel, SettingsPanel } from "./panels";

export interface AIAssistantHubProps {
  isMobile?: boolean;
  /** 来自其他注册系统的 Hub 命令 */
  externalCommands?: HubCommand[];
  /** AI Family 配置 */
  apiKey?: string;
  models?: { id: string; name: string; provider: string; isLocal: boolean }[];
}

type HubTab = TabKey | "hub-commands";

const HUB_TABS = [
  { key: "chat" as HubTab,         icon: MessageSquare, label: "对话" },
  { key: "hub-commands" as HubTab, icon: Command,       label: "系统" },
  { key: "people" as HubTab,       icon: Star,          label: "家人" },
  { key: "prompts" as HubTab,      icon: BookOpen,      label: "提示词" },
  { key: "settings" as HubTab,     icon: Sliders,       label: "配置" },
];

export function AIAssistantHub({
  isMobile = false,
  externalCommands = [],
  apiKey: externalApiKey = "",
  models: externalModels,
}: AIAssistantHubProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isMaximized, setIsMaximized] = useState(false);
  const [activeTab, setActiveTab] = useState<HubTab>("chat");

  // AI Family 人格
  const aiFamilyStorage = storage.aiFamily;
  const [activePersona, setActivePersona] = useState(() => aiFamilyStorage.get("activePersona", "meta-oracle")!);
  const currentPersona = PERSONAS_MAP[activePersona];

  // 持久化人格切换
  const switchPersona = useCallback((personaId: string) => {
    setActivePersona(personaId);
    aiFamilyStorage.set("activePersona", personaId);
    eventBus.emit(Events.AI_PERSONA_CHANGED, personaId);
    const p = PERSONAS_MAP[personaId];
    if (!p) return;
    setMessages(prev => [...prev, {
      id: generateMessageId("-persona"), role: "system",
      content: `👤 已切换至「${p.name}」\n${p.greeting}`,
      timestamp: getCurrentTimestamp(),
    }]);
  }, []);

  // 监听 Hub 事件
  useEffect(() => {
    const unsubOpen = eventBus.on(Events.HUB_OPEN, (tab?: string) => {
      setIsOpen(true);
      if (tab) setActiveTab(tab as HubTab);
    });
    const unsubClose = eventBus.on(Events.HUB_CLOSE, () => setIsOpen(false));
    const unsubNav = eventBus.on(Events.HUB_NAVIGATE, (tab: string) => setActiveTab(tab as HubTab));
    return () => { unsubOpen(); unsubClose(); unsubNav(); };
  }, []);

  // 聊天状态
  const availableModels = externalModels ?? DEFAULT_MODELS;
  const [messages, setMessages] = useState<ChatMessage[]>([
    { id: "welcome", role: "assistant", content: getPersonaGreeting(activePersona), timestamp: INITIAL_TIMESTAMP, personaId: activePersona },
  ]);
  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [systemPrompt, setSystemPrompt] = useState(PROMPT_PRESETS[4].prompt);
  const [showApiKey, setShowApiKey] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [skillFilter, setSkillFilter] = useState("all");
  const [pluginFilter, setPluginFilter] = useState("all");
  const [cmdFilter, setCmdFilter] = useState("all");
  const [personaFilter, setPersonaFilter] = useState("all");

  const { isListening, transcript, supported: voiceSupported, startListening, stopListening } = useSpeechRecognition();
  useEffect(() => { if (transcript) setInputValue(transcript); }, [transcript]);

  const sendMessage = useCallback(async (content: string) => {
    if (!content.trim()) return;
    const userMsg = { id: generateMessageId(), role: "user" as const, content: content.trim(), timestamp: getCurrentTimestamp(), personaId: activePersona };
    setMessages(prev => [...prev, userMsg]);
    setInputValue(""); setIsTyping(true);
    await new Promise(r => setTimeout(r, 800 + Math.random() * 1200));
    const response = getPersonaResponse(activePersona, content);
    const assistantMsg = { id: generateMessageId("-resp"), role: "assistant" as const, content: response, timestamp: getCurrentTimestamp(), personaId: activePersona, emotion: PERSONAS_MAP[activePersona]?.mood };
    setMessages(prev => [...prev, assistantMsg]);
    setIsTyping(false);
    eventBus.emit(Events.AI_RESPONSE, response, activePersona);
  }, [activePersona]);

  const executeCommand = (cmd: any) => {
    if (cmd.action) { setActiveTab("chat"); sendMessage(cmd.action); }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text).catch(() => {});
    setCopiedId(id); setTimeout(() => setCopiedId(null), 2000);
  };

  const clearChat = () => {
    setMessages([{ id: "welcome-new", role: "assistant", content: "对话已清空。", timestamp: getCurrentTimestamp(), personaId: activePersona }]);
  };

  // 合并命令 (本系统 + 外部注册)
  const allCommands = [
    ...(externalCommands ?? []),
    ...FAMILY_PERSONAS.map(p => ({
      id: `persona-${p.id}`,
      label: `呼叫 ${p.shortName}`,
      systemId: "ai-family",
      icon: p.icon,
      action: () => switchPersona(p.id),
    })),
  ];

  const PersonaIcon = currentPersona?.icon ?? AILogo;
  const panelClass = isMaximized ? "fixed inset-4 md:inset-8 z-[60]" :
    isMobile ? "fixed inset-0 z-[60]" : "fixed bottom-20 right-4 w-[520px] h-[680px] z-[60]";

  // ===== 浮动按钮 =====
  if (!isOpen) {
    return (
      <button onClick={() => setIsOpen(true)} data-testid="hub-float-btn"
        className="fixed z-[60] group" style={{ bottom: isMobile ? 80 : 24, right: isMobile ? 16 : 24 }}>
        <div className="relative rounded-2xl bg-gradient-to-br from-[#00FF88] to-[#00d4ff] flex items-center justify-center shadow-[0_0_30px_rgba(0,255,136,0.3)] hover:shadow-[0_0_40px_rgba(0,255,136,0.5)] transition-all hover:scale-105 active:scale-95"
          style={{ width: isMobile ? 48 : 56, height: isMobile ? 48 : 56 }}>
          {currentPersona
            ? <PersonaIcon className="text-white" size={isMobile ? 22 : 26} style={{ color: currentPersona.color }} />
            : <AILogo size={isMobile ? 24 : 28} />}
          <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-[#00FF88] to-[#00d4ff] animate-ping opacity-20" />
          <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-[#00ff88] flex items-center justify-center shadow-[0_0_8px_rgba(0,255,136,0.5)]">
            <Sparkles className="w-3 h-3 text-[#060e1f]" />
          </div>
        </div>
        <div className="absolute bottom-full right-0 mb-2 px-3 py-1.5 rounded-lg bg-[rgba(8,25,55,0.95)] border border-[rgba(0,255,136,0.2)] opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
          <span className="text-[#00FF88]" style={{ fontSize: "0.72rem" }}>AI Family 中枢</span>
        </div>
      </button>
    );
  }

  // ===== 主面板 =====
  return (
    <div className={panelClass}>
      <div className="w-full h-full rounded-2xl bg-[rgba(8,25,55,0.95)] backdrop-blur-2xl border border-[rgba(0,255,136,0.15)] shadow-[0_0_60px_rgba(0,255,136,0.08)] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="shrink-0 border-b border-[rgba(0,255,136,0.1)] bg-[rgba(0,40,80,0.2)]">
          <div className="flex items-center justify-between px-4 py-2.5">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center shadow-[0_0_15px_rgba(0,255,136,0.2)] overflow-hidden"
                style={{ background: `linear-gradient(135deg, #00FF88, #00d4ff)` }}>
                {currentPersona ? <PersonaIcon className="text-white" size={18} /> : <AILogo size={20} />}
              </div>
              <div>
                <h3 className="text-[#e0f0ff] flex items-center gap-1.5" style={{ fontSize: "0.85rem" }}>
                  AI Family 中枢
                  <span className="text-[rgba(0,255,136,0.4)]" style={{ fontSize: "0.55rem" }}>
                    {currentPersona?.shortName ?? "Hub"}
                  </span>
                </h3>
                <div className="flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#00FF88] animate-pulse" />
                  <span className="text-[rgba(0,255,136,0.35)]" style={{ fontSize: "0.6rem" }}>
                    {currentPersona?.expertise[0] ?? "协同就绪"}
                    {externalCommands.length > 0 && ` · ${externalCommands.length} 个系统接入`}
                  </span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button onClick={clearChat} className="p-1.5 rounded-lg hover:bg-[rgba(0,212,255,0.1)]" title="清空">
                <X className="w-4 h-4 text-[rgba(0,255,136,0.4)]" />
              </button>
              {!isMobile && (
                <button onClick={() => setIsMaximized(!isMaximized)} className="p-1.5 rounded-lg hover:bg-[rgba(0,212,255,0.1)]">
                  {isMaximized ? <Minimize2 className="w-4 h-4 text-[rgba(0,255,136,0.4)]" /> : <Maximize2 className="w-4 h-4 text-[rgba(0,255,136,0.4)]" />}
                </button>
              )}
              <button onClick={() => setIsOpen(false)} className="p-1.5 rounded-lg hover:bg-[rgba(255,51,102,0.1)]">
                <X className="w-4 h-4 text-[rgba(0,255,136,0.5)]" />
              </button>
            </div>
          </div>
          {/* 人格切换栏 */}
          <div className="flex items-center gap-1 px-3 pb-2.5 overflow-x-auto hide-scrollbar">
            {FAMILY_PERSONAS.map(p => {
              const Icon = p.icon;
              const isActive = activePersona === p.id;
              return (
                <button key={p.id} onClick={() => switchPersona(p.id)} className="flex flex-col items-center gap-0.5 shrink-0" style={{ minWidth: "44px" }}>
                  <div className="rounded-lg flex items-center justify-center transition-all" style={{
                    width: 32, height: 32,
                    background: isActive ? `${p.color}22` : "rgba(0,40,80,0.3)",
                    border: `1.5px solid ${isActive ? p.color : "rgba(0,255,136,0.08)"}`,
                    boxShadow: isActive ? `0 0 12px ${p.color}44` : "none",
                  }}>
                    <Icon size={16} style={{ color: p.color }} />
                  </div>
                  <span style={{ fontSize: "0.5rem", color: isActive ? p.color : "rgba(0,255,136,0.3)" }}>{p.shortName}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Tab bar */}
        <div className="shrink-0 flex items-center gap-0.5 px-2 py-1.5 border-b border-[rgba(0,255,136,0.06)] bg-[rgba(0,40,80,0.1)] overflow-x-auto hide-scrollbar">
          {HUB_TABS.map(tab => (
            <button key={tab.key} onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg shrink-0 ${activeTab === tab.key ? "bg-[rgba(0,255,136,0.12)] text-[#00FF88] border border-[rgba(0,255,136,0.25)]" : "text-[rgba(0,255,136,0.4)] hover:text-[#00FF88] border border-transparent"}`}
              style={{ fontSize: "0.68rem" }}>
              <tab.icon className="w-3 h-3" /> {tab.label}
            </button>
          ))}
        </div>

        {/* 内容区域 */}
        <div className="flex-1 overflow-hidden flex flex-col">
          {/* 对话 */}
          {activeTab === "chat" && (
            <ChatPanel
              messages={messages} setMessages={setMessages}
              inputValue={inputValue} setInputValue={setInputValue}
              isTyping={isTyping} sendMessage={sendMessage}
              activePersona={activePersona}
              voiceSupported={voiceSupported}
              isListening={isListening} startListening={startListening} stopListening={stopListening}
              copyToClipboard={copyToClipboard} copiedId={copiedId}
            />
          )}

          {/* 系统命令 (Hub) */}
          {activeTab === "hub-commands" && (
            <div className="flex-1 overflow-auto p-3">
              <h4 className="text-[#e0f0ff] mb-3" style={{ fontSize: "0.82rem" }}>系统快捷命令</h4>
              <p className="text-[rgba(0,255,136,0.3)] mb-3" style={{ fontSize: "0.62rem" }}>
                {allCommands.length} 条命令 · 来自 {new Set(allCommands.map(c => c.systemId)).size} 个系统
              </p>
              {/* 按系统分组 */}
              {Array.from(new Set(allCommands.map(c => c.systemId))).map(sysId => (
                <div key={sysId} className="mb-3">
                  <p className="text-[rgba(0,255,136,0.4)] mb-1.5" style={{ fontSize: "0.65rem" }}>
                    {sysId === "ai-family" ? "🤖 AI Family" : `📦 ${sysId}`}
                  </p>
                  <div className="space-y-1">
                    {allCommands.filter(c => c.systemId === sysId).map(cmd => {
                      const Icon = cmd.icon;
                      return (
                        <button key={cmd.id} onClick={() => cmd.action()}
                          className="w-full flex items-center gap-3 p-2.5 rounded-xl bg-[rgba(0,40,80,0.2)] border border-[rgba(0,255,136,0.06)] hover:border-[rgba(0,255,136,0.15)] transition-all text-left"
                          style={{ fontSize: "0.75rem" }}>
                          <Icon className="w-4 h-4" style={{ color: "#00FF88" }} />
                          <span className="text-[#e0f0ff]">{cmd.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
              {/* + 添加占位提示 */}
              <div className="p-3 rounded-xl bg-[rgba(0,255,136,0.03)] border border-dashed border-[rgba(0,255,136,0.1)] text-center">
                <p className="text-[rgba(0,255,136,0.25)]" style={{ fontSize: "0.6rem" }}>
                  各系统可注册 Hub 命令到中枢浮窗
                </p>
              </div>
            </div>
          )}

          {/* 家人 / 提示词 / 配置 */}
          {activeTab === "people" && (
            <PeoplePanel activePersona={activePersona} switchPersona={switchPersona} />
          )}
          {activeTab === "prompts" && (
            <PromptsPanel
              PROMPT_PRESETS={PROMPT_PRESETS}
              systemPrompt={systemPrompt} setSystemPrompt={setSystemPrompt}
              setActiveTab={setActiveTab as any} setMessages={setMessages}
            />
          )}
          {activeTab === "settings" && (
            <SettingsPanel
              availableModels={availableModels}
              apiKey={aiFamilyStorage.get(StorageKeys.AI_API_KEY, "")!}
              setApiKey={(v: string) => aiFamilyStorage.set(StorageKeys.AI_API_KEY, v)}
              showApiKey={showApiKey} setShowApiKey={setShowApiKey}
              storage={aiFamilyStorage}
            />
          )}
        </div>
      </div>
    </div>
  );
}
