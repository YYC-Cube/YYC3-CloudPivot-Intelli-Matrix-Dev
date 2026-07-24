import { Code2 } from "lucide-react";
import type { SystemRegistration } from "@yyc3/shell";
export function register(): SystemRegistration {
  return {
    id: "dev", name: "开发工具", description: "设计/终端/IDE", icon: Code2, color: "#E8E8E8", order: 50,
    menuItems: [
      { path: "/dev", label: "nav.designSystem" },
      { path: "/dev/terminal", label: "nav.terminal" },
      { path: "/dev/ide", label: "nav.idePanel" },
    ],
    routes: [
      { index: true,  lazy: () => import("./pages/DesignSystem") },
      { path: "terminal", lazy: () => import("./pages/Terminal") },
      { path: "ide",      lazy: () => import("./pages/IDEPanel") },
    ],
    hubCommands: [
      { id: "dev-terminal", label: "打开终端", systemId: "dev", icon: Code2, action: () => {} },
    ],
  };
}
