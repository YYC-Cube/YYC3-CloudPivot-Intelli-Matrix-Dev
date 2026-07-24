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
 * @file nvidia-smoke-test.ts
 * @description NVIDIA SDK 桥接器冒烟测试 — 组件层 + 技能层 + 家人映射
 */

import { discoverComponents, getNVIDIAStats, getComponentsByMember, search, isAvailable, discoverNVIDIASkills } from '../src/skills/nvidia/nvidia-bridge.js';

function main() {
  console.log('═══════════════════════════════════════');
  console.log('  NVIDIA Skills SDK 桥接器 — 冒烟测试');
  console.log('═══════════════════════════════════════\n');

  if (!isAvailable()) {
    console.log('❌ 技能仓库不可用 (docs/skills/ 不存在)');
    return;
  }

  // 1. 组件层
  const components = discoverComponents();
  console.log(`📦 组件: ${components.length}`);

  // 2. 技能层
  const skills = discoverNVIDIASkills();
  console.log(`📋 技能: ${skills.length}`);
  console.log(`🔒 签名: ${skills.filter(s => s.signed).length}/${skills.length}`);

  // 3. 统计
  const stats = getNVIDIAStats();
  console.log(`\n📊 统计:`);
  console.log(`  组件: ${stats.totalComponents}`);
  console.log(`  技能: ${stats.totalSkills}`);
  console.log(`  签名: ${stats.signedSkills}`);

  // 4. 按组件列出
  console.log(`\n🏗️ 组件列表 (按技能数排序):`);
  for (const comp of components) {
    const sec = comp.avgSecurity > 0 ? ` [安全:${comp.avgSecurity}%]` : '';
    console.log(`  ${comp.name.padEnd(25)} ${String(comp.totalSkills).padStart(2)} skills${sec}`);
  }

  // 5. 8位家人
  console.log(`\n👤 8位家人:`);
  for (const [mid, data] of Object.entries(stats.byMember).sort(([,a], [,b]) => b.skillCount - a.skillCount)) {
    const names = data.names.join(', ');
  console.log(`  ${mid.padEnd(15)} ${String(data.count).padStart(3)} 技能 → ${names}`);
  }

  // 6. 搜索测试
  console.log(`\n🔍 搜索 "cuopt":`);
  const { components: c, skills: s } = search('cuopt');
  console.log(`  组件: ${c.map(x => x.name).join(', ')}`);
  console.log(`  技能: ${s.length}`);

  // 7. 按家人筛选
  console.log(`\n🎨 创想·灵韵 的组件:`);
  for (const comp of getComponentsByMember('creative')) {
    console.log(`  ${comp.name} (${comp.totalSkills} skills)`);
  }
}

main();
