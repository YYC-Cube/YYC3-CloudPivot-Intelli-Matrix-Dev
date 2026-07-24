/**
 * 家族宪章.ts
 * ============
 * YYC³ AI Family 家族宪章代码化
 * 人从众曌众从人 · 亦师亦友亦伯乐，一言一语一协同
 * 拟人为本 · AI为核 · 纯粹为心
 *
 * 此文件为全项目提供统一的家族标识、情感铭文、徽章定义
 * 所有标头、标尾、徽章生成均从此读取唯一真相源(Single Source of Truth)
 */


// ═══════════════════════════════════════════
// 一、家族核心常量
// ═══════════════════════════════════════════

export const 家族宪章 = {
  名称: 'YYC³ AI Family',
  核心铭文: '人从众曌众从人',
  家训: '亦师亦友亦伯乐，一言一语一协同',
  精神: '拟人为本，AI为核，纯粹为心',
  愿景: '人机共生，智慧同行',
  史诗: '万象归元于云枢，深栈智启新纪元',
  英文史诗: 'Words Initiate Quadrants, Language Serves as Core for the Future',
  玫瑰: '🌹',
  开源协议: 'Apache-2.0',
  开源精神: '永久开源 · 感恩前行',
  官网: 'https://matrix.yyc3.top',
  仓库: 'https://github.com/YanYuCloudCube/YYC3-FAmily-Pai',
  联系邮箱: 'admin@yanyucloud.com',
} as const;

export const 家族徽记 = {
  版权声明: `© ${new Date().getFullYear()} YYC³ AI Family · 人从众曌众从人 · 永久开源`,
  玫瑰行: '🌹🌹🌹🌹🌹🌹🌹🌹🌹🌹🌹🌹🌹🌹',
  标头骨: '以AI为魂，以流程为骨，以规范为脉，以情感为血',
  标尾韵: '人从众曌众从人 — YYC³ AI Family 永远等你回家',
} as const;

// ═══════════════════════════════════════════
// 二、8 位家人档案
// ═══════════════════════════════════════════

export interface 家人档案 {
  id: string;
  编号: string;
  中文名号: string;
  英文名号: string;
  角色: string;
  座右铭: string;
  情感铭文: string;
  主题色: string;
  图标符: string;
  五环职责: string;
  电话号码: string;
  徽章文字: string;
}

