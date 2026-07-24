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
 * NoopTracer.ts
 * =============
 * 空追踪器实现 — 当 OpenTelemetry 未安装时使用
 */

import type { Span, Tracer } from './types';

class NoopSpan implements Span {
  private ended = false;

  setAttribute(_key: string, _value: string | number | boolean): void {}
  setAttributes(_attrs: Record<string, string | number | boolean>): void {}
  addEvent(_name: string, _attributes?: Record<string, string | number | boolean>): void {}
  setStatus(_status: 'ok' | 'error' | 'unset', _description?: string): void {}
  recordException(_error: Error): void {}
  end(): void { this.ended = true; }
  isRecording(): boolean { return !this.ended; }
}

export class NoopTracer implements Tracer {
  startSpan(
    _name: string,
    _options?: { attributes?: Record<string, string | number | boolean>; parent?: Span },
  ): Span {
    return new NoopSpan();
  }

  async withSpan<T>(
    _name: string,
    fn: (_span: Span) => Promise<T>,
    _options?: { attributes?: Record<string, string | number | boolean>; parent?: Span },
  ): Promise<T> {
    const span = this.startSpan(_name);
    try {
      return await fn(span);
    } finally {
      span.end();
    }
  }
}
