/**
 * @file: AISuggestion.tsx
 * @description: AI 智能决策中心
 */
import React, { useState } from "react";
import { Brain, Cpu, Activity, Zap, Eye, Sparkles } from "lucide-react";

const AI_CAPABILITIES = [
  { label: "智能分析",   icon: Eye,    color: "#AA55FF", desc: "异常模式检测" },
  { label: "模型管理",   icon: Cpu,    color: "#00d4ff", desc: "7 家提供商" },
  { label: "AI 诊断",   icon: Activity,color: "#00FF88", desc: "健康评分" },
  { label: "决策推荐",   icon: Zap,    color: "#FFD700", desc: "最优路径" },
];

export default function AISuggestion() {
  const [health] = useState(87);

  return (
    <div className="p-6" style={{ background: "linear-gradient(180deg, rgba(170,85,255,0.02) 0%, rgba(4,8,20,1) 40%)", minHeight: "100vh" }}>
      <div className="text-center mb-8">
        <Brain className="w-10 h-10 mx-auto mb-2" style={{ color: "#AA55FF" }} />
        <h1 className="text-[#e0f0ff] text-xl font-bold">AI 智能</h1>
        <p className="text-[rgba(170,85,255,0.3)] text-xs mt-1">决策 · 模型 · 诊断</p>
      </div>

      {/* 健康环 */}
      <div className="flex justify-center mb-6">
        <div className="relative w-24 h-24">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 64 64">
            <circle cx="32" cy="32" r="28" fill="none" stroke="rgba(170,85,255,0.08)" strokeWidth="4" />
            <circle cx="32" cy="32" r="28" fill="none" stroke="#AA55FF" strokeWidth="4" strokeDasharray={`${health * 1.76} 176`} strokeLinecap="round" />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-[#AA55FF] text-lg font-bold">{health}</span>
          </div>
        </div>
      </div>
      <p className="text-center text-[rgba(170,85,255,0.4)] text-xs mb-6">系统健康指数</p>

      <div className="grid grid-cols-2 gap-3 max-w-sm mx-auto">
        {AI_CAPABILITIES.map(c => {
          const Icon = c.icon;
          return (
            <div key={c.label} className="p-4 rounded-xl text-center"
              style={{ background: `${c.color}06`, border: `1px solid ${c.color}15` }}>
              <Icon size={20} style={{ color: c.color, margin: "0 auto 6px" }} />
              <p className="text-[#e0f0ff] text-sm">{c.label}</p>
              <p className="text-[rgba(255,255,255,0.2)] text-xs">{c.desc}</p>
            </div>
          );
        })}
      </div>

      <div className="mt-6 text-center">
        <Sparkles className="w-4 h-4 mx-auto mb-1" style={{ color: "rgba(170,85,255,0.3)" }} />
        <p className="text-[rgba(170,85,255,0.3)] text-xs">AI Family 智能驱动</p>
      </div>
    </div>
  );
}
