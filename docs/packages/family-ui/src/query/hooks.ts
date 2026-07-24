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
 * hooks.ts
 * ========
 * 结合 Zustand + TanStack React Query 的数据请求钩子
 *
 * 设计原则：
 * - Zustand 管理客户端状态（UI、主题、设置、实时消息）
 * - React Query 管理服务端状态（API 请求、缓存、后台刷新）
 * - hooks 从 React Query 获取数据后同步写入 Zustand store
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useFamilyStore } from '../ai-family/store/FamilyStore';

// ═══ 查询键常量 ═══

export const QUERY_KEYS = {
  members:        ['family', 'members'] as const,
  activities:     ['family', 'activities'] as const,
  messages:       ['family', 'messages'] as const,
  memberDetail:   (id: string) => ['family', 'member', id] as const,
  leaderboard:    ['family', 'leaderboard'] as const,
  achievement:    ['family', 'achievement'] as const,
  syncStatus:     ['family', 'sync'] as const,
} as const;

// ═══ 模拟 API 函数（后续替换为真实后端调用）════

async function fetchMembers(): Promise<import('../ai-family/shared').FamilyMember[]> {
  const res = await fetch('/api/family/members');
  if (!res.ok) throw new Error('Failed to fetch members');
  return res.json();
}

async function fetchActivities(): Promise<import('../ai-family/store/FamilyStore').FamilyActivity[]> {
  const res = await fetch('/api/family/activities');
  if (!res.ok) throw new Error('Failed to fetch activities');
  return res.json();
}

async function fetchMessages(): Promise<import('../ai-family/store/FamilyStore').FamilyMessage[]> {
  const res = await fetch('/api/family/messages');
  if (!res.ok) throw new Error('Failed to fetch messages');
  return res.json();
}

async function syncData(): Promise<{ syncedAt: number }> {
  const res = await fetch('/api/family/sync', { method: 'POST' });
  if (!res.ok) throw new Error('Sync failed');
  return res.json();
}

// ═══ 数据查询 Hooks ═══

/**
 * 获取 AI Family 成员列表，加载后同步到 Zustand store
 */
export function useFamilyMembers() {
  const updateMembers = useFamilyStore((s) => s.updateMemberStatus);

  return useQuery({
    queryKey: QUERY_KEYS.members,
    queryFn: fetchMembers,
    select: (data) => {
      // 同步到 Zustand store
      data.forEach((m) => updateMembers(m.id, m.status));
      return data;
    },
  });
}

/**
 * 获取活动流数据
 */
export function useFamilyActivities() {
  const addActivity = useFamilyStore((s) => s.addActivity);

  return useQuery({
    queryKey: QUERY_KEYS.activities,
    queryFn: fetchActivities,
    select: (data) => {
      data.forEach((a) => addActivity(a));
      return data;
    },
  });
}

/**
 * 获取消息列表
 */
export function useFamilyMessages() {
  const addMessage = useFamilyStore((s) => s.addMessage);

  return useQuery({
    queryKey: QUERY_KEYS.messages,
    queryFn: fetchMessages,
    select: (data) => {
      data.forEach((m) => addMessage(m));
      return data;
    },
  });
}

// ═══ 数据变更 Hooks ═══

/**
 * 手动触发数据同步
 */
export function useSyncFamily() {
  const queryClient = useQueryClient();
  const setSyncing = useFamilyStore((s) => s.setIsSyncing);
  const setSyncTime = useFamilyStore((s) => s.setLastSyncTime);

  return useMutation({
    mutationFn: syncData,
    onMutate: () => {
      setSyncing(true);
    },
    onSuccess: (data) => {
      setSyncTime(data.syncedAt);
      // 同步完成后主动刷新所有相关缓存
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.members });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.activities });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.messages });
    },
    onSettled: () => {
      setSyncing(false);
    },
  });
}

// ═══ 组合方案：获取全量 Family 数据 ═══

export function useFamilyDashboard() {
  const members = useFamilyMembers();
  const activities = useFamilyActivities();
  const messages = useFamilyMessages();

  const isLoading = members.isLoading || activities.isLoading || messages.isLoading;
  const isError = members.isError || activities.isError || messages.isError;
  const error = members.error ?? activities.error ?? messages.error;

  return {
    members: members.data ?? [],
    activities: activities.data ?? [],
    messages: messages.data ?? [],
    isLoading,
    isError,
    error,
  };
}
