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
 * types.ts
 * ========
 * 追踪 API 类型定义 — 轻量抽象层，可接入 OpenTelemetry
 */

/** Span 状态 */
export type SpanStatus = 'ok' | 'error' | 'unset';

/** 追踪 Span 接口 */
export interface Span {
  /** 设置属性 */
  setAttribute(key: string, value: string | number | boolean): void;
  /** 批量设置属性 */
  setAttributes(attrs: Record<string, string | number | boolean>): void;
  /** 添加事件 */
  addEvent(name: string, attributes?: Record<string, string | number | boolean>): void;
  /** 设置状态 */
  setStatus(status: SpanStatus, description?: string): void;
  /** 记录异常 */
  recordException(error: Error): void;
  /** 结束 span */
  end(): void;
  /** 是否活跃 */
  isRecording(): boolean;
}

/** 追踪器接口 */
export interface Tracer {
  /** 创建一个新的 span */
  startSpan(
    name: string,
    options?: {
      attributes?: Record<string, string | number | boolean>;
      parent?: Span;
    },
  ): Span;

  /** 使用回调方式创建 span，自动结束 */
  withSpan<T>(
    name: string,
    fn: (span: Span) => Promise<T>,
    options?: {
      attributes?: Record<string, string | number | boolean>;
      parent?: Span;
    },
  ): Promise<T>;
}

/** 追踪提供商配置 */
export interface TracingConfig {
  /** 服务名称 */
  serviceName?: string;
  /** 服务版本 */
  serviceVersion?: string;
  /** 环境名称 */
  environment?: string;
  /** OpenTelemetry 端点（可选） */
  otlpEndpoint?: string;
  /** 采样率 (0-1) */
  sampleRate?: number;
  /** 是否启用 */
  enabled?: boolean;
  /** 自定义属性 */
  attributes?: Record<string, string>;
}
