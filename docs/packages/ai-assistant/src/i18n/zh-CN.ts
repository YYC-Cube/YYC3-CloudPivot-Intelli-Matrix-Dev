/**
 * @file i18n/zh-CN.ts
 * @description 简体中文语言包（默认）
 * @author YanYuCloudCube Team
 * @version v1.0.0
 */

export const zhCN = {
  brand: {
    name: "AI 智能助理",
    tooltip: "AI 智能助理 (⌘J)"
  },
  panel: {
    title: "AI 智能助理",
    modelLoading: "模型加载中...",
    noModel: "未选择模型",
    clearChat: "清空对话",
    restore: "还原",
    maximize: "最大化",
    close: "关闭"
  },
  tabs: {
    chat: "对话",
    commands: "命令",
    prompts: "提示词",
    settings: "配置"
  },
  chat: {
    inputPlaceholder: "输入指令... (Enter 发送, Shift+Enter 换行)",
    welcome:
      "你好！我是 CP-IM AI 智能助理。\n\n我可以帮你：\n- 📊 查看集群状态和性能报告\n- 🚀 部署和管理推理模型\n- 🔧 执行系统运维操作\n- 🔍 分析日志和诊断问题\n\n请输入指令或点击右侧快捷命令开始操作。",
    cleared: "对话已清空。请输入新的指令开始操作。",
    roleSwitched: "✅ 已切换系统角色为「{name}」"
  },
  prompts: {
    presetTitle: "系统提示词预设",
    customTitle: "自定义系统提示词",
    customPlaceholder: "输入自定义系统提示词...",
    charCount: "字数: {count} | 建议控制在 500 字以内以获得最佳效果"
  },
  settings: {
    apiKeyTitle: "OpenAI API 认证",
    show: "显示",
    hide: "隐藏",
    apiKeyConfigured: "✅ API Key 已配置",
    apiKeyMissing: "⚠️ 未配置 Key，将使用本地模拟模式",
    apiKeyStorageNote: "密钥仅保存在本地浏览器",
    modelTitle: "模型选择",
    ollamaDetecting: "正在检测 Ollama 本地模型...",
    local: "本地",
    testConnection: "测试连接",
    noModels: "暂无可用模型，请前往「模型设置」页面添加",
    temperature: "温度 (Temperature)",
    tempMin: "精确 0",
    tempMax: "创意 2.0",
    topP: "Top-P (核采样)",
    topPMin: "集中 0",
    topPMax: "多样 1.0",
    maxTokens: "最大 Token 数"
  },
  commands: {
    categories: {
      all: "全部",
      cluster: "集群",
      model: "模型",
      data: "数据",
      security: "安全",
      monitor: "监控"
    },
    items: {
      "cmd-01": {
        label: "集群状态总览",
        desc: "获取所有节点实时状态"
      },
      "cmd-02": {
        label: "重启异常节点",
        desc: "自动检测并重启异常节点"
      },
      "cmd-03": {
        label: "部署模型",
        desc: "将模型部署到指定节点"
      },
      "cmd-04": {
        label: "推理性能报告",
        desc: "生成推理性能分析报告"
      },
      "cmd-05": {
        label: "数据库健康检查",
        desc: "检查 PostgreSQL 连接状态"
      },
      "cmd-06": {
        label: "存储空间分析",
        desc: "分析存储使用和清理建议"
      },
      "cmd-07": {
        label: "安全审计扫描",
        desc: "扫描安全漏洞和异常访问"
      },
      "cmd-08": {
        label: "网络延迟诊断",
        desc: "诊断节点间网络延迟"
      },
      "cmd-09": {
        label: "一键优化配置",
        desc: "AI 自动优化系统配置"
      },
      "cmd-10": {
        label: "WebSocket 重连",
        desc: "重新建立数据推送连接"
      }
    }
  },
  promptsData: {
    "p1": { name: "运维诊断专家", category: "运维" },
    "p2": { name: "模型调优顾问", category: "模型" },
    "p3": { name: "数据分析师", category: "数据" },
    "p4": { name: "安全审计员", category: "安全" },
    "p5": { name: "智能运维助手", category: "通用" }
  }
};

export type TranslationKeys = typeof zhCN;