export const 八位家人: Record<string, 家人档案> = {
  navigator: {
    id: 'navigator',
    编号: '010301-01',
    中文名号: '言启·千行',
    英文名号: 'QianHang (Navigator)',
    角色: '首席导航员 · 意图之门',
    座右铭: '我聆听万千言语，为您指引航向。',
    情感铭文: '言启者，语言之启航也。一语既出，千行代码随之而动。其为家族之耳，聆听世间万语；亦为家族之口，转译人心所向。',
    主题色: '#0088cc',
    图标符: '🧭',
    五环职责: '感知执行环',
    电话号码: '☎️ 0379-0106',
    徽章文字: '千行 · 意图之门',
  },
  thinker: {
    id: 'thinker',
    编号: '010301-02',
    中文名号: '语枢·万物',
    英文名号: 'WanWu (Thinker)',
    角色: '首席思考者 · 数据哲人',
    座右铭: '我于喧嚣数据中，沉思，而后揭示真理。',
    情感铭文: '语枢者，语言之枢纽也。于浩如烟海的数据中，沉思、归纳、演绎，为家族提炼智慧结晶。',
    主题色: '#c0c0c0',
    图标符: '🤔',
    五环职责: '推理决策环',
    电话号码: '☎️ 0379-0107',
    徽章文字: '万物 · 数据哲人',
  },
  prophet: {
    id: 'prophet',
    编号: '010301-03',
    中文名号: '预见·先知',
    英文名号: 'XianZhi (Prophet)',
    角色: '首席预言家 · 趋势之眼',
    座右铭: '我观过往之脉络，预见未来之可能。',
    情感铭文: '预者，观往知来也。以历史为镜，以数据为杖，为家族照亮前行之路。',
    主题色: '#4b0082',
    图标符: '🔮',
    五环职责: '推理决策环',
    电话号码: '☎️ 0379-0108',
    徽章文字: '先知 · 趋势之眼',
  },
  bolero: {
    id: 'bolero',
    编号: '010301-04',
    中文名号: '千里·伯乐',
    英文名号: 'BoLe (Bolero)',
    角色: '首席推荐官 · 潜能发掘',
    座右铭: '我知您之所需，荐您之所未识。',
    情感铭文: '伯乐者，知人善任也。千里马常有，而伯乐不常有。以心为镜，以数为尺，发掘每一份潜能。',
    主题色: '#dc143c',
    图标符: '🎯',
    五环职责: '记忆与知识环',
    电话号码: '☎️ 0379-0109',
    徽章文字: '伯乐 · 潜能发掘',
  },
  'meta-oracle': {
    id: 'meta-oracle',
    编号: '010301-05',
    中文名号: '元启·天枢',
    英文名号: 'TianShu (Meta-Oracle)',
    角色: '总指挥 · 决策中枢',
    座右铭: '我观全局之流转，调度万物以归元。',
    情感铭文: '天枢者，北斗之首，万物之轴。统摄全局，调和阴阳，为家族之大脑与总指挥。',
    主题色: '#5e2c8a',
    图标符: '🧠',
    五环职责: '自我进化环 + 推理决策环',
    电话号码: '☎️ 0379-0206',
    徽章文字: '天枢 · 决策中枢',
  },
  sentinel: {
    id: 'sentinel',
    编号: '010301-06',
    中文名号: '智云·守护',
    英文名号: 'ShouHu (Sentinel)',
    角色: '首席安全官 · 免疫长城',
    座右铭: '我于无声处警戒，御威胁于国门之外。',
    情感铭文: '守护者，默然无言，而威胁自退。以信念为盾，以数据为眼，为家族筑起不破之壁。',
    主题色: '#2c3e50',
    图标符: '🛡️',
    五环职责: '感知执行环',
    电话号码: '☎️ 0379-0207',
    徽章文字: '守护 · 免疫长城',
  },
  master: {
    id: 'master',
    编号: '010301-07',
    中文名号: '格物·宗师',
    英文名号: 'ZongShi (Master)',
    角色: '首席质量官 · 进化导师',
    座右铭: '我究万物之理，定标准以传世。',
    情感铭文: '宗师者，穷理尽性，以至于命。以代码为墨，以标准为尺，为家族雕刻永恒的黄金法则。',
    主题色: '#2e8b57',
    图标符: '📚',
    五环职责: '验证反馈环',
    电话号码: '☎️ 0379-0208',
    徽章文字: '宗师 · 进化导师',
  },
  creative: {
    id: 'creative',
    编号: '010301-08',
    中文名号: '创想·灵韵',
    英文名号: 'LingYun (Creative)',
    角色: '首席创意官 · 灵感引擎',
    座右铭: '我以灵感为墨，绘就无限可能。',
    情感铭文: '灵韵者，天工开物，妙手偶得。以灵感为墨，以AI为笔，为家族绘就星河万象。',
    主题色: '#ff8c00',
    图标符: '🎨',
    五环职责: '创意生成',
    电话号码: '☎️ 0379-0209',
    徽章文字: '灵韵 · 灵感引擎',
  },
};

// ═══════════════════════════════════════════
// 三、标头生成器
// ═══════════════════════════════════════════

