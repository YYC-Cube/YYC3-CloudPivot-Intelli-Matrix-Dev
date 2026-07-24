/**
 * @file: register.ts
 * @description: plugin-marketing 注册到 Shell
 */
import { Calendar } from "lucide-react";
import type { SystemRegistration } from "@yyc3/shell";

export function register(): SystemRegistration {
  return {
    id: "marketing",
    name: "节日营销",
    description: "6类节日聚合 · 农历转换 · 营销动作触发",
    icon: Calendar,
    color: "#AA55FF",
    order: 30,

    menuItems: [
      { path: "/marketing",        label: "节日总览" },
      { path: "/marketing/calendar", label: "年度日历" },
      { path: "/marketing/stages",  label: "三阶段分布" },
      { path: "/marketing/actions", label: "营销动作" },
    ],

    routes: [],

    hubCommands: [
      {
        id: "m-calendar",
        label: "查看节日日历",
        systemId: "marketing",
        icon: Calendar,
        action: () => {},
      },
    ],
  };
}
