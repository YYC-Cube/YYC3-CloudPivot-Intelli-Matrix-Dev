/**
 * @file: AIAssistantHub.tsx
 * @description: 通用中枢浮窗 — 所有 6 个子系统各持一份
 *
 * 每个子系统通过 props 注入自己的命令和配置。
 * AI Family 在此之上增加家人人格功能。
 */
import {
  BookOpen,
  Check,
  Command,
  Copy,
  Cpu,
  Key,
  Maximize2,
  MessageSquare,
  Mic, MicOff,
  Minimize2,
  RotateCcw,
  Send,
  Sliders,
  Sparkles,
  Trash2,
  X,
} from "lucide-react";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { eventBus, Events } from "./event-bus";
import { LLMBridge } from "./llm-bridge";
import { createSystemStorage, StorageKeys } from "./storage";
import { getSystemTheme, getTheme, type ThemeMode } from "./theme";
import type { HubCommand } from "./types";

// ============================================================
// Types
// ============================================================

interface ChatMessage {
  id: string; role: "user" | "assistant" | "system";
  content: string; timestamp: number;
}

interface PromptPreset {
  id: string; name: string; prompt: string; category: string;
}

const INITIAL_TIMESTAMP = Date.now();
let idCounter = 0;
const genId = (s = "") => { idCounter += 1; return `msg-${idCounter}${s}`; };
const now = () => Date.now();

function mockResponse(msg: string): string {
  const l = msg.toLowerCase();
  if (l.includes("状态") || l.includes("节点"))
    return `## 状态报告\n\n**时间**: ${new Date().toLocaleString("zh-CN")}\n\n系统运行正常，所有节点在线。`;
  if (l.includes("帮助") || l.includes("help"))
    return `可用命令：\n- 查看状态\n- 执行分析\n- 生成报告\n- 配置参数`;
  return `收到: "${msg}"\n\n已处理完毕。需要进一步帮助吗？`;
}

function useSR() {
  const [isListening, setIL] = useState(false);
  const [transcript, setT] = useState("");
  const supported = typeof window !== "undefined" && ("webkitSpeechRecognition" in window || "SpeechRecognition" in window);
  const ref = useRef<any>(null);
  const start = useCallback(() => {
    if (!supported) return;
    const R = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
    const r = new R(); r.lang = "zh-CN"; r.continuous = false; r.interimResults = false;
    r.onresult = (e: any) => { setT(e.results[0][0].transcript); setIL(false); };
    r.onerror = () => setIL(false); r.onend = () => setIL(false);
    r.start(); ref.current = r; setIL(true);
  }, [supported]);
  const stop = useCallback(() => { ref.current?.stop(); setIL(false); }, []);
  useEffect(() => () => ref.current?.abort(), []);
  return { isListening, transcript, supported, startListening: start, stopListening: stop };
}

// ============================================================
// Props
// ============================================================

export interface AIAssistantHubProps {
  isMobile?: boolean;
  /** 系统标识 */
  systemId: string;
  /** 显示标题 */
  title?: string;
  /** 主题色 (覆盖自动主题) */
  accentColor?: string;
  /** 主题模式: modern | ancient — 自动按 systemId 选择 */
  themeMode?: ThemeMode;
  /** 系统的 Hub 命令 */
  commands?: HubCommand[];
  /** 额外的预设提示词 */
  extraPrompts?: PromptPreset[];
  /** 是否显示人格切换 (仅 AI Family 启用) */
  showPersonas?: boolean;
  /** 人格渲染函数 (仅 showPersonas 时需传入) */
  renderPersonaBar?: () => React.ReactNode;
  /** 自定义 Mock 回复 */
  customMock?: (msg: string) => string;
}

const DEFAULT_PROMPTS: PromptPreset[] = [
  { id: "p1", name: "运维助手", prompt: "你是系统运维专家。请分析当前状态，给出优化建议。", category: "通用" },
  { id: "p2", name: "数据分析", prompt: "你是数据分析专家。请解读监控数据，识别趋势和异常。", category: "数据" },
];

