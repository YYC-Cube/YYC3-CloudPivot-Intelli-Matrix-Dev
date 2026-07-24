/**
 * @file: App.tsx
 * @description: AI Family 独立版 — 欢迎页 → 时钟环 + Hub 浮窗 (含人格增强) + 命令可执行
 */
import { FAMILY_PERSONAS } from "@yyc3/plugin-ai-family";
import { AIAssistantHub, eventBus, Events, storage, StorageKeys, WelcomePage } from "@yyc3/shell";
import { Brain, Ear, Eye, Lightbulb, MessageCircle, Network, Scale, Shield, Sparkles, Star, UserCircle2 } from "lucide-react";
import React, { useCallback, useEffect, useState } from "react";

const PERSONA_ICONS: Record<string, React.ElementType> = { navigator: Ear, thinker: Brain, prophet: Eye, bolero: Star, "meta-oracle": Network, sentinel: Shield, master: Scale, creative: Lightbulb };

const SYSTEM_CARDS = [{ id: "ai-family", name: "AI Family", description: "中枢 · 家人协同", icon: UserCircle2, color: "#00FF88", path: "/ai-family" }];

export default function App() {
  const [showWelcome, setShowWelcome] = useState(!storage.shell.get(StorageKeys.SHELL_WELCOME_DISMISSED, false));
  const [activePersona, setActivePersona] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  // 监听欢迎页关闭事件
  useEffect(() => {
    const unsub = eventBus.on(Events.SHELL_WELCOME_DISMISS, () => setShowWelcome(false));
    return unsub;
  }, []);

  const flashMessage = useCallback((msg: string) => {
    setMessage(msg);
    setTimeout(() => setMessage(null), 3000);
  }, []);

  const FAMILY_CMDS = FAMILY_PERSONAS.map((p: typeof FAMILY_PERSONAS[0]) => ({
    id: `f-call-${p.id}`,
    label: `呼叫 ${p.shortName}`,
    systemId: "ai-family",
    icon: PERSONA_ICONS[p.id] || UserCircle2,
    action: () => {
      setActivePersona(p.id);
      eventBus.emit("ai:persona-activated", { personaId: p.id });
      flashMessage(`已接通 ${p.shortName}（${p.role}）`);
    },
  }));

  const onlineCount = FAMILY_PERSONAS.filter((p: { mood: string }) => p.mood !== "idle").length;

  if (showWelcome)
    return (
      <WelcomePage
        systems={SYSTEM_CARDS}
        mode="modal"
        onNavigate={() => setShowWelcome(false)}
        familySummary={`${FAMILY_PERSONAS.length} 位家人 · ${onlineCount} 人在线`}
      />
    );

  const PersonaBar = () => (
    <div className="flex items-center gap-1 px-3 pb-2 overflow-x-auto hide-scrollbar">
      {FAMILY_PERSONAS.map((p: typeof FAMILY_PERSONAS[0]) => {
        const Icon = PERSONA_ICONS[p.id] || UserCircle2;
        const isActive = activePersona === p.id;
        return (
          <button
            key={p.id}
            onClick={() => {
              setActivePersona(p.id);
              eventBus.emit("ai:persona-activated", { personaId: p.id });
              flashMessage(`已接通 ${p.shortName}（${p.role}）`);
            }}
            className="flex flex-col items-center gap-0.5 shrink-0 transition-all"
            style={{ minWidth: "40px", opacity: isActive ? 1 : 0.5, transform: isActive ? "scale(1.15)" : "scale(1)" }}
          >
            <div
              className="w-7 h-7 rounded-lg flex items-center justify-center"
              style={{ background: `${p.color}22`, border: `1px solid ${isActive ? p.color : `${p.color}44`}`, boxShadow: isActive ? `0 0 12px ${p.color}44` : "none" }}
            >
              <Icon size={14} style={{ color: p.color }} />
            </div>
            <span style={{ fontSize: "0.45rem", color: p.color }}>{p.shortName}</span>
          </button>
        );
      })}
    </div>
  );

  const currentPersona = FAMILY_PERSONAS.find((p) => p.id === activePersona);

  return (
    <div className="min-h-screen" style={{ background: "radial-gradient(ellipse at center, rgba(0,255,136,0.03) 0%, rgba(4,8,20,1) 70%)" }}>
      <AIAssistantHub
        systemId="ai-family"
        title="AI Family"
        accentColor="#00FF88"
        commands={FAMILY_CMDS}
        showPersonas
        renderPersonaBar={PersonaBar}
      />

      {/* 消息提示条 */}
      {message && (
        <div
          className="fixed top-4 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-lg text-sm"
          style={{ background: "rgba(0,255,136,0.1)", border: "1px solid rgba(0,255,136,0.3)", color: "#00FF88" }}
        >
          {message}
        </div>
      )}

      <div className="min-h-screen flex flex-col items-center justify-center">
        {currentPersona ? (
          <div className="text-center">
            <div
              className="w-20 h-20 mx-auto mb-4 rounded-2xl flex items-center justify-center"
              style={{ background: `${currentPersona.color}22`, border: `2px solid ${currentPersona.color}`, boxShadow: `0 0 30px ${currentPersona.color}33` }}
            >
              {React.createElement(PERSONA_ICONS[currentPersona.id] || UserCircle2, { size: 36, style: { color: currentPersona.color } })}
            </div>
            <h1 className="text-lg font-medium" style={{ color: currentPersona.color }}>
              {currentPersona.shortName} · {currentPersona.role}
            </h1>
            <p className="text-sm mt-2 max-w-xs" style={{ color: "rgba(0,255,136,0.4)" }}>
              {currentPersona.personality} · {currentPersona.expertise.join(" / ")}
            </p>
            <div className="mt-4 flex items-center gap-2 justify-center">
              <MessageCircle size={14} style={{ color: currentPersona.color }} />
              <span className="text-xs" style={{ color: currentPersona.color }}>
                已接通 · 可通过 Hub 发送消息
              </span>
            </div>
          </div>
        ) : (
          <>
            <Sparkles className="w-16 h-16 mb-4" style={{ color: "#00FF8833" }} />
            <h1 className="text-[#e0f0ff] text-lg font-medium">AI Family</h1>
            <p className="text-[rgba(0,255,136,0.3)] text-sm mt-1">
              {FAMILY_PERSONAS.length} 位家人 · {onlineCount} 人在线
            </p>
            <p className="text-[rgba(0,255,136,0.15)] text-xs mt-3">点击家人头像或 Hub 命令呼叫</p>
          </>
        )}

        <div className="flex gap-2 mt-6">
          {FAMILY_PERSONAS.map((p) => (
            <button
              key={p.id}
              onClick={() => {
                setActivePersona(p.id);
                eventBus.emit("ai:persona-activated", { personaId: p.id });
                flashMessage(`已接通 ${p.shortName}（${p.role}）`);
              }}
              className="w-8 h-8 rounded-lg flex items-center justify-center transition-all hover:scale-110"
              style={{ background: `${p.color}22`, border: activePersona === p.id ? `1px solid ${p.color}` : "none" }}
            >
              {React.createElement(PERSONA_ICONS[p.id] || UserCircle2, { size: 16, style: { color: p.color } })}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
