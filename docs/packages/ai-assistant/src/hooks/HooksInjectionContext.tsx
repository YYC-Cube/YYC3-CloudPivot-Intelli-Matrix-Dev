/**
 * @file hooks/HooksInjectionContext.tsx
 * @description Stub hooks 运行时注入上下文
 *
 * 设计原因：
 *   ai-assistant 的 useAIConfig.ts 默认从 ./stubs/ 导入 mock hooks。
 *   由于 dist/ 产物已将 stubs 内联打包，vite alias 无法覆盖。
 *   此 Context 提供"运行时注入"通道：消费者可在 <AIAssistant> 外层
 *   包裹 <HooksProvider> 来替换 useModelProvider / useSettingsStore。
 *
 * @author YanYuCloudCube Team
 * @version v1.0.0
 */

import { createContext, useContext, type ReactNode } from "react";
import type { UseModelProviderReturn } from "./stubs/useModelProvider";
import type { UseSettingsStoreReturn } from "./stubs/useSettingsStore";

/**
 * Hooks 注入接口 — 消费者可选择性替换任一 hook
 */
export interface HooksOverride {
  /** 替换默认的 useModelProvider stub */
  useModelProvider?: () => UseModelProviderReturn;
  /** 替换默认的 useSettingsStore stub */
  useSettingsStore?: () => UseSettingsStoreReturn;
}

const HooksInjectionContext = createContext<HooksOverride | null>(null);

export interface HooksProviderProps {
  children: ReactNode;
  override: HooksOverride;
}

/**
 * Hooks 注入 Provider
 *
 * 使用示例（Intelli-Matrix 集成）：
 *   import { AIAssistant, HooksProvider } from "@yyc3/ai-assistant";
 *
 *   <HooksProvider override={{ useModelProvider, useSettingsStore }}>
 *     <AIAssistant />
 *   </HooksProvider>
 */
export function HooksProvider({ children, override }: HooksProviderProps) {
  return (
    <HooksInjectionContext.Provider value={override}>
      {children}
    </HooksInjectionContext.Provider>
  );
}

/**
 * 消费注入的 hooks（如果存在）
 */
export function useInjectedHooks(): HooksOverride | null {
  return useContext(HooksInjectionContext);
}

export { HooksInjectionContext };
