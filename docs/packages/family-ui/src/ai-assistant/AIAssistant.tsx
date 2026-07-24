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

/**
 * @file: AIAssistant.tsx
 * @description: AI 智能助理 v3.2 - 可拖拽 + 可缩放 + 自适应 + Logo触发
 * @version: v3.2.0
 */
import React, { useState, useCallback, useRef, useEffect, useMemo } from "react";
import { Sparkles, X, Trash2, MessageSquare, Zap, Star, Code, Box, Grid3x3, BookOpen, Sliders } from "lucide-react";
import type { AIAssistantProps, TabKey, ChatMessage, AISkill, AIPlugin, AIModule } from "./types";
import { FAMILY_PERSONAS, PERSONAS_MAP, DEFAULT_MODELS, AI_SKILLS, AI_PLUGINS, AI_MODULES, PROMPT_PRESETS, INITIAL_TIMESTAMP, generateMessageId, getCurrentTimestamp } from "./data";
import { getPersonaResponse, getPersonaGreeting } from "./mock";
import { AILogo } from "./components";
import { ChatPanel, CommandsPanel, PeoplePanel, SkillsPanel, PluginsPanel, ModulesPanel, PromptsPanel, SettingsPanel } from "./panels";
import { useI18n } from "../hooks/useI18n";

export { AIAssistantProps };

const MIN_W = 400, MIN_H = 400;
const PANEL_W = 520, PANEL_H = 680;

/** 全局 AI 浮窗开关事件 — 供 YYC³ Logo 等外部触发 */
export function triggerAIAssistant() {
  window.dispatchEvent(new CustomEvent('yyc3:toggle-ai'));
}

