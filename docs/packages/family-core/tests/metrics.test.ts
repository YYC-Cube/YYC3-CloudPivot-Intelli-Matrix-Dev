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

import { describe, it, expect, beforeEach } from 'vitest';
import { metrics, HistogramBuckets } from '../src/deps/metrics.js';

describe('Metrics', () => {
  beforeEach(() => {
    metrics.reset();
  });

  describe('counters', () => {
    it('should increment counter', () => {
      metrics.increment('requests');
      expect(metrics.getCounter('requests')).toBe(1);
    });

    it('should increment counter by value', () => {
      metrics.increment('bytes', 1024);
      expect(metrics.getCounter('bytes')).toBe(1024);
    });

    it('should increment counter with labels', () => {
      metrics.increment('api_call', 1, { method: 'GET', status: '200' });
      expect(metrics.getCounter('api_call', { method: 'GET', status: '200' })).toBe(1);
    });

    it('should separate counters by labels', () => {
      metrics.increment('api_call', 1, { status: '200' });
      metrics.increment('api_call', 1, { status: '404' });
      expect(metrics.getCounter('api_call', { status: '200' })).toBe(1);
      expect(metrics.getCounter('api_call', { status: '404' })).toBe(1);
      expect(metrics.getCounter('api_call')).toBe(0);
    });

    it('should return 0 for non-existent counter', () => {
      expect(metrics.getCounter('nonexistent')).toBe(0);
    });

    it('should get all counters', () => {
      metrics.increment('a');
      metrics.increment('b');
      const all = metrics.getAllCounters();
      expect(all.size).toBe(2);
      expect(all.get('a')).toBe(1);
    });
  });

  describe('histogram', () => {
    it('should track single value', () => {
      metrics.histogram('latency', 100);
      const h = metrics.getHistogram('latency')!;
      expect(h).toBeDefined();
      expect(h.count).toBe(1);
      expect(h.sum).toBe(100);
      expect(h.min).toBe(100);
      expect(h.max).toBe(100);
      expect(h.p50).toBe(100);
      expect(h.p95).toBe(100);
      expect(h.p99).toBe(100);
    });

    it('should compute min/max across values', () => {
      metrics.histogram('latency', 50);
      metrics.histogram('latency', 200);
      metrics.histogram('latency', 100);
      const h = metrics.getHistogram('latency')!;
      expect(h.count).toBe(3);
      expect(h.sum).toBe(350);
      expect(h.min).toBe(50);
      expect(h.max).toBe(200);
    });

    it('should compute percentiles', () => {
      const values = [10, 20, 30, 40, 50, 60, 70, 80, 90, 100];
      for (const v of values) {
        metrics.histogram('latency', v);
      }
      const h = metrics.getHistogram('latency')!;
      expect(h.count).toBe(10);
      expect(h.p50).toBe(60);
      expect(h.p95).toBe(100);
      expect(h.p99).toBe(100);
    });

    it('should track histogram with labels', () => {
      metrics.histogram('request_duration', 50, { endpoint: '/api/chat' });
      metrics.histogram('request_duration', 100, { endpoint: '/api/embed' });
      const chatH = metrics.getHistogram('request_duration', { endpoint: '/api/chat' });
      const embedH = metrics.getHistogram('request_duration', { endpoint: '/api/embed' });
      expect(chatH!.count).toBe(1);
      expect(chatH!.sum).toBe(50);
      expect(embedH!.count).toBe(1);
      expect(embedH!.sum).toBe(100);
    });

    it('should return undefined for non-existent histogram', () => {
      expect(metrics.getHistogram('nonexistent')).toBeUndefined();
    });

    it('should cap values at maxHistogramValues', () => {
      for (let i = 0; i < 1010; i++) {
        metrics.histogram('latency', i);
      }
      const h = metrics.getHistogram('latency')!;
      expect(h.values.length).toBeLessThanOrEqual(1000);
      expect(h.count).toBe(1010);
    });

    it('should get all histograms', () => {
      metrics.histogram('a', 1);
      metrics.histogram('b', 2);
      const all = metrics.getAllHistograms();
      expect(all.size).toBe(2);
    });
  });

  describe('gauge', () => {
    it('should set gauge value', () => {
      metrics.gauge('connections', 42);
      expect(metrics.getGauge('connections')).toBe(42);
    });

    it('should overwrite gauge value', () => {
      metrics.gauge('connections', 10);
      metrics.gauge('connections', 20);
      expect(metrics.getGauge('connections')).toBe(20);
    });

    it('should set gauge with labels', () => {
      metrics.gauge('queue_size', 5, { service: 'chat' });
      expect(metrics.getGauge('queue_size', { service: 'chat' })).toBe(5);
      expect(metrics.getGauge('queue_size')).toBe(0);
    });

    it('should return 0 for non-existent gauge', () => {
      expect(metrics.getGauge('nonexistent')).toBe(0);
    });

    it('should get all gauges', () => {
      metrics.gauge('a', 1);
      metrics.gauge('b', 2);
      const all = metrics.getAllGauges();
      expect(all.size).toBe(2);
    });
  });

  describe('label key building', () => {
    it('should sort labels alphabetically', () => {
      metrics.increment('test', 1, { z: '1', a: '2' });
      metrics.increment('test', 1, { a: '2', z: '1' });
      expect(metrics.getCounter('test', { z: '1', a: '2' })).toBe(2);
    });

    it('should use name as key when no labels', () => {
      metrics.increment('simple');
      expect(metrics.getCounter('simple')).toBe(1);
    });
  });

  describe('reset', () => {
    it('should clear all metrics', () => {
      metrics.increment('counter', 5);
      metrics.histogram('hist', 100);
      metrics.gauge('gauge', 42);
      metrics.reset();
      expect(metrics.getCounter('counter')).toBe(0);
      expect(metrics.getHistogram('hist')).toBeUndefined();
      expect(metrics.getGauge('gauge')).toBe(0);
    });
  });
});
