// @vitest-environment node
/**
 * @file: event-bus-cross-plugin.test.ts
 * @description: EventBus 跨插件通信测试 — 验证 7 子系统事件命名空间协同
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { EventBus, eventBus, Events } from "../event-bus";

describe("EventBus 跨插件通信", () => {
  let bus: EventBus;
  beforeEach(() => { bus = new EventBus(); });

  describe("AI 命名空间 (ai:*)", () => {
    it("ai-family → ai: persona-activated 应被 ai 系统接收", () => {
      const aiReceiver = vi.fn();
      bus.on("ai:persona-activated", aiReceiver);

      // 模拟 ai-family 发出事件
      bus.emit("ai:persona-activated", { personaId: "navigator" });

      expect(aiReceiver).toHaveBeenCalledWith({ personaId: "navigator" });
    });

    it("ai:analyze 应触发分析流程", () => {
      const analyzeHandler = vi.fn();
      bus.on("ai:analyze", analyzeHandler);

      bus.emit("ai:analyze", { type: "business", data: { revenue: 500 } });

      expect(analyzeHandler).toHaveBeenCalledTimes(1);
      expect(analyzeHandler).toHaveBeenCalledWith({ type: "business", data: { revenue: 500 } });
    });

    it("ai:response 回复事件应可被监控中心订阅", () => {
      const monitorReceiver = vi.fn();
      bus.on("ai:response", monitorReceiver);

      bus.emit("ai:response", { content: "分析完成", personaId: "thinker" });

      expect(monitorReceiver).toHaveBeenCalledWith({ content: "分析完成", personaId: "thinker" });
    });
  });

  describe("Hub 命名空间 (hub:*)", () => {
    it("hub:open 应触发浮窗打开", () => {
      const openHandler = vi.fn();
      bus.on(Events.HUB_OPEN, openHandler);

      bus.emit(Events.HUB_OPEN, "ai-tab");

      expect(openHandler).toHaveBeenCalledWith("ai-tab");
    });

    it("hub:command 应分发命令执行", () => {
      const cmdHandler = vi.fn();
      bus.on(Events.HUB_COMMAND, cmdHandler);

      bus.emit(Events.HUB_COMMAND, "g-analyze");

      expect(cmdHandler).toHaveBeenCalledWith("g-analyze");
    });

    it("hub:navigate 应支持 Tab 切换", () => {
      const navHandler = vi.fn();
      bus.on(Events.HUB_NAVIGATE, navHandler);

      bus.emit(Events.HUB_NAVIGATE, "monitor");
      bus.emit(Events.HUB_NAVIGATE, "ops");

      expect(navHandler).toHaveBeenCalledTimes(2);
      expect(navHandler).toHaveBeenNthCalledWith(1, "monitor");
      expect(navHandler).toHaveBeenNthCalledWith(2, "ops");
    });
  });

  describe("System 命名空间 (system:*)", () => {
    it("monitor 系统事件应可被 ops 系统接收", () => {
      const opsReceiver = vi.fn();
      bus.on("system:monitor-alerts", opsReceiver);

      bus.emit("system:monitor-alerts", { level: "critical", count: 3 });

      expect(opsReceiver).toHaveBeenCalledWith({ level: "critical", count: 3 });
    });

    it("ops 系统事件应可被 monitor 系统接收", () => {
      const monitorReceiver = vi.fn();
      bus.on("system:ops-backup", monitorReceiver);

      bus.emit("system:ops-backup", { status: "started" });

      expect(monitorReceiver).toHaveBeenCalledWith({ status: "started" });
    });

    it("admin 系统事件应广播给所有系统", () => {
      const receivers = [vi.fn(), vi.fn(), vi.fn()];
      receivers.forEach(r => bus.on("system:admin-settings", r));

      bus.emit("system:admin-settings", { key: "2fa", value: true });

      receivers.forEach(r => {
        expect(r).toHaveBeenCalledWith({ key: "2fa", value: true });
      });
    });

    it("system:navigate 应触发跨系统导航", () => {
      const navHandler = vi.fn();
      bus.on(Events.SYSTEM_NAVIGATE, navHandler);

      bus.emit(Events.SYSTEM_NAVIGATE, "monitor", "/alerts");

      expect(navHandler).toHaveBeenCalledWith("monitor", "/alerts");
    });

    it("system:notify 应支持多级别通知", () => {
      const notifyHandler = vi.fn();
      bus.on(Events.SYSTEM_NOTIFY, notifyHandler);

      bus.emit(Events.SYSTEM_NOTIFY, "info", "备份完成", "ops");
      bus.emit(Events.SYSTEM_NOTIFY, "warn", "磁盘使用率 85%", "monitor");
      bus.emit(Events.SYSTEM_NOTIFY, "error", "服务不可用", "ai");

      expect(notifyHandler).toHaveBeenCalledTimes(3);
    });
  });

  describe("Target 命名空间 (target:*)", () => {
    it("target:updated 事件应触发看板更新", () => {
      const dashboardHandler = vi.fn();
      bus.on("target:updated", dashboardHandler);

      bus.emit("target:updated", { annualTarget: 1500, phase: "peak" });

      expect(dashboardHandler).toHaveBeenCalledWith({ annualTarget: 1500, phase: "peak" });
    });
  });

  describe("跨插件全链路", () => {
    it("完整事件流: hub:command → ai:analyze → ai:response → system:notify", () => {
      // 1. Hub 发出命令
      const cmdHandler = vi.fn((cmdId: string) => {
        if (cmdId === "g-analyze") {
          // 2. 触发 AI 分析
          bus.emit("ai:analyze", { type: "business" });
        }
      });
      bus.on(Events.HUB_COMMAND, cmdHandler);

      // 3. AI 分析完成后发出回复
      const analyzeHandler = vi.fn(() => {
        bus.emit("ai:response", { content: "分析完成" });
      });
      bus.on("ai:analyze", analyzeHandler);

      // 4. AI 回复触发系统通知
      const responseHandler = vi.fn(() => {
        bus.emit(Events.SYSTEM_NOTIFY, "info", "AI 分析已完成", "ai");
      });
      bus.on("ai:response", responseHandler);

      // 5. 系统通知被接收
      const notifyHandler = vi.fn();
      bus.on(Events.SYSTEM_NOTIFY, notifyHandler);

      // 触发整个链路
      bus.emit(Events.HUB_COMMAND, "g-analyze");

      expect(cmdHandler).toHaveBeenCalledWith("g-analyze");
      expect(analyzeHandler).toHaveBeenCalled();
      expect(responseHandler).toHaveBeenCalled();
      expect(notifyHandler).toHaveBeenCalledWith("info", "AI 分析已完成", "ai");
    });

    it("多系统并行订阅同一事件应互不干扰", () => {
      const handlers = Array.from({ length: 5 }, () => vi.fn());
      handlers.forEach(h => bus.on("system:broadcast", h));

      bus.emit("system:broadcast", { message: "全局广播" });

      handlers.forEach(h => {
        expect(h).toHaveBeenCalledWith({ message: "全局广播" });
      });

      // 取消其中一个订阅，其他应不受影响
      const unsubscribe = bus.on("system:broadcast", handlers[0]);
      bus.off("system:broadcast", handlers[0]);

      bus.emit("system:broadcast", { message: "第二次广播" });

      expect(handlers[0]).toHaveBeenCalledTimes(1); // 不再触发
      expect(handlers[1]).toHaveBeenCalledTimes(2); // 仍触发
    });

    it("全局 eventBus 单例应可用", () => {
      const handler = vi.fn();
      const unsubscribe = eventBus.on("test:singleton", handler);

      eventBus.emit("test:singleton", "data");
      expect(handler).toHaveBeenCalledWith("data");

      unsubscribe();
      eventBus.emit("test:singleton", "data2");
      expect(handler).toHaveBeenCalledTimes(1);
    });
  });
});
