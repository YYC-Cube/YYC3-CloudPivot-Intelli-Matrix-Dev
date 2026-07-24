/**
 * file: index.ts
 * description: 内置插件汇总 — YYC³ 官方插件的统一导出入口
 * author: YanYuCloudCube Team <admin@0379.email>
 * version: v2.0.0
 * created: 2026-03-21
 * updated: 2026-06-09
 * status: active
 * tags: [plugin],[i18n],[index],[export]
 *
 * brief: YYC³ i18n 官方内置插件集合的统一导出
 *
 * details:
 * - ConsoleLoggerPlugin: 开发调试控制台日志
 * - MissingKeyReporterPlugin: 翻译缺失 Key 报告
 * - PerformanceTrackerPlugin: 翻译性能监控与分析
 * - 所有插件均实现 I18nPlugin 接口
 *
 * exports: ConsoleLoggerPlugin, MissingKeyReporterPlugin, PerformanceTrackerPlugin
 * notes: 新增插件需同步更新此文件导出
 */

export { createConsoleLogger } from "./console-logger.js";
export type { ConsoleLoggerConfig } from "./console-logger.js";

export { MissingKeyReporter } from "./missing-key-reporter.js";
export type { MissingKeyReporterConfig } from "./missing-key-reporter.js";

export { PerformanceTracker } from "./performance-tracker.js";
export type { PerformanceTrackerConfig, PerformanceMetrics } from "./performance-tracker.js";
