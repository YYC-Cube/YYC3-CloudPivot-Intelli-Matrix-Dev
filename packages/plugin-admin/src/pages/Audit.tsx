/**
 * @file: Audit.tsx
 * @description: 系统管理中心
 */
import React from "react";
import { ShieldCheck, Users, Settings, Eye, Monitor, Smartphone } from "lucide-react";

const ADMIN_MODULES = [
  { label: "系统设置",   icon: Settings,    color: "#FFDD00", desc: "全局配置" },
  { label: "用户管理",   icon: Users,       color: "#00d4ff", desc: "权限与角色" },
  { label: "操作审计",   icon: Eye,         color: "#00FF88", desc: "日志追溯" },
  { label: "安全监控",   icon: ShieldCheck, color: "#BF00FF", desc: "威胁检测" },
  { label: "性能监控",   icon: Monitor,     color: "#FF6600", desc: "系统指标" },
  { label: "PWA 管理",   icon: Smartphone,  color: "#FF69B4", desc: "离线与安装" },
];

export default function Audit() {
  return (
    <div className="p-6" style={{ background: "linear-gradient(180deg, rgba(255,221,0,0.02) 0%, rgba(4,8,20,1) 40%)", minHeight: "100vh" }}>
      <div className="text-center mb-8">
        <ShieldCheck className="w-10 h-10 mx-auto mb-2" style={{ color: "#FFDD00" }} />
        <h1 className="text-[#e0f0ff] text-xl font-bold">系统管理</h1>
        <p className="text-[rgba(255,221,0,0.3)] text-xs mt-1">设置 · 用户 · 安全 · PWA · 性能</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 max-w-lg mx-auto">
        {ADMIN_MODULES.map(mod => {
          const Icon = mod.icon;
          return (
            <div key={mod.label} className="p-4 rounded-xl text-center cursor-pointer hover:scale-105 transition-all"
              style={{ background: `${mod.color}06`, border: `1px solid ${mod.color}15` }}>
              <Icon size={22} style={{ color: mod.color, margin: "0 auto 6px" }} />
              <p className="text-[#e0f0ff] text-sm">{mod.label}</p>
              <p className="text-[rgba(255,255,255,0.2)] text-xs">{mod.desc}</p>
            </div>
          );
        })}
      </div>

      <div className="mt-6 text-center">
        <p className="text-[rgba(255,221,0,0.2)] text-xs">系统安全审计</p>
      </div>
    </div>
  );
}
