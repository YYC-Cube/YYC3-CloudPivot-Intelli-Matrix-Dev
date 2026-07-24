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
 * @file nvidia-catalog.ts
 * @description NVIDIA Skills 静态目录（198 条）
 *              当 docs/skills/ SDK 未安装时，作为 fallback 数据源
 *              数据来源: docs/NVIDIA-Skills.md (32 分类 / 202 条目)
 *              install command: npx skills add NVIDIA/skills --skill <id>
 */

// ═══ 类型 ═══

export interface CatalogSkill {
  id: string;
  name: string;
  description: string;
  installCmd: string;
}

export interface CatalogComponent {
  id: string;
  name: string;
  description: string;
  member: string;
  skills: CatalogSkill[];
}

// ═══ 辅助 ═══

function sk(id: string, name: string, desc: string): CatalogSkill {
  return { id, name, description: desc, installCmd: `npx skills add NVIDIA/skills --skill ${id}` };
}

// ═══ 32 组件 × 198 技能 ═══

export const NVIDIA_CATALOG: CatalogComponent[] = [

  // ── tianshu · 元启·天枢 ──────────────────────────────

  {
    id: 'rag-blueprint', name: 'RAG Blueprint', member: 'tianshu',
    description: 'RAG 检索增强生成 — 部署、配置、排查和管理',
    skills: [
      sk('rag-blueprint', '蓝图', '部署、安装、启动、配置、排查 RAG 功能或服务'),
      sk('aiq-deploy', 'AIQ-部署', '安装、部署、运行、验证 AIQ Blueprint 基础设施'),
      sk('rag-perf', '性能基准', 'RAG Blueprint 服务器性能基准测试'),
      sk('rag-eval', 'RAG 评估', '基于 RAGAS 的 RAG 质量评估'),
    ],
  },
  {
    id: 'nemoclaw', name: 'NemoClaw', member: 'tianshu',
    description: '沙箱安全生态 — 安全策略、沙箱管理、推理配置',
    skills: [
      sk('nemoclaw-user-configure-security', '安全配置', '可配置安全控制的风险框架'),
      sk('nemoclaw-user-manage-policy', '策略管理', '管理沙箱策略中允许的端点'),
      sk('nemoclaw-user-manage-sandboxes', '沙箱管理', '列出沙箱、状态检查、日志、诊断'),
      sk('nemoclaw-user-deploy-remote', '远程部署', '在远程 GPU 实例上运行 NemoClaw'),
      sk('nemoclaw-user-monitor-sandbox', '沙箱监控', '检查沙箱健康状况，追踪代理行为'),
      sk('nemoclaw-user-reference', '参考', 'NemoClaw 插件和蓝图架构'),
      sk('nemoclaw-user-configure-inference', '推理配置', '连接 NemoClaw 到本地推理服务器'),
      sk('nemoclaw-user-agent-skills', 'Agent 技能', 'NemoClaw 附带的智能体技能'),
      sk('nemoclaw-user-get-started', '快速入门', '安装 NemoClaw，运行首个示例'),
      sk('nemoclaw-user-overview', '概览', 'OpenClaw/OpenShell/NemoClaw 生态系统'),
    ],
  },
  {
    id: 'cuopt', name: 'cuOpt', member: 'tianshu',
    description: '数学优化 — LP/MILP/QP 求解、路径规划',
    skills: [
      sk('cuopt-numerical-optimization-api-cli', 'CLI 优化', '从 MPS 文件求解 LP/MILP/QP'),
      sk('cuopt-routing-api-python', '路径规划 Python', '基于 cuOpt 的 VRP/TSP/PDP Python API'),
      sk('cuopt-install', '安装', '安装 cuOpt 并验证'),
      sk('cuopt-user-rules', '用户规则', '调用 cuOpt 的基本规则'),
      sk('cuopt-numerical-optimization-api-c', 'C API 优化', 'cuOpt LP/MILP/QP C 语言 API'),
      sk('cuopt-server-api-python', '服务器 Python', 'cuOPT REST 服务器 Python 客户端'),
      sk('cuopt-server-common', '服务器通用', 'cuOPT REST 服务器功能与请求流转'),
      sk('cuopt-numerical-optimization-formulation', '建模公式', 'LP/MILP/QP 概念与建模范式'),
      sk('cuopt-routing-formulation', '路径规划公式', 'VRP/TSP/PDP 问题类型与数据需求'),
      sk('cuopt-numerical-optimization-api-python', 'Python API 优化', 'cuOpt Python API 求解 LP/MILP/QP'),
      sk('cuopt-developer', '开发者', '从源代码构建 cuOpt'),
      sk('cuopt-skill-evolution', '技能演进', 'cuOpt 技能版本管理与演进'),
    ],
  },
  {
    id: 'cufolio', name: 'cuFOLIO', member: 'tianshu',
    description: '投资组合优化',
    skills: [
      sk('cufolio', '投资组合', '投资组合构建与风险管理'),
    ],
  },
  {
    id: 'hsb', name: 'HSB Platform', member: 'tianshu',
    description: 'HSB 平台 — 安装与应用管理',
    skills: [
      sk('hsb-setup', '安装', 'HSB 平台安装配置'),
      sk('hsb-app', '应用', 'HSB 应用管理'),
      sk('hsb-flash', '刷写', 'HSB 设备刷写'),
      sk('hsb-test', '测试', 'HSB 测试工具'),
    ],
  },
  {
    id: 'aiq', name: 'AI-Q', member: 'tianshu',
    description: 'AI-Q 基础设施',
    skills: [
      sk('aiq-deploy', 'AIQ-部署', 'AIQ Blueprint 安装部署'),
      sk('aiq-research', 'AIQ 研究', 'AIQ 研究工作流'),
    ],
  },

  // ── thinker · 语枢·万物 ──────────────────────────────

  {
    id: 'nemo-mbridge', name: 'NeMo MBridge', member: 'thinker',
    description: 'Megatron-Bridge 分布式训练 — 性能调优 20 条',
    skills: [
      sk('nemo-mbridge-multi-node-slurm', '多节点 Slurm', '单节点转多节点 Slurm sbatch 作业'),
      sk('nemo-mbridge-resiliency', '弹性', '容错、落后检测、进程中重启'),
      sk('nemo-mbridge-perf-hierarchical-context-parallel', '分层上下文并行', '分层上下文并行配置'),
      sk('nemo-mbridge-perf-moe-dispatcher-selection', 'MoE 分发器', 'MoE 令牌分发器选择'),
      sk('nemo-mbridge-perf-activation-recompute', '激活重计算', '选择性激活重计算降低内存'),
      sk('nemo-mbridge-perf-cpu-offloading', 'CPU 卸载', '激活卸载和优化器状态卸载'),
      sk('nemo-mbridge-perf-cuda-graphs', 'CUDA 图', 'CUDA 图捕获功能'),
      sk('nemo-mbridge-perf-memory-tuning', '内存调优', '降低 GPU 峰值内存技术'),
      sk('nemo-mbridge-perf-moe-long-context', 'MoE 长上下文', '长上下文 MoE 训练'),
      sk('nemo-mbridge-perf-expert-parallel-overlap', '专家并行重叠', 'MoE 专家并行通信重叠'),
      sk('nemo-mbridge-perf-megatron-fsdp', 'Megatron FSDP', 'Megatron FSDP 配置'),
      sk('nemo-mbridge-perf-moe-comm-overlap', 'MoE 通信重叠', 'MoE 调度/合并重叠'),
      sk('nemo-mbridge-perf-moe-optimization-workflow', 'MoE 优化工作流', 'MoE 训练优化系统化工作流'),
      sk('nemo-mbridge-perf-parallelism-strategies', '并行策略', '并行策略组合与操作'),
      sk('nemo-mbridge-mlm-bridge-training', 'MLM 训练', 'Megatron-LM 和 Bridge 训练'),
      sk('nemo-mbridge-perf-moe-hardware-configs', 'MoE 硬件配置', '按平台/模型 MoE 训练脚本'),
      sk('nemo-mbridge-perf-moe-vlm-training', 'MoE VLM 训练', '视觉语言模型 MoE 训练'),
      sk('nemo-mbridge-recipe-recommender', '配方推荐', '推荐定制 Megatron Bridge 方案'),
      sk('nemo-mbridge-perf-sequence-packing', '序列打包', '序列打包与长上下文训练'),
      sk('nemo-mbridge-perf-tp-dp-comm-overlap', 'TP/DP/PP 重叠', '张量/数据/流水线并行通信重叠'),
    ],
  },
  {
    id: 'nemo-automodel', name: 'NeMo AutoModel', member: 'thinker',
    description: '训练自动化',
    skills: [
      sk('nemo-automodel-launcher-config', '启动器配置', 'NeMo AutoModel 作业启动配置'),
      sk('nemo-automodel-distributed-training', '分布式训练', '分布式训练策略选择与配置'),
      sk('nemo-automodel-model-onboarding', '模型接入', '新模型架构接入 AutoModel'),
      sk('nemo-automodel-recipe-development', '配方开发', '创建训练与评估方案'),
    ],
  },
  {
    id: 'nemo-rl', name: 'NeMo-RL', member: 'thinker',
    description: '强化学习',
    skills: [
      sk('launch-nemo-rl', '启动 NeMo-RL', 'K8s 集群启动 NeMo-RL'),
      sk('nemo-rl-auto-research', '自主研究', '自主 NeMo-RL 研究代理工作流'),
      sk('nemo-rl-session-memory', '会话内存', '跨上下文会话状态管理'),
      sk('nemo-rl-docs', '文档', 'NeMo-RL 文档约定'),
      sk('nemo-rl-brev-etiquette', 'Brev 规范', 'Brev 实例操作指南'),
    ],
  },
  {
    id: 'nemotron', name: 'Nemotron', member: 'thinker',
    description: '语音与定制 — 模型定制化、策略生成',
    skills: [
      sk('nemotron-customize', '定制化', 'Nemotron 定制化流程（SFT/PEFT/DPO）'),
      sk('nemotron-retrieval-recipes', '检索配方', 'Nemotron embed/rerank 检索配方'),
      sk('nemotron-policy-generator', '策略生成', 'Nemotron 策略生成'),
    ],
  },
  {
    id: 'megatron-core', name: 'Megatron Core', member: 'thinker',
    description: '框架工具 — 代码检查、测试、CI',
    skills: [
      sk('mcore-create-issue', '创建 Issue', '为失败的 CI 运行创建 GitHub Issue'),
      sk('mcore-linting-and-formatting', '代码检查', 'Megatron-LM 代码检查与格式化'),
      sk('mcore-run-on-slurm', 'Slurm 运行', 'SLURM 集群分布式训练'),
      sk('mcore-split-pr', '拆分 PR', '拆分拉取请求'),
      sk('mcore-testing', '测试', 'Megatron-LM 测试系统'),
    ],
  },
  {
    id: 'cupynumeric', name: 'cuPyNumeric', member: 'thinker',
    description: '科学计算 — 分布式 NumPy',
    skills: [
      sk('cupynumeric-migration-readiness', '迁移评估', 'NumPy 到 cuPyNumeric 迁移评估'),
      sk('cupynumeric-parallel-data-load', '并行数据加载', '并行数据加载策略'),
    ],
  },
  {
    id: 'cudf', name: 'cuDF', member: 'thinker',
    description: '数据处理 — GPU 数据帧',
    skills: [
      sk('accelerated-computing-cudf', '加速计算', 'cuDF GPU 加速数据处理'),
    ],
  },
  {
    id: 'data-designer', name: 'Data Designer', member: 'thinker',
    description: '数据设计与处理',
    skills: [
      sk('dali-dynamic-mode', 'DALI 动态模式', 'DALI 数据加载动态模式'),
      sk('data-designer', '数据设计器', '数据设计与生成'),
      sk('nemo-data-designer-plugin', '数据设计器插件', 'NeMo 数据设计器插件'),
      sk('nemo-evaluator-plugin', '评估器插件', 'NeMo 评估器插件'),
    ],
  },

  // ── qianhang · 言启·千行 ──────────────────────────────

  {
    id: 'nemotron-speech', name: 'Nemotron Speech', member: 'qianhang',
    description: '语音 — ASR/TTS/NMT NIM 任务',
    skills: [
      sk('nemotron-speech', 'Nemotron 语音', '部署、运行 ASR/TTS/NMT NIM'),
    ],
  },
  {
    id: 'nemo-retriever', name: 'NeMo Retriever', member: 'qianhang',
    description: '检索增强 — 嵌入与重排序',
    skills: [
      sk('nemo-retriever', 'NeMo 检索', 'NeMo Retriever 嵌入与重排序模型'),
    ],
  },

  // ── bole · 千里·伯乐（推荐/匹配）──────────────────────

  {
    id: 'bole-recommendation', name: 'NVIDIA Recommendation Bridge', member: 'bole',
    description: '推荐引擎 — 基于 NVIDIA 嵌入模型的用户-物品匹配',
    skills: [
      sk('nemotron-retrieval-recipes', '检索配方', 'Nemotron embed/rerank 配方，用于推荐场景中的用户-物品嵌入匹配'),
      sk('nemo-retriever-embedding', '嵌入模型', 'NeMo Retriever 嵌入模型，生成用户画像和物品特征向量'),
      sk('merlin-recsys', 'Merlin 推荐系统', 'NVIDIA Merlin 端到端推荐系统管道'),
    ],
  },

  // ── grace · 创想·灵韵 ──────────────────────────────

  {
    id: 'tao', name: 'TAO Toolkit', member: 'grace',
    description: '视觉 AI 训练平台 — 48 条全量覆盖',
    skills: [
      sk('tao-analyze-changenet-rca', '变更分析', 'Visual ChangeNet RCA 分析'),
      sk('tao-analyze-gaps-visual-changenet', '差距分析', 'Visual ChangeNet 差距分析'),
      sk('tao-analyze-gaps-vlm-bcq', 'VLM 差距分析', 'VLM BCQ 差距分析'),
      sk('tao-convert-dataset-format', '数据集转换', '数据集格式转换'),
      sk('tao-finetune-clip', '微调 CLIP', 'CLIP 模型微调'),
      sk('tao-finetune-cosmos-embed', '微调 Cosmos Embed', 'Cosmos Embed 模型微调'),
      sk('tao-finetune-cosmos-reason', '微调 Cosmos Reason', 'Cosmos Reason 模型微调'),
      sk('tao-finetune-huggingface-model', '微调 HF 模型', 'HuggingFace 模型微调'),
      sk('tao-generate-image-grounding', '图像定位标注', '图像定位数据生成'),
      sk('tao-generate-referring-expressions', '指代表达式', '指代表达式生成'),
      sk('tao-generate-video-reasoning-annotations', '视频推理标注', '视频推理标注生成'),
      sk('tao-launch-workflow', '启动工作流', 'TAO 工作流启动'),
      sk('tao-list-capabilities', '能力列表', 'TAO 能力列表'),
      sk('tao-mine-aoi-images', 'AOI 图像挖掘', 'AOI 图像数据挖掘'),
      sk('tao-port-huggingface-model', '迁移 HF 模型', 'HuggingFace 模型迁移到 TAO'),
      sk('tao-route-visual-changenet-samples', '路由变更样本', 'Visual ChangeNet 样本路由'),
      sk('tao-run-automl', 'AutoML', 'TAO AutoML 运行'),
      sk('tao-run-automl-deft-pipeline', 'AutoML DEFT', 'AutoML DEFT 管道'),
      sk('tao-run-deft-aoi', 'DEFT AOI', 'DEFT AOI 运行'),
      sk('tao-run-inference-service', '推理服务', 'TAO 推理服务运行'),
      sk('tao-run-on-brev', 'Brev 运行', 'Brev 上运行 TAO'),
      sk('tao-run-on-kubernetes', 'K8s 运行', 'Kubernetes 上运行 TAO'),
      sk('tao-run-on-lepton', 'Lepton 运行', 'Lepton 上运行 TAO'),
      sk('tao-run-on-local-docker', 'Docker 运行', '本地 Docker 运行 TAO'),
      sk('tao-run-on-slurm', 'Slurm 运行', 'Slurm 上运行 TAO'),
      sk('tao-run-platform', '平台运行', 'TAO 平台运行'),
      sk('tao-setup-nvidia-gpu-host', 'GPU 主机设置', 'NVIDIA GPU 主机设置'),
      sk('tao-train-action-recognition', '动作识别', '动作识别模型训练'),
      sk('tao-train-bevfusion', 'BEVFusion', 'BEVFusion 训练'),
      sk('tao-train-centerpose', 'CenterPose', 'CenterPose 训练'),
      sk('tao-train-deformable-detr', 'Deformable DETR', 'Deformable DETR 训练'),
      sk('tao-train-depth-anything-v2', 'Depth Anything V2', 'Depth Anything V2 训练'),
      sk('tao-train-dino', 'DINO', 'DINO 训练'),
      sk('tao-train-fast-foundation-stereo', '快速基础立体', '快速基础立体模型训练'),
      sk('tao-train-foundation-stereo', '基础立体', '基础立体模型训练'),
      sk('tao-train-grounding-dino', 'Grounding DINO', 'Grounding DINO 训练'),
      sk('tao-train-image-classification', '图像分类', '图像分类模型训练'),
      sk('tao-train-mask-auto-encoder', 'Mask Auto Encoder', '掩码自编码器训练'),
      sk('tao-train-mask-auto-label', 'Mask Auto Label', '掩码自动标注训练'),
      sk('tao-train-mask-grounding-dino', 'Mask Grounding DINO', '掩码 Grounding DINO 训练'),
      sk('tao-train-mask2former', 'Mask2Former', 'Mask2Former 训练'),
      sk('tao-train-metric-learning-recognition', '度量学习', '度量学习识别训练'),
      sk('tao-train-nvdinov2', 'NVDINOv2', 'NVDINOv2 训练'),
      sk('tao-train-nvpanoptix3d', 'NVPanoptix3D', 'NVPanoptix3D 训练'),
      sk('tao-train-ocdnet', 'OCDNet', 'OCDNet 训练'),
      sk('tao-train-ocrnet', 'OCRNet', 'OCRNet 训练'),
      sk('tao-train-oneformer', 'OneFormer', 'OneFormer 训练'),
      sk('tao-train-optical-inspection', '光学检测', '光学检测模型训练'),
      sk('tao-train-pointpillars', 'PointPillars', 'PointPillars 训练'),
      sk('tao-train-pose-classification', '姿态分类', '姿态分类模型训练'),
      sk('tao-train-reid', 'ReID', '行人重识别训练'),
      sk('tao-train-rtdetr', 'RTDETR', 'RTDETR 训练'),
      sk('tao-train-segformer', 'SegFormer', 'SegFormer 训练'),
      sk('tao-train-single-step', '单步检测', '单步检测模型训练'),
      sk('tao-train-sparse4d', 'Sparse4D', 'Sparse4D 训练'),
      sk('tao-train-visual-changenet', 'Visual ChangeNet', 'Visual ChangeNet 训练'),
      sk('tao-validate-dataset-format', '数据集验证', '数据集格式验证'),
    ],
  },
  {
    id: 'vss', name: 'Video Search and Summarization', member: 'grace',
    description: '视频安全监控 — 14 条',
    skills: [
      sk('vss-ask-video', '视频问答', '视频内容问答'),
      sk('vss-deploy-dense-captioning', '密集描述', '视频密集描述部署'),
      sk('vss-deploy-detection-tracking-2d', '2D 检测追踪', '2D 检测与追踪部署'),
      sk('vss-deploy-detection-tracking-3d', '3D 检测追踪', '3D 检测与追踪部署'),
      sk('vss-deploy-profile', '部署配置', 'VSS 部署配置'),
      sk('vss-deploy-video-embedding', '视频嵌入', '视频嵌入部署'),
      sk('vss-generate-video-calibration', '视频标定', '视频标定生成'),
      sk('vss-generate-video-report', '视频报告', '视频分析报告生成'),
      sk('vss-manage-alerts', '告警管理', 'VSS 告警管理'),
      sk('vss-manage-video-io-storage', 'IO 存储', '视频 IO 存储管理'),
      sk('vss-query-analytics', '分析查询', 'VSS 分析查询'),
      sk('vss-search-archive', '归档搜索', '视频归档搜索'),
      sk('vss-setup-behavior-analytics', '行为分析', '行为分析设置'),
      sk('vss-setup-video-analytics-api', '分析 API', '视频分析 API 设置'),
    ],
  },
  {
    id: 'deepstream', name: 'DeepStream', member: 'grace',
    description: '视频分析 — 模型导入与开发',
    skills: [
      sk('deepstream-import-vision-model', '导入视觉模型', 'DeepStream 视觉模型导入'),
      sk('deepstream-dev', '开发', 'DeepStream 开发'),
    ],
  },
  {
    id: 'omniverse', name: 'Omniverse', member: 'grace',
    description: '3D/USD 生态',
    skills: [
      sk('omniverse-cad-to-simready', 'CAD 转 SimReady', 'CAD 转 SimReady 资产'),
      sk('omniverse-realtime-viewer', '实时查看器', 'Omniverse 实时查看器'),
      sk('omniverse-usd-performance-tuning', 'USD 性能调优', 'USD 性能调优'),
    ],
  },

  // ── prophet · 预见·先知 ──────────────────────────────

  {
    id: 'physical-ai', name: 'Physical AI', member: 'prophet',
    description: '物理基础设施 — 缺陷生成、数据增强',
    skills: [
      sk('physical-ai-infrastructure-setup-and-resilient-scaling', '基础设施设置', 'Physical AI 基础设施设置与弹性扩展'),
      sk('physical-ai-defect-image-generation', '缺陷图像生成', 'Physical AI 缺陷图像生成'),
      sk('physical-ai-video-data-augmentation', '视频数据增强', 'Physical AI 视频数据增强'),
      sk('physical-ai-neural-reconstruction', '神经重建', 'Physical AI 神经重建'),
    ],
  },
  {
    id: 'earth2studio', name: 'Earth-2 Studio', member: 'prophet',
    description: '天气气候预测',
    skills: [
      sk('earth2studio-install', '安装', 'Earth2Studio 安装配置'),
      sk('earth2studio-discover', '发现', '查找天气/气候模型和数据源'),
      sk('earth2studio-data-fetch', '数据获取', '获取天气/气候数据'),
      sk('earth2studio-deterministic-forecast', '确定性预测', '构建确定性预测脚本'),
    ],
  },
  {
    id: 'physicsnemo', name: 'PhysicsNeMo', member: 'prophet',
    description: '物理 AI — 科学计算',
    skills: [
      sk('physicsnemo-discover', '发现', '查找 PhysicsNeMo 模型和示例'),
    ],
  },
  {
    id: 'medical-ai', name: 'Medical AI Skills', member: 'prophet',
    description: '医疗影像 AI — MR/CT/CXR 生成与分割',
    skills: [
      sk('nv-generate-mr', '生成 MR', '生成磁共振图像'),
      sk('nv-generate-mr-brain', '生成脑部 MR', '生成脑部磁共振图像'),
      sk('nv-generate-mr-brain-finetune', '微调脑部 MR', '微调脑部 MR 生成模型'),
      sk('nv-generate-vae-finetune', '微调 VAE', '微调 VAE 模型'),
      sk('nv-segment-ct', '分割 CT', 'CT 图像分割'),
      sk('nv-reason-cxr', '推理 CXR', '胸部 X 光推理'),
      sk('nv-segment-ct-finetune', '微调 CT 分割', '微调 CT 分割模型'),
      sk('nv-segment-ctmr', '分割 CT/MR', 'CT/MR 多模态分割'),
      sk('nv-generate-ct-rflow', 'CT RFlow', 'CT RFlow 生成'),
    ],
  },
  {
    id: 'dicom', name: 'DICOM', member: 'prophet',
    description: '医学影像数据处理',
    skills: [
      sk('dicom-metadata-extract', '元数据提取', 'DICOM 元数据提取'),
      sk('dicom-series-preflight', '预检', 'DICOM 系列预检'),
      sk('dicom-series-to-volume', '体素转换', 'DICOM 系列转体素'),
    ],
  },
  {
    id: 'digital-health', name: 'Digital Health', member: 'prophet',
    description: '数字健康 — 临床 ASR',
    skills: [
      sk('digital-health-clinical-asr-finetune', 'ASR 微调', '临床 ASR 模型微调'),
      sk('digital-health-clinical-asr-setup', 'ASR 设置', '临床 ASR 环境设置'),
      sk('digital-health-clinical-asr-eval', 'ASR 评估', '临床 ASR 评估'),
      sk('digital-health-clinical-asr-build', 'ASR 构建', '临床 ASR 构建流程'),
    ],
  },

  // ── grandmaster · 格物·宗师 ──────────────────────────────

  {
    id: 'tilegym', name: 'TileGym', member: 'grandmaster',
    description: 'GPU 内核优化 — CUTLile/Triton/Julia',
    skills: [
      sk('tilegym-adding-cutile-kernel', '添加 CUTLile 内核', '添加 CUTLile 内核'),
      sk('tilegym-converting-cutile-to-julia', '转 Julia', 'CUTLile 转 Julia'),
      sk('tilegym-converting-cutile-to-triton', '转 Triton', 'CUTLile 转 Triton'),
      sk('tilegym-cutile-autotuning', '自动调优', 'CUTLile 自动调优'),
      sk('tilegym-cutile-python', 'Python CUTLile', 'CUTLile Python 接口'),
      sk('tilegym-improve-cutile-kernel-perf', '性能优化', 'CUTLile 内核性能优化'),
      sk('tilegym-monkey-patch-kernels-to-transformers', '内核补丁', '内核补丁到 Transformers'),
    ],
  },
  {
    id: 'cuda-q', name: 'CUDA-Q', member: 'grandmaster',
    description: '量子计算',
    skills: [
      sk('cudaq-guide', 'CUDA-Q 指南', 'CUDA-Q 量子计算指南'),
    ],
  },
  {
    id: 'skill-governance', name: 'Skill Governance', member: 'grandmaster',
    description: '技能治理',
    skills: [
      sk('skill-card-generator', '技能卡片生成器', '生成 NVIDIA 技能评估卡片'),
    ],
  },

  // ── guardian · 智云·守护 ──────────────────────────────

  {
    id: 'dynamo', name: 'Dynamo', member: 'guardian',
    description: '推理服务编排 — 路由/配方/互联/排障',
    skills: [
      sk('dynamo-router-starter', '路由器启动', 'Dynamo 路由器模式启动'),
      sk('dynamo-recipe-runner', '配方运行', 'Dynamo K8s 配方部署'),
      sk('dynamo-interconnect-check', '互联检查', 'NIXL/UCC/NCCL 互联验证'),
      sk('dynamo-troubleshoot', '故障排除', 'Dynamo 部署诊断'),
    ],
  },
  {
    id: 'holoscan', name: 'Holoscan SDK', member: 'guardian',
    description: '医疗设备 SDK — 容器/Conda/Debian/源码安装',
    skills: [
      sk('holoscan-install-container', '容器安装', 'NGC Docker 容器安装'),
      sk('holoscan-setup', '设置', 'Holoscan SDK 安装评估'),
      sk('holoscan-install-conda', 'Conda 安装', 'Conda 安装 Holoscan SDK'),
      sk('holoscan-install-debian', 'Debian 安装', 'Debian 包安装'),
      sk('holoscan-install-source', '源码安装', '从源码编译安装'),
      sk('holoscan-install-wheel', 'Wheel 安装', 'pip wheel 安装'),
    ],
  },
];

// ═══ 统计 ═══

export function getCatalogStats() {
  const totalSkills = NVIDIA_CATALOG.reduce((sum, c) => sum + c.skills.length, 0);
  const byMember: Record<string, { components: number; skills: number }> = {};
  for (const c of NVIDIA_CATALOG) {
    if (!byMember[c.member]) byMember[c.member] = { components: 0, skills: 0 };
    byMember[c.member]!.components++;
    byMember[c.member]!.skills += c.skills.length;
  }
  return { totalComponents: NVIDIA_CATALOG.length, totalSkills, byMember };
}
