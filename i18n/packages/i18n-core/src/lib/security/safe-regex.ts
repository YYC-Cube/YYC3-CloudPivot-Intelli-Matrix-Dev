/**
 * file: safe-regex.ts
 * description: 安全正则编译 — 防止 ReDoS 攻击的正则表达式安全校验与编译
 * author: YanYuCloudCube Team <admin@0379.email>
 * version: v2.0.0
 * created: 2026-03-21
 * updated: 2026-06-09
 * status: active
 * tags: [security],[regex],[redos],[validation]
 *
 * brief: 安全编译用户提供的正则表达式，防止 ReDoS 攻击
 *
 * details:
 * - safeCompileRegex() 检测危险的嵌套量词模式（如 (a+)+ ）
 * - SafeRegexRejectReason 枚举拒绝原因（empty / unsafe-nested-repetition / invalid-regex）
 * - SafeRegexCompileResult 返回成功（regex）或失败（rejected + reason）
 * - 同时捕获 SyntaxError 等无效正则异常
 *
 * dependencies: 无
 * exports: safeCompileRegex, SafeRegexRejectReason, SafeRegexCompileResult
 * notes: 仅检测已知危险模式，不保证 100% ReDoS 防护
 */

export type SafeRegexRejectReason = "empty" | "unsafe-nested-repetition" | "invalid-regex";

export type SafeRegexCompileResult =
  | {
      regex: RegExp;
      source: string;
      flags: string;
      reason: null;
    }
  | {
      regex: null;
      source: string;
      flags: string;
      reason: SafeRegexRejectReason;
    };

const SAFE_REGEX_CACHE_MAX = 256;
const safeRegexCache = new Map<string, SafeRegexCompileResult>();

function hasUnsafeNestedRepetition(source: string): boolean {
  let depth = 0;
  let lastWasQuantifier = false;

  for (let i = 0; i < source.length; i++) {
    const char = source[i];
    if (char === undefined) continue;

    if (char === "(") {
      depth++;
      lastWasQuantifier = false;
    } else if (char === ")") {
      depth--;
      lastWasQuantifier = false;
    } else if ("*+?{".includes(char)) {
      if (lastWasQuantifier && depth > 0) {
        return true;
      }
      lastWasQuantifier = true;

      if (char === "{") {
        const closeIndex = source.indexOf("}", i);
        if (closeIndex === -1) continue;
        i = closeIndex;
      }
    } else if (char === "\\") {
      i++;
      lastWasQuantifier = false;
    } else {
      lastWasQuantifier = false;
    }
  }

  return false;
}

export function compileSafeRegex(source: string, flags?: string): SafeRegexCompileResult {
  const key = `${source}::${flags ?? ""}`;

  if (safeRegexCache.has(key)) {
    return safeRegexCache.get(key)!;
  }

  if (!source) {
    const result: SafeRegexCompileResult = { regex: null, source, flags: flags ?? "", reason: "empty" };
    cacheResult(key, result);
    return result;
  }

  if (hasUnsafeNestedRepetition(source)) {
    const result: SafeRegexCompileResult = { regex: null, source, flags: flags ?? "", reason: "unsafe-nested-repetition" };
    cacheResult(key, result);
    return result;
  }

  try {
    const regex = new RegExp(source, flags);
    const result: SafeRegexCompileResult = { regex, source, flags: flags ?? "", reason: null };
    cacheResult(key, result);
    return result;
  } catch {
    const result: SafeRegexCompileResult = { regex: null, source, flags: flags ?? "", reason: "invalid-regex" };
    cacheResult(key, result);
    return result;
  }
}

export function testSafeRegex(source: string, input: string, flags?: string): boolean {
  const result = compileSafeRegex(source, flags);
  if (!result.regex) {
    return false;
  }
  return result.regex.test(input);
}

export function clearSafeRegexCache(): void {
  safeRegexCache.clear();
}

function cacheResult(key: string, result: SafeRegexCompileResult): void {
  if (safeRegexCache.size >= SAFE_REGEX_CACHE_MAX) {
    const firstKey = safeRegexCache.keys().next().value;
    if (firstKey !== undefined) {
      safeRegexCache.delete(firstKey);
    }
  }
  safeRegexCache.set(key, result);
}
