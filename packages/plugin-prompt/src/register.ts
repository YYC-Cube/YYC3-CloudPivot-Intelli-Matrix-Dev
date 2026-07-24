/**
 * @file: register.ts
 * @description: plugin-prompt 注册到 Shell
 */
import { BookOpen } from "lucide-react";
import type { SystemRegistration } from "@yyc3/shell";

export function register(): SystemRegistration {
  return {
    id: "prompt",
    name: "提示词库",
    description: "15个业务Prompt模板 · 8位家人人格映射",
    icon: BookOpen,
    color: "#3399FF",
    order: 40,

    menuItems: [
      { path: "/prompt",          label: "Prompt总览" },
      { path: "/prompt/cost",     label: "成本盈亏" },
      { path: "/prompt/festival", label: "节日营销" },
      { path: "/prompt/diagnosis", label: "综合诊断" },
      { path: "/prompt/pipeline", label: "全链路" },
      { path: "/prompt/persona",  label: "人格映射" },
    ],

    routes: [],

    hubCommands: [
      {
        id: "p-list",
        label: "查看业务提示词",
        systemId: "prompt",
        icon: BookOpen,
        action: () => {},
      },
    ],
  };
}
