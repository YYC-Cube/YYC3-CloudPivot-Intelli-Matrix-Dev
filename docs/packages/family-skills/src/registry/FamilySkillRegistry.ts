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

import { EventEmitter } from 'events';
import type {
  FamilySkill,
  SkillCategory,
  SkillResult,
  SkillValidationResult,
  SkillExecutionContext,
} from '@yyc3/family-agents';

export interface SkillRegistrationResult {
  success: boolean;
  skillId?: string;
  errors?: string[];
}

export interface SkillExportConfig {
  id: string;
  name: string;
  version: string;
  owner: string;
  description: string;
  category: SkillCategory;
  parameters: import('@yyc3/family-agents').SkillParameter[];
  mcp?: { server: string; tool: string };
  registeredAt: number;
  callCount: number;
  avgExecutionTime: number;
}

export interface SkillSearchQuery {
  category?: SkillCategory;
  owner?: string;
  query?: string;
}

export interface SkillManifestEntry {
  skill: FamilySkill;
  registeredAt: number;
  callCount: number;
  lastCalledAt?: number;
  avgExecutionTime: number;
}

export class FamilySkillRegistry extends EventEmitter {
  private skills: Map<string, SkillManifestEntry> = new Map();
  private byCategory: Map<SkillCategory, string[]> = new Map();
  private byOwner: Map<string, string[]> = new Map();

  async register(skill: FamilySkill): Promise<SkillRegistrationResult> {
    const validation = this.validateSkill(skill);
    if (!validation.valid) {
      return { success: false, errors: validation.errors };
    }

    if (this.skills.has(skill.id)) {
      return { success: false, errors: [`Skill ${skill.id} already registered`] };
    }

    const entry: SkillManifestEntry = {
      skill,
      registeredAt: Date.now(),
      callCount: 0,
      avgExecutionTime: 0,
    };

    this.skills.set(skill.id, entry);

    if (!this.byCategory.has(skill.category)) {
      this.byCategory.set(skill.category, []);
    }
    this.byCategory.get(skill.category)!.push(skill.id);

    if (!this.byOwner.has(skill.owner)) {
      this.byOwner.set(skill.owner, []);
    }
    this.byOwner.get(skill.owner)!.push(skill.id);

    this.emit('skill:registered', { skillId: skill.id, owner: skill.owner });
    return { success: true, skillId: skill.id };
  }

  async unregister(skillId: string): Promise<void> {
    const entry = this.skills.get(skillId);
    if (!entry) throw new Error(`Skill ${skillId} not found`);

    const { skill } = entry;
    this.skills.delete(skillId);

    const category = this.byCategory.get(skill.category);
    if (category) {
      const idx = category.indexOf(skillId);
      if (idx > -1) category.splice(idx, 1);
    }

    const owner = this.byOwner.get(skill.owner);
    if (owner) {
      const idx = owner.indexOf(skillId);
      if (idx > -1) owner.splice(idx, 1);
    }

    this.emit('skill:unregistered', { skillId, owner: skill.owner });
  }

