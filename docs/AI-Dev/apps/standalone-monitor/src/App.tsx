import React, { useState } from "react";
import { WelcomePage, AIAssistantHub, storage, StorageKeys } from "@yyc3/shell";
import { Activity, AlertTriangle, Eye, Bell } from "lucide-react";

const MONITOR_CMDS = [
  { id: "m-status", label: "查看集群状态",   systemId: "monitor", icon: Activity, action: () => {} },
  { id: "m-alerts", label: "查看告警列表",   systemId: "monitor", icon: AlertTriangle, action: () => {} },
  { id: "m-patrol", label: "启动巡查模式",   systemId: "monitor", icon: Eye, action: () => {} },
  { id: "m-rules",  label: "配置告警规则",   systemId: "monitor", icon: Bell, action: () => {} },
];

const SYSTEM_CARDS = [{ id: "monitor", name: "监控中心", description: "实时监控与告警", icon: Activity, color: "#00d4ff", path: "/monitor" }];

export default function App() {
  const [showWelcome, setShowWelcome] = useState(!storage.shell.get(StorageKeys.SHELL_WELCOME_DISMISSED, false));
  if (showWelcome) return <WelcomePage systems={SYSTEM_CARDS} mode="modal" onNavigate={() => setShowWelcome(false)} />;
  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: "radial-gradient(ellipse at center, rgba(0,212,255,0.03) 0%, rgba(4,8,20,1) 70%)" }}>
      <AIAssistantHub systemId="monitor" title="监控中心" accentColor="#00d4ff" commands={MONITOR_CMDS} />
      <div className="text-center">
        <Activity className="w-16 h-16 mx-auto mb-4" style={{ color: "#00d4ff33" }} />
        <h1 className="text-[#e0f0ff] text-lg font-medium">监控中心</h1>
        <p className="text-[rgba(0,212,255,0.3)] text-sm mt-1">数据监控 · 告警 · 巡查</p>
      </div>
    </div>
  );
}
