import { describe, it, expect, vi, beforeEach } from "vitest";
import { EventBus, Events } from "../event-bus";

describe("EventBus", () => {
  let bus: EventBus;
  beforeEach(() => { bus = new EventBus(); });

  it("应该注册并触发事件", () => {
    const fn = vi.fn();
    bus.on("test", fn);
    bus.emit("test", "data");
    expect(fn).toHaveBeenCalledWith("data");
  });

  it("应支持多个监听器", () => {
    const a = vi.fn(), b = vi.fn();
    bus.on("test", a);
    bus.on("test", b);
    bus.emit("test");
    expect(a).toHaveBeenCalled();
    expect(b).toHaveBeenCalled();
  });

  it("off 应停止监听", () => {
    const fn = vi.fn();
    bus.on("test", fn);
    bus.off("test", fn);
    bus.emit("test");
    expect(fn).not.toHaveBeenCalled();
  });

  it("once 只触发一次", () => {
    const fn = vi.fn();
    bus.once("test", fn);
    bus.emit("test");
    bus.emit("test");
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it("events 常量应正确导出", () => {
    expect(Events.AI_PERSONA_CHANGED).toBe("ai:persona-changed");
    expect(Events.HUB_OPEN).toBe("hub:open");
    expect(Events.SYSTEM_NOTIFY).toBe("system:notify");
  });
});