export function AIAssistantHub({
  isMobile = false,
  systemId,
  title = "AI 智能助理",
  accentColor,
  themeMode,
  commands = [],
  extraPrompts,
  showPersonas = false,
  renderPersonaBar,
  customMock,
}: AIAssistantHubProps) {
  const sysStorage = createSystemStorage(systemId);
  const allPrompts = [...(extraPrompts ?? []), ...DEFAULT_PROMPTS];
  const T = getTheme(themeMode ?? (getSystemTheme(systemId).mode));
  const ac = accentColor ?? T.accent;

  const [isOpen, setIsOpen] = useState(false);
  const [isMaximized, setIsMaximized] = useState(false);
  const [activeTab, setActiveTab] = useState<"chat" | "commands" | "prompts" | "settings">("chat");

  const [messages, setMessages] = useState<ChatMessage[]>([
    { id: "welcome", role: "assistant", content: `你好！我是 ${title}。\n\n请输入指令或点击快捷命令开始操作。`, timestamp: INITIAL_TIMESTAMP },
  ]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [systemPrompt, setSystemPrompt] = useState(allPrompts[0]?.prompt ?? "");
  const [showAk, setShowAk] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const { isListening, transcript, supported: vs, startListening, stopListening } = useSR();
  useEffect(() => { if (transcript) setInput(transcript); }, [transcript]);
  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, isTyping]);

  const ak = sysStorage.get(StorageKeys.AI_API_KEY, "")!;
  const [localAk, setLocalAk] = useState(ak);
  const mk = sysStorage.get(StorageKeys.AI_MODEL, "")!;
  const [localMk, setLocalMk] = useState(mk);

  const persist = (k: string, v: string) => sysStorage.set(k as any, v);

  useEffect(() => {
    const unsub = eventBus.on(Events.HUB_OPEN, () => setIsOpen(true));
    const unsub2 = eventBus.on(Events.HUB_CLOSE, () => setIsOpen(false));
    return () => { unsub(); unsub2(); };
  }, []);

  // ===== LLM 桥接 (Phase 4: 真实 LLM + Mock 回退) =====
  // 静态导入, 运行时由 try/catch + ErrorBoundary 兜底
  const bridgeRef = useRef<LLMBridge | null>(null);
  const getBridge = useCallback(() => {
    if (!bridgeRef.current) {
      try {
        bridgeRef.current = new LLMBridge({
          stream: true,
          fallbackToMock: true,
          mockResponse: customMock ?? mockResponse,
        });
      } catch {
        bridgeRef.current = null; // plugin-llm 未加载, 全程 Mock
      }
    }
    return bridgeRef.current;
  }, [customMock]);

  const [llmStatus, setLlmStatus] = useState<"loading" | "mock" | "real" | "error">("loading");
  const [llmMeta, setLlmMeta] = useState<string>("");

  useEffect(() => {
    // 启动时检测 LLM 可用性
    const b = getBridge();
    if (!b) { setLlmStatus("mock"); return; }
    b.init().then(() => {
      if (b.isRealLLMAvailable()) {
        setLlmStatus("real");
        const providers = b.listProviders();
        setLlmMeta(providers.map(p => p.provider).join(", "));
      } else {
        setLlmStatus("mock");
      }
    }).catch(() => setLlmStatus("mock"));
  }, [getBridge]);

  const send = useCallback(async (content: string) => {
    if (!content.trim()) return;
    const userMsg = { id: genId(), role: "user" as const, content: content.trim(), timestamp: now() };
    setMessages(p => [...p, userMsg]);
    setInput("");
    setIsTyping(true);

    // 流式渲染 — 创建占位消息, 逐步更新 content
    const assistantId = genId("-r");
    setMessages(p => [...p, { id: assistantId, role: "assistant", content: "", timestamp: now() }]);

    try {
      const bridge = getBridge();
      const history = messages
        .filter(m => m.id !== "welcome" && m.id !== "new")
        .map(m => ({ role: m.role, content: m.content }));

      if (bridge) {
        await bridge.chatStream(
          [
            ...(systemPrompt ? [{ role: "system" as const, content: systemPrompt }] : []),
            ...history,
            { role: "user" as const, content: content.trim() },
          ],
          (delta) => {
            // 流式累加 delta 到最后一条消息
            setMessages(prev => {
              const next = [...prev];
              const idx = next.findIndex(m => m.id === assistantId);
              if (idx >= 0) next[idx] = { ...next[idx], content: next[idx].content + delta };
              return next;
            });
          },
          { temperature: 0.7 }
        );
      } else {
        // plugin-llm 未加载, 退化到 Mock (与原行为一致)
        await new Promise(r => setTimeout(r, 800 + Math.random() * 1200));
        const resp = customMock ? customMock(content) : mockResponse(content);
        setMessages(prev => {
          const next = [...prev];
          const idx = next.findIndex(m => m.id === assistantId);
          if (idx >= 0) next[idx] = { ...next[idx], content: resp };
          return next;
        });
      }
    } catch (err) {
      // 错误回退 Mock
      const fallback = (customMock ?? mockResponse)(content);
      setMessages(prev => {
        const next = [...prev];
        const idx = next.findIndex(m => m.id === assistantId);
        if (idx >= 0) next[idx] = { ...next[idx], content: `⚠️ ${(err as Error).message}\n\n---\n\n${fallback}` };
        return next;
      });
    }
    setIsTyping(false);
  }, [customMock, getBridge, messages, systemPrompt]);

  const handleKey = (e: React.KeyboardEvent) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(input); } };
  const cc = (text: string, id: string) => { navigator.clipboard.writeText(text).catch(() => { }); setCopiedId(id); setTimeout(() => setCopiedId(null), 2000); };

  const TABS = [
    { key: "chat" as const, icon: MessageSquare, label: "对话" },
    { key: "commands" as const, icon: Command, label: "命令" },
    { key: "prompts" as const, icon: BookOpen, label: "提示词" },
    { key: "settings" as const, icon: Sliders, label: "配置" },
  ];

  const pClass = isMaximized ? "fixed inset-4 md:inset-8 z-[60]" :
    isMobile ? "fixed inset-0 z-[60]" : "fixed bottom-20 right-4 w-[520px] h-[680px] z-[60]";

  // ===== 浮窗按钮 =====
  if (!isOpen) {
    return (
      <button onClick={() => setIsOpen(true)} data-testid={`hub-btn-${systemId}`}
        className="fixed z-[60] group" style={{ bottom: isMobile ? 80 : 24, right: isMobile ? 16 : 24 }}>
        <div className="relative rounded-2xl flex items-center justify-center shadow-lg hover:shadow-xl transition-all hover:scale-105 active:scale-95"
          style={{ width: isMobile ? 48 : 56, height: isMobile ? 48 : 56, background: `linear-gradient(135deg, ${ac}, ${ac}88)` }}>
          <Sparkles className="text-white" size={isMobile ? 22 : 26} />
          <div className="absolute inset-0 rounded-2xl animate-ping opacity-20" style={{ background: accentColor }} />
        </div>
        <div className="absolute bottom-full right-0 mb-2 px-3 py-1.5 rounded-lg bg-[${T.panelBg}] border opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap"
          style={{ borderColor: `${ac}33` }}>
          <span style={{ color: ac, fontSize: "0.72rem" }}>{title}</span>
        </div>
      </button>
    );
  }

  // ===== 面板 =====
  return (
    <div className={pClass}>
      <div className="w-full h-full rounded-2xl bg-[${T.panelBg}] backdrop-blur-2xl flex flex-col overflow-hidden"
        style={{ border: `1px solid ${accentColor}33`, boxShadow: `0 0 60px ${accentColor}15` }}>

        {/* Header */}
        <div className="shrink-0 px-4 py-3 flex items-center justify-between" style={{ borderBottom: `1px solid ${ac}15`, background: `${ac}08` }}>
          <div>
            <h3 className="text-[#e0f0ff]" style={{ fontSize: "0.9rem" }}>{title}</h3>
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: accentColor }} />
              <span style={{ color: `${ac}66`, fontSize: "0.6rem" }}>{systemId} · {commands.length} 条命令</span>
              <span style={{
                color: llmStatus === "real" ? "#00ff88" : llmStatus === "mock" ? `${ac}44` : `${ac}66`,
                fontSize: "0.55rem",
                marginLeft: "0.3rem",
                padding: "0 0.3rem",
                border: `1px solid ${llmStatus === "real" ? "#00ff8833" : `${ac}22`}`,
                borderRadius: "0.25rem",
              }} title={llmStatus === "real" ? `LLM: ${llmMeta}` : llmStatus === "mock" ? "Mock 模式 (未配置 API Key)" : "初始化中"}>
                {llmStatus === "real" ? `● ${llmMeta || "LLM"}` : llmStatus === "mock" ? "○ Mock" : "○ ..."}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button onClick={() => setMessages([{ id: "new", role: "assistant", content: "对话已清空。", timestamp: now() }])}
              className="p-1.5 rounded-lg hover:bg-[rgba(0,212,255,0.1)]"><Trash2 className="w-4 h-4" style={{ color: `${accentColor}66` }} /></button>
            {!isMobile && (
              <button onClick={() => setIsMaximized(!isMaximized)} className="p-1.5 rounded-lg hover:bg-[rgba(0,212,255,0.1)]">
                {isMaximized ? <Minimize2 className="w-4 h-4" style={{ color: `${accentColor}66` }} /> : <Maximize2 className="w-4 h-4" style={{ color: `${accentColor}66` }} />}
              </button>
            )}
            <button onClick={() => setIsOpen(false)} className="p-1.5 rounded-lg hover:bg-[rgba(255,51,102,0.1)]">
              <X className="w-4 h-4" style={{ color: `${ac}88` }} />
            </button>
          </div>
        </div>

        {/* Persona bar (仅 AI Family) */}
        {showPersonas && renderPersonaBar && (
          <div className="shrink-0 px-3 pb-2" style={{ borderBottom: `1px solid ${accentColor}10` }}>
            {renderPersonaBar()}
          </div>
        )}

        {/* Tab bar */}
        <div className="shrink-0 flex items-center gap-0.5 px-2 py-1.5 overflow-x-auto hide-scrollbar"
          style={{ borderBottom: `1px solid ${ac}08`, background: `${ac}05` }}>
          {TABS.map(t => (
            <button key={t.key} onClick={() => setActiveTab(t.key)}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg shrink-0 ${activeTab === t.key ? "border" : "border border-transparent"}`}
              style={{ fontSize: "0.68rem", background: activeTab === t.key ? `${accentColor}18` : "transparent", color: activeTab === t.key ? accentColor : `${accentColor}66`, borderColor: activeTab === t.key ? `${accentColor}44` : "transparent" }}>
              <t.icon className="w-3 h-3" /> {t.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden flex flex-col">
          {/* Chat */}
          {activeTab === "chat" && (
            <>
              <div className="flex-1 overflow-auto p-3 space-y-3">
                {messages.map(msg => {
                  const isUser = msg.role === "user";
                  return (
                    <div key={msg.id} className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
                      <div className={`max-w-[85%] relative group px-3.5 py-2.5 ${isUser
                        ? "rounded-2xl rounded-br-sm" : "rounded-2xl rounded-bl-sm"}`}
                        style={{ background: isUser ? `${ac}18` : T.panelBg, border: `1px solid ${isUser ? `${ac}33` : T.panelBorder}` }}>
                        <div className="whitespace-pre-wrap text-[#c0dcf0]" style={{ fontSize: "0.78rem", lineHeight: 1.6 }}>{msg.content}</div>
                        {msg.role === "assistant" && (
                          <button onClick={() => cc(msg.content, msg.id)}
                            className="absolute top-2 right-2 p-1 rounded opacity-0 group-hover:opacity-100 hover:bg-[rgba(0,212,255,0.1)]">
                            {copiedId === msg.id ? <Check className="w-3 h-3 text-[#00ff88]" /> : <Copy className="w-3 h-3" style={{ color: `${ac}55` }} />}
                          </button>
                        )}
                        <div style={{ color: T.textMuted, fontSize: "0.58rem" }}>{new Date(msg.timestamp).toLocaleTimeString("zh-CN")}</div>
                      </div>
                    </div>
                  );
                })}
                {isTyping && (
                  <div className="flex justify-start">
                    <div className="bg-[rgba(0,40,80,0.3)] border border-[rgba(0,180,255,0.1)] rounded-2xl rounded-bl-sm px-4 py-3">
                      <div className="flex gap-1.5">
                        {[0, 150, 300].map(d => <div key={d} className="w-2 h-2 rounded-full animate-bounce" style={{ background: ac, animationDelay: `${d}ms` }} />)}
                      </div>
                    </div>
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>
              <div className="shrink-0 p-3" style={{ borderTop: `1px solid ${accentColor}15` }}>
                <div className="flex items-end gap-2">
                  {vs && (
                    <button onClick={isListening ? stopListening : startListening}
                      className={`p-2.5 rounded-xl min-w-[40px] min-h-[40px] flex items-center justify-center ${isListening ? "bg-[rgba(255,60,60,0.2)] border border-[rgba(255,60,60,0.4)] animate-pulse" : ""}`}
                      style={{ background: isListening ? undefined : "rgba(0,40,80,0.4)", border: isListening ? undefined : `1px solid ${accentColor}22` }}>
                      {isListening ? <MicOff className="w-4 h-4 text-[#ff6060]" /> : <Mic className="w-4 h-4" style={{ color: `${ac}88` }} />}
                    </button>
                  )}
                  <textarea value={input} onChange={e => setInput(e.target.value)} onKeyDown={handleKey}
                    placeholder={isListening ? "🎤 正在聆听..." : "输入指令... (Enter 发送)"} rows={1}
                    className="flex-1 px-3 py-2.5 rounded-xl bg-[rgba(0,40,80,0.4)] text-[#e0f0ff] placeholder-[rgba(0,212,255,0.25)] focus:outline-none resize-none"
                    style={{ fontSize: "0.8rem", maxHeight: "100px", border: `1px solid ${ac}22` }} />
                  <button onClick={() => send(input)} disabled={!input.trim() || isTyping}
                    className="p-2.5 rounded-xl text-white min-w-[44px] min-h-[44px] flex items-center justify-center disabled:opacity-30"
                    style={{ background: `linear-gradient(135deg, ${ac}, ${ac}88)` }}>
                    <Send className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </>
          )}

          {/* Commands */}
          {activeTab === "commands" && (
            <div className="flex-1 overflow-auto p-3">
              <h4 className="text-[#e0f0ff] mb-3" style={{ fontSize: "0.82rem" }}>系统快捷命令</h4>
              {commands.length === 0 ? (
                <p style={{ color: T.textMuted, fontSize: "0.72rem" }}>暂无注册命令</p>
              ) : (
                <div className="space-y-1">
                  {commands.map(cmd => {
                    const Icon = cmd.icon;
                    return (
                      <button key={cmd.id} onClick={() => { cmd.action?.(); setActiveTab("chat"); send(cmd.label); }}
                        className="w-full flex items-center gap-3 p-2.5 rounded-xl transition-all hover:opacity-80"
                        style={{ background: "rgba(0,40,80,0.2)", border: `1px solid ${ac}10` }}>
                        <Icon className="w-4 h-4" style={{ color: ac }} />
                        <span className="text-[#e0f0ff]" style={{ fontSize: "0.78rem" }}>{cmd.label}</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Prompts */}
          {activeTab === "prompts" && (
            <div className="flex-1 overflow-auto p-3">
              <h4 className="text-[#e0f0ff] mb-3" style={{ fontSize: "0.82rem" }}>提示词预设</h4>
              <div className="space-y-2 mb-4">
                {allPrompts.map(p => (
                  <div key={p.id} onClick={() => { setSystemPrompt(p.prompt); setActiveTab("chat"); }}
                    className="p-3 rounded-xl border cursor-pointer" style={{ borderColor: systemPrompt === p.prompt ? `${ac}44` : `${ac}10`, background: systemPrompt === p.prompt ? `${ac}10` : "rgba(0,40,80,0.15)" }}>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[#e0f0ff]" style={{ fontSize: "0.8rem" }}>{p.name}</span>
                      <span className="px-1.5 py-0.5 rounded" style={{ background: `${ac}10`, color: ac, fontSize: "0.55rem" }}>{p.category}</span>
                    </div>
                    <p style={{ color: T.textSecondary, fontSize: "0.68rem" }}>{p.prompt.slice(0, 60)}...</p>
                  </div>
                ))}
              </div>
              <textarea value={systemPrompt} onChange={e => setSystemPrompt(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl bg-[rgba(0,40,80,0.4)] text-[#e0f0ff] focus:outline-none resize-none"
                style={{ fontSize: "0.75rem", border: `1px solid ${ac}22` }} rows={4} />
            </div>
          )}

          {/* Settings */}
          {activeTab === "settings" && (
            <div className="flex-1 overflow-auto p-3 space-y-4">
              <div>
                <h4 className="text-[#e0f0ff] mb-2 flex items-center gap-2" style={{ fontSize: "0.82rem" }}>
                  <Key className="w-4 h-4" style={{ color: ac }} /> API Key
                </h4>
                <div className="relative">
                  <input type={showAk ? "text" : "password"} value={localAk}
                    onChange={e => { setLocalAk(e.target.value); persist(StorageKeys.AI_API_KEY, e.target.value); }}
                    className="w-full px-3 py-2.5 rounded-xl bg-[rgba(0,40,80,0.4)] text-[#e0f0ff] focus:outline-none"
                    style={{ fontSize: "0.78rem", fontFamily: "monospace", border: `1px solid ${ac}22` }}
                    placeholder="sk-..." />
                  <button onClick={() => setShowAk(!showAk)} className="absolute right-2 top-1/2 -translate-y-1/2 p-1">
                    <span style={{ color: `${ac}66`, fontSize: "0.65rem" }}>{showAk ? "隐藏" : "显示"}</span>
                  </button>
                </div>
              </div>
              <div>
                <h4 className="text-[#e0f0ff] mb-2 flex items-center gap-2" style={{ fontSize: "0.82rem" }}>
                  <Cpu className="w-4 h-4" style={{ color: ac }} /> 模型
                </h4>
                <input value={localMk} onChange={e => { setLocalMk(e.target.value); persist(StorageKeys.AI_MODEL, e.target.value); }}
                  className="w-full px-3 py-2.5 rounded-xl bg-[rgba(0,40,80,0.4)] text-[#e0f0ff] focus:outline-none"
                  style={{ fontSize: "0.78rem", border: `1px solid ${accentColor}22` }} placeholder="gpt-4o" />
              </div>
              <button onClick={() => { setLocalAk(""); setLocalMk(""); }}
                className="w-full py-2.5 rounded-xl flex items-center justify-center gap-2"
                style={{ background: "rgba(0,40,80,0.2)", border: `1px solid ${ac}15`, color: `${ac}88`, fontSize: "0.78rem" }}>
                <RotateCcw className="w-3.5 h-3.5" /> 清空配置 (兼容旧版)
              </button>

              {/* Phase 4: 多 Provider LLM 管理 */}
              <div className="pt-3 mt-3" style={{ borderTop: `1px solid ${ac}10` }}>
                <h4 className="text-[#e0f0ff] mb-2 flex items-center gap-2" style={{ fontSize: "0.82rem" }}>
                  <Cpu className="w-4 h-4" style={{ color: ac }} /> LLM 多 Provider (Phase 4 · AES-256-GCM)
                </h4>
                <p style={{ color: T.textMuted, fontSize: "0.62rem", marginBottom: "0.6rem" }}>
                  API Key 通过浏览器原生 Web Crypto API 加密存储 (PBKDF2 + AES-GCM)，密钥不落明文盘。
                </p>
                <LLMProviderPanel systemId={systemId} accentColor={ac} onConfigured={() => {
                  // 重新检测 LLM 状态
                  setLlmStatus("loading");
                  const b = getBridge();
                  b?.init().then(() => {
                    setLlmStatus(b?.isRealLLMAvailable() ? "real" : "mock");
                    const ps = b?.listProviders() ?? [];
                    setLlmMeta(ps.map(p => p.provider).join(", "));
                  }).catch(() => setLlmStatus("mock"));
                }} />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ============================================================
// LLMProviderPanel — 多 Provider 配置子组件 (Phase 4)
// ============================================================
const LLM_PROVIDERS = [
  { id: "openai", name: "OpenAI", models: ["gpt-4o", "gpt-4o-mini", "gpt-4-turbo", "o1-mini"], site: "platform.openai.com" },
  { id: "anthropic", name: "Anthropic Claude", models: ["claude-3-5-sonnet-20241022", "claude-3-5-haiku-20241022"], site: "console.anthropic.com" },
  { id: "qwen", name: "通义千问 (DashScope)", models: ["qwen-max", "qwen-plus", "qwen-turbo"], site: "dashscope.aliyun.com" },
  { id: "deepseek", name: "DeepSeek", models: ["deepseek-chat", "deepseek-reasoner"], site: "platform.deepseek.com" },
  { id: "kimi", name: "Kimi (Moonshot)", models: ["moonshot-v1-8k", "moonshot-v1-32k"], site: "platform.moonshot.cn" },
] as const;

function LLMProviderPanel({ systemId: _systemId, accentColor, onConfigured }: {
  systemId: string;
  accentColor: string;
  onConfigured: () => void;
}) {
  const [activeProvider, setActiveProvider] = useState<string>("openai");
  const [keyInput, setKeyInput] = useState("");
  const [modelInput, setModelInput] = useState<string>(LLM_PROVIDERS[0].models[0]);
  const [configured, setConfigured] = useState<string[]>([]);
  const [error, setError] = useState<string>("");
  const [saved, setSaved] = useState(false);

  const refreshConfigured = useCallback(async () => {
    try {
      const { getLLMBridge } = await import("./llm-bridge");
      const b = getLLMBridge();
      await b.init();
      const list = b.listProviders();
      setConfigured(list.map(l => l.provider));
    } catch {
      // plugin-llm 未加载
    }
  }, []);

  useEffect(() => { refreshConfigured(); }, [refreshConfigured]);

  const handleSave = async () => {
    setError("");
    if (!keyInput.trim()) {
      setError("请输入 API Key");
      return;
    }
    try {
      const { getLLMBridge } = await import("./llm-bridge");
      const b = getLLMBridge();
      await b.init();
      await b.setProviderKey(activeProvider as any, keyInput.trim(), { defaultModel: modelInput });
      await refreshConfigured();
      setKeyInput("");
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
      onConfigured();
    } catch (e) {
      setError((e as Error).message);
    }
  };

  const handleDelete = async (provider: string) => {
    try {
      const { getLLMBridge } = await import("./llm-bridge");
      const b = getLLMBridge();
      b.removeProviderKey(provider as any);
      await refreshConfigured();
      onConfigured();
    } catch (e) {
      setError((e as Error).message);
    }
  };

  return (
    <div className="space-y-2">
      {/* Provider 选择 */}
      <div className="flex flex-wrap gap-1">
        {LLM_PROVIDERS.map(p => (
          <button key={p.id} onClick={() => { setActiveProvider(p.id); setModelInput(p.models[0]); }}
            className="px-2 py-1 rounded text-xs transition-all"
            style={{
              background: activeProvider === p.id ? `${accentColor}18` : "rgba(0,40,80,0.25)",
              color: activeProvider === p.id ? accentColor : `${accentColor}66`,
              border: `1px solid ${activeProvider === p.id ? `${accentColor}44` : `${accentColor}10`}`,
              fontSize: "0.65rem",
            }}>
            {p.name}
            {configured.includes(p.id) && <span style={{ color: "#00ff88", marginLeft: 4 }}>●</span>}
          </button>
        ))}
      </div>

      {/* 当前 Provider 输入区 */}
      <div className="space-y-1.5 p-2 rounded" style={{ background: "rgba(0,40,80,0.2)", border: `1px solid ${accentColor}10` }}>
        <input value={keyInput} onChange={e => setKeyInput(e.target.value)} type="password"
          placeholder={`${LLM_PROVIDERS.find(p => p.id === activeProvider)?.name} API Key`}
          className="w-full px-2.5 py-2 rounded bg-[rgba(0,40,80,0.4)] text-[#e0f0ff] focus:outline-none"
          style={{ fontSize: "0.7rem", fontFamily: "monospace", border: `1px solid ${accentColor}22` }} />
        <select value={modelInput} onChange={e => setModelInput(e.target.value)}
          className="w-full px-2.5 py-2 rounded bg-[rgba(0,40,80,0.4)] text-[#e0f0ff] focus:outline-none"
          style={{ fontSize: "0.7rem", border: `1px solid ${accentColor}22` }}>
          {LLM_PROVIDERS.find(p => p.id === activeProvider)?.models.map(m => (
            <option key={m} value={m} style={{ background: "#040814" }}>{m}</option>
          ))}
        </select>
        <div className="flex gap-1.5">
          <button onClick={handleSave}
            className="flex-1 py-1.5 rounded flex items-center justify-center gap-1.5"
            style={{ background: `${accentColor}22`, color: accentColor, fontSize: "0.7rem", border: `1px solid ${accentColor}33` }}>
            {saved ? <><Check className="w-3 h-3" /> 已保存 (加密)</> : "保存 (AES-256-GCM 加密)"}
          </button>
        </div>
        {error && <div style={{ color: "#ff6060", fontSize: "0.62rem" }}>{error}</div>}
      </div>

      {/* 已配置列表 */}
      {configured.length > 0 && (
        <div>
          <div style={{ color: `${accentColor}88`, fontSize: "0.62rem", marginBottom: "0.3rem" }}>已配置 Provider:</div>
          {configured.map(p => {
            const meta = LLM_PROVIDERS.find(x => x.id === p);
            return (
              <div key={p} className="flex items-center justify-between px-2 py-1.5 mb-1 rounded"
                style={{ background: "rgba(0,40,80,0.2)", border: `1px solid ${accentColor}10` }}>
                <div className="flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 rounded-full" style={{ background: "#00ff88" }} />
                  <span style={{ color: "#e0f0ff", fontSize: "0.7rem" }}>{meta?.name || p}</span>
                </div>
                <button onClick={() => handleDelete(p)} className="p-1 rounded hover:bg-[rgba(255,60,60,0.2)]">
                  <Trash2 className="w-3 h-3" style={{ color: "#ff6060" }} />
                </button>
              </div>
            );
          })}
        </div>
      )}

      <div style={{ color: `${accentColor}44`, fontSize: "0.58rem", marginTop: "0.4rem" }}>
        💡 Key 通过 PBKDF2(100000 iter) + AES-256-GCM 加密; sessionStorage 会话级缓存.
      </div>
    </div>
  );
}
