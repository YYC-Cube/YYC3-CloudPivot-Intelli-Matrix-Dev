/**
 * file: i18n-audit.ts
 * description: 国际化审计工具 — 翻译缺失检测、审计日志与报告导出
 * author: YanYuCloudCube Team <admin@0379.email>
 * version: v2.0.0
 * created: 2026-03-21
 * updated: 2026-06-09
 * status: active
 * tags: [util],[i18n],[audit],[quality]
 *
 * brief: 翻译覆盖审计，检测缺失 key 并生成结构化报告
 *
 * details:
 * - I18nAuditLogger 收集翻译缺失事件
 * - createAuditedT() 包装 t() 函数，自动记录 key==fallback 的缺失
 * - exportReport() 导出格式化文本报告
 * - enable()/disable() 开关控制，支持生产环境关闭
 * - 自动过滤 config.* 和模板字面量起始 key
 *
 * dependencies: translate.js
 * exports: I18nAuditLogger, createAuditedT
 * notes: 开发/测试环境使用，生产环境建议 disable
 */

import { t } from "./translate.js";

interface I18nAuditEntry {
  key: string;
  fallback: string;
  location: string;
  timestamp: number;
}

class I18nAuditLogger {
  private entries: I18nAuditEntry[] = [];
  private enabled = false;

  enable() {
    this.enabled = true;
    this.entries = [];
    console.log("[i18n-audit] ✅ Translation audit ENABLED");
  }

  disable() {
    this.enabled = false;
    console.log(`[i18n-audit] ❌ Translation audit DISABLED (${this.entries.length} entries)`);
  }

  log(key: string, fallback: string, location: string) {
    if (!this.enabled) return;

    const entry: I18nAuditEntry = {
      key,
      fallback,
      location,
      timestamp: Date.now(),
    };

    this.entries.push(entry);

    console.warn(
      `[i18n-audit] Missing translation:\n` +
      `  🔑 Key: ${key}\n` +
      `  📝 Fallback: "${fallback}"\n` +
      `  📍 Location: ${location}`
    );
  }

  getReport(): { total: number; uniqueKeys: Set<string>; entries: I18nAuditEntry[] } {
    const uniqueKeys = new Set(this.entries.map(e => e.key));
    return {
      total: this.entries.length,
      uniqueKeys,
      entries: this.entries,
    };
  }

  exportReport(): string {
    const report = this.getReport();

    let output = `\n${"=".repeat(80)}\n`;
    output += `📊 I18N AUDIT REPORT\n`;
    output += `${"=".repeat(80)}\n\n`;
    output += `Total missing translations: ${report.total}\n`;
    output += `Unique keys missing: ${report.uniqueKeys.size}\n\n`;

    output += `📋 MISSING TRANSLATION KEYS:\n`;
    output += `${"-".repeat(80)}\n\n`;

    for (const key of Array.from(report.uniqueKeys).sort()) {
      const examples = report.entries.filter(e => e.key === key).slice(0, 3);
      output += `❌ ${key}\n`;
      if (examples.length > 0) {
        output += `   Example fallback: "${examples[0]?.fallback}"\n`;
        output += `   Found in: ${examples[0]?.location}\n\n`;
      }
    }

    output += `${"=".repeat(80)}\n\n`;

    return output;
  }

  clear() {
    this.entries = [];
  }
}

export const i18nAudit = new I18nAuditLogger();

export function createAuditedT(location: string) {
  return (key: string, params?: Record<string, string>): string => {
    const result = t(key, params);

    if (result === key && !key.startsWith("{") && !key.startsWith("config.")) {
      i18nAudit.log(key, key, location);
    } else if (result === `${key}.label` || result === `${key}.help`) {
      i18nAudit.log(key, result.replace(`${key}.`, ""), location);
    }

    return result;
  };
}
