"use client";

/**
 * AIAssistant.tsx
 * =================================
 * YYC³ CloudPivot Intelli-Matrix · AI 集成控制中心
 *
 * 共用包版本 v1.1.0
 * - 模块化架构（ChatPanel / CommandsPanel / PromptsPanel / SettingsPanel）
 * - Radix UI 组件 + 可拖拽设计
 * - i18n 就绪（内置 zh-CN/en-US + 可桥接 @yyc3/i18n-core）
 * - 通过 I18nProvider 包裹实现全局语言切换
 */

import { BookOpen, Command, GripVertical, MessageSquare, Sliders } from "lucide-react";
import { useCallback, useState } from "react";
import {
  ChatPanel,
  CommandsPanel,
  FloatingButton,
  PanelHeader,
  PromptsPanel,
  SettingsPanel
} from "./components";
import { SYSTEM_COMMANDS, type SystemCommand } from "./constants";
import { useAIConfig, useChat, useDraggable, useFloatingPanel, useI18n } from "./hooks";
import type { AIAssistantProps, AITab } from "./types";
import { I18nProvider } from "./hooks/useI18n";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";

const DRAGGABLE_BOUNDS = {
  left: 20,
  top: 60,
  right: typeof window !== "undefined" ? window.innerWidth - 20 : 1920,
  bottom: typeof window !== "undefined" ? window.innerHeight - 20 : 1080
};

/**
 * 内部组件 — 必须在 I18nProvider 内部消费 useI18n
 */
