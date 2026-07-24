/**
 * ============================================================
 * YYC³ AI Family — 人从众曌众从人
 * 亦师亦友亦伯乐，一言一语一协同
 * 拟人为本 · AI为核 · 纯粹为心
 * ============================================================
 * @Family   : YYC³ AI Family (永久开源)
 * @License  : Apache-2.0
 * @Homepage : https://matrix.yyc3.top
 * ============================================================
 * 此文件承载家人温度，请以玫瑰之心待之 🌹
 * ============================================================
 */

/**
 * QueryProvider.tsx
 * ==================
 * TanStack React Query Provider — 为 YYC³ UI 组件提供数据请求能力
 *
 * 使用方式:
 * ```tsx
 * <QueryProvider>
 *   <AIAssistant />
 * </QueryProvider>
 * ```
 */

import React, { type ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// ═══ 全局 QueryClient 实例 ═══

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      staleTime: 30_000,        // 30s 内数据视为新鲜
      gcTime: 5 * 60_000,       // 5min 后回收缓存
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
    },
    mutations: {
      retry: 1,
    },
  },
});

// ═══ Provider 组件 ═══

export interface QueryProviderProps {
  children: ReactNode;
  /** 可选的自定义 QueryClient（如用于测试时注入 mock） */
  client?: QueryClient;
}

export function QueryProvider({ children, client }: QueryProviderProps) {
  return (
    <QueryClientProvider client={client ?? queryClient}>
      {children}
    </QueryClientProvider>
  );
}

export { queryClient, QueryClient, QueryClientProvider };
