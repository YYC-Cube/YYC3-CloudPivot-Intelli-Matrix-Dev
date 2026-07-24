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
 * index.ts
 * ========
 * 追踪模块统一导出
 */

export type { Span, Tracer, TracingConfig, SpanStatus } from './types';
export { getTracer, resetTracer, setTracer, traceable } from './TracerProvider';
export { NoopTracer } from './NoopTracer';
export { OTelTracer } from './OTelTracer';
