/**
 * @file: App.tsx
 * @description: 运维管理独立版 — Hub 命令可执行 + 操作面板
 */
import { AIAssistantHub, eventBus, Events, storage, StorageKeys, WelcomePage } from "@yyc3/shell";
import { CheckCircle, Database, FileText, Loader, Server, Wrench } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

type Panel = "backup" | "files" | "db";

export default function App() {
  const [showWelcome, setShowWelcome] = useState(!storage.shell.get(StorageKeys.SHELL_WELCOME_DISMISSED, false));
  const [activePanel, setActivePanel] = useState<Panel>("backup");
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

  const OPS_CMDS = [
    { id: "o-backup", label: "执行数据备份", systemId: "ops", icon: Server, action: () => runAction("backup", "数据备份已执行", "system:ops-backup") },
    { id: "o-files", label: "管理文件", systemId: "ops", icon: FileText, action: () => runAction("files", "文件管理器已打开", "system:ops-files") },
    { id: "o-db", label: "数据库健康检查", systemId: "ops", icon: Database, action: () => runAction("db", "数据库健康检查完成", "system:ops-db") },
  ];
  const SYSTEM_CARDS = [{ id: "ops", name: "运维管理", description: "操作中心与文件管理", icon: Wrench, color: "#FF6600", path: "/ops" }];

  if (showWelcome) return <WelcomePage systems={SYSTEM_CARDS} mode="modal" onNavigate={() => setShowWelcome(false)} />;

  return (
    <div style={{ background: "linear-gradient(180deg, rgba(255,102,0,0.02) 0%, rgba(4,8,20,1) 40%)", minHeight: "100vh" }}>
      <AIAssistantHub systemId="ops" title="运维管理" accentColor="#FF6600" commands={OPS_CMDS} />

      {message && <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-lg text-sm" style={{ background: "rgba(255,102,0,0.1)", border: "1px solid rgba(255,102,0,0.3)", color: "#FF6600" }}>{message}</div>}

      <div className="p-6 text-center" style={{ paddingTop: "10vh" }}>
        <Wrench className="w-12 h-12 mx-auto mb-3" style={{ color: "#FF6600" }} />
        <h1 className="text-[#e0f0ff] text-xl font-bold">运维管理</h1>

        <div className="max-w-md mx-auto mt-8 text-left">
          {activePanel === "backup" && (
            <div className="p-4 rounded-lg" style={{ background: "rgba(255,102,0,0.05)", border: "1px solid rgba(255,102,0,0.15)" }}>
              <div className="flex items-center gap-2 mb-2">{loading ? <Loader className="animate-spin" size={16} style={{ color: "#FF6600" }} /> : <CheckCircle size={16} style={{ color: "#00ff88" }} />}<p className="text-sm text-[#FF6600]">数据备份</p></div>
              <p className="text-xs" style={{ color: "rgba(255,102,0,0.4)" }}>{loading ? "正在备份..." : "上次备份: 2026-07-16 03:00"}</p>
              <p className="text-xs mt-1" style={{ color: "rgba(255,102,0,0.3)" }}>备份大小: 2.3 GB · 状态: 健康</p>
            </div>
          )}
          {activePanel === "files" && (
            <div className="p-4 rounded-lg" style={{ background: "rgba(255,102,0,0.05)", border: "1px solid rgba(255,102,0,0.15)" }}>
              <p className="text-sm text-[#FF6600]">文件管理</p>
              <div className="mt-3 space-y-2">
                {[{ n: "config.json", s: "2.1KB", t: "配置" }, { n: "logs/app-2026-07-16.log", s: "1.2MB", t: "日志" }, { n: "backups/db-2026-07-16.tar.gz", s: "2.3GB", t: "备份" }].map(f => (
                  <div key={f.n} className="flex items-center gap-2 p-2 rounded" style={{ background: "rgba(255,102,0,0.04)" }}>
                    <FileText size={14} style={{ color: "#FF6600" }} /><span className="text-xs text-[#e0f0ff]">{f.n}</span><span className="text-xs ml-auto" style={{ color: "rgba(255,102,0,0.3)" }}>{f.s}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          {activePanel === "db" && (
            <div className="p-4 rounded-lg" style={{ background: "rgba(255,102,0,0.05)", border: "1px solid rgba(255,102,0,0.15)" }}>
              <p className="text-sm text-[#FF6600]">数据库健康检查</p>
              <div className="mt-3 space-y-1 text-left">
                <p className="text-xs text-[#e0f0ff]">连接: <span style={{ color: "#00ff88" }}>正常</span></p>
                <p className="text-xs text-[#e0f0ff]">响应时间: <span style={{ color: "#00ff88" }}>12ms</span></p>
                <p className="text-xs text-[#e0f0ff]">表数量: <span style={{ color: "#00ff88" }}>47</span></p>
                <p className="text-xs text-[#e0f0ff]">索引完整: <span style={{ color: "#00ff88" }}>是</span></p>
                <p className="text-xs text-[#e0f0ff]">慢查询: <span style={{ color: "#FFDD00" }}>2 条</span></p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
