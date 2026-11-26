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

  it("clear 应按事件名或全量清空监听", () => {
    const a = vi.fn(), b = vi.fn(), c = vi.fn();
    bus.on("evt-a", a);
    bus.on("evt-b", b);
    bus.on("evt-c", c);
    bus.clear("evt-a");
    bus.emit("evt-a");
    bus.emit("evt-b");
    expect(a).not.toHaveBeenCalled();
    expect(b).toHaveBeenCalledTimes(1);
    bus.clear();
    bus.emit("evt-b");
    bus.emit("evt-c");
    expect(b).toHaveBeenCalledTimes(1);
    expect(c).not.toHaveBeenCalled();
  });

  it("对未注册事件的 emit/off 应安全无副作用", () => {
    expect(() => {
      bus.emit("ghost", 1);
      bus.off("ghost", () => { });
    }).not.toThrow();
  });

  it("events 常量应正确导出", () => {
    expect(Events.AI_PERSONA_CHANGED).toBe("ai:persona-changed");
    expect(Events.HUB_OPEN).toBe("hub:open");
    expect(Events.SYSTEM_NOTIFY).toBe("system:notify");
  });
});
