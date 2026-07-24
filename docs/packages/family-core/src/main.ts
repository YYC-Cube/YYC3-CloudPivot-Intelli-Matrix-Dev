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
 * @file main.ts
 * @description YYC³ Family Core — 统一启动入口
 *              集成：环境校验 → 进程保护 → 日志初始化 → HTTP 服务
 */

import { createServer, type IncomingMessage, type ServerResponse } from 'node:http';
import { validateEnvironment } from './config/EnvValidator.js';
import { installProcessGuard } from './deps/process-guard.js';
import { logger } from './deps/logger.js';
import { metrics } from './deps/metrics.js';

export interface AppConfig {
  port: number;
  healthEndpoint?: string;
  metricsEndpoint?: string;
}

const DEFAULT_CONFIG: AppConfig = {
  port: parseInt(process.env.PORT ?? '3000', 10),
  healthEndpoint: '/health',
  metricsEndpoint: '/metrics',
};

// ═══ 启动前校验 ═══

function preflight(): void {
  // 1. 环境变量校验（不阻塞启动，仅警告）
  const envResult = validateEnvironment();
  if (!envResult.valid) {
    logger.error('环境变量校验未通过', 'Main', { missing: envResult.missing });
  }

  // 2. 设置日志级别
  const logLevel = envResult.config.LOG_LEVEL || 'info';
  logger.setLevel(logLevel as 'debug' | 'info' | 'warn' | 'error');

  // 3. JSON 日志模式
  if (envResult.config.LOG_FORMAT === 'json') {
    logger.setJsonMode(true);
  }

  // 4. 安装全局未捕获异常处理
  installProcessGuard({
    exitOnUncaught: process.env.NODE_ENV === 'production',
  });
}

// ═══ HTTP 请求路由 ═══

function routeRequest(url: string): { handler: string; params: Record<string, string> } {
  if (url === '/health' || url === '/health/') return { handler: 'health', params: {} };
  if (url === '/metrics' || url === '/metrics/') return { handler: 'metrics', params: {} };
  return { handler: '404', params: {} };
}

function handleHealth(_req: IncomingMessage, res: ServerResponse): void {
  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage().heapUsed,
  }));
}

function handleMetrics(_req: IncomingMessage, res: ServerResponse): void {
  res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' });
  res.end(metrics.exportPrometheus());
}

function handleNotFound(_req: IncomingMessage, res: ServerResponse): void {
  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: 'Not Found' }));
}

// ═══ HTTP 服务创建 ═══

export function createApp(config?: Partial<AppConfig>) {
  const cfg: AppConfig = { ...DEFAULT_CONFIG, ...config };
  preflight();

  const server = createServer((req, res) => {
    const route = routeRequest(req.url ?? '/');
    switch (route.handler) {
      case 'health':  return handleHealth(req, res);
      case 'metrics': return handleMetrics(req, res);
      default:        return handleNotFound(req, res);
    }
  });

  return server;
}

// ═══ 启动 ═══

export function start(config?: Partial<AppConfig>): { server: ReturnType<typeof createServer>; url: string } {
  const server = createApp(config);

  const port = (config?.port ?? DEFAULT_CONFIG.port);
  server.listen(port, () => {
    logger.info(`YYC³ Family Core 已启动`, 'Main', {
      port,
      nodeEnv: process.env.NODE_ENV ?? 'development',
      healthEndpoint: `http://localhost:${port}${DEFAULT_CONFIG.healthEndpoint}`,
      metricsEndpoint: `http://localhost:${port}${DEFAULT_CONFIG.metricsEndpoint}`,
    });
  });

  return { server, url: `http://localhost:${port}` };
}

// ═══ 直接执行时启动（CLI） ═══
if (process.argv[1]?.endsWith('main.ts') || process.argv[1]?.endsWith('main.js')) {
  start();
}
