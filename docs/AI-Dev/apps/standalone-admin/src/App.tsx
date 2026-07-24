import React, { useState } from "react";
import { WelcomePage, AIAssistantHub, storage, StorageKeys } from "@yyc3/shell";
import { ShieldCheck, Users, Settings, Eye } from "lucide-react";

const ADMIN_CMDS = [
  { id: "a-settings", label: "打开系统设置",   systemId: "admin", icon: Settings, action: () => {} },
  { id: "a-users",    label: "用户管理",       systemId: "admin", icon: Users, action: () => {} },
  { id: "a-audit",    label: "操作审计日志",   systemId: "admin", icon: Eye, action: () => {} },
];

const SYSTEM_CARDS = [{ id: "admin", name: "系统管理", description: "设置/用户/安全", icon: ShieldCheck, color: "#FFDD00", path: "/admin" }];

export default function App() {
  const [showWelcome, setShowWelcome] = useState(!storage.shell.get(StorageKeys.SHELL_WELCOME_DISMISSED, false));
  if (showWelcome) return <WelcomePage systems={SYSTEM_CARDS} mode="modal" onNavigate={() => setShowWelcome(false)} />;
  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: "radial-gradient(ellipse at center, rgba(255,221,0,0.03) 0%, rgba(4,8,20,1) 70%)" }}>
      <AIAssistantHub systemId="admin" title="系统管理" accentColor="#FFDD00" commands={ADMIN_CMDS} />
      <div className="text-center">
        <ShieldCheck className="w-16 h-16 mx-auto mb-4" style={{ color: "#FFDD0033" }} />
        <h1 className="text-[#e0f0ff] text-lg font-medium">系统管理</h1>
        <p className="text-[rgba(255,221,0,0.3)] text-sm mt-1">设置 · 用户 · 安全 · PWA</p>
      </div>
    </div>
  );
}
