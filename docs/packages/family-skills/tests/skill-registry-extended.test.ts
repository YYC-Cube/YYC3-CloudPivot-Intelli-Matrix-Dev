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

import { describe, it, expect, beforeEach } from 'vitest';
import { FamilySkillRegistry } from '../src/registry/FamilySkillRegistry.js';
import { defineSkill } from '../src/registry/SkillManifest.js';
import type { FamilySkill } from '@yyc3/family-agents';

function createTestSkill(id: string, owner: string = 'thinker', category: string = 'analysis'): FamilySkill {
  return defineSkill(
    { id, name: `Test ${id}`, version: '1.0.0', owner: owner as any, description: `Test skill ${id}`, category: category as any, parameters: [] },
    async () => ({ result: `from-${id}` }),
    (params) => ({ valid: !!params }),
  );
}

describe('FamilySkillRegistry Edit/Import/Export', () => {
  let registry: FamilySkillRegistry;

  beforeEach(() => {
    registry = new FamilySkillRegistry();
  });

  describe('updateSkill', () => {
    it('updates skill name and description', async () => {
      const skill = createTestSkill('test:update');
      await registry.register(skill);

      const result = await registry.updateSkill('test:update', {
        name: 'Updated Name',
        description: 'Updated description',
      });

      expect(result.success).toBe(true);
      const updated = registry.get('test:update');
      expect(updated?.name).toBe('Updated Name');
      expect(updated?.description).toBe('Updated description');
    });

    it('updates skill parameters', async () => {
      const skill = createTestSkill('test:params');
      await registry.register(skill);

      const newParams = [{ name: 'input', type: 'string' as const, required: true, description: 'Input data' }];
      await registry.updateSkill('test:params', { parameters: newParams });

      const updated = registry.get('test:params');
      expect(updated?.parameters).toEqual(newParams);
    });

    it('updates validate function', async () => {
      const skill = createTestSkill('test:validate');
      await registry.register(skill);

      let customValidated = false;
      await registry.updateSkill('test:validate', {
        validate: () => { customValidated = true; return { valid: true }; },
      });

      const updated = registry.get('test:validate');
      updated?.validate?.({});
      expect(customValidated).toBe(true);
    });

    it('returns error for non-existent skill', async () => {
      const result = await registry.updateSkill('nonexistent', { name: 'X' });
      expect(result.success).toBe(false);
      expect(result.errors?.[0]).toContain('not found');
    });

    it('emits skill:updated event', async () => {
      const skill = createTestSkill('test:event');
      await registry.register(skill);

      let eventFired = false;
      registry.on('skill:updated', () => { eventFired = true; });
      await registry.updateSkill('test:event', { name: 'New' });
      expect(eventFired).toBe(true);
    });
  });

  describe('importSkill', () => {
    it('imports a new skill', async () => {
      const skill = createTestSkill('test:import-new');
      const result = await registry.importSkill(skill);
      expect(result.success).toBe(true);
      expect(result.skillId).toBe('test:import-new');
      expect(registry.get('test:import-new')).toBeDefined();
    });

    it('replaces existing skill (idempotent import)', async () => {
      const skill1 = createTestSkill('test:replace');
      await registry.register(skill1);

      const skill2 = createTestSkill('test:replace');
      skill2.name = 'Replaced';
      const result = await registry.importSkill(skill2);

      expect(result.success).toBe(true);
      expect(registry.get('test:replace')?.name).toBe('Replaced');
    });

    it('preserves call stats on reimport', async () => {
      const skill = createTestSkill('test:stats');
      await registry.register(skill);
      const entry = registry.getManifest('test:stats');
      if (entry) { entry.callCount = 10; entry.avgExecutionTime = 50; }

      const newSkill = createTestSkill('test:stats');
      await registry.importSkill(newSkill);

      const updated = registry.getManifest('test:stats');
      expect(updated?.callCount).toBe(10);
      expect(updated?.avgExecutionTime).toBe(50);
    });

    it('rejects invalid skill', async () => {
      const result = await registry.importSkill({} as FamilySkill);
      expect(result.success).toBe(false);
      expect(result.errors?.length).toBeGreaterThan(0);
    });

    it('emits skill:imported for new and skill:reimported for existing', async () => {
      let importedEvent = '';
      registry.on('skill:imported', () => { importedEvent = 'imported'; });
      registry.on('skill:reimported', () => { importedEvent = 'reimported'; });

      const skill = createTestSkill('test:events');
      await registry.importSkill(skill);
      expect(importedEvent).toBe('imported');

      const skill2 = createTestSkill('test:events');
      await registry.importSkill(skill2);
      expect(importedEvent).toBe('reimported');
    });
  });

  describe('importFromExternal', () => {
    it('bulk imports multiple skills', async () => {
      const skills = [
        createTestSkill('test:bulk-1'),
        createTestSkill('test:bulk-2'),
        createTestSkill('test:bulk-3'),
      ];

      const results = await registry.importFromExternal(skills);
      expect(results).toHaveLength(3);
      expect(results.every(r => r.success)).toBe(true);
      expect(registry.getStats().total).toBe(3);
    });

    it('handles mixed valid and invalid skills', async () => {
      const skills = [
        createTestSkill('test:mix-valid'),
        {} as FamilySkill,
        createTestSkill('test:mix-valid-2'),
      ];

      const results = await registry.importFromExternal(skills);
      expect(results[0]?.success).toBe(true);
      expect(results[1]?.success).toBe(false);
      expect(results[2]?.success).toBe(true);
    });
  });

  describe('exportSkill', () => {
    it('exports skill config', async () => {
      const skill = createTestSkill('test:export');
      await registry.register(skill);

      const exported = registry.exportSkill('test:export');
      expect(exported).toBeDefined();
      expect(exported!.config.id).toBe('test:export');
      expect(exported!.config.owner).toBe('thinker');
      expect(exported!.config.category).toBe('analysis');
      expect(exported!.config.registeredAt).toBeGreaterThan(0);
    });

    it('returns undefined for non-existent skill', () => {
      const exported = registry.exportSkill('nonexistent');
      expect(exported).toBeUndefined();
    });

    it('exported config includes call stats', async () => {
      const skill = createTestSkill('test:export-stats');
      await registry.register(skill);
      const entry = registry.getManifest('test:export-stats');
      if (entry) { entry.callCount = 42; entry.avgExecutionTime = 100; }

      const exported = registry.exportSkill('test:export-stats');
      expect(exported!.config.callCount).toBe(42);
      expect(exported!.config.avgExecutionTime).toBe(100);
    });
  });
});
