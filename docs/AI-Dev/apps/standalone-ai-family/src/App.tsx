/**
 * @file: App.tsx
 * @description: AI Family 独立版 — 欢迎页 → 时钟环 + Hub 浮窗 (含人格增强)
 */
import React, { useState } from "react";
import { WelcomePage, AIAssistantHub, storage, StorageKeys } from "@yyc3/shell";
import { FAMILY_PERSONAS } from "@yyc3/plugin-ai-family";
import { UserCircle2, Sparkles, Ear, Brain, Eye, Star, Network, Shield, Scale, Lightbulb } from "lucide-react";

const PERSONA_ICONS: Record<string, React.ElementType> = { navigator: Ear, thinker: Brain, prophet: Eye, bolero: Star, "meta-oracle": Network, sentinel: Shield, master: Scale, creative: Lightbulb };

const FAMILY_CMDS = FAMILY_PERSONAS.map(p => ({
  id: `f-call-${p.id}`, label: `呼叫 ${p.shortName}`, systemId: "ai-family",
  icon: PERSONA_ICONS[p.id] || UserCircle2, action: () => {},
}));

const SYSTEM_CARDS = [{ id: "ai-family", name: "AI Family", description: "中枢 · 家人协同", icon: UserCircle2, color: "#00FF88", path: "/ai-family" }];

export default function App() {
  const [showWelcome, setShowWelcome] = useState(!storage.shell.get(StorageKeys.SHELL_WELCOME_DISMISSED, false));
  const onlineCount = FAMILY_PERSONAS.filter(p => p.mood !== "idle").length;
  if (showWelcome) return <WelcomePage systems={SYSTEM_CARDS} mode="modal" onNavigate={() => setShowWelcome(false)} familySummary={`${FAMILY_PERSONAS.length} 位家人 · ${onlineCount} 人在线`} />;

  const PersonaBar = () => (
    <div className="flex items-center gap-1 px-3 pb-2 overflow-x-auto hide-scrollbar">
      {FAMILY_PERSONAS.map(p => {
        const Icon = PERSONA_ICONS[p.id] || UserCircle2;
        return (
          <button key={p.id} className="flex flex-col items-center gap-0.5 shrink-0" style={{ minWidth: "40px" }}>
            <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: `${p.color}22`, border: `1px solid ${p.color}44` }}>
              <Icon size={14} style={{ color: p.color }} />
            </div>
            <span style={{ fontSize: "0.45rem", color: p.color }}>{p.shortName}</span>
          </button>
        );
      })}
    </div>
  );

  return (
    <div className="min-h-screen" style={{ background: "radial-gradient(ellipse at center, rgba(0,255,136,0.03) 0%, rgba(4,8,20,1) 70%)" }}>
      <AIAssistantHub systemId="ai-family" title="AI Family" accentColor="#00FF88" commands={FAMILY_CMDS}
        showPersonas renderPersonaBar={PersonaBar} />
      <div className="min-h-screen flex flex-col items-center justify-center">
        <Sparkles className="w-16 h-16 mb-4" style={{ color: "#00FF8833" }} />
        <h1 className="text-[#e0f0ff] text-lg font-medium">AI Family</h1>
        <p className="text-[rgba(0,255,136,0.3)] text-sm mt-1">{FAMILY_PERSONAS.length} 位家人 · {onlineCount} 人在线</p>
        <div className="flex gap-2 mt-6">
          {FAMILY_PERSONAS.map(p => (
            <div key={p.id} className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: `${p.color}22` }}>
              {React.createElement(PERSONA_ICONS[p.id] || UserCircle2, { size: 16, style: { color: p.color } })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
