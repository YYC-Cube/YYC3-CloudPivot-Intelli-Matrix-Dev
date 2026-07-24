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
 * OTelTracer.ts
 * =============
 * OpenTelemetry 追踪器实现 — 当 @opentelemetry/api 可用时启用
 *
 * 使用类型擦除模式避免对 @opentelemetry/api 的编译时依赖。
 * 运行时动态加载，降级为 NoopTracer。
 */

import type { Span, Tracer, TracingConfig } from './types';
import { NoopTracer } from './NoopTracer';

// 运行时 OTel 引用（类型擦除为 unknown 避免编译依赖）
let _otelApi: unknown = null;
let otelLoaded = false;

async function ensureOTel(): Promise<unknown> {
  if (otelLoaded) return _otelApi;
  otelLoaded = true;
  try {
    // 字符串拼接避免 tsc 静态解析模块路径 (@opentelemetry/api 为可选依赖)
    const otelMod = '@opentelemetry' + '/api';
    _otelApi = await import(otelMod);
    return _otelApi;
  } catch {
    return null;
  }
}

/** OTel Span 适配器 — 使用动态属性访问避免编译依赖 */
class OTelSpanAdapter implements Span {
  constructor(private inner: unknown) {}

  setAttribute(key: string, value: string | number | boolean): void {
    (this.inner as Record<string, (...a: unknown[]) => unknown>).setAttribute?.(key, value);
  }
  setAttributes(attrs: Record<string, string | number | boolean>): void {
    (this.inner as Record<string, (...a: unknown[]) => unknown>).setAttributes?.(attrs);
  }
  addEvent(name: string, attributes?: Record<string, string | number | boolean>): void {
    (this.inner as Record<string, (...a: unknown[]) => unknown>).addEvent?.(name, attributes);
  }
  setStatus(status: 'ok' | 'error' | 'unset', description?: string): void {
    const otel = _otelApi as Record<string, unknown> | null;
    const statusCode = otel?.['SpanStatusCode'] as Record<string, number> | undefined;
    const inner = this.inner as Record<string, (...a: unknown[]) => unknown>;
    if (inner.setStatus && statusCode) {
      const map: Record<string, number> = {
        ok: statusCode.OK ?? 0,
        error: statusCode.ERROR ?? 1,
        unset: statusCode.UNSET ?? 2,
      };
      inner.setStatus({ code: map[status], message: description });
    }
  }
  recordException(error: Error): void {
    (this.inner as Record<string, (...a: unknown[]) => unknown>).recordException?.(error);
  }
  end(): void { (this.inner as Record<string, (...a: unknown[]) => unknown>).end?.(); }
  isRecording(): boolean { return !!(this.inner as Record<string, unknown>)['isRecording']; }
}

export class OTelTracer implements Tracer {
  private innerTracer: unknown = null;

  constructor(config: TracingConfig = {}) {
    this.init(config);
  }

  private async init(config: TracingConfig): Promise<void> {
    const otel = await ensureOTel();
    if (!otel) return;

    const otelObj = otel as Record<string, unknown>;
    const tracerProvider = otelObj['trace'] as Record<string, (...a: unknown[]) => unknown> | undefined;
    if (tracerProvider?.getTracer) {
      this.innerTracer = tracerProvider.getTracer(
        config.serviceName ?? 'yyc3-family',
        config.serviceVersion ?? '1.0.0',
      );
    }
  }

  startSpan(name: string): Span {
    if (!this.innerTracer) {
      return new NoopTracer().startSpan(name);
    }
    const otelSpan = (this.innerTracer as Record<string, (...a: unknown[]) => unknown>).startSpan?.(name);
    if (otelSpan) return new OTelSpanAdapter(otelSpan);
    return new NoopTracer().startSpan(name);
  }

  async withSpan<T>(
    name: string,
    fn: (span: Span) => Promise<T>,
    options?: { attributes?: Record<string, string | number | boolean>; parent?: Span },
  ): Promise<T> {
    const span = this.startSpan(name);
    if (options?.attributes) {
      span.setAttributes(options.attributes);
    }
    try {
      return await fn(span);
    } finally {
      span.end();
    }
  }
}
