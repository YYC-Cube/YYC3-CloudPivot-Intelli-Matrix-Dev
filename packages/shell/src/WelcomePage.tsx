/**
 * @file: WelcomePage.tsx
 * @description: 统一欢迎页 — 展示所有已注册系统
 */
import React, { useEffect, useState } from "react";
import { Sparkles, Users } from "lucide-react";
import type { SystemCard } from "./types";
import { storage, StorageKeys } from "./storage";
import { eventBus, Events } from "./event-bus";

interface WelcomePageProps {
  systems: SystemCard[];
  /** 显示模式: 全屏首屏 / 弹窗 */
  mode?: "page" | "modal";
  onNavigate: (path: string) => void;
  /** AI Family 状态摘要 */
  familySummary?: string;
}

/**
 * 欢迎页 — AI Family 中枢的"门面"
 *
 * 合并版: 显示所有注册系统卡片
 * 独立版: 显示当前系统的子功能卡片
 */
export function WelcomePage({ systems, mode = "page", onNavigate, familySummary }: WelcomePageProps) {
  const [dismissed, setDismissed] = useState(() =>
    storage.shell.get(StorageKeys.SHELL_WELCOME_DISMISSED, false)
  );

  // modal 模式下检查是否已关闭
  if (mode === "modal" && dismissed) return null;

  const handleDismiss = () => {
    setDismissed(true);
    storage.shell.set(StorageKeys.SHELL_WELCOME_DISMISSED, true);
    eventBus.emit(Events.SHELL_WELCOME_DISMISS);
  };

  return (
    <div className={`flex flex-col items-center justify-center ${mode === "modal" ? "fixed inset-0 z-50 bg-black/60 backdrop-blur-sm" : "min-h-screen"}`}
      style={{ background: mode === "page" ? "radial-gradient(ellipse at center, rgba(0,180,255,0.05) 0%, rgba(4,8,20,1) 70%)" : undefined }}>
      <div className={`max-w-2xl w-full ${mode === "modal" ? "bg-[rgba(8,25,55,0.98)] border border-[rgba(0,180,255,0.2)] rounded-2xl p-8 shadow-[0_0_60px_rgba(0,180,255,0.1)] mx-4" : "px-4"}`}>

        {/* Logo + 标题 */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-[#00d4ff] to-[#7b2ff7] flex items-center justify-center shadow-[0_0_30px_rgba(0,180,255,0.3)]">
            <Sparkles className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-[#e0f0ff] text-2xl font-bold tracking-wider mb-2">
            YYC³ Cloud Intelli-Matrix
          </h1>
          <p className="text-[rgba(0,212,255,0.4)] text-sm">
            AI Family 中枢 · 协同所有系统
          </p>
        </div>

        {/* 系统卡片网格 */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-6">
          {systems.map(sys => {
            const Icon = sys.icon;
            return (
              <button key={sys.id} onClick={() => onNavigate(sys.path)}
                className="group p-4 rounded-xl text-center transition-all hover:scale-105 active:scale-95"
                style={{
                  background: `${sys.color}08`,
                  border: `1px solid ${sys.color}20`,
                  boxShadow: `0 0 20px ${sys.color}08`,
                }}>
                <div className="w-10 h-10 mx-auto mb-2 rounded-xl flex items-center justify-center transition-all group-hover:scale-110"
                  style={{ background: `${sys.color}18` }}>
                  <Icon className="w-5 h-5" style={{ color: sys.color }} />
                </div>
                <p className="text-[#e0f0ff] text-sm font-medium">{sys.name}</p>
                <p className="text-[rgba(0,212,255,0.3)] text-xs mt-0.5">{sys.description}</p>
                {sys.badge && (
                  <span className="inline-block mt-1 px-2 py-0.5 rounded text-xs"
                    style={{ background: `${sys.color}18`, color: sys.color }}>{sys.badge}</span>
                )}
              </button>
            );
          })}
        </div>

        {/* AI Family 状态摘要 */}
        {familySummary && (
          <div className="p-3 rounded-xl flex items-center gap-3"
            style={{ background: "rgba(0,255,136,0.04)", border: "1px solid rgba(0,255,136,0.1)" }}>
            <Users className="w-5 h-5 text-[#00FF88]" />
            <span className="text-[rgba(0,255,136,0.6)] text-xs">{familySummary}</span>
          </div>
        )}

        {/* 弹窗模式的关闭按钮 */}
        {mode === "modal" && (
          <button onClick={handleDismiss}
            className="mt-4 w-full py-2.5 rounded-xl text-sm transition-all"
            style={{ background: "rgba(0,212,255,0.08)", border: "1px solid rgba(0,212,255,0.15)", color: "rgba(0,212,255,0.5)" }}>
            进入系统 · 下次不再提示
          </button>
        )}
      </div>
    </div>
  );
}
