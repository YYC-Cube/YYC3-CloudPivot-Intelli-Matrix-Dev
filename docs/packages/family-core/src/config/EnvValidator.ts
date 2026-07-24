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
 * @file EnvValidator.ts
 * @description 启动时环境变量校验 — 确保必需配置均已设置
 */

import { logger } from '../deps/logger.js';

/** 环境变量定义 */
export interface EnvVarDef {
  key: string;
  required?: boolean;
  description?: string;
  defaultValue?: string;
  validate?: (value: string) => boolean;
}

/** 预定义的校验规则 */
export const REQUIRED_ENV_VARS: EnvVarDef[] = [
  { key: 'NODE_ENV', required: false, defaultValue: 'development', description: '运行环境' },
  { key: 'LOG_LEVEL', required: false, defaultValue: 'info', description: '日志级别 (debug|info|warn|error)' },
  { key: 'LOG_FORMAT', required: false, defaultValue: 'text', description: '日志格式 (text|json)' },
  { key: 'OPENAI_API_KEY', required: false, description: 'OpenAI API Key' },
  { key: 'ANTHROPIC_API_KEY', required: false, description: 'Anthropic API Key' },
  { key: 'GOOGLE_API_KEY', required: false, description: 'Google AI API Key (Gemini)' },
  { key: 'REDIS_URL', required: false, defaultValue: 'redis://localhost:6379', description: 'Redis 连接 URL' },
  { key: 'OTEL_EXPORTER_OTLP_ENDPOINT', required: false, description: 'OpenTelemetry OTLP 端点' },
  { key: 'PORT', required: false, defaultValue: '3000', description: 'HTTP 服务端口' },
];

export interface EnvValidationResult {
  valid: boolean;
  missing: string[];
  warnings: string[];
  config: Record<string, string>;
}

/**
 * 验证并加载环境变量
 */
export function validateEnvironment(vars?: EnvVarDef[]): EnvValidationResult {
  const defs = vars ?? REQUIRED_ENV_VARS;
  const result: EnvValidationResult = {
    valid: true,
    missing: [],
    warnings: [],
    config: {},
  };

  for (const def of defs) {
    const value = process.env[def.key] ?? def.defaultValue ?? '';

    if (!value && def.required) {
      result.valid = false;
      result.missing.push(def.key);
      logger.warn(`缺少必需环境变量: ${def.key} — ${def.description ?? ''}`, 'EnvValidator');
    } else if (!value && !def.required) {
      // 可选的未设置变量 — 仅记录
      result.config[def.key] = '';
    } else {
      if (def.validate && !def.validate(value)) {
        result.valid = false;
        result.warnings.push(`${def.key} 值无效: ${value}`);
      }
      result.config[def.key] = value;
    }
  }

  if (result.missing.length > 0) {
    logger.error(`环境验证失败: 缺少 ${result.missing.join(', ')}`, 'EnvValidator');
  }

  return result;
}

/**
 * 标记-使用模式：阻止未校验的 env 读取
 */
let validated = false;

export function ensureValidated(): void {
  if (validated) return;
  const result = validateEnvironment();
  validated = true;

  if (!result.valid) {
    console.error('═══════════════════════════════════════════');
    console.error('  启动失败: 环境变量配置不完整');
    console.error(`  缺少: ${result.missing.join(', ')}`);
    console.error('  请检查 .env 文件或环境变量设置');
    console.error('═══════════════════════════════════════════');
    // 不自动退出 — 让调用方决定处理方式
  }
}
