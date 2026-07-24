/**
 * @file: register.ts
 * @description: plugin-cost 注册到 Shell
 */
import { Calculator } from "lucide-react";
import type { SystemRegistration } from "@yyc3/shell";

export function register(): SystemRegistration {
  return {
    id: "cost",
    name: "成本盈亏",
    description: "动态成本核算 · 盈亏分析 · 敏感性测算",
    icon: Calculator,
    color: "#FF6600",
    order: 20,

    menuItems: [
      { path: "/cost",          label: "成本总览" },
      { path: "/cost/city",     label: "城市选择" },
      { path: "/cost/venue",    label: "场地配置" },
      { path: "/cost/equipment", label: "设备配置" },
      { path: "/cost/calc",     label: "成本计算" },
      { path: "/cost/profit",   label: "盈亏分析" },
    ],

    routes: [],

    hubCommands: [
      {
        id: "c-calc",
        label: "计算经营成本",
        systemId: "cost",
        icon: Calculator,
        action: () => {},
      },
    ],
  };
}
