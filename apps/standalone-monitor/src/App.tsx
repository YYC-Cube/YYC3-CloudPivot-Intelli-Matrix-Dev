/**
 * @file: App.tsx
 * @description: 监控中心独立版 — Hub 命令可执行 + 实时面板
 */
import { AIAssistantHub, eventBus, Events, storage, StorageKeys, WelcomePage } from "@yyc3/shell";
import { Activity, AlertTriangle, Bell, CheckCircle, Cpu, Eye, XCircle } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

type Panel = "status" | "alerts" | "patrol" | "rules";

export default function App() {
  const [showWelcome, setShowWelcome] = useState(!storage.shell.get(StorageKeys.SHELL_WELCOME_DISMISSED, false));
  const [activePanel, setActivePanel] = useState<Panel>("status");
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const unsub = eventBus.on(Events.SHELL_WELCOME_DISMISS, () => setShowWelcome(false));
    return unsub;
  }, []);

  const flash = useCallback((msg: string) => { setMessage(msg); setTimeout(() => setMessage(null), 3000); }, []);

  const CMDS = [
    { id: "m-status", label: "查看集群状态", systemId: "monitor", icon: Activity, action: () => { setActivePanel("status"); eventBus.emit("system:monitor-status", {}); flash("集群状态已刷新"); } },
    { id: "m-alerts", label: "查看告警列表", systemId: "monitor", icon: AlertTriangle, action: () => { setActivePanel("alerts"); eventBus.emit("system:monitor-alerts", {}); flash("告警列表已加载"); } },
    { id: "m-patrol", label: "启动巡查模式", systemId: "monitor", icon: Eye, action: () => { setActivePanel("patrol"); eventBus.emit("system:monitor-patrol", { mode: "start" }); flash("巡查模式已启动"); } },
    { id: "m-rules", label: "配置告警规则", systemId: "monitor", icon: Bell, action: () => { setActivePanel("rules"); eventBus.emit("system:monitor-rules", {}); flash("告警规则面板已打开"); } },
  ];
  const CARDS = [{ id: "monitor", name: "监控中心", description: "实时监控与告警", icon: Activity, color: "#00d4ff", path: "/monitor" }];

  if (showWelcome) return <WelcomePage systems={CARDS} mode="modal" onNavigate={() => setShowWelcome(false)} />;

  const STATS = [
    { v: "7/8", l: "节点", c: "#00ff88" },
    { v: "3.8k", l: "QPS", c: "#00d4ff" },
    { v: "2", l: "告警", c: "#FFDD00" },
    { v: "48ms", l: "延迟", c: "#00d4ff" },
  ];

  const ALERTS = [
    { level: "warn", msg: "node-3 CPU 使用率 85%", time: "2分钟前", icon: AlertTriangle, color: "#FFDD00" },
    { level: "info", msg: "node-1 磁盘使用率 72%", time: "5分钟前", icon: Eye, color: "#00d4ff" },
  ];

  return (
    <div style={{ background: "linear-gradient(180deg, rgba(0,212,255,0.02) 0%, rgba(4,8,20,1) 40%)", minHeight: "100vh" }}>
      <AIAssistantHub systemId="monitor" title="监控中心" accentColor="#00d4ff" commands={CMDS} />

      {message && <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-lg text-sm" style={{ background: "rgba(0,212,255,0.1)", border: "1px solid rgba(0,212,255,0.3)", color: "#00d4ff" }}>{message}</div>}

      <div className="p-6 text-center" style={{ paddingTop: "8vh" }}>
        <Activity className="w-12 h-12 mx-auto mb-3" style={{ color: "#00d4ff" }} />
        <h1 className="text-[#e0f0ff] text-xl font-bold">监控中心</h1>
        <p className="text-[rgba(0,212,255,0.3)] text-xs mt-1">7/8 节点在线 · QPS 3.8k · 延迟 48ms</p>

        <div className="grid grid-cols-2 gap-3 max-w-xs mx-auto mt-6">
          {STATS.map(s => (
            <div key={s.l} className="p-3 rounded-xl" style={{ background: "rgba(0,40,80,0.2)", border: "1px solid rgba(0,180,255,0.08)" }}>
              <p className="text-lg font-bold" style={{ color: s.c }}>{s.v}</p>
              <p className="text-[rgba(0,212,255,0.4)] text-xs">{s.l}</p>
            </div>
          ))}
        </div>

        <div className="max-w-md mx-auto mt-8 text-left">
          {activePanel === "status" && (
            <div className="space-y-2">
              {[1, 2, 3, 4, 5, 6, 7].map(n => (
                <div key={n} className="flex items-center gap-3 p-3 rounded-lg" style={{ background: "rgba(0,40,80,0.15)", border: "1px solid rgba(0,180,255,0.06)" }}>
                  <CheckCircle size={16} style={{ color: "#00ff88" }} />
                  <span className="text-sm text-[#e0f0ff]">node-{n}</span>
                  <span className="text-xs ml-auto" style={{ color: "rgba(0,212,255,0.4)" }}>CPU {Math.floor(Math.random() * 30 + 20)}% · MEM {Math.floor(Math.random() * 40 + 30)}%</span>
                </div>
              ))}
              <div className="flex items-center gap-3 p-3 rounded-lg" style={{ background: "rgba(0,40,80,0.1)", border: "1px solid rgba(255,221,0,0.1)" }}>
                <XCircle size={16} style={{ color: "#FF6600" }} />
                <span className="text-sm text-[#e0f0ff]">node-8</span>
                <span className="text-xs ml-auto" style={{ color: "rgba(255,102,0,0.5)" }}>离线</span>
              </div>
            </div>
          )}
          {activePanel === "alerts" && (
            <div className="space-y-2">
              {ALERTS.map((a, i) => {
                const Icon = a.icon; return (
                  <div key={i} className="flex items-center gap-3 p-3 rounded-lg" style={{ background: `${a.color}0A`, border: `1px solid ${a.color}22` }}>
                    <Icon size={16} style={{ color: a.color }} />
                    <div><p className="text-sm text-[#e0f0ff]">{a.msg}</p><p className="text-xs" style={{ color: "rgba(255,255,255,0.2)" }}>{a.time}</p></div>
                  </div>
                );
              })}
            </div>
          )}
          {activePanel === "patrol" && (
            <div className="p-4 rounded-lg" style={{ background: "rgba(0,212,255,0.05)", border: "1px solid rgba(0,212,255,0.15)" }}>
              <p className="text-sm text-[#00d4ff]">巡查模式已启动</p>
              <p className="text-xs mt-2" style={{ color: "rgba(0,212,255,0.4)" }}>每 30 秒自动检查所有节点健康状态</p>
              <div className="mt-3 flex items-center gap-2"><Cpu size={14} style={{ color: "#00d4ff" }} /><span className="text-xs" style={{ color: "#00d4ff" }}>正在巡查 node-1...</span></div>
            </div>
          )}
          {activePanel === "rules" && (
            <div className="p-4 rounded-lg" style={{ background: "rgba(0,212,255,0.05)", border: "1px solid rgba(0,212,255,0.15)" }}>
              <p className="text-sm text-[#00d4ff]">告警规则配置</p>
              <div className="mt-3 space-y-2 text-left">
                <label className="flex items-center gap-2 text-xs text-[#e0f0ff]"><input type="checkbox" defaultChecked /> CPU &gt; 80%</label>
                <label className="flex items-center gap-2 text-xs text-[#e0f0ff]"><input type="checkbox" defaultChecked /> MEM &gt; 90%</label>
                <label className="flex items-center gap-2 text-xs text-[#e0f0ff]"><input type="checkbox" defaultChecked /> 磁盘 &gt; 85%</label>
                <label className="flex items-center gap-2 text-xs text-[#e0f0ff]"><input type="checkbox" /> 节点离线</label>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
