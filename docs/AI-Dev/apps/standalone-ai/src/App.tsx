import React, { useState } from "react";
import { WelcomePage, AIAssistantHub, storage, StorageKeys } from "@yyc3/shell";
import { Brain, Cpu, Activity } from "lucide-react";

const AI_CMDS = [
  { id: "ai-analyze",    label: "AI 智能分析",          systemId: "ai", icon: Brain, action: () => {} },
  { id: "ai-models",     label: "管理模型提供商",        systemId: "ai", icon: Cpu, action: () => {} },
  { id: "ai-diagnosis",  label: "运行 AI 诊断",          systemId: "ai", icon: Activity, action: () => {} },
];

const SYSTEM_CARDS = [{ id: "ai", name: "AI 智能", description: "决策/模型/诊断", icon: Brain, color: "#AA55FF", path: "/ai" }];

export default function App() {
  const [showWelcome, setShowWelcome] = useState(!storage.shell.get(StorageKeys.SHELL_WELCOME_DISMISSED, false));
  if (showWelcome) return <WelcomePage systems={SYSTEM_CARDS} mode="modal" onNavigate={() => setShowWelcome(false)} />;
  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: "radial-gradient(ellipse at center, rgba(170,85,255,0.03) 0%, rgba(4,8,20,1) 70%)" }}>
      <AIAssistantHub systemId="ai" title="AI 智能" accentColor="#AA55FF" commands={AI_CMDS} extraPrompts={[
        { id: "ap1", name: "模型专家", prompt: "你是大模型专家，请分析当前部署并给出优化建议。", category: "模型" },
        { id: "ap2", name: "诊断专家", prompt: "你是 AI 诊断专家，请分析系统异常模式。", category: "诊断" },
      ]} />
      <div className="text-center">
        <Brain className="w-16 h-16 mx-auto mb-4" style={{ color: "#AA55FF33" }} />
        <h1 className="text-[#e0f0ff] text-lg font-medium">AI 智能</h1>
        <p className="text-[rgba(170,85,255,0.3)] text-sm mt-1">决策 · 模型 · 诊断</p>
      </div>
    </div>
  );
}
