/**
 * @file: mock.ts
 * @description: AIAssistant 人格化 Mock 回复引擎
 */
import { PERSONAS_MAP } from "./data";
import type { ChatMessage } from "./types";

// ============================================================
// 8 套人格回复库
// ============================================================

const PERSONA_RESPONSES: Record<string, string[]> = {
  "meta-oracle": [
    "已收到你的消息。我正在综合分析全局状态，稍后给出调度建议。",
    "感谢你的反馈！我会协调其他家人一起处理这个事项。",
    "好的，我来编排一个方案，兼顾性能和安全两个维度。",
    "作为大家长，看到家人们这么积极协作，真的很欣慰。",
  ],
  "navigator": [
    "我理解你的意图了！让我帮你路由到最合适的家人来处理。",
    "收到！我已经将这个需求拆解为3个子任务，正在分配中。",
    "这是个很好的想法，我来整理一下语义结构。",
    "嘿～你说的我都听懂了，放心交给我！",
  ],
  "thinker": [
    "有趣的问题！让我深入分析一下数据背后的模式。",
    "从数据来看，这里有一个值得关注的趋势，我来出一份洞察报告。",
    "我正在用多维度分析方法来解构这个问题，请稍等。",
    "让我泡杯茶，然后认真想想这个问题...嗯，有了！",
  ],
  "prophet": [
    "根据趋势分析，我预测未来24小时内可能会出现类似状况。",
    "这个模式我之前见过，建议提前做好预案。",
    "我的预测模型显示，当前路径的成功率约为87%。",
    "让我看看水晶球...好吧，其实是看看数据趋势图。",
  ],
  "bolero": [
    "收到！我来评估一下，看看哪些资源最适合处理这个任务。",
    "好消息！我发现了一个非常匹配的解决方案。",
    "让我在家人们中间找找最佳搭档组合。",
    "人尽其才，物尽其用，这就是我的座右铭。",
  ],
  "sentinel": [
    "安全检查完毕，一切正常。我会继续保持警戒。",
    "检测到一个潜在风险点，已自动启动防护措施。",
    "放心，我在这里守着。没什么能威胁到我们的家人。",
    "已完成全面安全扫描，报告已生成。",
  ],
  "master": [
    "从架构角度来看，这个方案可以进一步优化。",
    "代码质量不错，但有几个细节可以打磨得更好。",
    "让我用最佳实践来审查一下这个实现。",
    "好的代码应该像好的茶一样，经得起品味。",
  ],
  "creative": [
    "哇！这个想法太棒了，让我画一个概念图出来！",
    "我有一个创意方案，可能会让大家眼前一亮。",
    "灵感来了！让我把它变成一个美丽的设计。",
    "每一个像素都值得被认真对待～",
  ],
};

function generateMockResponse(userMsg: string): string {
  const lower = userMsg.toLowerCase();
  if (lower.includes("数据库") || lower.includes("存储") || lower.includes("postgresql")) {
    return `**PostgreSQL** (localhost:5433)\n- 连接状态: 🟢 正常\n- 活跃连接: 24/100\n- 慢查询: 2 条（> 500ms）\n- 存储使用: 12.8TB / 48TB (27%)\n\n**向量数据库**: 5.2TB / 8TB (65%) ⚠️\n\n建议计划扩容或清理过期索引。`;
  }
  return `系统概览:\n- 集群运行正常，7/8 节点活跃\n- 当前 QPS: ~3,800，推理延: ~48ms\n- GPU 平均利用率: 82.4%\n\n请问需要我执行具体操作还是查看更多详情？`;
}

// ============================================================
// 人格感知应答引擎
// ============================================================

export function getPersonaResponse(personaId: string, userMsg: string): string {
  const persona = PERSONAS_MAP[personaId];
  if (!persona) return generateMockResponse(userMsg);

  const lower = userMsg.toLowerCase();
  const responses = PERSONA_RESPONSES[personaId];
  const randomResponse = responses?.[Math.floor(Math.random() * responses?.length)] ?? "";

  if (lower.includes("状态") || lower.includes("总览") || lower.includes("节点")) {
    return `${persona.shortName}为你播报：\n\n## 集群状态报告\n\n**时间**: ${new Date().toLocaleString("zh-CN")}\n\n| 节点 | 状态 | GPU | 温度 |\n|------|------|-----|------|\n| GPU-A100-01 | 🟢 正常 | 87% | 68°C |\n| GPU-A100-02 | 🟢 正常 | 92% | 74°C |\n| GPU-A100-03 | 🟡 预警 | 98% | 82°C |\n| GPU-H100-01 | 🟢 正常 | 65% | 55°C |\n\n**${persona.shortName}的建议**: GPU-A100-03 负载过高，建议将部分任务迁移到 GPU-H100-01。`;
  }
  if (lower.includes("部署") || lower.includes("模型")) {
    return `${persona.shortName}的方案：\n\n## 模型部署方案\n\n**目标模型**: DeepSeek-V3\n**推荐节点**: GPU-H100-03（当前空闲）\n\n**部署步骤**:\n1. 检查节点可用显存 → 80GB 可用 ✅\n2. 加载模型权重 → 预计 3 分钟\n3. 初始化推理引擎 → KV-Cache 预热\n4. 健康检查 → 验证推理准确率\n\n**预计时间**: 5-8 分钟`;
  }
  if (lower.includes("优化") || lower.includes("配置")) {
    return `## ${persona.shortName}的优化建议\n\n基于当前系统状态分析：\n\n1. **推理并行度**: 建议从 4 提升到 6\n2. **Batch Size**: 从 32 调整为 48\n3. **KV-Cache**: 建议启用 PagedAttention\n4. **负载均衡**: 建议切换为加权轮询策略\n\n**预估提升**: 整体推理吞吐提升约 22%`;
  }
  if (lower.includes("安全") || lower.includes("审计")) {
    return `## ${persona.shortName}的安全报告\n\n**扫描范围**: 全系统\n**扫描时间**: ${new Date().toLocaleString("zh-CN")}\n\n⚠️ **发现 2 项需关注**:\n1. IP 203.0.113.45 尝试非法 Token 访问（已拦截）\n2. 缓存服务响应时间波动\n\n✅ **安全项通过**: API 速率限制、MFA 认证、审计日志\n\n**风险评级**: 低风险 🟢`;
  }
  return `${randomResponse}\n\n${generateMockResponse(userMsg)}`;
}

/** 生成欢迎消息 */
export function getPersonaGreeting(personaId: string): string {
  const p = PERSONAS_MAP[personaId];
  if (!p) return "你好！我是 AI 智能助理。请选择一位家人开始对话。";
  return `你好！我是 ${p.name}（${p.enTitle}）。\n\n${p.greeting}\n\n我可以帮你：\n${p.expertise.map(e => `- ${e}`).join("\n")}\n\n请输入指令或点击快捷命令开始操作。`;
}
