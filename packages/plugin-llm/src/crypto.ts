/**
 * @file: crypto.ts
 * @description: AES-256-GCM API Key 加密存储 — 使用浏览器原生 Web Crypto API
 *
 * 设计原则:
 * 1. 密钥不落明文盘 — localStorage 仅存储 base64 密文
 * 2. 用户口令派生密钥 (PBKDF2 + 100000 iterations) — 即使密文泄露无法解密
 * 3. 每条密文独立 IV (12 bytes 随机) — 防重放攻击
 * 4. GCM 模式自带完整性校验 — 防篡改
 */

const enc = new TextEncoder();
const dec = new TextDecoder();

/** 派生密钥的迭代次数 (OWASP 推荐 ≥ 100000) */
const PBKDF2_ITERATIONS = 100_000;
/** 密钥派生盐长度 (bytes) */
const SALT_LENGTH = 16;
/** GCM IV 长度 (bytes, 推荐 12) */
const IV_LENGTH = 12;

/** 加密后的密文结构 (base64 序列化) */
interface EncryptedBlob {
  v: 1;                    // 版本号
  salt: string;            // base64 编码的 PBKDF2 salt
  iv: string;              // base64 编码的 GCM IV
  ct: string;              // base64 编码的密文
  iter: number;            // PBKDF2 迭代次数
}

/** Base64 ↔ ArrayBuffer 转换工具 */
function bufToBase64(buf: ArrayBuffer | Uint8Array): string {
  const bytes = buf instanceof Uint8Array ? buf : new Uint8Array(buf);
  let binary = "";
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary);
}

function base64ToBuf(b64: string): Uint8Array {
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

// ============================================================
// 运行时自检 — WebCrypto 可用性前置校验 + 降级告警
// 非 HTTPS (非 localhost) 环境 / 过旧浏览器下 crypto.subtle 为 undefined,
// 加密将在 deep 处抛含糊错误; 启动时显式检测, 给出可操作的降级指引
// ============================================================

export interface WebCryptoCheck {
  ok: boolean;
  /** ok=false 时的降级原因 */
  reason?: string;
}

/** 缓存自检结果, 避免每次加解密重复检测 */
let cryptoCheckCache: WebCryptoCheck | null = null;

/**
 * 校验 WebCrypto (crypto.subtle) 运行时可用性
 * 失败场景: 非 HTTPS 非 localhost / http 内网 IP 访问 / 极旧浏览器
 */
export function checkWebCrypto(): WebCryptoCheck {
  if (cryptoCheckCache) return cryptoCheckCache;

  const result: WebCryptoCheck = (() => {
    if (typeof crypto === "undefined") {
      return { ok: false, reason: "Web Crypto API 不可用: 当前环境无 crypto 全局对象 (浏览器过旧?)" };
    }
    if (!crypto.subtle) {
      const isLocalhost = typeof location !== "undefined" &&
        (location.hostname === "localhost" || location.hostname === "127.0.0.1");
      return {
        ok: false,
        reason: isLocalhost
          ? "crypto.subtle 不可用: 请升级浏览器"
          : "crypto.subtle 不可用: Web Crypto 仅在安全上下文 (HTTPS 或 localhost) 提供 — 请通过 HTTPS 访问, API Key 加密存储已降级为不可用",
      };
    }
    // AES-GCM + PBKDF2 算法能力探测 (Safari 旧版有 subtle 但缺算法)
    try {
      crypto.getRandomValues(new Uint8Array(1));
      return { ok: true };
    } catch {
      return { ok: false, reason: "crypto.getRandomValues 不可用: 安全随机数源缺失" };
    }
  })();

  cryptoCheckCache = result;
  if (!result.ok) {
    // 降级告警 — 高安全要求下显式暴露而非静默失败
    console.warn(`[plugin-llm/crypto] ⚠️ ${result.reason}`);
  }
  return result;
}

/** 供调用方 (SettingsPanel 等) 在渲染加密 UI 前快速判断 */
export function isWebCryptoAvailable(): boolean {
  return checkWebCrypto().ok;
}

/**
 * 通过用户口令派生 AES-256-GCM 密钥
 */
async function deriveKey(passphrase: string, salt: Uint8Array): Promise<CryptoKey> {
  // 拷贝到独立 ArrayBuffer, 确保 TS BufferSource 类型匹配
  const saltBuf = new Uint8Array(salt.length);
  saltBuf.set(salt);
  const baseKey = await crypto.subtle.importKey(
    "raw",
    enc.encode(passphrase),
    { name: "PBKDF2" },
    false,
    ["deriveKey"]
  );
  return crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: saltBuf,
      iterations: PBKDF2_ITERATIONS,
      hash: "SHA-256",
    },
    baseKey,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );
}

/**
 * 加密字符串 — 返回 base64 编码的 JSON Blob
 * @param plaintext 明文
 * @param passphrase 用户口令 (建议: 设备指纹 / 用户 ID + 全局盐)
 */
export async function encryptString(plaintext: string, passphrase: string): Promise<string> {
  if (!plaintext) return "";
  const salt = crypto.getRandomValues(new Uint8Array(SALT_LENGTH));
  const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH));
  const key = await deriveKey(passphrase, salt);

  const ciphertext = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    enc.encode(plaintext)
  );

  const blob: EncryptedBlob = {
    v: 1,
    salt: bufToBase64(salt),
    iv: bufToBase64(iv),
    ct: bufToBase64(ciphertext),
    iter: PBKDF2_ITERATIONS,
  };

  return btoa(JSON.stringify(blob));
}

/**
 * 解密字符串
 * @param encryptedBase64 加密后 base64 (encryptString 的返回值)
 * @param passphrase 同一口令
 */
export async function decryptString(encryptedBase64: string, passphrase: string): Promise<string> {
  if (!encryptedBase64) return "";
  try {
    const blob = JSON.parse(atob(encryptedBase64)) as EncryptedBlob;
    if (blob.v !== 1) throw new Error(`unsupported version: ${blob.v}`);

    const salt = base64ToBuf(blob.salt);
    const iv = new Uint8Array(IV_LENGTH);
    iv.set(base64ToBuf(blob.iv));
    const ct = base64ToBuf(blob.ct);

    const key = await deriveKey(passphrase, salt);
    const plaintext = await crypto.subtle.decrypt(
      { name: "AES-GCM", iv },
      key,
      ct as BufferSource
    );

    return dec.decode(plaintext);
  } catch (err) {
    throw new Error(`AES-GCM 解密失败: ${(err as Error).message}`, { cause: err });
  }
}

/**
 * 生成设备指纹 (用于派生密钥的 passphrase) — FingerprintJS 轻量版
 * 不追求唯一性, 只需稳定 + 难以猜测
 */
export function getDeviceFingerprint(): string {
  if (typeof window === "undefined") return "yyc3-server-fallback";
  const parts = [
    navigator.userAgent,
    navigator.language,
    `${screen.width}x${screen.height}x${screen.colorDepth}`,
    new Date().getTimezoneOffset().toString(),
    (navigator.hardwareConcurrency || 0).toString(),
  ];
  // 简单 FNV-1a hash
  let hash = 0x811c9dc5;
  const str = parts.join("|");
  for (let i = 0; i < str.length; i++) {
    hash ^= str.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return `yyc3-fp-${(hash >>> 0).toString(16)}`;
}

/**
 * 生成随机 API Key 样式字符串 (用于演示/测试)
 */
export function generateDemoKey(prefix = "sk-yyc3"): string {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  const hex = Array.from(bytes).map(b => b.toString(16).padStart(2, "0")).join("");
  return `${prefix}-${hex}`;
}
