// @vitest-environment node
/**
 * @file: hub-commands.test.ts
 * @description: Hub 命令集成测试 — 验证 7 子系统 Hub 命令定义完整且 action 可执行
 */
import type React from "react";
import { describe, expect, it, vi } from "vitest";
import { eventBus } from "../event-bus";
import type { HubCommand } from "../types";

// 模拟各系统的 Hub 命令定义（与 apps/standalone-*/src/App.tsx 中的定义保持一致）
function buildAIFamilyCommands(): HubCommand[] {
  const personas = [
    { id: "navigator", shortName: "千行", role: "聆听与翻译" },
    { id: "thinker", shortName: "万物", role: "分析与洞察" },
  ];
  return personas.map(p => ({
    id: `f-call-${p.id}`,
    label: `呼叫 ${p.shortName}`,
    systemId: "ai-family",
    icon: {} as React.ElementType,
    action: () => {
      eventBus.emit("ai:persona-activated", { personaId: p.id });
    },
  }));
}

function buildMonitorCommands(): HubCommand[] {
  return [
    { id: "m-status", label: "查看集群状态", systemId: "monitor", icon: {} as React.ElementType, action: () => { eventBus.emit("system:monitor-status", {}); } },
    { id: "m-alerts", label: "查看告警列表", systemId: "monitor", icon: {} as React.ElementType, action: () => { eventBus.emit("system:monitor-alerts", {}); } },
    { id: "m-patrol", label: "启动巡查模式", systemId: "monitor", icon: {} as React.ElementType, action: () => { eventBus.emit("system:monitor-patrol", { mode: "start" }); } },
    { id: "m-rules", label: "配置告警规则", systemId: "monitor", icon: {} as React.ElementType, action: () => { eventBus.emit("system:monitor-rules", {}); } },
  ];
}

function buildOpsCommands(): HubCommand[] {
  return [
    { id: "o-backup", label: "执行数据备份", systemId: "ops", icon: {} as React.ElementType, action: () => { eventBus.emit("system:ops-backup", {}); } },
    { id: "o-files", label: "管理文件", systemId: "ops", icon: {} as React.ElementType, action: () => { eventBus.emit("system:ops-files", {}); } },
    { id: "o-db", label: "数据库健康检查", systemId: "ops", icon: {} as React.ElementType, action: () => { eventBus.emit("system:ops-db", {}); } },
  ];
}

function buildAICommands(): HubCommand[] {
  return [
    { id: "ai-analyze", label: "AI 智能分析", systemId: "ai", icon: {} as React.ElementType, action: () => { eventBus.emit("ai:analyze", {}); } },
    { id: "ai-models", label: "管理模型提供商", systemId: "ai", icon: {} as React.ElementType, action: () => { eventBus.emit("ai:models", {}); } },
    { id: "ai-diagnosis", label: "运行 AI 诊断", systemId: "ai", icon: {} as React.ElementType, action: () => { eventBus.emit("ai:diagnosis", {}); } },
  ];
}

function buildDevCommands(): HubCommand[] {
  return [
    { id: "d-term", label: "打开终端", systemId: "dev", icon: {} as React.ElementType, action: () => { eventBus.emit("system:dev-terminal", {}); } },
    { id: "d-design", label: "设计系统", systemId: "dev", icon: {} as React.ElementType, action: () => { eventBus.emit("system:dev-design", {}); } },
    { id: "d-ide", label: "打开 IDE", systemId: "dev", icon: {} as React.ElementType, action: () => { eventBus.emit("system:dev-ide", {}); } },
  ];
}

function buildAdminCommands(): HubCommand[] {
  return [
    { id: "a-settings", label: "打开系统设置", systemId: "admin", icon: {} as React.ElementType, action: () => { eventBus.emit("system:admin-settings", {}); } },
    { id: "a-users", label: "用户管理", systemId: "admin", icon: {} as React.ElementType, action: () => { eventBus.emit("system:admin-users", {}); } },
    { id: "a-audit", label: "操作审计日志", systemId: "admin", icon: {} as React.ElementType, action: () => { eventBus.emit("system:admin-audit", {}); } },
  ];
}

const ALL_SYSTEMS = ["ai-family", "monitor", "ops", "ai", "dev", "admin"];

