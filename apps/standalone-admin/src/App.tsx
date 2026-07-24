/**
 * @file: App.tsx
 * @description: 系统管理独立版 — Hub 命令可执行 + 管理面板
 */
import { AIAssistantHub, eventBus, Events, storage, StorageKeys, WelcomePage } from "@yyc3/shell";
import { AlertTriangle, CheckCircle, Eye, Settings, ShieldCheck, Users } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

type Panel = "settings" | "users" | "audit";

export default function App() {
  const [showWelcome, setShowWelcome] = useState(!storage.shell.get(StorageKeys.SHELL_WELCOME_DISMISSED, false));
  const [activePanel, setActivePanel] = useState<Panel>("settings");
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    const unsub = eventBus.on(Events.SHELL_WELCOME_DISMISS, () => setShowWelcome(false));
    return unsub;
  }, []);

  const flash = useCallback((msg: string) => { setMessage(msg); setTimeout(() => setMessage(null), 3000); }, []);

  const ADMIN_CMDS = [
    { id: "a-settings", label: "打开系统设置", systemId: "admin", icon: Settings, action: () => { setActivePanel("settings"); eventBus.emit("system:admin-settings", {}); flash("系统设置已打开"); } },
    { id: "a-users", label: "用户管理", systemId: "admin", icon: Users, action: () => { setActivePanel("users"); eventBus.emit("system:admin-users", {}); flash("用户管理已加载"); } },
    { id: "a-audit", label: "操作审计日志", systemId: "admin", icon: Eye, action: () => { setActivePanel("audit"); eventBus.emit("system:admin-audit", {}); flash("审计日志已加载"); } },
  ];
  const SYSTEM_CARDS = [{ id: "admin", name: "系统管理", description: "设置/用户/安全", icon: ShieldCheck, color: "#FFDD00", path: "/admin" }];

  if (showWelcome) return <WelcomePage systems={SYSTEM_CARDS} mode="modal" onNavigate={() => setShowWelcome(false)} />;

  const USERS = [
    { name: "admin", role: "超级管理员", status: "在线", color: "#00FF88" },
    { name: "dev01", role: "开发者", status: "在线", color: "#00FF88" },
    { name: "dev02", role: "开发者", status: "离线", color: "#666" },
    { name: "ops01", role: "运维", status: "在线", color: "#00FF88" },
  ];

  const AUDIT_LOGS = [
    { user: "admin", action: "修改系统配置", time: "10:32", level: "info" },
    { user: "dev01", action: "部署 v1.1.0", time: "09:15", level: "info" },
    { user: "ops01", action: "执行数据备份", time: "03:00", level: "info" },
    { user: "system", action: "检测到异常登录", time: "昨天", level: "warn" },
  ];

  return (
    <div style={{ background: "linear-gradient(180deg, rgba(255,221,0,0.02) 0%, rgba(4,8,20,1) 40%)", minHeight: "100vh" }}>
      <AIAssistantHub systemId="admin" title="系统管理" accentColor="#FFDD00" commands={ADMIN_CMDS} />

      {message && <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-lg text-sm" style={{ background: "rgba(255,221,0,0.1)", border: "1px solid rgba(255,221,0,0.3)", color: "#FFDD00" }}>{message}</div>}

      <div className="p-6 text-center" style={{ paddingTop: "10vh" }}>
        <ShieldCheck className="w-12 h-12 mx-auto mb-3" style={{ color: "#FFDD00" }} />
        <h1 className="text-[#e0f0ff] text-xl font-bold">系统管理</h1>

        <div className="max-w-md mx-auto mt-8 text-left">
          {activePanel === "settings" && (
            <div className="p-4 rounded-lg" style={{ background: "rgba(255,221,0,0.05)", border: "1px solid rgba(255,221,0,0.15)" }}>
              <p className="text-sm text-[#FFDD00] mb-3">系统设置</p>
              <div className="space-y-2 text-left">
                <label className="flex items-center justify-between text-xs text-[#e0f0ff]"><span>双因素认证</span><input type="checkbox" defaultChecked /></label>
                <label className="flex items-center justify-between text-xs text-[#e0f0ff]"><span>操作审计</span><input type="checkbox" defaultChecked /></label>
                <label className="flex items-center justify-between text-xs text-[#e0f0ff]"><span>自动备份</span><input type="checkbox" defaultChecked /></label>
                <label className="flex items-center justify-between text-xs text-[#e0f0ff]"><span>告警邮件通知</span><input type="checkbox" /></label>
              </div>
              <div className="mt-3 flex items-center gap-2"><CheckCircle size={14} style={{ color: "#00FF88" }} /><span className="text-xs" style={{ color: "#00FF88" }}>系统安全等级: A+</span></div>
            </div>
          )}
          {activePanel === "users" && (
            <div className="p-4 rounded-lg" style={{ background: "rgba(255,221,0,0.05)", border: "1px solid rgba(255,221,0,0.15)" }}>
              <p className="text-sm text-[#FFDD00] mb-3">用户管理</p>
              <div className="space-y-2">
                {USERS.map(u => (
                  <div key={u.name} className="flex items-center gap-2 p-2 rounded" style={{ background: "rgba(255,221,0,0.04)" }}>
                    <Users size={14} style={{ color: "#FFDD00" }} />
                    <div><p className="text-xs text-[#e0f0ff]">{u.name}</p><p className="text-xs" style={{ color: "rgba(255,221,0,0.3)" }}>{u.role}</p></div>
                    <span className="text-xs ml-auto" style={{ color: u.color }}>{u.status}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          {activePanel === "audit" && (
            <div className="p-4 rounded-lg" style={{ background: "rgba(255,221,0,0.05)", border: "1px solid rgba(255,221,0,0.15)" }}>
              <p className="text-sm text-[#FFDD00] mb-3">审计日志</p>
              <div className="space-y-2">
                {AUDIT_LOGS.map((log, i) => (
                  <div key={i} className="flex items-center gap-2 p-2 rounded" style={{ background: "rgba(255,221,0,0.04)" }}>
                    {log.level === "warn" ? <AlertTriangle size={14} style={{ color: "#FF6600" }} /> : <Eye size={14} style={{ color: "#FFDD00" }} />}
                    <div><p className="text-xs text-[#e0f0ff]">{log.action}</p><p className="text-xs" style={{ color: "rgba(255,221,0,0.3)" }}>{log.user} · {log.time}</p></div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
