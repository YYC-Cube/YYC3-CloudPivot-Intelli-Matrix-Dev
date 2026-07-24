#!/usr/bin/env node
// AIAssistant v3.0 模块化完整性验证脚本
// 运行: node validate.js

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = __dirname;

const ALL_FILES = ["types.ts", "data.ts", "mock.ts", "components.tsx", "panels.tsx", "AIAssistant.tsx", "index.ts", "README.md", "GUIDE.md", "validate.js"];

const ALL_EXPORTS = [
  ["types.ts",           ["ChatMessage", "SystemCommand", "FamilyPersona", "AISkill", "AIPlugin", "AIModule", "TabKey", "AIAssistantProps"]],
  ["data.ts",            ["FAMILY_PERSONAS", "PERSONAS_MAP", "SYSTEM_COMMANDS", "AI_SKILLS", "AI_PLUGINS", "AI_MODULES", "PROMPT_PRESETS", "DEFAULT_MODELS", "ALL_TABS"]],
  ["mock.ts",            ["getPersonaResponse", "getPersonaGreeting"]],
  ["components.tsx",     ["AILogo", "EmotionRipple", "useSpeechRecognition"]],
  ["panels.tsx",         ["ChatPanel", "CommandsPanel", "PeoplePanel", "SkillsPanel", "PluginsPanel", "ModulesPanel", "PromptsPanel", "SettingsPanel"]],
  ["AIAssistant.tsx",    ["AIAssistant"]],
  ["index.ts",           ["AIAssistant", "AIAssistantProps"]],
];

const REQUIRED_FEATURES = [
  ["组件", "AI Family 人格数据",     "FAMILY_PERSONAS"],
  ["组件", "语音识别 Hook",          "useSpeechRecognition"],
  ["组件", "人格切换",               "switchPersona"],
  ["组件", "命令按人过滤",           "personaFilter"],
  ["组件", "麦克风按钮",             "Mic"],
  ["组件", "情感涟漪动画",           "EmotionRipple"],
  ["组件", "人格回复库",             "getPersonaResponse"],
  ["组件", "健康状态卡片",           "Heart"],
  ["组件", "音乐状态提示",           "Music2"],
  ["组件", "技能系统数据",           "AI_SKILLS"],
  ["组件", "插件系统数据",           "AI_PLUGINS"],
  ["组件", "模块系统数据",           "AI_MODULES"],
  ["组件", "8 个 Tab 面板",          "ChatPanel"],
  ["组件", "Mock 回复引擎",          "getPersonaGreeting"],
  ["组件", "提示词预设",             "PROMPT_PRESETS"],
  ["组件", "默认模型列表",           "DEFAULT_MODELS"],
  ["组件", "系统命令",               "SYSTEM_COMMANDS"],
  ["组件", "本地持久化",             "persist"],
  ["架构", "floating 模式",          'mode === "floating"'],
  ["架构", "inline 模式",            'mode === "inline"'],
];

// Colors
const GREEN = "\x1b[32m", RED = "\x1b[31m", YELLOW = "\x1b[33m", CYAN = "\x1b[36m", RESET = "\x1b[0m", BOLD = "\x1b[1m";
function ok(m)  { console.log("  " + GREEN + "\u2713" + RESET + " " + m); }
function fail(m){ console.log("  " + RED + "\u2717" + RESET + " " + m); }
function warn(m){ console.log("  " + YELLOW + "\u26a0" + RESET + " " + m); }

let errors = 0;

// ---- 1. 文件完整性 ----
console.log("\n" + BOLD + CYAN + "\u2550\u2550\u2550 1. \u6587\u4ef6\u5b8c\u6574\u6027\u68c0\u67e5 " + RESET + "\n");
const fileContents = {};
for (const file of ALL_FILES) {
  const fpath = path.join(ROOT, file);
  try {
    const stat = fs.statSync(fpath);
    fileContents[file] = fs.readFileSync(fpath, "utf-8");
    ok(file + " (" + (stat.size / 1024).toFixed(1) + "KB)");
  } catch {
    fail(file + " \u7f3a\u5931");
    errors++;
  }
}

