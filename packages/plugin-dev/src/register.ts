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
    routes: [] as any,
    hubCommands: [
      { id: "dev-terminal", label: "打开终端", systemId: "dev", icon: Code2, action: () => {} },
    ],
  };
}
