/**
 * @file: DesignSystem.tsx
 * @description: 开发工具中心
 */
import React from "react";
import { Code2, Terminal, Palette, Box, FileText, GitBranch } from "lucide-react";

const DEV_TOOLS = [
  { label: "终端",      icon: Terminal,  color: "#00ff88", desc: "CLI 命令行" },
  { label: "IDE",       icon: Code2,     color: "#00d4ff", desc: "代码编辑器" },
  { label: "设计系统",  icon: Palette,   color: "#FF69B4", desc: "组件库" },
  { label: "重构分析",  icon: Box,       color: "#FF6600", desc: "代码审计" },
  { label: "开发指南",  icon: FileText,  color: "#FFD700", desc: "API 参考" },
  { label: "架构审计",  icon: GitBranch, color: "#AA55FF", desc: "系统分析" },
];

export default function DesignSystem() {
  return (
    <div className="p-6" style={{ background: "linear-gradient(180deg, rgba(232,232,232,0.02) 0%, rgba(4,8,20,1) 40%)", minHeight: "100vh" }}>
      <div className="text-center mb-8">
        <Code2 className="w-10 h-10 mx-auto mb-2" style={{ color: "#E8E8E8" }} />
        <h1 className="text-[#e0f0ff] text-xl font-bold">开发工具</h1>
        <p className="text-[rgba(232,232,232,0.3)] text-xs mt-1">设计系统 · 终端 · IDE · 分析</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 max-w-lg mx-auto">
        {DEV_TOOLS.map(tool => {
          const Icon = tool.icon;
          return (
            <div key={tool.label} className="p-4 rounded-xl text-center cursor-pointer hover:scale-105 transition-all"
              style={{ background: `${tool.color}06`, border: `1px solid ${tool.color}15` }}>
              <Icon size={22} style={{ color: tool.color, margin: "0 auto 6px" }} />
              <p className="text-[#e0f0ff] text-sm">{tool.label}</p>
              <p className="text-[rgba(255,255,255,0.2)] text-xs">{tool.desc}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
