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
 * @file nvidia-bridge.ts
 * @description NVIDIA Skills SDK → YYC³ 桥接器
 *              3 层：组件 (32) → 技能 (201) → 评估 (skill-card)
 *              来源: docs/skills/ — NVIDIA/skills 社区仓库 (skills.sh)
 *
 * @see https://github.com/NVIDIA/skills
 */

import yaml from 'js-yaml';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { NVIDIA_CATALOG, type CatalogComponent, type CatalogSkill } from './nvidia-catalog.js';

// ═══ 路径解析 ═══

function findSkillsRoot(): string {
  const candidates = [
    path.resolve(process.cwd(), 'docs/skills'),
    path.resolve(process.cwd(), '../../docs/skills'),
    path.resolve(process.cwd(), '../../../docs/skills'),
  ];
  for (const d of candidates) { if (fs.existsSync(d)) return path.resolve(d); }
  return candidates[1]!;
}

const ROOT = findSkillsRoot();
const SKILLS_DIR = path.join(ROOT, 'skills');
const COMPS_DIR = path.join(ROOT, 'components.d');

/** 读取 YAML 文件 */
function loadYaml(p: string): Record<string, unknown> | null {
  if (!fs.existsSync(p)) return null;
  try { return yaml.load(fs.readFileSync(p, 'utf-8')) as Record<string, unknown>; }
  catch { return null; }
}

/** 提取 SKILL.md frontmatter */
function loadFrontmatter(dir: string): Record<string, unknown> | null {
  const p = path.join(dir, 'SKILL.md');
  if (!fs.existsSync(p)) return null;
  const content = fs.readFileSync(p, 'utf-8');
  const m = content.match(/^---\n([\s\S]*?)\n---/);
  if (!m) return null;
  try { return yaml.load(m[1]!) as Record<string, unknown>; }
  catch { return null; }
}

// ═══ 类型 ═══

export interface NVSkillCard {
  id: string; name: string; version: string; description: string;
  license: string; signed: boolean; tags: string[];
  evalSummary?: Record<string, number>;
}

export interface NVComponent {
  id: string; name: string; repo: string; description: string;
  skills: NVSkillCard[]; totalSkills: number; signedSkills: number; avgSecurity: number;
}

export interface NVIDIAStats {
  totalComponents: number; totalSkills: number; signedSkills: number;
  components: Record<string, number>;
  byMember: Record<string, { count: number; names: string[] }>;
}

// ═══ 家人映射 ═══

export const COMPONENT_TO_MEMBER: Record<string, string> = {
  // tianshu — 元启·天枢（编排/调度/优化）
  AIQ: 'tianshu', 'RAG Blueprint': 'tianshu', cuOpt: 'tianshu', cuFOLIO: 'tianshu', NemoClaw: 'tianshu',
  // thinker — 语枢·万物（训练/分析/数据）
  Nemotron: 'thinker', 'NeMo AutoModel': 'thinker', 'NeMo MBridge': 'thinker', 'NeMo RL': 'thinker', 'NeMo Platform': 'thinker',
  'Megatron Core': 'thinker', cuDF: 'thinker', 'Data Designer': 'thinker', cuPyNumeric: 'thinker',
  // qianhang — 言启·千行（对话/检索/语音入口）
  'NeMo Retriever': 'qianhang', 'Nemotron Speech': 'qianhang',
  // grace — 创想·灵韵（视觉/创意/视频）
  'TAO Toolkit': 'grace', 'Video Search and Summarization': 'grace', DeepStream: 'grace', DALI: 'grace',
  // prophet — 预见·先知（物理/气候/医疗）
  'Physical AI': 'prophet', PhysicsNeMo: 'prophet', 'Earth-2 Studio': 'prophet', 'Digital Health': 'prophet', 'Medical AI Skills': 'prophet',
  // grandmaster — 格物·宗师（GPU优化/量子/质量）
  TileGym: 'grandmaster', 'CUDA-Q': 'grandmaster', 'Skill Card Generator': 'grandmaster',
  // guardian — 智云·守护（推理服务/边缘安全）
  Dynamo: 'guardian', 'Holoscan SDK': 'guardian', 'Holoscan Sensor Bridge': 'guardian',
};

// ═══ 加载技能 ═══

function loadSkill(dirName: string): NVSkillCard | null {
  const dir = path.join(SKILLS_DIR, dirName);
  const raw = loadFrontmatter(dir);
  if (!raw?.name) return null;
  const meta = (raw.metadata ?? {}) as Record<string, unknown>;

  const card: NVSkillCard = {
    id: dirName,
    name: String(raw.title ?? raw.name),
    version: String(raw.version ?? '0.1.0'),
    description: String(raw.description ?? ''),
    license: String(raw.license ?? 'Apache-2.0'),
    signed: fs.existsSync(path.join(dir, 'skill.oms.sig')),
    tags: Array.isArray(meta.tags) ? (meta.tags as string[]).map(String) : [],
  };

  // 从 skill-card.md 提取评估
  const cardPath = path.join(dir, 'skill-card.md');
  if (fs.existsSync(cardPath)) {
    const text = fs.readFileSync(cardPath, 'utf-8');
    const dims: Record<string, number> = {};
    let inTable = false;
    for (const line of text.split('\n')) {
      if (line.includes('| Dimension |')) { inTable = true; continue; }
      if (!inTable || !line.startsWith('| ')) continue;
      const parts = line.split('|').map(s => s.trim()).filter(Boolean);
      if (parts.length >= 2) { const v = parseFloat(parts[1]!); if (!isNaN(v)) dims[parts[0]!.toLowerCase()] = v; }
    }
    if (dims.security !== undefined) card.evalSummary = dims;
  }

  return card;
}

