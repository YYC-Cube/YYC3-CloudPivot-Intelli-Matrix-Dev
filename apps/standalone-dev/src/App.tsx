/**
 * @file: App.tsx
 * @description: 开发工具独立版 — Hub 命令可执行 + 工具面板
 */
import { AIAssistantHub, eventBus, Events, storage, StorageKeys, WelcomePage } from "@yyc3/shell";
import { CheckCircle, Code2, Palette, Terminal } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

type Panel = "terminal" | "design" | "ide";

export default function App() {
  const [showWelcome, setShowWelcome] = useState(!storage.shell.get(StorageKeys.SHELL_WELCOME_DISMISSED, false));
  const [activePanel, setActivePanel] = useState<Panel>("design");
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    const unsub = eventBus.on(Events.SHELL_WELCOME_DISMISS, () => setShowWelcome(false));
    return unsub;
  }, []);

  const flash = useCallback((msg: string) => { setMessage(msg); setTimeout(() => setMessage(null), 3000); }, []);

  const DEV_CMDS = [
    { id: "d-term", label: "打开终端", systemId: "dev", icon: Terminal, action: () => { setActivePanel("terminal"); eventBus.emit("system:dev-terminal", {}); flash("终端已打开"); } },
    { id: "d-design", label: "设计系统", systemId: "dev", icon: Palette, action: () => { setActivePanel("design"); eventBus.emit("system:dev-design", {}); flash("设计系统已加载"); } },
    { id: "d-ide", label: "打开 IDE", systemId: "dev", icon: Code2, action: () => { setActivePanel("ide"); eventBus.emit("system:dev-ide", {}); flash("IDE 已启动"); } },
  ];
  const SYSTEM_CARDS = [{ id: "dev", name: "开发工具", description: "设计/终端/IDE", icon: Code2, color: "#E8E8E8", path: "/dev" }];

  if (showWelcome) return <WelcomePage systems={SYSTEM_CARDS} mode="modal" onNavigate={() => setShowWelcome(false)} />;

  const COLORS = ["#00FF88", "#00d4ff", "#FF6600", "#AA55FF", "#C9A96E", "#FFDD00"];

  return (
    <div style={{ background: "linear-gradient(180deg, rgba(232,232,232,0.02) 0%, rgba(4,8,20,1) 40%)", minHeight: "100vh" }}>
      <AIAssistantHub systemId="dev" title="开发工具" accentColor="#E8E8E8" commands={DEV_CMDS} />

      {message && <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-lg text-sm" style={{ background: "rgba(232,232,232,0.1)", border: "1px solid rgba(232,232,232,0.3)", color: "#E8E8E8" }}>{message}</div>}

      <div className="p-6 text-center" style={{ paddingTop: "10vh" }}>
        <Code2 className="w-12 h-12 mx-auto mb-3" style={{ color: "#E8E8E8" }} />
        <h1 className="text-[#e0f0ff] text-xl font-bold">开发工具</h1>

        <div className="max-w-md mx-auto mt-8 text-left">
          {activePanel === "terminal" && (
            <div className="p-4 rounded-lg font-mono" style={{ background: "rgba(0,0,0,0.3)", border: "1px solid rgba(232,232,232,0.15)" }}>
              <p className="text-xs" style={{ color: "#00FF88" }}>$ pnpm dev</p>
              <p className="text-xs mt-1" style={{ color: "rgba(255,255,255,0.3)" }}>→ Local: http://localhost:3100</p>
              <p className="text-xs" style={{ color: "rgba(255,255,255,0.3)" }}>→ ready in 423ms</p>
              <p className="text-xs mt-2" style={{ color: "#00d4ff" }}>$ npx tsc --noEmit</p>
              <p className="text-xs" style={{ color: "#00FF88" }}>→ 0 errors</p>
              <p className="text-xs mt-2" style={{ color: "#FFDD00" }}>$ npx vitest run</p>
              <p className="text-xs" style={{ color: "#00FF88" }}>→ 167 passed (167)</p>
            </div>
          )}
          {activePanel === "design" && (
            <div className="p-4 rounded-lg" style={{ background: "rgba(232,232,232,0.05)", border: "1px solid rgba(232,232,232,0.15)" }}>
              <p className="text-sm text-[#E8E8E8] mb-3">设计系统 · 色彩规范</p>
              <div className="grid grid-cols-3 gap-2">
                {COLORS.map(c => (
                  <div key={c} className="p-2 rounded text-center" style={{ background: `${c}15`, border: `1px solid ${c}33` }}>
                    <div className="w-full h-8 rounded mb-1" style={{ background: c }} />
                    <p className="text-xs" style={{ color: c }}>{c}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
          {activePanel === "ide" && (
            <div className="p-4 rounded-lg" style={{ background: "rgba(232,232,232,0.05)", border: "1px solid rgba(232,232,232,0.15)" }}>
              <p className="text-sm text-[#E8E8E8] mb-3">IDE 工作区</p>
              <div className="space-y-1 text-left">
                <p className="text-xs text-[#e0f0ff]">📂 YYC3-CloudPivot-Intelli-Matrix-Dev/</p>
                <p className="text-xs pl-4" style={{ color: "rgba(232,232,232,0.4)" }}>📂 packages/ (13)</p>
                <p className="text-xs pl-4" style={{ color: "rgba(232,232,232,0.4)" }}>📂 apps/ (8)</p>
                <p className="text-xs pl-4" style={{ color: "rgba(232,232,232,0.4)" }}>📂 docs/ (25+)</p>
                <p className="text-xs pl-4" style={{ color: "rgba(232,232,232,0.4)" }}>📄 tsconfig.json</p>
                <p className="text-xs pl-4" style={{ color: "rgba(232,232,232,0.4)" }}>📄 vitest.config.ts</p>
              </div>
              <div className="mt-3 flex items-center gap-2"><CheckCircle size={14} style={{ color: "#00FF88" }} /><span className="text-xs" style={{ color: "#00FF88" }}>项目健康度: 优秀</span></div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
