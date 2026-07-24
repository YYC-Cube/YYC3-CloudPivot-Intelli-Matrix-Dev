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
 * @file MetricsBridge.ts
 * @description Metrics → OpenTelemetry 桥接器
 *              定时从 Metrics 读取数据并推送到 OTLP 端点
 *              OTel 未安装时降级到文件/日志输出
 */

import { logger } from '../deps/logger.js';
import { metrics } from '../deps/metrics.js';
import fs from 'node:fs';
import path from 'node:path';

export interface MetricsBridgeConfig {
  /** 推送间隔（ms） */
  interval?: number;
  /** OTLP HTTP 端点（可选），例如 http://localhost:4318/v1/metrics */
  otlpEndpoint?: string;
  /** 服务名称 */
  serviceName?: string;
  /** 是否启用文件导出（当 OTel 不可用时） */
  fileExport?: boolean;
  /** 文件导出路径 */
  filePath?: string;
}

const DEFAULT_CONFIG: Required<MetricsBridgeConfig> = {
  interval: 15_000,
  otlpEndpoint: '',
  serviceName: 'yyc3-family-core',
  fileExport: false,
  filePath: './data/metrics.jsonl',
};

export class MetricsBridge {
  private config: Required<MetricsBridgeConfig>;
  private timer: ReturnType<typeof setInterval> | null = null;
  private otelAvailable = false;

  constructor(config: MetricsBridgeConfig = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /** 启动指标推送 */
  start(): void {
    if (this.timer) return;

    // 检测 OTel 是否可用
    this.checkOTelAvailability();

    this.timer = setInterval(() => this.push(), this.config.interval);
    logger.info('Metrics bridge 已启动', 'MetricsBridge', {
      interval: this.config.interval,
      otelAvailable: this.otelAvailable,
      fileExport: this.config.fileExport,
    });

    // 立即推送一次
    this.push();
  }

  /** 停止指标推送 */
  stop(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
    logger.info('Metrics bridge 已停止', 'MetricsBridge');
  }

  /** 手动触发一次推送 */
  push(): void {
    try {
      if (this.otelAvailable) {
        this.pushToOTel();
      }
      if (this.config.fileExport) {
        this.pushToFile();
      }
    } catch (err) {
      logger.error('Metrics push 失败', 'MetricsBridge', { error: err instanceof Error ? err.message : String(err) });
    }
  }

  private checkOTelAvailability(): void {
    try {
      // 动态检测 @opentelemetry/api
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      require('@opentelemetry/api');
      this.otelAvailable = true;
    } catch {
      this.otelAvailable = false;
    }
  }

  private pushToOTel(): void {
    // OTel 推送逻辑 — 接入 @opentelemetry/api 时启用
    // 当前版本暂不实现 OTLP HTTP 推送，保留扩展点
    logger.debug('OTel metrics push (not yet implemented)', 'MetricsBridge');
  }

  private pushToFile(): void {
    try {
      const dir = path.dirname(this.config.filePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      const data = JSON.stringify({
        timestamp: new Date().toISOString(),
        metrics: metrics.exportJSON(),
      }) + '\n';
      fs.appendFileSync(this.config.filePath, data, 'utf-8');
    } catch (err) {
      logger.error('Metrics 文件写入失败', 'MetricsBridge', { error: String(err) });
    }
  }

  /** 获取桥接器状态 */
  getStatus(): { running: boolean; otelAvailable: boolean; fileExport: boolean } {
    return {
      running: this.timer !== null,
      otelAvailable: this.otelAvailable,
      fileExport: this.config.fileExport,
    };
  }
}