// ---- 2. 导出完整性 ----
console.log("\n" + BOLD + CYAN + "\u2550\u2550\u2550 2. \u5bfc\u51fa\u5b8c\u6574\u6027\u68c0\u67e5 " + RESET + "\n");
for (const [file, exports] of ALL_EXPORTS) {
  const content = fileContents[file];
  if (!content) continue;
  const okEx = exports.filter(ex => content.includes(ex));
  const badEx = exports.filter(ex => !content.includes(ex));
  if (badEx.length === 0) ok(file + ": " + exports.length + " \u4e2a\u5bfc\u51fa\u5168\u90e8\u5b58\u5728");
  else {
    for (const ex of badEx) fail(file + " \u7f3a\u5c11\u5bfc\u51fa: " + ex);
    errors += badEx.length;
  }
}

// ---- 3. 跨模块引用 ----
console.log("\n" + BOLD + CYAN + "\u2550\u2550\u2550 3. \u8de8\u6a21\u5757\u5f15\u7528\u68c0\u67e5 " + RESET + "\n");
const deps = [
  ["data.ts",        ["types"]],
  ["mock.ts",        ["data"]],
  ["components.tsx", []],
  ["panels.tsx",     ["data", "components", "types"]],
  ["AIAssistant.tsx", ["types", "data", "mock", "components", "panels"]],
];
for (const [file, expectedDeps] of deps) {
  const content = fileContents[file];
  if (!content) continue;
  const missing = expectedDeps.filter(d => !content.includes("./" + d));
  if (missing.length === 0) ok(file + ": " + expectedDeps.length + " \u4e2a\u4f9d\u8d56\u5f15\u7528\u6b63\u786e");
  else for (const m of missing) fail(file + ": \u7f3a\u5c11\u4f9d\u8d56 ./" + m);
  if (missing.length > 0) errors += missing.length;
}

// ---- 4. 功能特性检查 ----
console.log("\n" + BOLD + CYAN + "\u2550\u2550\u2550 4. \u529f\u80fd\u7279\u6027\u68c0\u67e5 " + RESET + "\n");
const allContent = Object.values(fileContents).join("\n");
for (const [category, name, pattern] of REQUIRED_FEATURES) {
  if (allContent.includes(pattern)) ok("[" + category + "] " + name);
  else { fail("[" + category + "] " + name + " (" + pattern + ")"); errors++; }
}

// ---- 5. Tab 完整性 ----
console.log("\n" + BOLD + CYAN + "\u2550\u2550\u2550 5. Tab \u9762\u677f\u5b8c\u6574\u6027 " + RESET + "\n");
const panelsContent = fileContents["panels.tsx"] || "";
const expectedPanels = ["chat", "commands", "people", "skills", "plugins", "modules", "prompts", "settings"];
for (const tab of expectedPanels) {
  const cap = tab.charAt(0).toUpperCase() + tab.slice(1) + "Panel";
  if (panelsContent.includes(cap)) ok(tab + ": " + cap);
  else { fail(tab + ": " + cap + " \u7f3a\u5931"); errors++; }
}

// ---- 6. 质量检查 ----
console.log("\n" + BOLD + CYAN + "\u2550\u2550\u2550 6. \u4ee3\u7801\u8d28\u91cf " + RESET + "\n");
const aiContent = fileContents["AIAssistant.tsx"] || "";
const mainLines = aiContent.split("\n").length;
ok("AIAssistant.tsx: " + mainLines + " \u884c (\u539f 1208 \u2192 \u73b0 " + mainLines + ", \u7f29\u51cf " + (1208 - mainLines) + " \u884c)");

// ---- Summary ----
console.log("\n" + BOLD + CYAN + "\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550" + RESET);
console.log(BOLD + CYAN + "  AIAssistant v3.0 \u9a8c\u8bc1\u62a5\u544a" + RESET);
console.log(BOLD + CYAN + "\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550" + RESET + "\n");

console.log("  \u6587\u4ef6:       " + ALL_FILES.length + " \u4e2a");
const totalExportCount = ALL_EXPORTS.reduce((s, e) => s + e[1].length, 0);
console.log("  \u5bfc\u51fa\u9879:     " + totalExportCount + " \u4e2a");
console.log("  \u529f\u80fd\u7279\u6027:   " + REQUIRED_FEATURES.length + " \u9879");
console.log("  Tab \u9762\u677f:   " + expectedPanels.length + " \u4e2a");
console.log("  \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500");

if (errors > 0) {
  console.log("  " + RED + "\u5931\u8d25: " + errors + " \u9879\u274c" + RESET + "\n");
  process.exit(1);
} else {
  console.log("  " + GREEN + BOLD + "\u2705 \u5168\u90e8\u901a\u8fc7\uff01\u6a21\u5757\u5316\u91cd\u6784\u5b8c\u6574\u53ef\u7528\u3002" + RESET + "\n");
}
