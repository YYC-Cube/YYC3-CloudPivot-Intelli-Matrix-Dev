/**
 * @file: App.tsx
 * @description: YYC³ 合并版 — 7 系统全开, AI Family 中枢协同
 */
import { FAMILY_PERSONAS } from "@yyc3/plugin-ai-family";
import { AIAssistantHub, eventBus, storage, StorageKeys, WelcomePage } from "@yyc3/shell";
import {
  Activity,
  Brain,
  Code2,
  Ear, Eye,
  Lightbulb,
  Network as NetworkIcon,
  Scale,
  ShieldCheck,
  Shield as ShieldIcon,
  Star,
  UserCircle2,
  Wrench,
} from "lucide-react";
import React, { useState } from "react";
import { createHashRouter, Outlet, RouterProvider } from "react-router-dom";

const CARD_COLORS = { monitor: "#00d4ff", ops: "#FF6600", ai: "#AA55FF", "ai-family": "#00FF88", business: "#14B8A6", dev: "#E8E8E8", admin: "#FFDD00" };
const PERSONA_MAP: Record<string, React.ElementType> = { navigator: Ear, thinker: Eye, prophet: Eye, bolero: Star, "meta-oracle": NetworkIcon, sentinel: ShieldIcon, master: Scale, creative: Lightbulb };

const SYSTEMS = [
  { id: "monitor", name: "监控中心", desc: "实时监控与告警", icon: Activity, path: "/monitor" },
  { id: "ops", name: "运维管理", desc: "操作中心与文件", icon: Wrench, path: "/ops" },
  { id: "ai", name: "AI 智能", desc: "决策/模型/诊断", icon: Brain, path: "/ai" },
  { id: "ai-family", name: "AI Family", desc: "中枢 · 家人协同", icon: UserCircle2, path: "/ai-family" },
  { id: "business", name: "业务看板", desc: "酒店 · 通讯基站", icon: Activity, path: "/business" },
  { id: "dev", name: "开发工具", desc: "设计/终端/IDE", icon: Code2, path: "/dev" },
  { id: "admin", name: "系统管理", desc: "设置/用户/安全", icon: ShieldCheck, path: "/admin" },
];

const ALL_CMDS = [
  ...FAMILY_PERSONAS.map((p: typeof FAMILY_PERSONAS[0]) => ({ id: `call-${p.id}`, label: `呼叫 ${p.shortName}`, systemId: "ai-family", icon: PERSONA_MAP[p.id] || UserCircle2, action: () => { window.location.hash = "#/ai-family"; eventBus.emit("ai:persona-activated", { personaId: p.id }); } })),
  { id: "g-monitor", label: "查看集群状态", systemId: "monitor", icon: Activity, action: () => { window.location.hash = "#/monitor"; } },
  { id: "g-backup", label: "执行数据备份", systemId: "ops", icon: Wrench, action: () => { window.location.hash = "#/ops"; eventBus.emit("system:ops-backup", {}); } },
  { id: "g-analyze", label: "AI 智能分析", systemId: "ai", icon: Brain, action: () => { window.location.hash = "#/ai"; eventBus.emit("ai:analyze", {}); } },
];

const CARDS = SYSTEMS.map(s => ({ ...s, color: (CARD_COLORS as Record<string, string>)[s.id] || "#00d4ff", description: s.desc }));
const familySummary = `${FAMILY_PERSONAS.length} 位家人 · 7 系统协同`;

function Layout({ children }: { children: React.ReactNode }) {
  return <div style={{ background: "radial-gradient(ellipse at center, rgba(0,212,255,0.03) 0%, rgba(4,8,20,1) 70%)", minHeight: "100vh" }}>
    <AIAssistantHub systemId="hub" title="YYC³ 中枢" accentColor="#00FF88" commands={ALL_CMDS} />
    {children}
  </div>;
}

export default function App() {
  const [showWelcome, setShowWelcome] = useState(!storage.shell.get(StorageKeys.SHELL_WELCOME_DISMISSED, false));
  if (showWelcome) return <WelcomePage systems={CARDS} mode="modal" onNavigate={() => setShowWelcome(false)} familySummary={familySummary} />;

  const router = createHashRouter([
    {
      element: <Layout><Outlet /></Layout>, children: [
        { index: true, element: <Dashboard cards={CARDS} /> },
        { path: "monitor", lazy: async () => ({ Component: (await import("@yyc3/plugin-monitor/pages/Dashboard")).default }) },
        { path: "ops", lazy: async () => ({ Component: (await import("@yyc3/plugin-ops/pages/OperationCenter")).default }) },
        { path: "ai", lazy: async () => ({ Component: (await import("@yyc3/plugin-ai/pages/AISuggestion")).default }) },
        { path: "ai-family", lazy: async () => ({ Component: (await import("@yyc3/plugin-ai-family/pages/FamilyHomePage")).default }) },
        { path: "business", lazy: async () => ({ Component: (await import("@yyc3/plugin-business/pages/HotelConsole")).default }) },
        { path: "dev", lazy: async () => ({ Component: (await import("@yyc3/plugin-dev/pages/DesignSystem")).default }) },
        { path: "admin", lazy: async () => ({ Component: (await import("@yyc3/plugin-admin/pages/Audit")).default }) },
      ]
    },
  ]);
  return <RouterProvider router={router} />;
}

/** 首屏控制面板 */
function Dashboard({ cards }: { cards: { id: string; name: string; desc: string; icon: React.ElementType; color: string; path: string }[] }) {
  return (
    <div className="p-8 text-center" style={{ paddingTop: "8vh" }}>
      <h1 className="text-[#e0f0ff] text-2xl font-bold tracking-wider mb-2">YYC³ Cloud Intelli-Matrix</h1>
      <p className="text-[rgba(0,212,255,0.3)] text-sm mb-10">7 系统协同 · AI Family 中枢</p>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 max-w-2xl mx-auto">
        {cards.map(c => {
          const Icon = c.icon;
          return (
            <a key={c.id} href={`#${c.path}`}
              className="p-5 rounded-xl text-center transition-all hover:scale-105"
              style={{ background: `${c.color}06`, border: `1px solid ${c.color}18`, textDecoration: "none" }}>
              <Icon size={24} style={{ color: c.color, margin: "0 auto 8px" }} />
              <p className="text-[#e0f0ff] text-sm font-medium">{c.name}</p>
              <p className="text-[rgba(255,255,255,0.2)] text-xs mt-0.5">{c.desc}</p>
            </a>
          );
        })}
      </div>

      <div className="mt-12 flex justify-center gap-6 text-[rgba(0,212,255,0.15)] text-xs">
        <span>{FAMILY_PERSONAS.length} 位家人</span><span>·</span>
        <span>7 子系统</span>
      </div>
    </div>
  );
}
