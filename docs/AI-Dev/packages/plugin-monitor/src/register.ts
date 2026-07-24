import { Activity } from "lucide-react";
import type { SystemRegistration } from "@yyc3/shell";
export function register(): SystemRegistration {
  return {
    id: "monitor", name: "监控中心", description: "实时监控与告警", icon: Activity, color: "#00d4ff", order: 10,
    menuItems: [
      { path: "/monitor", label: "nav.dataMonitor" },
      { path: "/monitor/follow-up", label: "nav.followUp" },
      { path: "/monitor/patrol", label: "nav.patrol" },
      { path: "/monitor/alerts", label: "nav.alerts" },
    ],
    routes: [
      { index: true, lazy: () => import("./pages/Dashboard") },
      { path: "follow-up", lazy: () => import("./pages/FollowUp") },
      { path: "patrol",    lazy: () => import("./pages/Patrol") },
      { path: "alerts",    lazy: () => import("./pages/Alerts") },
    ],
    hubCommands: [
      { id: "mon-status", label: "查看集群状态", systemId: "monitor", icon: Activity, action: () => {} },
    ],
  };
}
