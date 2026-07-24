import { Brain } from "lucide-react";
import type { SystemRegistration } from "@yyc3/shell";
export function register(): SystemRegistration {
  return {
    id: "ai", name: "AI 智能", description: "决策/模型/诊断", icon: Brain, color: "#AA55FF", order: 30,
    menuItems: [
      { path: "/ai", label: "nav.aiDecision" },
      { path: "/ai/models", label: "nav.modelProvider" },
      { path: "/ai/diagnosis", label: "nav.aiDiagnosis" },
    ],
    routes: [
      { index: true,  lazy: () => import("./pages/AISuggestion") },
      { path: "models",    lazy: () => import("./pages/ModelProvider") },
      { path: "diagnosis", lazy: () => import("./pages/AIDiagnostics") },
    ],
    hubCommands: [
      { id: "ai-analyze", label: "AI 智能分析", systemId: "ai", icon: Brain, action: () => {} },
    ],
  };
}
