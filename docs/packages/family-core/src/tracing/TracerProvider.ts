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
 * TracerProvider.ts
 * =================
 * 全局追踪器提供商 — 管理追踪器实例
 * 优先使用 OTel（如已安装），否则降级到 Noop
 */

import type { Tracer, TracingConfig } from './types';
import { NoopTracer } from './NoopTracer';
import { OTelTracer } from './OTelTracer';

let globalTracer: Tracer | null = null;

/** 获取全局追踪器实例 */
export function getTracer(config?: TracingConfig): Tracer {
  if (globalTracer) return globalTracer;

  if (config?.enabled ?? true) {
    try {
      globalTracer = new OTelTracer(config ?? {});
      return globalTracer;
    } catch {
      // OTel 不可用，降级
    }
  }

  globalTracer = new NoopTracer();
  return globalTracer;
}

/** 重置全局追踪器（用于测试） */
export function resetTracer(): void {
  globalTracer = null;
}

/** 设置自定义追踪器 */
export function setTracer(tracer: Tracer): void {
  globalTracer = tracer;
}

// ═══ 便利辅助函数 ═══

/**
 * 创建一个包装函数，为指定函数添加追踪 span
 */
export function traceable<Args extends unknown[], T>(
  name: string,
  fn: (...args: Args) => Promise<T>,
  attributeFn?: (...args: Args) => Record<string, string | number | boolean>,
): (...args: Args) => Promise<T> {
  const tracer = getTracer();
  return async (...args: Args) => {
    return tracer.withSpan(name, async (span) => {
      if (attributeFn) {
        span.setAttributes(attributeFn(...args));
      }
      return fn(...args);
    });
  };
}
