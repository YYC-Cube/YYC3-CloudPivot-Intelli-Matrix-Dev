import React, { useState } from "react";
import { WelcomePage, AIAssistantHub, storage, StorageKeys } from "@yyc3/shell";
import { Wrench, Server, FileText, Database } from "lucide-react";

const OPS_CMDS = [
  { id: "o-backup", label: "执行数据备份",   systemId: "ops", icon: Server, action: () => {} },
  { id: "o-files",  label: "管理文件",       systemId: "ops", icon: FileText, action: () => {} },
  { id: "o-db",     label: "数据库健康检查", systemId: "ops", icon: Database, action: () => {} },
];

const SYSTEM_CARDS = [{ id: "ops", name: "运维管理", description: "操作中心与文件管理", icon: Wrench, color: "#FF6600", path: "/ops" }];

export default function App() {
  const [showWelcome, setShowWelcome] = useState(!storage.shell.get(StorageKeys.SHELL_WELCOME_DISMISSED, false));
  if (showWelcome) return <WelcomePage systems={SYSTEM_CARDS} mode="modal" onNavigate={() => setShowWelcome(false)} />;
  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: "radial-gradient(ellipse at center, rgba(255,102,0,0.03) 0%, rgba(4,8,20,1) 70%)" }}>
      <AIAssistantHub systemId="ops" title="运维管理" accentColor="#FF6600" commands={OPS_CMDS} />
      <div className="text-center">
        <Wrench className="w-16 h-16 mx-auto mb-4" style={{ color: "#FF660033" }} />
        <h1 className="text-[#e0f0ff] text-lg font-medium">运维管理</h1>
        <p className="text-[rgba(255,102,0,0.3)] text-sm mt-1">操作中心 · 文件 · 数据库</p>
      </div>
    </div>
  );
}
