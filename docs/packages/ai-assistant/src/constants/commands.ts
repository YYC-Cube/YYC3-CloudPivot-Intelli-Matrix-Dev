/**
 * @file constants/commands.ts
 * @description AI 助手系统命令预设（含 i18n key）
 * @author YanYuCloudCube Team
 * @version v1.1.0
 */

import {
  Activity,
  Server,
  Database,
  Shield,
  RotateCcw,
  Cpu,
  HardDrive,
  Network,
  Layers,
  Zap
} from "lucide-react";
import type { CommandCategory } from "../types";

export interface SystemCommand {
  id: string;
  icon: typeof Zap;
  /** i18n key 前缀，例如 commands.items.cmd-01 */
  i18nKey: string;
  category: CommandCategory;
  action: string;
  color: string;
}

export const SYSTEM_COMMANDS: SystemCommand[] = [
  {
    id: "cmd-01",
    icon: Activity,
    i18nKey: "commands.items.cmd-01",
    category: "cluster",
    action: "查看当前集群所有节点的运行状态、GPU利用率和温度",
    color: "#00d4ff"
  },
  {
    id: "cmd-02",
    icon: Server,
    i18nKey: "commands.items.cmd-02",
    category: "cluster",
    action: "检测并重启所有状态异常的推理节点",
    color: "#ff6600"
  },
  {
    id: "cmd-03",
    icon: Layers,
    i18nKey: "commands.items.cmd-03",
    category: "model",
    action: "将 DeepSeek-V3 模型部署到空闲 GPU 节点",
    color: "#00ff88"
  },
  {
    id: "cmd-04",
    icon: Cpu,
    i18nKey: "commands.items.cmd-04",
    category: "model",
    action: "生成过去24小时的推理性能分析报告",
    color: "#aa55ff"
  },
  {
    id: "cmd-05",
    icon: Database,
    i18nKey: "commands.items.cmd-05",
    category: "data",
    action: "执行数据库健康检查，检测连接池和慢查询",
    color: "#ffdd00"
  },
  {
    id: "cmd-06",
    icon: HardDrive,
    i18nKey: "commands.items.cmd-06",
    category: "data",
    action: "分析当前存储空间使用情况给出清理建议",
    color: "#ff3366"
  },
  {
    id: "cmd-07",
    icon: Shield,
    i18nKey: "commands.items.cmd-07",
    category: "security",
    action: "执行安全审计扫描，检查异常访问和潜在风险",
    color: "#ff3366"
  },
  {
    id: "cmd-08",
    icon: Network,
    i18nKey: "commands.items.cmd-08",
    category: "monitor",
    action: "诊断所有节点间的网络延迟和带宽状态",
    color: "#00d4ff"
  },
  {
    id: "cmd-09",
    icon: Zap,
    i18nKey: "commands.items.cmd-09",
    category: "cluster",
    action: "根据当前负载情况，AI 自动优化集群配置参数",
    color: "#00ff88"
  },
  {
    id: "cmd-10",
    icon: RotateCcw,
    i18nKey: "commands.items.cmd-10",
    category: "monitor",
    action: "重新建立 WebSocket 实时数据推送连接",
    color: "#aa55ff"
  }
];

export type CommandCategoryKey = "all" | CommandCategory;

export const CMD_CATEGORIES: Array<{ key: CommandCategoryKey; i18nKey: string }> = [
  { key: "all", i18nKey: "commands.categories.all" },
  { key: "cluster", i18nKey: "commands.categories.cluster" },
  { key: "model", i18nKey: "commands.categories.model" },
  { key: "data", i18nKey: "commands.categories.data" },
  { key: "security", i18nKey: "commands.categories.security" },
  { key: "monitor", i18nKey: "commands.categories.monitor" }
];
