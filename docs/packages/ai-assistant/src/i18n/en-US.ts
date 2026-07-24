/**
 * @file i18n/en-US.ts
 * @description English language pack
 * @author YanYuCloudCube Team
 * @version v1.0.0
 */

import type { TranslationKeys } from "./zh-CN";

export const enUS: TranslationKeys = {
  brand: {
    name: "AI Assistant",
    tooltip: "AI Assistant (⌘J)"
  },
  panel: {
    title: "AI Assistant",
    modelLoading: "Loading model...",
    noModel: "No model selected",
    clearChat: "Clear chat",
    restore: "Restore",
    maximize: "Maximize",
    close: "Close"
  },
  tabs: {
    chat: "Chat",
    commands: "Commands",
    prompts: "Prompts",
    settings: "Settings"
  },
  chat: {
    inputPlaceholder: "Type a command... (Enter to send, Shift+Enter for newline)",
    welcome:
      "Hello! I'm the CP-IM AI Assistant.\n\nI can help you:\n- 📊 View cluster status and performance reports\n- 🚀 Deploy and manage inference models\n- 🔧 Execute system operations\n- 🔍 Analyze logs and diagnose issues\n\nType a command or tap a quick action on the right to begin.",
    cleared: "Chat cleared. Type a new command to begin.",
    roleSwitched: "✅ Switched system role to \"{name}\""
  },
  prompts: {
    presetTitle: "System Prompt Presets",
    customTitle: "Custom System Prompt",
    customPlaceholder: "Type a custom system prompt...",
    charCount: "Chars: {count} | Recommended ≤ 500 for best results"
  },
  settings: {
    apiKeyTitle: "OpenAI API Auth",
    show: "Show",
    hide: "Hide",
    apiKeyConfigured: "✅ API Key configured",
    apiKeyMissing: "⚠️ No Key configured, local mock mode active",
    apiKeyStorageNote: "Key is stored locally in your browser only",
    modelTitle: "Model Selection",
    ollamaDetecting: "Detecting local Ollama models...",
    local: "local",
    testConnection: "Test connection",
    noModels: "No models available. Add one on the \"Model Settings\" page",
    temperature: "Temperature",
    tempMin: "Precise 0",
    tempMax: "Creative 2.0",
    topP: "Top-P (Nucleus Sampling)",
    topPMin: "Focused 0",
    topPMax: "Diverse 1.0",
    maxTokens: "Max Tokens"
  },
  commands: {
    categories: {
      all: "All",
      cluster: "Cluster",
      model: "Model",
      data: "Data",
      security: "Security",
      monitor: "Monitor"
    },
    items: {
      "cmd-01": {
        label: "Cluster Overview",
        desc: "Get real-time status of all nodes"
      },
      "cmd-02": {
        label: "Restart Abnormal Nodes",
        desc: "Detect and restart abnormal nodes"
      },
      "cmd-03": {
        label: "Deploy Model",
        desc: "Deploy model to specified node"
      },
      "cmd-04": {
        label: "Inference Performance Report",
        desc: "Generate inference performance analysis"
      },
      "cmd-05": {
        label: "Database Health Check",
        desc: "Check PostgreSQL connection status"
      },
      "cmd-06": {
        label: "Storage Analysis",
        desc: "Analyze storage usage and cleanup suggestions"
      },
      "cmd-07": {
        label: "Security Audit Scan",
        desc: "Scan for vulnerabilities and abnormal access"
      },
      "cmd-08": {
        label: "Network Latency Diagnostics",
        desc: "Diagnose inter-node network latency"
      },
      "cmd-09": {
        label: "One-click Optimization",
        desc: "AI auto-optimizes system config"
      },
      "cmd-10": {
        label: "WebSocket Reconnect",
        desc: "Re-establish real-time push connection"
      }
    }
  },
  promptsData: {
    "p1": { name: "Ops Diagnostic Expert", category: "Ops" },
    "p2": { name: "Model Tuning Advisor", category: "Model" },
    "p3": { name: "Data Analyst", category: "Data" },
    "p4": { name: "Security Auditor", category: "Security" },
    "p5": { name: "Intelligent Ops Assistant", category: "General" }
  }
};