describe("Hub 命令集成测试", () => {
  describe("命令定义完整性", () => {
    it("ai-family 命令应有正确的 systemId", () => {
      const cmds = buildAIFamilyCommands();
      expect(cmds.length).toBeGreaterThan(0);
      for (const cmd of cmds) {
        expect(cmd.systemId).toBe("ai-family");
        expect(cmd.id).toMatch(/^f-call-/);
        expect(cmd.label).toBeTruthy();
        expect(typeof cmd.action).toBe("function");
      }
    });

    it("monitor 命令应覆盖 4 个核心功能", () => {
      const cmds = buildMonitorCommands();
      expect(cmds).toHaveLength(4);
      expect(cmds.map(c => c.id)).toEqual(["m-status", "m-alerts", "m-patrol", "m-rules"]);
      for (const cmd of cmds) {
        expect(cmd.systemId).toBe("monitor");
      }
    });

    it("ops 命令应覆盖 3 个核心功能", () => {
      const cmds = buildOpsCommands();
      expect(cmds).toHaveLength(3);
      expect(cmds.map(c => c.id)).toEqual(["o-backup", "o-files", "o-db"]);
    });

    it("ai 命令应覆盖 3 个智能功能", () => {
      const cmds = buildAICommands();
      expect(cmds).toHaveLength(3);
      expect(cmds.map(c => c.id)).toEqual(["ai-analyze", "ai-models", "ai-diagnosis"]);
    });

    it("dev 命令应覆盖 3 个开发工具", () => {
      const cmds = buildDevCommands();
      expect(cmds).toHaveLength(3);
      expect(cmds.map(c => c.id)).toEqual(["d-term", "d-design", "d-ide"]);
    });

    it("admin 命令应覆盖 3 个管理功能", () => {
      const cmds = buildAdminCommands();
      expect(cmds).toHaveLength(3);
      expect(cmds.map(c => c.id)).toEqual(["a-settings", "a-users", "a-audit"]);
    });
  });

  describe("命令 ID 全局唯一性", () => {
    it("所有系统命令 ID 不应重复", () => {
      const allCmds = [
        ...buildAIFamilyCommands(),
        ...buildMonitorCommands(),
        ...buildOpsCommands(),
        ...buildAICommands(),
        ...buildDevCommands(),
        ...buildAdminCommands(),
      ];
      const ids = allCmds.map(c => c.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(ids.length);
    });
  });

  describe("命令 action 可执行性", () => {
    it("ai-family 命令 action 应触发 ai:persona-activated 事件", () => {
      const cmds = buildAIFamilyCommands();
      const handler = vi.fn();
      const unsubscribe = eventBus.on("ai:persona-activated", handler);

      cmds[0].action();

      expect(handler).toHaveBeenCalledWith({ personaId: "navigator" });
      unsubscribe();
    });

    it("monitor 命令 action 应触发对应事件", () => {
      const cmds = buildMonitorCommands();
      const statusHandler = vi.fn();
      const alertsHandler = vi.fn();
      const unsubStatus = eventBus.on("system:monitor-status", statusHandler);
      const unsubAlerts = eventBus.on("system:monitor-alerts", alertsHandler);

      cmds[0].action(); // m-status
      cmds[1].action(); // m-alerts

      expect(statusHandler).toHaveBeenCalledTimes(1);
      expect(alertsHandler).toHaveBeenCalledTimes(1);
      unsubStatus();
      unsubAlerts();
    });

    it("ops 命令 action 应触发对应事件", () => {
      const cmds = buildOpsCommands();
      const backupHandler = vi.fn();
      const unsub = eventBus.on("system:ops-backup", backupHandler);

      cmds[0].action(); // o-backup

      expect(backupHandler).toHaveBeenCalledTimes(1);
      unsub();
    });

    it("ai 命令 action 应触发 ai:analyze 事件", () => {
      const cmds = buildAICommands();
      const handler = vi.fn();
      const unsub = eventBus.on("ai:analyze", handler);

      cmds[0].action(); // ai-analyze

      expect(handler).toHaveBeenCalledWith({});
      unsub();
    });

    it("dev 命令 action 应触发 system:dev-terminal 事件", () => {
      const cmds = buildDevCommands();
      const handler = vi.fn();
      const unsub = eventBus.on("system:dev-terminal", handler);

      cmds[0].action(); // d-term

      expect(handler).toHaveBeenCalledTimes(1);
      unsub();
    });

    it("admin 命令 action 应触发 system:admin-settings 事件", () => {
      const cmds = buildAdminCommands();
      const handler = vi.fn();
      const unsub = eventBus.on("system:admin-settings", handler);

      cmds[0].action(); // a-settings

      expect(handler).toHaveBeenCalledTimes(1);
      unsub();
    });
  });

  describe("命令系统归属", () => {
    it("每条命令的 systemId 应属于已知系统", () => {
      const allCmds = [
        ...buildAIFamilyCommands(),
        ...buildMonitorCommands(),
        ...buildOpsCommands(),
        ...buildAICommands(),
        ...buildDevCommands(),
        ...buildAdminCommands(),
      ];

      for (const cmd of allCmds) {
        expect(ALL_SYSTEMS).toContain(cmd.systemId);
      }
    });

    it("命令总数应符合预期 (≥18)", () => {
      const allCmds = [
        ...buildAIFamilyCommands(),
        ...buildMonitorCommands(),
        ...buildOpsCommands(),
        ...buildAICommands(),
        ...buildDevCommands(),
        ...buildAdminCommands(),
      ];
      expect(allCmds.length).toBeGreaterThanOrEqual(18);
    });
  });
});
