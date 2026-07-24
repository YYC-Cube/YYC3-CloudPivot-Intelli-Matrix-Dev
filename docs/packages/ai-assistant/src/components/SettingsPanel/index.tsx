"use client";

/**
 * @file components/SettingsPanel/index.tsx
 * @description 设置面板容器组件（接入 i18n）
 * @author YanYuCloudCube Team
 * @version v1.1.0
 */

import { ApiKeyInput, type ApiKeyInputProps } from "./ApiKeyInput";
import { ModelSelector, type ModelSelectorProps } from "./ModelSelector";
import { ParameterSlider } from "./ParameterSlider";
import { useI18n } from "../../hooks/useI18n";

export interface SettingsPanelProps {
  apiKey: ApiKeyInputProps["value"];
  showApiKey: boolean;
  onToggleApiKey: () => void;
  onApiKeyChange: ApiKeyInputProps["onChange"];
  models: ModelSelectorProps["models"];
  selectedModel: ModelSelectorProps["selectedId"];
  modelsLoading: ModelSelectorProps["loading"];
  onModelSelect: ModelSelectorProps["onSelect"];
  temperature: number;
  onTemperatureChange: (value: number) => void;
  topP: number;
  onTopPChange: (value: number) => void;
  maxTokens: number;
  onMaxTokensChange: (value: number) => void;
}

export function SettingsPanel({
  apiKey,
  showApiKey,
  onToggleApiKey,
  onApiKeyChange,
  models,
  selectedModel,
  modelsLoading,
  onModelSelect,
  temperature,
  onTemperatureChange,
  topP,
  onTopPChange,
  maxTokens,
  onMaxTokensChange
}: SettingsPanelProps) {
  const { t } = useI18n();

  return (
    <div className="space-y-4 min-h-0">
      <ApiKeyInput
        value={apiKey}
        showValue={showApiKey}
        onToggleShow={onToggleApiKey}
        onChange={onApiKeyChange}
      />
      <ModelSelector
        models={models}
        selectedId={selectedModel}
        loading={modelsLoading}
        onSelect={onModelSelect}
      />
      <ParameterSlider
        label={t("settings.temperature")}
        value={temperature}
        min={0}
        max={2}
        step={0.05}
        minLabel={t("settings.tempMin")}
        maxLabel={t("settings.tempMax")}
        onChange={onTemperatureChange}
        color="#00d4ff"
      />
      <ParameterSlider
        label={t("settings.topP")}
        value={topP}
        min={0}
        max={1}
        step={0.05}
        minLabel={t("settings.topPMin")}
        maxLabel={t("settings.topPMax")}
        onChange={onTopPChange}
        color="#aa55ff"
      />
      <ParameterSlider
        label={t("settings.maxTokens")}
        value={maxTokens}
        min={256}
        max={8192}
        step={256}
        minLabel="256"
        maxLabel="8192"
        onChange={onMaxTokensChange}
        color="#00ff88"
      />
    </div>
  );
}