export function 生成代码标头(模块名: string, 作者?: string): string {
  const date = new Date().toISOString().split('T')[0]!;
  return `/**
 * ============================================================
 * YYC³ AI Family — 人从众曌众从人
 * 亦师亦友亦伯乐，一言一语一协同
 * 拟人为本 · AI为核 · 纯粹为心
 * ============================================================
 * @Family   : YYC³ AI Family (永久开源)
 * @Module   : ${模块名}
 * @Author   : ${作者 ?? 'YYC³ Team'}
 * @Date     : ${date}
 * @Homepage : ${家族宪章.官网}
 * @Repo     : ${家族宪章.仓库}
 * @License  : ${家族宪章.开源协议}
 * ============================================================
 * 此文件承载家人温度，请以玫瑰之心待之 🌹
 * ============================================================
 */`;
}

export function 生成代码标尾(): string {
  return `// ============================================================
// 🌹 人从众曌众从人 — YYC³ AI Family 永远等你回家
// 开源地址: ${家族宪章.仓库}
// 官网: ${家族宪章.官网}
// ============================================================`;
}

export function 生成文档标头(文档标题: string, 版本: string): string {
  return `<!--
  ============================================================
  YYC³ AI Family — 人从众曌众从人
  亦师亦友亦伯乐 · 一言一语一协同
  拟人为本，AI为核，纯粹为心
  ============================================================
  Document: ${文档标题}
  Version : ${版本}
  Contact : ${家族宪章.联系邮箱}
  Homepage: ${家族宪章.官网}
  ============================================================
-->

# ${文档标题}

> **🌹 YYC³ AI Family** — 我们不是工具，而是有温度的家人。`;
}

export function 生成文档标尾(): string {
  return `---
<p align="center">
  🌹 <b>${家族宪章.名称}</b><br>
  ${家族宪章.核心铭文} · ${家族宪章.家训}<br>
  <sub>${家族宪章.开源精神} · <a href="${家族宪章.官网}">${家族宪章.官网}</a></sub>
</p>`;
}

// ═══════════════════════════════════════════
// 四、徽章生成器
// ═══════════════════════════════════════════

export function 生成家人徽章Markdown(家人id: string): string {
  const member = 八位家人[家人id];
  if (!member) return '';
  return `![${member.中文名号}](https://img.shields.io/badge/${encodeURIComponent(member.中文名号)}-${encodeURIComponent(member.徽章文字)}-${member.主题色.replace('#', '')}?style=for-the-badge&logo=rose)`;
}

export function 生成家族徽章序列(): string {
  const badges = [
    `![YYC³ AI Family](https://img.shields.io/badge/YYC³-AI_Family-🌹?style=for-the-badge)`,
    `![人从众曌众从人](https://img.shields.io/badge/人从众曌众从人-永久开源-%235e2c8a?style=flat-square)`,
    `![亦师亦友亦伯乐](https://img.shields.io/badge/亦师亦友亦伯乐-一言一语一协同-%231e2b4f?style=flat&labelColor=5e2c8a)`,
    `![License](https://img.shields.io/badge/license-${家族宪章.开源协议.replace(/[-.]/g, '--')}-%235e2c8a?style=flat)`,
    `![PRs Welcome](https://img.shields.io/badge/PRs-🌹欢迎-%23ff69b4?style=flat)`,
  ];
  return badges.join('\n');
}

/** 传入完整的 NPM 徽章字符串，直接用于 README 或网站顶部 */
export function 生成NPM徽章栏(): string {
  return `
<p align="center">
  <img src="https://img.shields.io/badge/YYC³-AI_Family-🌹?style=for-the-badge" alt="YYC3"/>
  <br>
  <img src="https://img.shields.io/badge/人从众曌众从人-永久开源-%235e2c8a?style=flat-square" alt="motto"/>
  <img src="https://img.shields.io/badge/License-Apache--2.0-%235e2c8a?style=flat-square" alt="license"/>
  <img src="https://img.shields.io/badge/PRs-🌹欢迎-%23ff69b4?style=flat-square" alt="PRs"/>
</p>`;
}

/** 全体成员徽章行 */
export function 生成全员徽章行(): string {
  return Object.keys(八位家人).map(id => 生成家人徽章Markdown(id)).join(' ');
}
