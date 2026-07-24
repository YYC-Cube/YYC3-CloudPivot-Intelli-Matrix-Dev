/**
 * @file: Dashboard.tsx
 * @description: 监控中心仪表盘
 */
import React from "react";
import { Activity, AlertTriangle, Eye, Bell, Cpu, HardDrive, Network } from "lucide-react";

const STATS = [
  { label: "节点在线", value: "7/8", icon: Cpu, color: "#00ff88", detail: "GPU-A100-01 预警" },
  { label: "QPS",      value: "3.8k", icon: Activity, color: "#00d4ff", detail: "峰值 5.2k" },
  { label: "告警",     value: "2", icon: AlertTriangle, color: "#FFDD00", detail: "低风险" },
  { label: "延迟",     value: "48ms", icon: Network, color: "#00d4ff", detail: "P99: 120ms" },
  { label: "存储",     value: "27%", icon: HardDrive, color: "#FF6600", detail: "12.8TB / 48TB" },
  { label: "巡查",     value: "就绪", icon: Eye, color: "#AA55FF", detail: "下次: 14:00" },
];

export default function Dashboard() {
  return (
    <div className="p-6" style={{ background: "linear-gradient(180deg, rgba(0,212,255,0.02) 0%, rgba(4,8,20,1) 40%)", minHeight: "100vh" }}>
      <div className="text-center mb-8">
        <Activity className="w-10 h-10 mx-auto mb-2 text-[#00d4ff]" />
        <h1 className="text-[#e0f0ff] text-xl font-bold">监控中心</h1>
        <p className="text-[rgba(0,212,255,0.3)] text-xs mt-1">实时监控 · 告警 · 巡查</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 max-w-lg mx-auto">
        {STATS.map(s => {
          const Icon = s.icon;
          return (
            <div key={s.label} className="p-4 rounded-xl text-center"
              style={{ background: "rgba(0,40,80,0.2)", border: "1px solid rgba(0,180,255,0.08)" }}>
              <Icon size={20} style={{ color: s.color, margin: "0 auto 6px" }} />
              <p className="text-[#e0f0ff] text-lg font-bold" style={{ fontFamily: "monospace" }}>{s.value}</p>
              <p className="text-[rgba(0,212,255,0.4)] text-xs">{s.label}</p>
              <p className="text-[rgba(0,212,255,0.2)]" style={{ fontSize: "0.55rem" }}>{s.detail}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
