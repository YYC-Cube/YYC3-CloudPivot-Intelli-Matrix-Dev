/**
 * @file: App.tsx
 * @description: AI 智能独立版 — Hub 命令可执行 + 分析面板
 */
import { AIAssistantHub, eventBus, Events, storage, StorageKeys, WelcomePage } from "@yyc3/shell";
import { Activity, Brain, CheckCircle, Cpu, Loader } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

type Panel = "analyze" | "models" | "diagnosis";

export default function App() {
  const [showWelcome, setShowWelcome] = useState(!storage.shell.get(StorageKeys.SHELL_WELCOME_DISMISSED, false));
  const [activePanel, setActivePanel] = useState<Panel>("analyze");
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const unsub = eventBus.on(Events.SHELL_WELCOME_DISMISS, () => setShowWelcome(false));
    return unsub;
  }, []);

  const flash = useCallback((msg: string) => { setMessage(msg); setTimeout(() => setMessage(null), 3000); }, []);

  const runAction = useCallback((panel: Panel, msg: string, event: string) => {
    setActivePanel(panel); setLoading(true);
    eventBus.emit(event, {});
    flash(msg); setTimeout(() => setLoading(false), 1500);
  }, [flash]);

  const AI_CMDS = [
    { id: "ai-analyze", label: "AI 智能分析", systemId: "ai", icon: Brain, action: () => runAction("analyze", "AI 分析已启动", "ai:analyze") },
    { id: "ai-models", label: "管理模型提供商", systemId: "ai", icon: Cpu, action: () => runAction("models", "模型提供商列表已加载", "ai:models") },
    { id: "ai-diagnosis", label: "运行 AI 诊断", systemId: "ai", icon: Activity, action: () => runAction("diagnosis", "AI 诊断已执行", "ai:diagnosis") },
  ];
  const SYSTEM_CARDS = [{ id: "ai", name: "AI 智能", description: "决策/模型/诊断", icon: Brain, color: "#AA55FF", path: "/ai" }];

  if (showWelcome) return <WelcomePage systems={SYSTEM_CARDS} mode="modal" onNavigate={() => setShowWelcome(false)} />;

  const MODELS = [
    { name: "GPT-4 Turbo", provider: "OpenAI", status: "活跃", color: "#00FF88" },
    { name: "Claude 3.5", provider: "Anthropic", status: "活跃", color: "#00FF88" },
    { name: "GLM-4", provider: "智谱AI", status: "待命", color: "#FFDD00" },
    { name: "Qwen2-72B", provider: "阿里云", status: "待命", color: "#FFDD00" },
  ];

  return (
    <div style={{ background: "linear-gradient(180deg, rgba(170,85,255,0.02) 0%, rgba(4,8,20,1) 40%)", minHeight: "100vh" }}>
      <AIAssistantHub systemId="ai" title="AI 智能" accentColor="#AA55FF" commands={AI_CMDS} extraPrompts={[
        { id: "ap1", name: "模型专家", prompt: "你是大模型专家，请分析当前部署并给出优化建议。", category: "模型" },
      ]} />

      {message && <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-lg text-sm" style={{ background: "rgba(170,85,255,0.1)", border: "1px solid rgba(170,85,255,0.3)", color: "#AA55FF" }}>{message}</div>}

      <div className="p-6 text-center" style={{ paddingTop: "10vh" }}>
        <Brain className="w-12 h-12 mx-auto mb-3" style={{ color: "#AA55FF" }} />
        <h1 className="text-[#e0f0ff] text-xl font-bold">AI 智能</h1>

        <div className="max-w-md mx-auto mt-8 text-left">
          {activePanel === "analyze" && (
            <div className="p-4 rounded-lg" style={{ background: "rgba(170,85,255,0.05)", border: "1px solid rgba(170,85,255,0.15)" }}>
              <div className="flex items-center gap-2 mb-2">{loading ? <Loader className="animate-spin" size={16} style={{ color: "#AA55FF" }} /> : <CheckCircle size={16} style={{ color: "#00ff88" }} />}<p className="text-sm text-[#AA55FF]">智能分析报告</p></div>
              <p className="text-xs mt-2" style={{ color: "rgba(170,85,255,0.4)" }}>系统运行正常，QPS 3.8k，建议扩容 node-8</p>
              <p className="text-xs mt-1" style={{ color: "rgba(170,85,255,0.3)" }}>模型调用: 12.3k 次/日 · 成功率 99.7%</p>
              <p className="text-xs mt-1" style={{ color: "rgba(170,85,255,0.3)" }}>平均响应: 1.2s · Token 消耗: 2.1M</p>
            </div>
          )}
          {activePanel === "models" && (
            <div className="p-4 rounded-lg" style={{ background: "rgba(170,85,255,0.05)", border: "1px solid rgba(170,85,255,0.15)" }}>
              <p className="text-sm text-[#AA55FF] mb-3">模型提供商</p>
              <div className="space-y-2">
                {MODELS.map(m => (
                  <div key={m.name} className="flex items-center gap-2 p-2 rounded" style={{ background: "rgba(170,85,255,0.04)" }}>
                    <Cpu size={14} style={{ color: "#AA55FF" }} />
                    <div><p className="text-xs text-[#e0f0ff]">{m.name}</p><p className="text-xs" style={{ color: "rgba(170,85,255,0.3)" }}>{m.provider}</p></div>
                    <span className="text-xs ml-auto" style={{ color: m.color }}>{m.status}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          {activePanel === "diagnosis" && (
            <div className="p-4 rounded-lg" style={{ background: "rgba(170,85,255,0.05)", border: "1px solid rgba(170,85,255,0.15)" }}>
              <div className="flex items-center gap-2 mb-2">{loading ? <Loader className="animate-spin" size={16} style={{ color: "#AA55FF" }} /> : <CheckCircle size={16} style={{ color: "#00ff88" }} />}<p className="text-sm text-[#AA55FF]">AI 诊断结果</p></div>
              <div className="mt-2 space-y-1 text-left">
                <p className="text-xs text-[#e0f0ff]">模型连通性: <span style={{ color: "#00ff88" }}>正常</span></p>
                <p className="text-xs text-[#e0f0ff]">API 密钥: <span style={{ color: "#00ff88" }}>有效</span></p>
                <p className="text-xs text-[#e0f0ff]">配额使用: <span style={{ color: "#FFDD00" }}>68%</span></p>
                <p className="text-xs text-[#e0f0ff]">延迟: <span style={{ color: "#00ff88" }}>正常</span></p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
