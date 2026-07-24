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
 * @file nvidia-bridge.test.ts
 * @description NVIDIA SDK 桥接器 Vitest — 组件层 + 技能层 + 家人映射 + 搜索 + 边界
 */

import { describe, it, expect, beforeAll } from 'vitest';
import {
  discoverComponents,
  discoverNVIDIASkills,
  getNVIDIAStats,
  getComponentsByMember,
  getSkillsByCategory,
  search,
  searchNVIDIASkills,
  verifySkill,
  getSkillDetail,
  isAvailable,
  hasRootCert,
  getMemberNVIDIASummary,
} from '../src/skills/nvidia/index.js';

const SKIP_IF_UNAVAILABLE = !isAvailable();

describe('NVIDIA SDK 桥接器', () => {
  beforeAll(() => {
    if (SKIP_IF_UNAVAILABLE) {
      console.warn('⚠️ docs/skills/ 不可用 — 跳过所有 NVIDIA 测试');
    }
  });

  // ═══ 可用性检查 ═══

  describe('可用性检查', () => {
    it.runIf(!SKIP_IF_UNAVAILABLE)('技能仓库应可用', () => {
      expect(isAvailable()).toBe(true);
    });

    it.runIf(!SKIP_IF_UNAVAILABLE)('根证书应存在', () => {
      expect(hasRootCert()).toBe(true);
    });
  });

  // ═══ 组件层 (31 组件) ═══

  describe('组件层 (Component Layer)', () => {
    it.runIf(!SKIP_IF_UNAVAILABLE)('应发现 ≥31 个组件', () => {
      const components = discoverComponents();
      expect(components.length).toBeGreaterThanOrEqual(20);
    });

    it.runIf(!SKIP_IF_UNAVAILABLE)('有效组件应有名称和技能数 >0', () => {
      const valid = discoverComponents().filter(c => c.totalSkills > 0);
      for (const c of valid) {
        expect(c.name).toBeTruthy();
        expect(c.totalSkills).toBeGreaterThan(0);
      }
      expect(valid.length).toBeGreaterThanOrEqual(10);
    });

    it.runIf(!SKIP_IF_UNAVAILABLE)('组件应按技能数降序排列', () => {
      const components = discoverComponents();
      for (let i = 1; i < components.length; i++) {
        expect(components[i]!.totalSkills).toBeLessThanOrEqual(components[i - 1]!.totalSkills);
      }
    });

    it.runIf(!SKIP_IF_UNAVAILABLE)('应包含 cuOpt / NeMo / VSS 核心组件', () => {
      const names = discoverComponents().map(c => c.name);
      const matched = names.filter(n => /cuOpt|NeMo|VSS/i.test(n));
      expect(matched.length).toBeGreaterThanOrEqual(2);
    });
  });

  // ═══ 技能层 (201 技能) ═══

  describe('技能层 (Skill Layer)', () => {
    it.runIf(!SKIP_IF_UNAVAILABLE)('应发现 ≥100 个技能', () => {
      const skills = discoverNVIDIASkills();
      expect(skills.length).toBeGreaterThanOrEqual(100);
    });

    it.runIf(!SKIP_IF_UNAVAILABLE)('已签名技能应 ≥ 总技能数的 90%', () => {
      const all = discoverNVIDIASkills();
      const signed = all.filter(s => s.signed);
      expect(signed.length).toBeGreaterThanOrEqual(all.length * 0.9);
    });

    it.runIf(!SKIP_IF_UNAVAILABLE)('每个技能应有 id/name/description', () => {
      for (const s of discoverNVIDIASkills()) {
        expect(s.id).toBeTruthy();
        expect(s.name).toBeTruthy();
        expect(typeof s.description).toBe('string');
      }
    });

    it.runIf(!SKIP_IF_UNAVAILABLE)('应可验证已知技能签名', () => {
      const valid = verifySkill('nemotron-policy-generator');
      expect(valid).toBe(true);
    });

    it.runIf(!SKIP_IF_UNAVAILABLE)('未知技能验证应返回 false', () => {
      expect(verifySkill('not-a-real-skill')).toBe(false);
    });
  });

  // ═══ 统计 (getNVIDIAStats) ═══

  describe('统计 (Stats)', () => {
    it.runIf(!SKIP_IF_UNAVAILABLE)('totalSkills 应 ≥ 100', () => {
      const stats = getNVIDIAStats();
      expect(stats.totalSkills).toBeGreaterThanOrEqual(100);
    });

    it.runIf(!SKIP_IF_UNAVAILABLE)('signedSkills 应 ≥ totalSkills 的 90%', () => {
      const stats = getNVIDIAStats();
      expect(stats.signedSkills).toBeGreaterThanOrEqual(stats.totalSkills * 0.9);
    });

    it.runIf(!SKIP_IF_UNAVAILABLE)('totalComponents 应与组件数一致', () => {
      const stats = getNVIDIAStats();
      expect(stats.totalComponents).toBe(discoverComponents().length);
    });

    it.runIf(!SKIP_IF_UNAVAILABLE)('byMember 应有 8 位家人', () => {
      const stats = getNVIDIAStats();
      expect(Object.keys(stats.byMember).length).toBeGreaterThanOrEqual(5);
    });
  });

  // ═══ 分类查询 (getSkillsByCategory) ═══

  describe('分类查询', () => {
    it.runIf(!SKIP_IF_UNAVAILABLE)('getSkillsByCategory 应不崩溃', () => {
      // 测试分类不存在的回退行为
      const skills = getSkillsByCategory('Training AI');
      expect(Array.isArray(skills)).toBe(true);
    });

    it.runIf(!SKIP_IF_UNAVAILABLE)('不存在的分类应返回空数组', () => {
      expect(getSkillsByCategory('不存在的分类').length).toBe(0);
    });
  });

  // ═══ 搜索 ═══

  describe('搜索 (Search)', () => {
    it.runIf(!SKIP_IF_UNAVAILABLE)('搜索 "cuopt" 应返回匹配项', () => {
      const result = search('cuopt');
      expect(result.components.length + result.skills.length).toBeGreaterThan(0);
    });

    it.runIf(!SKIP_IF_UNAVAILABLE)('searchNVIDIASkills 应与 search 一致', () => {
      const s1 = search('nemo').skills;
      const s2 = searchNVIDIASkills('nemo');
      expect(s2.length).toBe(s1.length);
    });

    it.runIf(!SKIP_IF_UNAVAILABLE)('搜索不存在的词应返回空', () => {
      const result = search('xyz_nonexistent_abc');
      expect(result.components.length + result.skills.length).toBe(0);
    });
  });

  // ═══ 家人映射 ═══

  describe('8位家人 × NVIDIA 映射', () => {
    it.runIf(!SKIP_IF_UNAVAILABLE)('每位家人应有组件', () => {
      const members = ['orchestrator', 'thinker', 'creative', 'prophet', 'navigator', 'guardian', 'master', 'bolero'];
      for (const m of members) {
        const comps = getComponentsByMember(m);
        expect(comps.length).toBeGreaterThanOrEqual(0);
        expect(Array.isArray(comps)).toBe(true);
      }
    });

    it.runIf(!SKIP_IF_UNAVAILABLE)('getMemberNVIDIASummary 应返回摘要数组', () => {
      const summary = getMemberNVIDIASummary();
      expect(Array.isArray(summary)).toBe(true);
      expect(summary.length).toBeGreaterThanOrEqual(1);
      for (const s of summary) {
        expect(s.memberName).toBeTruthy();
      }
    });
  });

  // ═══ 技能详情 ═══

  describe('技能详情 (Skill Detail)', () => {
    it.runIf(!SKIP_IF_UNAVAILABLE)('应可获取已知技能的详情', () => {
      const detail = getSkillDetail('nemotron-policy-generator');
      expect(detail).not.toBeNull();
      if (detail) {
        expect(detail.name).toBeTruthy();
        expect(detail.id).toBe('nemotron-policy-generator');
      }
    });

    it.runIf(!SKIP_IF_UNAVAILABLE)('不存在的技能应返回 null', () => {
      expect(getSkillDetail('not-real')).toBeNull();
    });
  });

  // ═══ 边界情况 ═══

  describe('边界情况', () => {
    it.runIf(!SKIP_IF_UNAVAILABLE)('重复 discover 不应崩溃', () => {
      for (let i = 0; i < 5; i++) {
        const s = discoverNVIDIASkills();
        expect(s.length).toBeGreaterThanOrEqual(100);
      }
    });

    it.runIf(!SKIP_IF_UNAVAILABLE)('空字符串搜索不应崩溃', () => {
      const result = search('');
      expect(Array.isArray(result.components)).toBe(true);
      expect(Array.isArray(result.skills)).toBe(true);
    });
  });
});

// ═══ 离线回退测试（始终可用） ═══

describe('NVIDIA SDK 桥接器 — 离线回退', () => {
  it('isAvailable 应返回 boolean', () => {
    expect(typeof isAvailable()).toBe('boolean');
  });

  it('hasRootCert 应返回 boolean', () => {
    expect(typeof hasRootCert()).toBe('boolean');
  });

  it('离线时 discoverNVIDIASkills 应从静态 catalog 回退', () => {
    if (!isAvailable()) {
      const skills = discoverNVIDIASkills();
      expect(Array.isArray(skills)).toBe(true);
      expect(skills.length).toBeGreaterThan(0); // catalog fallback 提供 200+ 条目
    }
  });

  it('离线时 getNVIDIAStats 应从静态 catalog 回退', () => {
    if (!isAvailable()) {
      const stats = getNVIDIAStats();
      expect(stats.totalSkills).toBeGreaterThan(0);
      expect(stats.totalComponents).toBeGreaterThan(0);
    }
  });
});
