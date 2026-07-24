/**
 * @file: event-bus.ts
 * @description: 跨系统事件总线 — AI Family 中枢核心
 */
type Handler = (...args: any[]) => void;

export class EventBus {
  private listeners = new Map<string, Set<Handler>>();

  /** 发送事件 */
  emit(event: string, ...args: any[]): void {
    this.listeners.get(event)?.forEach(fn => fn(...args));
  }

  /** 监听事件，返回取消监听函数 */
  on(event: string, fn: Handler): () => void {
    if (!this.listeners.has(event)) this.listeners.set(event, new Set());
    this.listeners.get(event)!.add(fn);
    return () => this.listeners.get(event)?.delete(fn);
  }

  /** 一次性监听 */
  once(event: string, fn: Handler): void {
    const wrapper = (...args: any[]) => { fn(...args); this.off(event, wrapper); };
    this.on(event, wrapper);
  }

  off(event: string, fn: Handler): void {
    this.listeners.get(event)?.delete(fn);
  }

  clear(event?: string): void {
    if (event) this.listeners.delete(event);
    else this.listeners.clear();
  }
}

/** 全局单例 */
export const eventBus = new EventBus();

// ============================================================
// 预定义事件常量 (统一全系统)
// ============================================================

export const Events = {
  // ===== AI Family 中枢事件 =====
  /** 人格切换: (personaId: string) */
  AI_PERSONA_CHANGED: "ai:persona-changed",
  /** 询问 AI: (question: string, personaId?: string) */
  AI_ASK: "ai:ask",
  /** AI 回复: (content: string, personaId: string) */
  AI_RESPONSE: "ai:response",

  // ===== 浮窗 Hub 事件 =====
  /** 打开浮窗: (defaultTab?: string) */
  HUB_OPEN: "hub:open",
  /** 关闭浮窗 */
  HUB_CLOSE: "hub:close",
  /** 导航到浮窗 Tab: (tab: string) */
  HUB_NAVIGATE: "hub:navigate",
  /** 执行快捷命令: (commandId: string) */
  HUB_COMMAND: "hub:command",

  // ===== 系统间事件 =====
  /** 系统通知: (level, message, systemId) */
  SYSTEM_NOTIFY: "system:notify",
  /** 请求导航到系统: (systemId: string, path?: string) */
  SYSTEM_NAVIGATE: "system:navigate",

  // ===== Shell 事件 =====
  /** 欢迎页已关闭 */
  SHELL_WELCOME_DISMISS: "shell:welcome-dismiss",
  /** 侧边栏切换 */
  SHELL_SIDEBAR_TOGGLE: "shell:sidebar-toggle",
} as const;