  async execute(skillId: string, context: SkillExecutionContext): Promise<SkillResult> {
    const entry = this.skills.get(skillId);
    if (!entry) {
      return { success: false, error: `Skill ${skillId} not found`, executionTime: 0 };
    }

    const { skill } = entry;
    const startTime = Date.now();

    try {
      if (skill.validate) {
        const validation = skill.validate(context.params);
        if (!validation.valid) {
          return {
            success: false,
            error: `Validation failed: ${validation.errors?.join(', ')}`,
            executionTime: Date.now() - startTime,
          };
        }
      }

      const result = await skill.execute(context);
      const executionTime = Date.now() - startTime;

      entry.callCount++;
      entry.lastCalledAt = Date.now();
      entry.avgExecutionTime =
        (entry.avgExecutionTime * (entry.callCount - 1) + executionTime) / entry.callCount;

      this.emit('skill:executed', { skillId, executionTime, success: result.success });
      return result;
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
        executionTime: Date.now() - startTime,
      };
    }
  }

  get(skillId: string): FamilySkill | undefined {
    return this.skills.get(skillId)?.skill;
  }

  getManifest(skillId: string): SkillManifestEntry | undefined {
    return this.skills.get(skillId);
  }

  list(query?: SkillSearchQuery): FamilySkill[] {
    if (!query) return Array.from(this.skills.values()).map(e => e.skill);

    let results = Array.from(this.skills.values());

    if (query.category) {
      const ids = this.byCategory.get(query.category) ?? [];
      const idSet = new Set(ids);
      results = results.filter(e => idSet.has(e.skill.id));
    }

    if (query.owner) {
      const ids = this.byOwner.get(query.owner) ?? [];
      const idSet = new Set(ids);
      results = results.filter(e => idSet.has(e.skill.id));
    }

    if (query.query) {
      const q = query.query.toLowerCase();
      results = results.filter(e =>
        e.skill.name.toLowerCase().includes(q) ||
        e.skill.description.toLowerCase().includes(q) ||
        e.skill.id.toLowerCase().includes(q)
      );
    }

    return results.map(e => e.skill);
  }

  listByOwner(owner: string): FamilySkill[] {
    const ids = this.byOwner.get(owner) ?? [];
    return ids.map(id => this.skills.get(id)?.skill).filter((s): s is FamilySkill => !!s);
  }

  listByCategory(category: SkillCategory): FamilySkill[] {
    const ids = this.byCategory.get(category) ?? [];
    return ids.map(id => this.skills.get(id)?.skill).filter((s): s is FamilySkill => !!s);
  }

  getMCPSkills(): FamilySkill[] {
    return Array.from(this.skills.values())
      .map(e => e.skill)
      .filter(s => !!s.mcp);
  }

  getStats(): {
    total: number;
    byCategory: Record<string, number>;
    byOwner: Record<string, number>;
    totalCalls: number;
  } {
    const byCategory: Record<string, number> = {};
    const byOwner: Record<string, number> = {};
    let totalCalls = 0;

    for (const [cat, ids] of this.byCategory) byCategory[cat] = ids.length;
    for (const [owner, ids] of this.byOwner) byOwner[owner] = ids.length;
    for (const entry of this.skills.values()) totalCalls += entry.callCount;

    return { total: this.skills.size, byCategory, byOwner, totalCalls };
  }

  private validateSkill(skill: FamilySkill): SkillValidationResult {
    const errors: string[] = [];
    if (!skill.id) errors.push('Skill ID is required');
    if (!skill.name) errors.push('Skill name is required');
    if (!skill.description) errors.push('Skill description is required');
    if (!skill.owner) errors.push('Skill owner is required');
    if (!skill.category) errors.push('Skill category is required');
    if (!skill.execute) errors.push('Skill execute function is required');
    return { valid: errors.length === 0, errors: errors.length > 0 ? errors : undefined };
  }

  // ================= Edit / Import / Export =================

  async updateSkill(skillId: string, updates: Partial<Pick<FamilySkill, 'name' | 'description' | 'parameters' | 'validate'>>): Promise<SkillRegistrationResult> {
    const entry = this.skills.get(skillId);
    if (!entry) {
      return { success: false, errors: [`Skill ${skillId} not found`] };
    }

    if (updates.name !== undefined) entry.skill.name = updates.name;
    if (updates.description !== undefined) entry.skill.description = updates.description;
    if (updates.parameters !== undefined) entry.skill.parameters = updates.parameters;
    if (updates.validate !== undefined) entry.skill.validate = updates.validate;

    this.emit('skill:updated', { skillId, updates: Object.keys(updates) });
    return { success: true, skillId };
  }

  async importSkill(skill: FamilySkill): Promise<SkillRegistrationResult> {
    const validation = this.validateSkill(skill);
    if (!validation.valid) {
      return { success: false, errors: validation.errors };
    }

    const existing = this.skills.get(skill.id);
    if (existing) {
      this.removeFromIndex(existing.skill);
    }

    const entry: SkillManifestEntry = {
      skill,
      registeredAt: Date.now(),
      callCount: existing?.callCount ?? 0,
      avgExecutionTime: existing?.avgExecutionTime ?? 0,
    };

    this.skills.set(skill.id, entry);
    this.addToIndex(skill);

    this.emit(existing ? 'skill:reimported' : 'skill:imported', { skillId: skill.id, owner: skill.owner });
    return { success: true, skillId: skill.id };
  }

  async importFromExternal(skills: FamilySkill[]): Promise<SkillRegistrationResult[]> {
    const results: SkillRegistrationResult[] = [];
    for (const skill of skills) {
      results.push(await this.importSkill(skill));
    }
    return results;
  }

  exportSkill(skillId: string): { config: SkillExportConfig } | undefined {
    const entry = this.skills.get(skillId);
    if (!entry) return undefined;

    const { skill } = entry;
    return {
      config: {
        id: skill.id,
        name: skill.name,
        version: skill.version,
        owner: skill.owner,
        description: skill.description,
        category: skill.category,
        parameters: skill.parameters,
        mcp: skill.mcp,
        registeredAt: entry.registeredAt,
        callCount: entry.callCount,
        avgExecutionTime: entry.avgExecutionTime,
      },
    };
  }

  private addToIndex(skill: FamilySkill): void {
    if (!this.byCategory.has(skill.category)) {
      this.byCategory.set(skill.category, []);
    }
    this.byCategory.get(skill.category)!.push(skill.id);

    if (!this.byOwner.has(skill.owner)) {
      this.byOwner.set(skill.owner, []);
    }
    this.byOwner.get(skill.owner)!.push(skill.id);
  }

  private removeFromIndex(skill: FamilySkill): void {
    const category = this.byCategory.get(skill.category);
    if (category) {
      const idx = category.indexOf(skill.id);
      if (idx > -1) category.splice(idx, 1);
    }

    const owner = this.byOwner.get(skill.owner);
    if (owner) {
      const idx = owner.indexOf(skill.id);
      if (idx > -1) owner.splice(idx, 1);
    }
  }
}
