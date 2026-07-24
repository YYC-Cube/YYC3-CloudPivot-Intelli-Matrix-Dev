/**
 * @file: App.tsx
 * @description: 业务空间独立版 — 智慧酒店 + 通讯基站
 */
import { AIAssistantHub, eventBus, Events, storage, StorageKeys, WelcomePage } from "@yyc3/shell";
import { Building2, Radio, CheckCircle, Loader, Wifi, BedDouble } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

type Panel = "hotel" | "comm";

export default function App() {
  const [showWelcome, setShowWelcome] = useState(!storage.shell.get(StorageKeys.SHELL_WELCOME_DISMISSED, false));
  const [activePanel, setActivePanel] = useState<Panel>("hotel");
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const unsub = eventBus.on(Events.SHELL_WELCOME_DISMISS, () => setShowWelcome(false));
    return unsub;
  }, []);

  const flash = useCallback((msg: string) => { setMessage(msg); setTimeout(() => setMessage(null), 3000); }, []);

  const runAction = useCallback((panel: Panel, msg: string, event: string) => {
    setActivePanel(panel); setLoading(true);
    eventBus.emit(event, {});
    flash(msg);
    setTimeout(() => setLoading(false), 1500);
  }, [flash]);

  const BIZ_CMDS = [
    { id: "b-hotel", label: "智慧酒店控制台", systemId: "business", icon: Building2, action: () => runAction("hotel", "酒店控制台已加载", "system:business-hotel") },
    { id: "b-comm", label: "通讯基站状态", systemId: "business", icon: Radio, action: () => runAction("comm", "通讯基站状态已刷新", "system:business-comm") },
  ];
  const SYSTEM_CARDS = [{ id: "business", name: "业务空间", description: "智慧酒店 / 通讯基站", icon: Building2, color: "#14B8A6", path: "/business" }];

  if (showWelcome) return <WelcomePage systems={SYSTEM_CARDS} mode="modal" onNavigate={() => setShowWelcome(false)} />;

  return (
    <div style={{ background: "linear-gradient(180deg, rgba(20,184,166,0.02) 0%, rgba(4,8,20,1) 40%)", minHeight: "100vh" }}>
      <AIAssistantHub systemId="business" title="业务空间" accentColor="#14B8A6" commands={BIZ_CMDS} />

      {message && <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-lg text-sm" style={{ background: "rgba(20,184,166,0.1)", border: "1px solid rgba(20,184,166,0.3)", color: "#14B8A6" }}>{message}</div>}

      <div className="p-6 text-center" style={{ paddingTop: "10vh" }}>
        <Building2 className="w-12 h-12 mx-auto mb-3" style={{ color: "#14B8A6" }} />
        <h1 className="text-[#e0f0ff] text-xl font-bold">业务空间</h1>

        <div className="max-w-md mx-auto mt-8 text-left">
          {activePanel === "hotel" && (
            <div className="p-4 rounded-lg" style={{ background: "rgba(20,184,166,0.05)", border: "1px solid rgba(20,184,166,0.15)" }}>
              <div className="flex items-center gap-2 mb-2">
                {loading ? <Loader className="animate-spin" size={16} style={{ color: "#14B8A6" }} /> : <CheckCircle size={16} style={{ color: "#00ff88" }} />}
                <p className="text-sm" style={{ color: "#14B8A6" }}>智慧酒店控制台</p>
              </div>
              <div className="mt-3 space-y-2">
                {[
                  { room: "8801", status: "已入住", guest: "张先生" },
                  { room: "8802", status: "空闲", guest: "-" },
                  { room: "8803", status: "清洁中", guest: "-" },
                  { room: "VIP套", status: "已入住", guest: "李女士" },
                ].map(r => (
                  <div key={r.room} className="flex items-center gap-2 p-2 rounded" style={{ background: "rgba(20,184,166,0.04)" }}>
                    <BedDouble size={14} style={{ color: "#14B8A6" }} />
                    <span className="text-xs text-[#e0f0ff]">{r.room}</span>
                    <span className="text-xs ml-auto" style={{ color: r.status === "已入住" ? "#FFDD00" : r.status === "空闲" ? "#00ff88" : "#14B8A6" }}>{r.status}</span>
                    <span className="text-xs" style={{ color: "rgba(20,184,166,0.3)" }}>{r.guest}</span>
                  </div>
                ))}
              </div>
              <p className="text-xs mt-2" style={{ color: "rgba(20,184,166,0.3)" }}>入住率: 50% · 房间总数: 120</p>
            </div>
          )}
          {activePanel === "comm" && (
            <div className="p-4 rounded-lg" style={{ background: "rgba(20,184,166,0.05)", border: "1px solid rgba(20,184,166,0.15)" }}>
              <p className="text-sm" style={{ color: "#14B8A6" }}>通讯基站状态</p>
              <div className="mt-3 space-y-1 text-left">
                <p className="text-xs text-[#e0f0ff]">信号强度: <span style={{ color: "#00ff88" }}>-42 dBm (优)</span></p>
                <p className="text-xs text-[#e0f0ff]">在线设备: <span style={{ color: "#00ff88" }}>48 台</span></p>
                <p className="text-xs text-[#e0f0ff]">频段: <span style={{ color: "#14B8A6" }}>2.4G / 5G 双频</span></p>
                <p className="text-xs text-[#e0f0ff]">上行带宽: <span style={{ color: "#00ff88" }}>867 Mbps</span></p>
                <p className="text-xs text-[#e0f0ff]">运行时长: <span style={{ color: "#14B8A6" }}>28 天 14 小时</span></p>
              </div>
              <div className="flex items-center gap-2 mt-3 pt-3" style={{ borderTop: "1px solid rgba(20,184,166,0.1)" }}>
                <Wifi size={14} style={{ color: "#00ff88" }} />
                <span className="text-xs" style={{ color: "#00ff88" }}>基站运行正常</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
