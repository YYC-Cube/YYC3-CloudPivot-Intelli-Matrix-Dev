/**
 * file: secret-equal.ts
 * description: 安全字符串比较 — 基于 timingSafeEqual 的恒定时间密钥比较
 * author: YanYuCloudCube Team <admin@0379.email>
 * version: v2.0.0
 * created: 2026-03-21
 * updated: 2026-06-09
 * status: active
 * tags: [security],[crypto],[timing-safe],[secret]
 *
 * brief: 恒定时间字符串比较，防止时序攻击
 *
 * details:
 * - safeEqualSecret() 使用 Node.js timingSafeEqual 进行恒定时间比较
 * - 输入先经过 SHA-256 哈希归一化为固定长度
 * - 防止通过比较耗时差异推断密钥内容（时序侧信道攻击）
 * - 适用于 API Key、Token 等敏感字符串的比较
 *
 * dependencies: node:crypto
 * exports: safeEqualSecret
 * notes: 浏览器环境需用 Web Crypto API subtle.digest 替代
 */

import { createHash, timingSafeEqual } from "node:crypto";

export function safeEqualSecret(
  provided: string | undefined | null,
  expected: string | undefined | null,
): boolean {
  if (typeof provided !== "string" || typeof expected !== "string") {
    return false;
  }
  const hash = (s: string) => createHash("sha256").update(s).digest();
  return timingSafeEqual(hash(provided), hash(expected));
}