export function AIAssistant({
  isMobile = false,
  models: externalModels,
  apiKey: externalApiKey = "",
  baseUrl: _baseUrl = "",
  loading: _loading = false,
  mode = "floating",
  defaultOpen = true,
}: AIAssistantProps) {
  const { t } = useI18n();
  const [isOpen, setIsOpen] = useState(mode === "inline" ? defaultOpen : false);
  const [activeTab, setActiveTab] = useState<TabKey>("chat");
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const [size, setSize] = useState({ w: PANEL_W, h: PANEL_H });
  const panelRef = useRef<HTMLDivElement>(null);

  // 动态多语言 Tabs
  const ALL_TABS = useMemo(() => [
    { key: "chat" as TabKey, icon: MessageSquare, label: t("aiAssistant.tabs.chat") },
    { key: "commands" as TabKey, icon: Zap, label: t("aiAssistant.tabs.commands") },
    { key: "people" as TabKey, icon: Star, label: t("aiAssistant.tabs.people") },
    { key: "skills" as TabKey, icon: Code, label: t("aiAssistant.tabs.skills") },
    { key: "plugins" as TabKey, icon: Box, label: t("aiAssistant.tabs.plugins") },
    { key: "modules" as TabKey, icon: Grid3x3, label: t("aiAssistant.tabs.modules") },
    { key: "prompts" as TabKey, icon: BookOpen, label: t("aiAssistant.tabs.prompts") },
    { key: "settings" as TabKey, icon: Sliders, label: t("aiAssistant.tabs.settings") },
  ], [t]);

  // 缩放比例（相对于默认尺寸）
  const scale = Math.min(size.w / PANEL_W, size.h / PANEL_H);

  // 监听全局 toggle 事件
  useEffect(() => {
    const handler = () => { setIsOpen(prev => !prev); };
    window.addEventListener('yyc3:toggle-ai', handler);
    return () => window.removeEventListener('yyc3:toggle-ai', handler);
  }, []);

  const [activePersona, setActivePersona] = useState("meta-oracle");
  const currentPersona = PERSONAS_MAP[activePersona];
  const availableModels = externalModels ?? DEFAULT_MODELS;
  const [localApiKey, setLocalApiKey] = useState(() => { try { return localStorage.getItem("ai_assistant_api_key") ?? externalApiKey; } catch { return externalApiKey; } });
  const [localModel, setLocalModel] = useState(() => { try { return localStorage.getItem("ai_assistant_model") ?? ""; } catch { return ""; } });
  const [localTemperature, setLocalTemperature] = useState(() => { try { return parseFloat(localStorage.getItem("ai_assistant_temperature") ?? "0.7"); } catch { return 0.7; } });
  const [localTopP, setLocalTopP] = useState(() => { try { return parseFloat(localStorage.getItem("ai_assistant_top_p") ?? "0.9"); } catch { return 0.9; } });
  const [localMaxTokens, setLocalMaxTokens] = useState(() => { try { return parseInt(localStorage.getItem("ai_assistant_max_tokens") ?? "2048"); } catch { return 2048; } });
  const persist = (key: string, value: string) => { try { localStorage.setItem(key, value); } catch { /* ignore localStorage errors */ } };
  const [messages, setMessages] = useState<ChatMessage[]>([
    { id: "welcome", role: "assistant", content: getPersonaGreeting(activePersona), timestamp: INITIAL_TIMESTAMP, personaId: activePersona },
  ]);
  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);
  const [systemPrompt, setSystemPrompt] = useState(PROMPT_PRESETS[4]?.prompt ?? "");
  const [cmdFilter, setCmdFilter] = useState("all");
  const [personaFilter, setPersonaFilter] = useState("all");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [skills, setSkills] = useState<AISkill[]>(AI_SKILLS);
  const [plugins, setPlugins] = useState<AIPlugin[]>(AI_PLUGINS);
  const [modules, setModules] = useState<AIModule[]>(AI_MODULES);
  const [skillFilter, setSkillFilter] = useState("all");
  const [pluginFilter, setPluginFilter] = useState("all");
  const selectedModel = localModel || availableModels[0]?.id || "";

  // ---- Auto-center on open ----
  useEffect(() => {
    if (!isOpen) return;
    const vw = window.innerWidth, vh = window.innerHeight;
    const maxW = Math.min(PANEL_W, vw - 40), maxH = Math.min(PANEL_H, vh - 40);
    setPos({ x: Math.max(10, Math.min((vw - maxW) / 2, vw - maxW - 10)), y: Math.max(10, Math.min((vh - maxH) / 2, vh - maxH - 10)) });
    setSize({ w: maxW, h: maxH });
  }, [isOpen]);

  // ---- Drag (using refs to avoid stale closure & cursor stuck) ----
  const dragCtx = useRef({ startX: 0, startY: 0, origX: 0, origY: 0, w: PANEL_W, h: PANEL_H, edge: '' });
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    if (!isDragging) return;
    const onMove = (e: MouseEvent) => {
      const ctx = dragCtx.current;
      if (ctx.edge) {
        // Resize
        const dx = e.clientX - ctx.startX, dy = e.clientY - ctx.startY;
        let nw = ctx.w, nh = ctx.h, nx = ctx.origX, ny = ctx.origY;
        if (ctx.edge.includes('e')) nw = Math.max(MIN_W, ctx.w + dx);
        if (ctx.edge.includes('w')) { nw = Math.max(MIN_W, ctx.w - dx); nx = ctx.origX + (ctx.w - nw); }
        if (ctx.edge.includes('s')) nh = Math.max(MIN_H, ctx.h + dy);
        if (ctx.edge.includes('n')) { nh = Math.max(MIN_H, ctx.h - dy); ny = ctx.origY + (ctx.h - nh); }
        setSize({ w: nw, h: nh }); setPos({ x: nx, y: ny });
      } else {
        // Drag
        setPos({
          x: Math.max(10, Math.min(ctx.origX + (e.clientX - ctx.startX), window.innerWidth - ctx.w - 10)),
          y: Math.max(10, Math.min(ctx.origY + (e.clientY - ctx.startY), window.innerHeight - ctx.h - 10)),
        });
      }
    };
    const onUp = () => { setIsDragging(false); document.removeEventListener('mousemove', onMove); document.removeEventListener('mouseup', onUp); document.body.style.cursor = ''; };
    document.addEventListener('mousemove', onMove); document.addEventListener('mouseup', onUp);
    return () => { document.removeEventListener('mousemove', onMove); document.removeEventListener('mouseup', onUp); document.body.style.cursor = ''; };
  }, [isDragging]);

  const startDrag = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    // 不拦截按钮、输入框、选择器等交互元素
    const tag = target.tagName.toLowerCase();
    if (tag === 'button' || tag === 'input' || tag === 'textarea' || tag === 'select' || tag === 'a' || tag === 'label') return;
    if (target.closest('button') || target.closest('input') || target.closest('textarea') || target.closest('select') || target.closest('a')) return;
    // 不拦截有 cursor-pointer 类的元素（Tab 按钮等）
    if (target.closest('.cursor-pointer')) return;
    e.preventDefault();
    dragCtx.current = { startX: e.clientX, startY: e.clientY, origX: pos.x, origY: pos.y, w: size.w, h: size.h, edge: '' };
    document.body.style.cursor = 'grabbing';
    setIsDragging(true);
  };

  const startResize = (edge: string, e: React.MouseEvent) => {
    e.preventDefault(); e.stopPropagation();
    dragCtx.current = { startX: e.clientX, startY: e.clientY, origX: pos.x, origY: pos.y, w: size.w, h: size.h, edge };
    document.body.style.cursor = `${edge}-resize`;
    setIsDragging(true);
  };

  const sendMessage = useCallback(async (content: string) => {
    if (!content.trim()) return;
    const userMsg: ChatMessage = { id: generateMessageId(), role: "user", content: content.trim(), timestamp: getCurrentTimestamp(), personaId: activePersona };
    setMessages(prev => [...prev, userMsg]); setInputValue(""); setIsTyping(true);
    await new Promise(r => setTimeout(r, 800 + Math.random() * 1200));
    setMessages(prev => [...prev, { id: generateMessageId("-resp"), role: "assistant", content: getPersonaResponse(activePersona, content), timestamp: getCurrentTimestamp(), personaId: activePersona, emotion: PERSONAS_MAP[activePersona]?.mood }]);
    setIsTyping(false);
  }, [activePersona]);

  const switchPersona = (personaId: string) => {
    setActivePersona(personaId);
    const p = PERSONAS_MAP[personaId];
    if (!p) return;
    setMessages(prev => [...prev, { id: generateMessageId("-persona"), role: "system", content: `👤 已切换至「${p.name}」\n${p.greeting}\n\n角色: ${p.role} | 专长: ${p.expertise.join("、")}`, timestamp: getCurrentTimestamp() }]);
  };
  const copyToClipboard = (text: string, id: string) => { navigator.clipboard.writeText(text).catch(() => {}); setCopiedId(id); setTimeout(() => setCopiedId(null), 2000); };
  const clearChat = () => { setMessages([{ id: "welcome-new", role: "assistant", content: "对话已清空", timestamp: getCurrentTimestamp(), personaId: activePersona }]); };

  const sharedProps = {
    activeTab, setActiveTab, messages, setMessages, inputValue, setInputValue, isTyping, sendMessage,
    activePersona, setActivePersona: switchPersona, cmdFilter, setCmdFilter, personaFilter, setPersonaFilter,
    skills, setSkills, plugins, setPlugins, modules, setModules, skillFilter, setSkillFilter, pluginFilter, setPluginFilter,
    systemPrompt, setSystemPrompt, localApiKey, setLocalApiKey, selectedModel, setLocalModel, availableModels,
    localTemperature, setLocalTemperature, localTopP, setLocalTopP, localMaxTokens, setLocalMaxTokens,
    showApiKey, setShowApiKey, persist, copyToClipboard, copiedId, clearChat, scale,
  };
  const PersonaIcon = currentPersona?.icon ?? AILogo;

  // ========== FLOATING BUTTON ==========
  if (mode === "floating" && !isOpen) {
    return (
      <button onClick={() => setIsOpen(true)} data-testid="ai-assistant-float-btn"
        className="fixed z-[60] group" style={{ bottom: isMobile ? 80 : 24, right: isMobile ? 16 : 24 }}>
        <div className="relative rounded-2xl bg-gradient-to-br from-[#00d4ff] to-[#7b2ff7] flex items-center justify-center shadow-[0_0_30px_rgba(0,180,255,0.4)] hover:shadow-[0_0_40px_rgba(0,180,255,0.6)] transition-all hover:scale-105 active:scale-95"
          style={{ width: isMobile ? 48 : 56, height: isMobile ? 48 : 56 }}>
          {currentPersona ? <PersonaIcon className="text-white" size={isMobile ? 22 : 26} style={{ color: currentPersona.color }} /> : <AILogo size={isMobile ? 24 : 28} />}
          <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-[#00d4ff] to-[#7b2ff7] animate-ping opacity-20" />
          <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-[#00ff88] flex items-center justify-center shadow-[0_0_8px_rgba(0,255,136,0.5)]">
            <Sparkles className="w-3 h-3 text-[#060e1f]" />
          </div>
        </div>
      </button>
    );
  }

  // ========== FLOATING PANEL ==========
  if (mode === "floating" && isOpen) {
    return (
      <div className="fixed inset-0 z-[55]" style={{ background: "rgba(0,0,0,0.25)" }} onClick={() => setIsOpen(false)}>
        <div ref={panelRef} onMouseDown={startDrag} onClick={(e) => e.stopPropagation()}
          className="fixed flex flex-col overflow-hidden"
          style={{
            left: pos.x, top: pos.y, width: size.w, height: size.h,
            background: "#0a1128", borderRadius: Math.max(8, 16 * scale),
            border: "1px solid rgba(0,180,255,0.2)",
            boxShadow: "0 0 60px rgba(0,0,0,0.5), 0 0 40px rgba(0,212,255,0.08)",
            fontSize: `${0.85 * scale}rem`,
          }}
        >

          {/* 8 向缩放手柄（n/s 水平 bar, e/w 垂直 bar, 对角 10×10） */}
          {['n','s','e','w','ne','nw','se','sw'].map(edge => {
            const isCorner = edge.length === 2;
            const isHorizontal = edge === 'n' || edge === 's';
            return (
              <div key={edge} onMouseDown={(e) => startResize(edge, e)}
                style={{
                  position: 'absolute', zIndex: 25, background: 'transparent',
                  ...(edge.includes('n') ? { top: -4 } : edge.includes('s') ? { bottom: -4 } : { top: 0, bottom: 0 }),
                  ...(edge.includes('w') ? { left: -4 } : edge.includes('e') ? { right: -4 } : { left: 0, right: 0 }),
                  width: isCorner ? 10 : isHorizontal ? '100%' : 10,
                  height: isCorner ? 10 : isHorizontal ? 10 : '100%',
                  cursor: `${edge}-resize`,
                }}
              />
            );
          })}

          {/* ===== 面板内容 ===== */}
          <div className="flex flex-col" style={{ height: '100%' }}>
            {/* Header */}
            <div className="shrink-0" style={{ borderBottom: '1px solid rgba(0,180,255,0.12)', background: '#0d1530' }}>
              <div className="flex items-center justify-between" style={{ padding: '8px 12px' }}>
                <div className="flex items-center gap-2">
                  <div style={{ width: 32, height: 32, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', background: `linear-gradient(135deg, ${currentPersona?.color ?? "#00d4ff"}, ${currentPersona?.color ? `${currentPersona.color}88` : "#7b2ff7"})` }}>
                    {currentPersona ? <PersonaIcon size={18} style={{ color: '#fff' }} /> : <AILogo size={20} />}
                  </div>
                  <div>
                    <div className="text-[#e0f0ff] flex items-center gap-1" style={{ fontSize: 14 }}>
                      {currentPersona?.shortName ?? "AI"}
                      <span style={{ fontSize: 10, color: 'rgba(0,212,255,0.3)' }}>{currentPersona?.enTitle ?? "Assistant"}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={clearChat} className="p-1.5 rounded-lg hover:bg-[rgba(0,212,255,0.1)]"><Trash2 size={14} style={{ color: 'rgba(0,212,255,0.4)' }} /></button>
                  <button onClick={() => setIsOpen(false)} className="p-1.5 rounded-lg hover:bg-[rgba(255,51,102,0.1)]"><X size={14} style={{ color: 'rgba(0,212,255,0.5)' }} /></button>
                </div>
              </div>
              {/* Persona Bar */}
              <div className="flex items-center gap-1 overflow-x-auto hide-scrollbar" style={{ padding: '0 8px 6px' }}>
                {FAMILY_PERSONAS.map(p => {
                  const Icon = p.icon; const ia = activePersona === p.id;
                  return (
                    <button key={p.id} onClick={() => switchPersona(p.id)} className="flex flex-col items-center gap-0.5 shrink-0 transition-all"
                      style={{ minWidth: 44 }} title={`${p.name}`}>
                      <div className="rounded-lg flex items-center justify-center transition-all"
                        style={{ width: 28, height: 28, background: ia ? `${p.color}22` : 'rgba(0,40,80,0.3)', border: `1.5px solid ${ia ? p.color : 'rgba(0,180,255,0.08)'}`, boxShadow: ia ? `0 0 8px ${p.color}44` : 'none' }}>
                        <Icon size={14} style={{ color: p.color }} />
                      </div>
                      <span style={{ fontSize: 8, color: ia ? p.color : 'rgba(0,212,255,0.3)' }}>{p.shortName}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Tab Bar */}
            <div className="shrink-0 flex items-center gap-0.5 overflow-x-auto hide-scrollbar" style={{ padding: '4px 6px', borderBottom: '1px solid rgba(0,180,255,0.08)', background: 'rgba(0,30,60,0.3)' }}>
              {ALL_TABS.map(tab => (
                <button key={tab.key} onClick={() => setActiveTab(tab.key)}
                  className={`flex items-center gap-1.5 shrink-0 rounded-lg transition-all ${activeTab === tab.key ? 'bg-[rgba(0,212,255,0.12)] text-[#00d4ff] border border-[rgba(0,212,255,0.25)]' : 'text-[rgba(0,212,255,0.4)] hover:text-[#00d4ff] border border-transparent'}`}
                  style={{ padding: '4px 8px', fontSize: 11 }}>
                  <tab.icon size={12} /> {tab.label}
                </button>
              ))}
            </div>

            {/* Content */}
            <div className="flex-1 overflow-hidden flex flex-col" style={{ background: '#0a1128' }}>
              {activeTab === "chat"     && <ChatPanel {...sharedProps} />}
              {activeTab === "commands" && <CommandsPanel {...sharedProps} />}
              {activeTab === "people"   && <PeoplePanel {...sharedProps} />}
              {activeTab === "skills"   && <SkillsPanel {...sharedProps} />}
              {activeTab === "plugins"  && <PluginsPanel {...sharedProps} />}
              {activeTab === "modules"  && <ModulesPanel {...sharedProps} />}
              {activeTab === "prompts"  && <PromptsPanel {...sharedProps} />}
              {activeTab === "settings" && <SettingsPanel {...sharedProps} />}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ========== INLINE MODE ==========
  return (
    <div className="w-full h-full rounded-2xl flex flex-col overflow-hidden" style={{ background: '#0a1128', border: '1px solid rgba(0,180,255,0.2)' }}>
      <div className="shrink-0" style={{ borderBottom: '1px solid rgba(0,180,255,0.12)', background: '#0d1530' }}>
        <div className="flex items-center justify-between" style={{ padding: '8px 12px' }}>
          <div className="flex items-center gap-2">
            <div style={{ width: 32, height: 32, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', background: `linear-gradient(135deg, ${currentPersona?.color ?? '#00d4ff'}, ${currentPersona?.color ? `${currentPersona.color}88` : '#7b2ff7'})` }}>
              {currentPersona ? <PersonaIcon size={18} style={{ color: '#fff' }} /> : <AILogo size={20} />}
            </div>
            <div><span style={{ fontSize: 14, color: '#e0f0ff' }}>{currentPersona?.shortName ?? "AI"}</span></div>
          </div>
        </div>
        <div className="flex items-center gap-1 px-3 pb-2 overflow-x-auto hide-scrollbar">
          {FAMILY_PERSONAS.map(p => {
            const Icon = p.icon; const ia = activePersona === p.id;
            return (
              <button key={p.id} onClick={() => switchPersona(p.id)} className="flex flex-col items-center gap-0.5 shrink-0" style={{ minWidth: 44 }}>
                <div style={{ width: 28, height: 28, borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', background: ia ? `${p.color}22` : 'rgba(0,40,80,0.3)', border: `1.5px solid ${ia ? p.color : 'rgba(0,180,255,0.08)'}` }}>
                  <Icon size={14} style={{ color: p.color }} />
                </div>
                <span style={{ fontSize: 8, color: ia ? p.color : 'rgba(0,212,255,0.3)' }}>{p.shortName}</span>
              </button>
            );
          })}
        </div>
      </div>
      <div className="shrink-0 flex items-center gap-1 px-2 py-1.5 border-b border-[rgba(0,180,255,0.08)] bg-[rgba(0,40,80,0.1)] overflow-x-auto hide-scrollbar">
        {ALL_TABS.map(tab => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg transition-all shrink-0 ${activeTab === tab.key ? 'bg-[rgba(0,212,255,0.12)] text-[#00d4ff] border border-[rgba(0,212,255,0.25)]' : 'text-[rgba(0,212,255,0.4)] hover:text-[#00d4ff] border border-transparent'}`}
            style={{ fontSize: '0.68rem' }}>
            <tab.icon className="w-3 h-3" /> {tab.label}
          </button>
        ))}
      </div>
      <div className="flex-1 overflow-hidden flex flex-col" style={{ background: '#0a1128' }}>
        {activeTab === "chat"     && <ChatPanel {...sharedProps} />}
        {activeTab === "commands" && <CommandsPanel {...sharedProps} />}
        {activeTab === "people"   && <PeoplePanel {...sharedProps} />}
        {activeTab === "skills"   && <SkillsPanel {...sharedProps} />}
        {activeTab === "plugins"  && <PluginsPanel {...sharedProps} />}
        {activeTab === "modules"  && <ModulesPanel {...sharedProps} />}
        {activeTab === "prompts"  && <PromptsPanel {...sharedProps} />}
        {activeTab === "settings" && <SettingsPanel {...sharedProps} />}
      </div>
    </div>
  );
}

export default AIAssistant;
