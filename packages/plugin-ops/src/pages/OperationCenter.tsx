/**
 * @file: OperationCenter.tsx
 * @description: 运维管理中心
 */
import React from "react";
import { Wrench, Server, FileText, Database, HardDrive, RotateCcw } from "lucide-react";

const OPS_ITEMS = [
  { label: "执行备份",   icon: Server,    color: "#FF6600", desc: "全量数据备份" },
  { label: "文件管理",   icon: FileText,  color: "#00d4ff", desc: "本地文件管理" },
  { label: "数据库",     icon: Database,  color: "#FFDD00", desc: "PostgreSQL 状态" },
  { label: "存储分析",   icon: HardDrive, color: "#AA55FF", desc: "12.8TB / 48TB" },
  { label: "连接测试",   icon: Wrench,    color: "#00FF88", desc: "服务连通性" },
  { label: "恢复操作",   icon: RotateCcw, color: "#BF00FF", desc: "数据恢复" },
];

export default function OperationCenter() {
  return (
    <div className="p-6" style={{ background: "linear-gradient(180deg, rgba(255,102,0,0.02) 0%, rgba(4,8,20,1) 40%)", minHeight: "100vh" }}>
      <div className="text-center mb-8">
        <Wrench className="w-10 h-10 mx-auto mb-2" style={{ color: "#FF6600" }} />
        <h1 className="text-[#e0f0ff] text-xl font-bold">运维管理</h1>
        <p className="text-[rgba(255,102,0,0.3)] text-xs mt-1">操作中心 · 文件 · 数据库 · 报表</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 max-w-lg mx-auto">
        {OPS_ITEMS.map(item => {
          const Icon = item.icon;
          return (
            <div key={item.label} className="p-4 rounded-xl text-center cursor-pointer hover:scale-105 transition-all"
              style={{ background: `${item.color}08`, border: `1px solid ${item.color}20` }}>
              <Icon size={22} style={{ color: item.color, margin: "0 auto 6px" }} />
              <p className="text-[#e0f0ff] text-sm">{item.label}</p>
              <p className="text-[rgba(255,255,255,0.2)] text-xs mt-0.5">{item.desc}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
