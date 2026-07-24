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
 * @file nvidia-member-map.ts
 * @description NVIDIA 32 组件 → 8 位 AI 家人映射
 */

import { COMPONENT_TO_MEMBER, discoverComponents } from './nvidia-bridge.js';

const MEMBER_INFO: Record<string, { name: string; title: string; emoji: string }> = {
  'tianshu': { name: '元启·天枢', title: '天枢 · Tianshu', emoji: '⚙️' },
  'thinker': { name: '语枢·万物', title: '万物 · Thinker', emoji: '🧠' },
  'grace': { name: '创想·灵韵', title: '灵韵 · Grace', emoji: '🎨' },
  'prophet': { name: '预见·先知', title: '先知 · Prophet', emoji: '🔮' },
  'qianhang': { name: '言启·千行', title: '千行 · QianHang', emoji: '👂' },
  'guardian': { name: '智云·守护', title: '守护 · Guardian', emoji: '🛡️' },
  'grandmaster': { name: '格物·宗师', title: '宗师 · Grandmaster', emoji: '⚖️' },
  'bole': { name: '千里·伯乐', title: '伯乐 · Bole', emoji: '⭐' },
};

export interface MemberNVSummary {
  memberId: string;
  memberName: string;
  title: string;
  emoji: string;
  components: { name: string; skills: number; avgSecurity: number }[];
  totalComponents: number;
  totalSkills: number;
  signedSkills: number;
}

/** 获取每位家人的 NVIDIA 组件分配 */
export function getMemberNVIDIASummary(): MemberNVSummary[] {
  const allComponents = discoverComponents();
  const grouped = new Map<string, MemberNVSummary>();

  for (const [id, info] of Object.entries(MEMBER_INFO)) {
    grouped.set(id, {
      memberId: id, memberName: info.name, title: info.title, emoji: info.emoji,
      components: [], totalComponents: 0, totalSkills: 0, signedSkills: 0,
    });
  }

  for (const comp of allComponents) {
    const mid = COMPONENT_TO_MEMBER[comp.name] ?? 'meta-oracle';
    const g = grouped.get(mid);
    if (g) {
      g.components.push({ name: comp.name, skills: comp.totalSkills, avgSecurity: comp.avgSecurity });
      g.totalComponents++;
      g.totalSkills += comp.totalSkills;
      g.signedSkills += comp.signedSkills;
    }
  }

  // 按技能数排序
  for (const g of grouped.values()) {
    g.components.sort((a, b) => b.skills - a.skills);
  }

  return Array.from(grouped.values()).sort((a, b) => b.totalSkills - a.totalSkills);
}

/** 8 位家人总览 */
export const NVIDIA_MEMBER_OVERVIEW = [
  { memberId: 'tianshu', emoji: '⚙️', summary: 'AIQ + cuOpt + cuFOLIO + NemoClaw + RAG — 指挥调度 5 组件' },
  { memberId: 'thinker', emoji: '🧠', summary: 'NeMo 全家桶 + Megatron + cuDF/cuPyNumeric + Data Designer — 9 组件' },
  { memberId: 'grace', emoji: '🎨', summary: 'TAO 视觉 + VSS + DeepStream + DALI — 4 组件' },
  { memberId: 'prophet', emoji: '🔮', summary: 'Physical AI + Earth-2 + PhysicsNeMo + 医疗 — 5 组件' },
  { memberId: 'grandmaster', emoji: '⚖️', summary: 'TileGym GPU + CUDA-Q 量子 + Skill Card — 3 组件' },
  { memberId: 'guardian', emoji: '🛡️', summary: 'Dynamo 推理 + Holoscan 边缘 — 3 组件' },
  { memberId: 'qianhang', emoji: '👂', summary: 'Nemotron Speech + NeMo Retriever — 对话入口 2 组件' },
  { memberId: 'bole',        emoji: '⭐', summary: 'NVIDIA Merlin + 嵌入匹配 — 推荐引擎 1 组件' },
];
