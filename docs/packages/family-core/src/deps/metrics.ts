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
 * @file metrics.ts
 * @description 生产级指标收集 — 支持 Prometheus 文本格式导出和 OpenTelemetry 推送
 */

export interface HistogramBuckets {
  count: number;
  sum: number;
  min: number;
  max: number;
  p50: number;
  p95: number;
  p99: number;
  values: number[];
}

class Metrics {
  private counters: Map<string, number> = new Map();
  private histograms: Map<string, HistogramBuckets> = new Map();
  private gauges: Map<string, number> = new Map();
  private maxHistogramValues = 1000;
  private startedAt = Date.now();

  increment(name: string, value: number = 1, labels?: Record<string, string>): void {
    const key = this.buildKey(name, labels);
    this.counters.set(key, (this.counters.get(key) || 0) + value);
  }

  histogram(name: string, value: number, labels?: Record<string, string>): void {
    const key = this.buildKey(name, labels);
    let buckets = this.histograms.get(key);
    if (!buckets) {
      buckets = { count: 0, sum: 0, min: Infinity, max: -Infinity, p50: 0, p95: 0, p99: 0, values: [] };
      this.histograms.set(key, buckets);
    }
    buckets.count++;
    buckets.sum += value;
    buckets.min = Math.min(buckets.min, value);
    buckets.max = Math.max(buckets.max, value);
    buckets.values.push(value);
    if (buckets.values.length > this.maxHistogramValues) {
      buckets.values.shift();
    }
    const sorted = [...buckets.values].sort((a, b) => a - b);
    buckets.p50 = sorted[Math.floor(sorted.length * 0.5)] || 0;
    buckets.p95 = sorted[Math.floor(sorted.length * 0.95)] || 0;
    buckets.p99 = sorted[Math.floor(sorted.length * 0.99)] || 0;
  }

  gauge(name: string, value: number, labels?: Record<string, string>): void {
    const key = this.buildKey(name, labels);
    this.gauges.set(key, value);
  }

  getCounter(name: string, labels?: Record<string, string>): number {
    return this.counters.get(this.buildKey(name, labels)) || 0;
  }

  getHistogram(name: string, labels?: Record<string, string>): HistogramBuckets | undefined {
    return this.histograms.get(this.buildKey(name, labels));
  }

  getGauge(name: string, labels?: Record<string, string>): number {
    return this.gauges.get(this.buildKey(name, labels)) || 0;
  }

  getAllCounters(): Map<string, number> {
    return new Map(this.counters);
  }

  getAllHistograms(): Map<string, HistogramBuckets> {
    return new Map(this.histograms);
  }

  getAllGauges(): Map<string, number> {
    return new Map(this.gauges);
  }

  /** 导出所有指标为 Prometheus 文本格式 */
  exportPrometheus(): string {
    const lines: string[] = [];
    lines.push('# HELP yyc3_metrics YYC³ Family Core metrics');
    lines.push(`# TYPE yyc3_uptime counter`);
    lines.push(`yyc3_uptime ${(Date.now() - this.startedAt) / 1000}`);

    for (const [key, value] of this.counters) {
      const [name, ...labelParts] = key.includes('{') ? key.split('{') : [key, ''];
      const labels = labelParts.join('{');
      if (name) {
        lines.push(`# TYPE ${this.sanitize(name)} counter`);
        lines.push(`${this.sanitize(name)}${labels ? `{${labels}` : ''} ${value}`);
      }
    }

    for (const [key, h] of this.histograms) {
      const [name, ...labelParts] = key.includes('{') ? key.split('{') : [key, ''];
      const labels = labelParts.join('{');
      if (name) {
        lines.push(`# TYPE ${this.sanitize(name)} histogram`);
        lines.push(`${this.sanitize(name)}_count${labels ? `{${labels}` : ''} ${h.count}`);
        lines.push(`${this.sanitize(name)}_sum${labels ? `{${labels}` : ''} ${h.sum}`);
        lines.push(`${this.sanitize(name)}_bucket{le="0.05"}${labels ? `,${labels}` : ''} ${h.p50}`);
      }
    }

    for (const [key, value] of this.gauges) {
      const [name, ...labelParts] = key.includes('{') ? key.split('{') : [key, ''];
      const labels = labelParts.join('{');
      if (name) {
        lines.push(`# TYPE ${this.sanitize(name)} gauge`);
        lines.push(`${this.sanitize(name)}${labels ? `{${labels}` : ''} ${value}`);
      }
    }

    return lines.join('\n');
  }

  /** 导出为 JSON（适合 OpenTelemetry / 日志采集） */
  exportJSON(): Record<string, unknown> {
    return {
      uptime: (Date.now() - this.startedAt) / 1000,
      counters: Object.fromEntries(this.counters),
      histograms: Object.fromEntries(
        Array.from(this.histograms.entries()).map(([k, v]) => [k, { ...v, values: v.values.length }]),
      ),
      gauges: Object.fromEntries(this.gauges),
    };
  }

  reset(): void {
    this.counters.clear();
    this.histograms.clear();
    this.gauges.clear();
    this.startedAt = Date.now();
  }

  private sanitize(name: string): string {
    return name.replace(/[^a-zA-Z0-9_:]/g, '_');
  }

  private buildKey(name: string, labels?: Record<string, string>): string {
    if (!labels || Object.keys(labels).length === 0) return name;
    const sorted = Object.entries(labels).sort(([a], [b]) => a.localeCompare(b));
    return `${name}{${sorted.map(([k, v]) => `${k}="${v}"`).join(',')}}`;
  }
}

export const metrics = new Metrics();