function AIAssistantInner({ isMobile = false }: AIAssistantProps) {
  const { t } = useI18n();

  const {
    isOpen,
    isMaximized,
    activeTab,
    openPanel,
    closePanel,
    toggleMaximize,
    setActiveTab,
    panelClass
  } = useFloatingPanel({ isMobile });

  const {
    position,
    isDragging,
    handleMouseDown,
    handleTouchStart,
    draggableRef,
    resetPosition
  } = useDraggable({
    initialPosition: { x: typeof window !== "undefined" ? window.innerWidth - 420 : 1500, y: 80 },
    bounds: DRAGGABLE_BOUNDS
  });

  const {
    messages,
    inputValue,
    isTyping,
    systemPrompt,
    chatEndRef,
    sendMessage,
    setInputValue,
    clearChat,
    setSystemPrompt,
    applyPreset,
    copyToClipboard,
    copiedId
  } = useChat();

  const {
    apiKey,
    setApiKey,
    selectedModel,
    setSelectedModel,
    temperature,
    setTemperature,
    topP,
    setTopP,
    maxTokens,
    setMaxTokens,
    availableModels,
    ollamaLoading
  } = useAIConfig();

  const [showApiKey, setShowApiKey] = useState(false);
  const [cmdFilter, setCmdFilter] = useState<string>("all");

  const executeCommand = (cmd: SystemCommand) => {
    setActiveTab("chat");
    sendMessage(cmd.action);
  };

  const handleSend = () => {
    sendMessage(inputValue);
  };

  const handleClose = useCallback(() => {
    resetPosition();
    closePanel();
  }, [resetPosition, closePanel]);

  const currentModel = availableModels.find((m) => m.id === selectedModel);

  if (!isOpen) {
    return <FloatingButton onClick={openPanel} isMobile={isMobile} />;
  }

  const panelStyle = isMaximized
    ? {}
    : {
        position: "fixed" as const,
        left: position.x,
        top: position.y,
        zIndex: 1000,
        cursor: isDragging ? "grabbing" : "default"
      };

  return (
    <div
      ref={draggableRef as React.LegacyRef<HTMLDivElement>}
      className={isMaximized ? panelClass : "w-[380px] h-[520px]"}
      style={panelStyle}
    >
      <div className="w-full h-full rounded-2xl bg-[rgba(8,25,55,0.95)] backdrop-blur-2xl border border-[rgba(0,180,255,0.2)] shadow-[0_0_60px_rgba(0,180,255,0.12)] flex flex-col overflow-hidden">
        {!isMaximized && (
          <div
            className="shrink-0 h-6 flex items-center justify-center cursor-grab active:cursor-grabbing bg-[rgba(0,40,80,0.3)] border-b border-[rgba(0,180,255,0.1)]"
            onMouseDown={handleMouseDown}
            onTouchStart={handleTouchStart}
          >
            <GripVertical className="w-4 h-4 text-[rgba(0,212,255,0.3)]" />
          </div>
        )}

        <PanelHeader
          modelName={currentModel?.name ?? ""}
          isLoading={ollamaLoading}
          isMaximized={isMaximized}
          isMobile={isMobile}
          onClearChat={clearChat}
          onToggleMaximize={toggleMaximize}
          onClose={handleClose}
        />

        <Tabs
          value={activeTab}
          onValueChange={(v) => setActiveTab(v as AITab)}
          className="flex-1 flex flex-col min-h-0"
        >
          <div className="shrink-0 px-3 py-2 border-b border-[rgba(0,180,255,0.08)] bg-[rgba(0,40,80,0.1)]">
            <TabsList className="bg-transparent gap-0.5">
              <TabsTrigger value="chat" className="flex items-center gap-1.5 text-xs">
                <MessageSquare className="w-3.5 h-3.5" />
                {t("tabs.chat")}
              </TabsTrigger>
              <TabsTrigger value="commands" className="flex items-center gap-1.5 text-xs">
                <Command className="w-3.5 h-3.5" />
                {t("tabs.commands")}
              </TabsTrigger>
              <TabsTrigger value="prompts" className="flex items-center gap-1.5 text-xs">
                <BookOpen className="w-3.5 h-3.5" />
                {t("tabs.prompts")}
              </TabsTrigger>
              <TabsTrigger value="settings" className="flex items-center gap-1.5 text-xs">
                <Sliders className="w-3.5 h-3.5" />
                {t("tabs.settings")}
              </TabsTrigger>
            </TabsList>
          </div>

          <div className="flex-1 min-h-0 overflow-y-auto scrollbar-thin scrollbar-thumb-[rgba(0,212,255,0.3)] scrollbar-track-transparent hover:scrollbar-thumb-[rgba(0,212,255,0.5)]">
            <TabsContent
              value="chat"
              className="flex flex-col h-full m-0 data-[state=inactive]:hidden overflow-hidden"
            >
              <ChatPanel
                messages={messages}
                inputValue={inputValue}
                isTyping={isTyping}
                copiedId={copiedId}
                chatEndRef={chatEndRef}
                onInputChange={setInputValue}
                onSend={handleSend}
                onCopy={copyToClipboard}
              />
            </TabsContent>

            <TabsContent
              value="commands"
              className="m-0 data-[state=inactive]:hidden p-3 overflow-hidden"
            >
              <CommandsPanel
                commands={SYSTEM_COMMANDS}
                filter={cmdFilter}
                onFilterChange={setCmdFilter}
                onExecute={executeCommand}
              />
            </TabsContent>

            <TabsContent
              value="prompts"
              className="m-0 data-[state=inactive]:hidden p-3 overflow-hidden"
            >
              <PromptsPanel
                activePrompt={systemPrompt}
                onSelect={applyPreset}
                onCustomChange={setSystemPrompt}
              />
            </TabsContent>

            <TabsContent
              value="settings"
              className="m-0 data-[state=inactive]:hidden p-3 overflow-hidden"
            >
              <SettingsPanel
                apiKey={apiKey}
                showApiKey={showApiKey}
                onToggleApiKey={() => setShowApiKey(!showApiKey)}
                onApiKeyChange={setApiKey}
                models={availableModels}
                selectedModel={selectedModel}
                modelsLoading={ollamaLoading}
                onModelSelect={setSelectedModel}
                temperature={temperature}
                onTemperatureChange={setTemperature}
                topP={topP}
                onTopPChange={setTopP}
                maxTokens={maxTokens}
                onMaxTokensChange={setMaxTokens}
              />
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </div>
  );
}

/**
 * AIAssistant — 公开入口，自动包裹 I18nProvider
 *
 * 使用方式：
 *   import { AIAssistant } from "@yyc3/ai-assistant";
 *   <AIAssistant />
 *
 * 接入 i18n-core（推荐，主项目语言切换会自动同步）：
 *   import { AIAssistant, createI18nCoreAdapter } from "@yyc3/ai-assistant";
 *   import { i18n } from "@yyc3/i18n-core";
 *   <AIAssistant i18nEngine={createI18nCoreAdapter(i18n)} />
 */
export function AIAssistant({ isMobile, i18nEngine }: AIAssistantProps) {
  return (
    <I18nProvider engine={i18nEngine}>
      <AIAssistantInner isMobile={isMobile} />
    </I18nProvider>
  );
}
