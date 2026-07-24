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

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { getTracer, resetTracer, setTracer, traceable, NoopTracer } from '../src/tracing/index';

describe('Tracing — NoopTracer', () => {
  beforeEach(() => resetTracer());
  afterEach(() => resetTracer());

  it('should return a NoopTracer by default', () => {
    const tracer = getTracer({ enabled: false });
    expect(tracer).toBeInstanceOf(NoopTracer);
  });

  it('should startSpan and return a span that is recording', () => {
    const tracer = getTracer({ enabled: false });
    const span = tracer.startSpan('test-span');
    expect(span.isRecording()).toBe(true);
    span.end();
    expect(span.isRecording()).toBe(false);
  });

  it('should allow setting attributes on span', () => {
    const tracer = getTracer({ enabled: false });
    const span = tracer.startSpan('attr-test');
    expect(() => span.setAttribute('key', 'value')).not.toThrow();
    expect(() => span.setAttributes({ a: 1, b: '2' })).not.toThrow();
    span.end();
  });

  it('should allow adding events and status', () => {
    const tracer = getTracer({ enabled: false });
    const span = tracer.startSpan('event-test');
    expect(() => span.addEvent('test-event')).not.toThrow();
    expect(() => span.setStatus('ok')).not.toThrow();
    span.end();
  });

  it('should allow recording exceptions', () => {
    const tracer = getTracer({ enabled: false });
    const span = tracer.startSpan('error-test');
    expect(() => span.recordException(new Error('test error'))).not.toThrow();
    span.end();
  });

  describe('withSpan', () => {
    it('should execute the callback with a span', async () => {
      const tracer = getTracer({ enabled: false });
      const result = await tracer.withSpan('test', async (span) => {
        expect(span.isRecording()).toBe(true);
        return 42;
      });
      expect(result).toBe(42);
    });

    it('should auto-end the span after callback', async () => {
      const tracer = getTracer({ enabled: false });
      let capturedSpan: any;
      await tracer.withSpan('test', async (span) => {
        capturedSpan = span;
      });
      expect(capturedSpan.isRecording()).toBe(false);
    });

    it('should set error status when callback throws', async () => {
      const tracer = getTracer({ enabled: false });
      await expect(
        tracer.withSpan('failing', async () => {
          throw new Error('oops');
        }),
      ).rejects.toThrow('oops');
    });
  });

  describe('setTracer', () => {
    it('should use custom tracer when set', () => {
      const customTracer = new NoopTracer();
      setTracer(customTracer);
      expect(getTracer()).toBe(customTracer);
    });
  });
});

describe('Tracing — traceable', () => {
  beforeEach(() => resetTracer());
  afterEach(() => resetTracer());

  it('should wrap an async function with tracing', async () => {
    const fn = async (x: number) => x * 2;
    const traced = traceable('double', fn);

    const result = await traced(21);
    expect(result).toBe(42);
  });

  it('should allow custom attribute extraction', async () => {
    const fn = async (name: string) => `Hello ${name}`;
    const traced = traceable(
      'greet',
      fn,
      (name: string) => ({ name }),
    );

    const result = await traced('World');
    expect(result).toBe('Hello World');
  });

  it('should propagate errors', async () => {
    const fn = async () => { throw new Error('fail'); };
    const traced = traceable('failing', fn);

    await expect(traced()).rejects.toThrow('fail');
  });
});