// ═══ 加载组件 ═══

function loadComponent(fileName: string): NVComponent | null {
  const raw = loadYaml(path.join(COMPS_DIR, fileName));
  if (!raw?.name) return null;

  const rawSkills = raw.skills;
  const skillDirs: string[] = [];
  if (Array.isArray(rawSkills)) {
    for (const s of rawSkills) {
      if (s && typeof s === 'object' && 'path' in (s as object)) {
        skillDirs.push(String((s as Record<string, unknown>).path).replace(/^skills\//, ''));
      }
    }
  }

  const skills: NVSkillCard[] = [];
  for (const d of skillDirs) { const s = loadSkill(d); if (s) skills.push(s); }

  return {
    id: fileName.replace(/\.yml$/, ''),
    name: String(raw.name),
    repo: String(raw.repo ?? ''),
    description: String(raw.description ?? ''),
    skills,
    totalSkills: skills.length,
    signedSkills: skills.filter(s => s.signed).length,
    avgSecurity: skills.length > 0 ? Math.round(skills.reduce((a, s) => a + (s.evalSummary?.security ?? 0), 0) / skills.length) : 0,
  };
}

// ═══ Catalog Fallback 适配器 ═══

/** CatalogSkill → NVSkillCard */
function catalogSkillToCard(cs: CatalogSkill): NVSkillCard {
  return {
    id: cs.id,
    name: cs.name,
    version: '0.1.0',
    description: cs.description,
    license: 'Apache-2.0',
    signed: false,
    tags: [],
  };
}

/** CatalogComponent → NVComponent */
function catalogToComponent(cc: CatalogComponent): NVComponent {
  return {
    id: cc.id,
    name: cc.name,
    repo: 'NVIDIA/skills',
    description: cc.description,
    skills: cc.skills.map(catalogSkillToCard),
    totalSkills: cc.skills.length,
    signedSkills: 0,
    avgSecurity: 0,
  };
}

// ═══ 公开 API ═══

/** 发现所有 NVIDIA 组件（SDK 未安装时 fallback 到静态 catalog） */
export function discoverComponents(): NVComponent[] {
  if (fs.existsSync(COMPS_DIR)) {
    return fs.readdirSync(COMPS_DIR)
      .filter(f => f.endsWith('.yml') && f !== 'README.md')
      .map(f => loadComponent(f))
      .filter((x): x is NVComponent => x !== null)
      .sort((a, b) => b.totalSkills - a.totalSkills);
  }
  // Fallback: 使用静态 catalog
  return NVIDIA_CATALOG.map(catalogToComponent).sort((a, b) => b.totalSkills - a.totalSkills);
}

/** 发现所有 NVIDIA 技能（SDK 未安装时 fallback 到静态 catalog） */
export function discoverNVIDIASkills(): NVSkillCard[] {
  if (fs.existsSync(SKILLS_DIR)) {
    return fs.readdirSync(SKILLS_DIR, { withFileTypes: true })
      .filter(e => e.isDirectory())
      .map(e => loadSkill(e.name))
      .filter((x): x is NVSkillCard => x !== null);
  }
  // Fallback: 使用静态 catalog
  return NVIDIA_CATALOG.flatMap(c => c.skills.map(catalogSkillToCard));
}

/** 统计 */
export function getNVIDIAStats(): NVIDIAStats {
  const comps = discoverComponents();
  const compCount: Record<string, number> = {};
  const byMember: Record<string, { count: number; names: string[] }> = {};
  let totalSkills = 0, signedSkills = 0;

  for (const c of comps) {
    totalSkills += c.totalSkills; signedSkills += c.signedSkills;
    compCount[c.name] = c.totalSkills;
    const mid = COMPONENT_TO_MEMBER[c.name] ?? 'tianshu';
    if (!byMember[mid]) byMember[mid] = { count: 0, names: [] };
    byMember[mid].count += c.totalSkills;
    byMember[mid].names.push(c.name);
  }

  return { totalComponents: comps.length, totalSkills, signedSkills, components: compCount, byMember };
}

/** 按家人查询 */
export function getComponentsByMember(memberId: string): NVComponent[] {
  return discoverComponents().filter(c => (COMPONENT_TO_MEMBER[c.name] ?? 'tianshu') === memberId);
}

/** 搜索 */
export function search(query: string): { components: NVComponent[]; skills: NVSkillCard[] } {
  const q = query.toLowerCase();
  const all = discoverComponents();
  return {
    components: all.filter(c => c.name.toLowerCase().includes(q) || c.description.toLowerCase().includes(q)),
    skills: all.flatMap(c => c.skills).filter(s => s.id.includes(q) || s.name.toLowerCase().includes(q) || s.tags.some(t => t.includes(q))),
  };
}

/** 验证签名存在 */
export function verifySkill(name: string): boolean {
  return fs.existsSync(path.join(SKILLS_DIR, name, 'skill.oms.sig'));
}

/** SDK 可用 */
export function isAvailable(): boolean { return fs.existsSync(COMPS_DIR) && fs.existsSync(SKILLS_DIR); }
export function hasRootCert(): boolean { return fs.existsSync(path.join(ROOT, 'nv-agent-root-cert.pem')); }

/** 兼容旧 API */
export function getSkillsByCategory(cat: string): NVSkillCard[] { return discoverComponents().filter(c => (COMPONENT_TO_MEMBER[c.name] ?? '') === cat).flatMap(c => c.skills); }
export function searchNVIDIASkills(q: string): NVSkillCard[] { return search(q).skills; }
export function getSkillDetail(name: string): NVSkillCard | null { return loadSkill(name); }
