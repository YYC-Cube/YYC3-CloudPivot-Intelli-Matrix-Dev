import React, { useState } from "react";
import { WelcomePage, AIAssistantHub, storage, StorageKeys } from "@yyc3/shell";
import { Code2, Terminal, Palette } from "lucide-react";

const DEV_CMDS = [
  { id: "d-term",   label: "打开终端",     systemId: "dev", icon: Terminal, action: () => {} },
  { id: "d-design", label: "设计系统",     systemId: "dev", icon: Palette, action: () => {} },
  { id: "d-ide",    label: "打开 IDE",     systemId: "dev", icon: Code2, action: () => {} },
];

const SYSTEM_CARDS = [{ id: "dev", name: "开发工具", description: "设计/终端/IDE", icon: Code2, color: "#E8E8E8", path: "/dev" }];

export default function App() {
  const [showWelcome, setShowWelcome] = useState(!storage.shell.get(StorageKeys.SHELL_WELCOME_DISMISSED, false));
  if (showWelcome) return <WelcomePage systems={SYSTEM_CARDS} mode="modal" onNavigate={() => setShowWelcome(false)} />;
  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: "radial-gradient(ellipse at center, rgba(232,232,232,0.03) 0%, rgba(4,8,20,1) 70%)" }}>
      <AIAssistantHub systemId="dev" title="开发工具" accentColor="#E8E8E8" commands={DEV_CMDS} />
      <div className="text-center">
        <Code2 className="w-16 h-16 mx-auto mb-4" style={{ color: "#E8E8E833" }} />
        <h1 className="text-[#e0f0ff] text-lg font-medium">开发工具</h1>
        <p className="text-[rgba(232,232,232,0.3)] text-sm mt-1">设计系统 · 终端 · IDE</p>
      </div>
    </div>
  );
}
