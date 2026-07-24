import type { SystemRegistration } from "@yyc3/shell";
import { Building2 } from "lucide-react";

export function register(): SystemRegistration {
  return {
    id: "business",
    name: "业务空间",
    description: "智慧酒店 / 通讯基站",
    icon: Building2,
    color: "#14B8A6",
    order: 50,
    menuItems: [
      { path: "/business", label: "nav.businessOverview" },
      { path: "/business/hotel", label: "nav.hotel" },
      { path: "/business/comm-station", label: "nav.commStation" },
    ],
    routes: [] as any,
    hubCommands: [
      { id: "b-hotel", label: "智慧酒店控制台", systemId: "business", icon: Building2, action: () => { } },
    ],
  };
}
