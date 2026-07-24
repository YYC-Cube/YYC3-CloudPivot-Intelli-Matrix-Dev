import { ShieldCheck } from "lucide-react";
import type { SystemRegistration } from "@yyc3/shell";
export function register(): SystemRegistration {
  return {
    id: "admin", name: "系统管理", description: "设置/用户/安全", icon: ShieldCheck, color: "#FFDD00", order: 60,
    menuItems: [
      { path: "/admin", label: "nav.auditLog" },
      { path: "/admin/settings", label: "nav.systemSettings" },
      { path: "/admin/users", label: "nav.userManagement" },
      { path: "/admin/security", label: "nav.securityMonitor" },
      { path: "/admin/pwa", label: "nav.pwaManagement" },
    ],
    routes: [] as any,
    hubCommands: [
      { id: "admin-settings", label: "打开系统设置", systemId: "admin", icon: ShieldCheck, action: () => {} },
    ],
  };
}
