/**
 * @file: register.ts
 * @description: AI Family 子系统注册入口 — 按 Arch 规范导出 SystemRegistration
 */
import { UserCircle2 } from "lucide-react";
import type { SystemRegistration } from "@yyc3/shell";

export function register(): SystemRegistration {
  return {
    id: "ai-family",
    name: "AI Family",
    description: "中枢 · 家人协同",
    icon: UserCircle2,
    color: "#00FF88",
    order: 40,

    menuItems: [
      { path: "/ai-family",        label: "家族首页" },
      { path: "/ai-family/chat",   label: "交流中心" },
      { path: "/ai-family/music",  label: "音乐空间" },
      { path: "/ai-family/voice",  label: "语音系统" },
      { path: "/ai-family/settings", label: "Family 设置" },
    ],

    routes: [
      { index: true, lazy: () => import("./pages/FamilyHomePage") },
      { path: "chat",   lazy: () => import("./pages/FamilyChatPage") },
      { path: "music",  lazy: () => import("./pages/FamilyHomePage") },
      { path: "voice",  lazy: () => import("./pages/FamilyChatPage") },
      { path: "settings", lazy: () => import("./pages/FamilySettingsPage") },
    ],

    hubCommands: [
      { id: "hub-call-thinker", label: "呼叫万物分析数据", systemId: "ai-family", icon: UserCircle2, action: () => {} },
      { id: "hub-call-sentinel", label: "呼叫守护安全检查", systemId: "ai-family", icon: UserCircle2, action: () => {} },
    ],
  };
}
