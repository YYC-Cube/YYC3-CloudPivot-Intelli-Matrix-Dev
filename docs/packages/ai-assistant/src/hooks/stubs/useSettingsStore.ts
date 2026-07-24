/**
 * @file hooks/stubs/useSettingsStore.ts
 * @description 设置存储 Stub — 外部项目应替换为真实实现
 *
 * 集成指南：
 *   消费者项目可通过 tsconfig paths 或 vite alias 覆盖此 stub，
 *   注入基于 zustand / localStorage / electron-store 的真实实现。
 *
 * @author YanYuCloudCube Team
 * @version v1.0.0
 */

import { useCallback, useState } from "react";

export interface SettingsValues {
  aiApiKey: string;
  aiModel: string;
  aiTemperature: string;
  aiTopP: string;
  aiMaxTokens: string;
}

export interface UseSettingsStoreReturn {
  values: SettingsValues;
  updateValue: <K extends keyof SettingsValues>(key: K, value: SettingsValues[K]) => void;
}

const DEFAULT_VALUES: SettingsValues = {
  aiApiKey: "",
  aiModel: "",
  aiTemperature: "0.7",
  aiTopP: "0.9",
  aiMaxTokens: "2048"
};

export function useSettingsStore(): UseSettingsStoreReturn {
  const [values, setValues] = useState<SettingsValues>(DEFAULT_VALUES);

  const updateValue = useCallback(
    <K extends keyof SettingsValues>(key: K, value: SettingsValues[K]) => {
      setValues((prev) => ({ ...prev, [key]: value }));
    },
    []
  );

  return { values, updateValue };
}
