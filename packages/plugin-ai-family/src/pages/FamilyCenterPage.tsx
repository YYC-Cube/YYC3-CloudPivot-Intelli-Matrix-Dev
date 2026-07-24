/**
 * @file: FamilyCenterPage.tsx
 * @description: AI Family 中心页 — 家园空间入口网格 + 家人卡片
 */
import { Activity, BookOpen, MessageSquare, Music, Phone, Settings, Sparkles, UserCircle2 } from "lucide-react";
import React from "react";
import { FAMILY_PERSONAS } from "../data";

const HOME_SPACES = [
  { id: "assistant", label: "AI 助理", icon: Sparkles, color: "#00FF88", desc: "Hub 浮窗对话" },
  { id: "chat", label: "交流中心", icon: MessageSquare, color: "#00d4ff", desc: "群聊与私聊" },
  { id: "music", label: "音乐空间", icon: Music, color: "#FF69B4", desc: "AI 创作工坊" },
  { id: "phone", label: "家人热线", icon: Phone, color: "#FFD700", desc: "拨号与通话" },
  { id: "activity", label: "活动中心", icon: Activity, color: "#FF6600", desc: "积分与勋章" },
  { id: "learn", label: "知识学习", icon: BookOpen, color: "#AA55FF", desc: "技能树课程" },
  { id: "settings", label: "Family 设置", icon: Settings, color: "#C0C0C0", desc: "模型与配置" },
];

export default function FamilyCenterPage() {
  const onlineCount = FAMILY_PERSONAS.filter((p: { mood: string }) => p.mood !== "idle").length;

  return (
    <div className="p-6" style={{ background: "linear-gradient(180deg, rgba(0,255,136,0.02) 0%, rgba(4,8,20,1) 40%)", minHeight: "100vh" }}>
      {/* 标题 */}
      <div className="text-center mb-8">
        <div className="w-12 h-12 mx-auto mb-3 rounded-2xl flex items-center justify-center"
          style={{ background: "linear-gradient(135deg, #00FF88, #00d4ff)" }}>
          <UserCircle2 className="w-6 h-6 text-white" />
        </div>
        <h1 className="text-[#e0f0ff] text-xl font-bold">AI Family 家园</h1>
        <p className="text-[rgba(0,255,136,0.3)] text-xs mt-1">{FAMILY_PERSONAS.length} 位家人 · {onlineCount} 人在线</p>
      </div>

      {/* 家园空间网格 */}
      <div className="max-w-xl mx-auto mb-8">
        <h3 className="text-[rgba(0,255,136,0.4)] text-xs mb-3">家园空间</h3>
        <div className="grid grid-cols-2 gap-2">
          {HOME_SPACES.map((space: typeof HOME_SPACES[0]) => {
            const Icon = space.icon;
            return (
              <div key={space.id}
                className="p-3 rounded-xl flex items-center gap-3 cursor-pointer transition-all hover:scale-[1.02]"
                style={{ background: `${space.color}08`, border: `1px solid ${space.color}20` }}>
                <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: `${space.color}18` }}>
                  <Icon size={18} style={{ color: space.color }} />
                </div>
                <div>
                  <span className="text-[#e0f0ff] text-sm font-medium">{space.label}</span>
                  <p className="text-[rgba(255,255,255,0.2)] text-xs">{space.desc}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 家人状态卡片 */}
      <div className="max-w-xl mx-auto">
        <h3 className="text-[rgba(0,255,136,0.4)] text-xs mb-3">家人在线</h3>
        <div className="grid grid-cols-4 gap-2">
          {FAMILY_PERSONAS.map((p: { id: string; color: string; shortName: string; modelName?: string; icon: React.ElementType }) => {
            const Icon = p.icon;
            return (
              <div key={p.id}
                className="p-2.5 rounded-xl text-center transition-all"
                style={{ background: `${p.color}06`, border: `1px solid ${p.color}15` }}>
                <Icon size={18} style={{ color: p.color, margin: "0 auto 4px" }} />
                <p className="text-[#e0f0ff] text-xs font-medium">{p.shortName}</p>
                <p className="text-[rgba(255,255,255,0.2)]" style={{ fontSize: "0.5rem" }}>{p.modelName}</p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
