/**
 * @file: register.ts
 * @description: plugin-target 注册到 Shell
 */
import { Target } from "lucide-react";
import type { SystemRegistration } from "@yyc3/shell";

export function register(): SystemRegistration {
  return {
    id: "target",
    name: "目标量化",
    description: "年度营收X公式 · 三阶段拆分 · 月度节点细化",
    icon: Target,
    color: "#00FF88",
    order: 10,

    menuItems: [
      { path: "/target",          label: "目标总览" },
      { path: "/target/calc",     label: "X值计算" },
      { path: "/target/phases",   label: "三阶段拆分" },
      { path: "/target/monthly",  label: "月度节点" },
    ],

    routes: [],  // Phase 2 填充实际页面组件

    hubCommands: [
      {
        id: "t-calc",
        label: "计算年度目标X",
        systemId: "target",
        icon: Target,
        action: () => {},
      },
    ],
  };
}
