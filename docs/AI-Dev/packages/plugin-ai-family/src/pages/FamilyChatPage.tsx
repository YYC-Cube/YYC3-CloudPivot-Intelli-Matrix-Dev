/**
 * @file: FamilyChatPage.tsx
 * @description: AI Family 交流中心 — 家人对话页面
 */
import React from "react";
import { MessageSquare, Users } from "lucide-react";
import { FAMILY_PERSONAS } from "../data";

export default function FamilyChatPage() {
  return (
    <div className="p-8">
      <h1 className="text-[#e0f0ff] text-lg font-medium flex items-center gap-2">
        <MessageSquare className="w-5 h-5 text-[#00FF88]" /> 交流中心
      </h1>
      <p className="text-[rgba(0,255,136,0.3)] text-sm mt-1 mb-6">与 AI 家人群聊或私聊</p>

      <div className="flex gap-6">
        {/* 频道列表 */}
        <div className="w-48 space-y-1">
          {["全体闲聊", "技术讨论", "音乐鉴赏", "创意工坊"].map(ch => (
            <div key={ch} className="px-3 py-2 rounded-lg text-sm cursor-pointer transition-all"
              style={{ background: "rgba(0,40,80,0.2)", border: "1px solid rgba(0,255,136,0.06)", color: "rgba(224,232,255,0.7)" }}>
              # {ch}
            </div>
          ))}
        </div>

        {/* 聊天区域 */}
        <div className="flex-1 rounded-xl p-6 flex flex-col items-center justify-center"
          style={{ background: "rgba(0,40,80,0.1)", border: "1px solid rgba(0,255,136,0.06)", minHeight: 400 }}>
          <Users className="w-12 h-12 text-[rgba(0,255,136,0.1)] mb-3" />
          <p className="text-[rgba(0,255,136,0.2)] text-sm">选择频道开始交流</p>
          <p className="text-[rgba(0,255,136,0.1)] text-xs mt-1">{FAMILY_PERSONAS.length} 位家人在线</p>
        </div>
      </div>
    </div>
  );
}
