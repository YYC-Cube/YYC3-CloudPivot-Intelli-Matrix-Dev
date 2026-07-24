/**
 * file: secure-random.ts
 * description: 安全随机生成 — 基于 crypto 模块的密码学安全随机数
 * author: YanYuCloudCube Team <admin@0379.email>
 * version: v2.0.0
 * created: 2026-03-21
 * updated: 2026-06-09
 * status: active
 * tags: [infra],[security],[crypto],[random]
 *
 * brief: 密码学安全的 UUID/hex/base64 随机值生成工具
 *
 * details:
 * - generateSecureUuid() 生成 v4 UUID（RFC 4122）
 * - generateSecureHex() 生成指定长度的十六进制随机串
 * - generateSecureBase64() 生成 Base64 编码的随机字节
 * - 基于 Node.js crypto.randomBytes/randomInt/randomUUID
 *
 * dependencies: node:crypto
 * exports: generateSecureUuid, generateSecureHex, generateSecureBase64
 * notes: 浏览器环境需使用 Web Crypto API 替代
 */

import { randomBytes, randomInt, randomUUID } from "node:crypto";

export function generateSecureUuid(): string {
  return randomUUID();
}

export function generateSecureToken(bytes = 16): string {
  return randomBytes(bytes).toString("base64url");
}

export function generateSecureHex(bytes = 16): string {
  return randomBytes(bytes).toString("hex");
}

export function generateSecureFraction(): number {
  return randomBytes(4).readUInt32BE(0) / 0x1_0000_0000;
}

export function generateSecureInt(maxExclusive: number): number;
export function generateSecureInt(minInclusive: number, maxExclusive: number): number;
export function generateSecureInt(a: number, b?: number): number {
  return typeof b === "number" ? randomInt(a, b) : randomInt(a);
}
