import { Wrench } from "lucide-react";
import type { SystemRegistration } from "@yyc3/shell";
export function register(): SystemRegistration {
  return {
    id: "ops", name: "运维管理", description: "操作/文件/数据库", icon: Wrench, color: "#FF6600", order: 20,
    menuItems: [
      { path: "/ops", label: "nav.operationCenter" },
      { path: "/ops/files", label: "nav.fileManager" },
      { path: "/ops/database", label: "nav.databaseManager" },
      { path: "/ops/reports", label: "nav.reportExport" },
    ],
    routes: [
      { index: true, lazy: () => import("./pages/OperationCenter") },
      { path: "files",    lazy: () => import("./pages/FileManager") },
      { path: "database", lazy: () => import("./pages/DatabaseManager") },
      { path: "reports",  lazy: () => import("./pages/Reports") },
    ],
    hubCommands: [
      { id: "ops-backup", label: "执行数据备份", systemId: "ops", icon: Wrench, action: () => {} },
    ],
  };
}
