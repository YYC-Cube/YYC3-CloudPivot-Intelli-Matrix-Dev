/**
 * @file hooks/stubs/useModelProvider.ts
 * @description 模型提供者 Stub — 外部项目应替换为真实实现
 *
 * 集成指南：
 *   在消费者项目中创建 src/hooks/useModelProvider.ts，导出同名 hook，
 *   并在 vite/tsconfig 中通过 alias 覆盖此 stub。
 *   或使用 Module Resolution 覆盖：tsconfig.paths → "@yyc3/ai-assistant/stubs/useModelProvider"
 *
 * @author YanYuCloudCube Team
 * @version v1.0.0
 */

import { useState } from "react";

export interface ModelInfo {
  id: string;
  name: string;
  provider: string;
  isLocal?: boolean;
}

export interface UseModelProviderReturn {
  availableModels: ModelInfo[];
  ollamaLoading: boolean;
}

export function useModelProvider(): UseModelProviderReturn {
  const [availableModels] = useState<ModelInfo[]>([
    { id: "deepseek-v3", name: "DeepSeek-V3", provider: "OpenAI", isLocal: false },
    { id: "qwen2.5-72b", name: "Qwen2.5-72B", provider: "Ollama", isLocal: true }
  ]);
  const [ollamaLoading] = useState(false);

  return { availableModels, ollamaLoading };
}
