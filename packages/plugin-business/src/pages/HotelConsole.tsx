/**
 * @file: HotelConsole.tsx
 * @description: 业务空间 — 智慧酒店控制台
 */
import { eventBus } from "@yyc3/shell";
import { BedDouble, CheckCircle, Loader, Radio, Wifi } from "lucide-react";
import { useEffect, useState } from "react";

type Panel = "hotel" | "comm";

const ROOMS = [
  { room: "8801", status: "已入住", guest: "张先生" },
  { room: "8802", status: "空闲", guest: "-" },
  { room: "8803", status: "清洁中", guest: "-" },
  { room: "VIP套", status: "已入住", guest: "李女士" },
];

export default function HotelConsole() {
  const [activePanel, setActivePanel] = useState<Panel>("hotel");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const onHotel = () => { setActivePanel("hotel"); setLoading(true); setTimeout(() => setLoading(false), 1200); };
    const onComm = () => { setActivePanel("comm"); setLoading(true); setTimeout(() => setLoading(false), 1200); };
    const u1 = eventBus.on("system:business-hotel", onHotel);
    const u2 = eventBus.on("system:business-comm", onComm);
    return () => { u1(); u2(); };
  }, []);

  return (
    <div className="p-6 text-center" style={{ background: "linear-gradient(180deg, rgba(20,184,166,0.02) 0%, rgba(4,8,20,1) 40%)", minHeight: "100vh", paddingTop: "10vh" }}>
      <div className="w-12 h-12 mx-auto mb-3 rounded-2xl flex items-center justify-center" style={{ background: "linear-gradient(135deg, #14B8A6, #0d9488)" }}>
        <BedDouble className="w-6 h-6 text-white" />
      </div>
      <h1 className="text-[#e0f0ff] text-xl font-bold">业务空间</h1>
      <p className="text-[rgba(20,184,166,0.4)] text-xs mt-1">智慧酒店 · 通讯基站</p>

      <div className="flex justify-center gap-2 mt-6">
        <button onClick={() => setActivePanel("hotel")} className="px-3 py-1 rounded-lg text-xs transition-all" style={{ background: activePanel === "hotel" ? "rgba(20,184,166,0.15)" : "transparent", border: "1px solid rgba(20,184,166,0.2)", color: activePanel === "hotel" ? "#14B8A6" : "rgba(20,184,166,0.5)" }}>
          <BedDouble size={12} className="inline mr-1" />智慧酒店
        </button>
        <button onClick={() => setActivePanel("comm")} className="px-3 py-1 rounded-lg text-xs transition-all" style={{ background: activePanel === "comm" ? "rgba(20,184,166,0.15)" : "transparent", border: "1px solid rgba(20,184,166,0.2)", color: activePanel === "comm" ? "#14B8A6" : "rgba(20,184,166,0.5)" }}>
          <Radio size={12} className="inline mr-1" />通讯基站
        </button>
      </div>

      <div className="max-w-md mx-auto mt-6 text-left">
        {loading && <div className="flex items-center justify-center gap-2 mb-3"><Loader className="animate-spin" size={14} style={{ color: "#14B8A6" }} /><span className="text-xs" style={{ color: "#14B8A6" }}>加载中...</span></div>}
        {activePanel === "hotel" && (
          <div className="p-4 rounded-lg" style={{ background: "rgba(20,184,166,0.05)", border: "1px solid rgba(20,184,166,0.15)" }}>
            <div className="flex items-center gap-2 mb-2">
              {!loading && <CheckCircle size={16} style={{ color: "#00ff88" }} />}
              <p className="text-sm" style={{ color: "#14B8A6" }}>智慧酒店控制台</p>
            </div>
            <div className="mt-3 space-y-2">
              {ROOMS.map(r => (
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
  );
}
