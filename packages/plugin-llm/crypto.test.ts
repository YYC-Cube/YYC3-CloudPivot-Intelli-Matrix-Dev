/**
 * @file: crypto.test.ts
 * @description: AES-256-GCM 加密存储单元测试
 */
import { describe, expect, it } from "vitest";
import {
  checkWebCrypto,
  decryptString,
  encryptString,
  generateDemoKey,
  getDeviceFingerprint,
  isWebCryptoAvailable,
} from "./src/crypto";

describe("WebCrypto 运行时自检", () => {
  it("Node/jsdom 安全上下文应自检通过", () => {
    const check = checkWebCrypto();
    expect(check.ok).toBe(true);
    expect(check.reason).toBeUndefined();
  });

  it("isWebCryptoAvailable 应与 checkWebCrypto().ok 一致", () => {
    expect(isWebCryptoAvailable()).toBe(checkWebCrypto().ok);
  });
});

describe("AES-256-GCM 加密", () => {
  const PASSPHRASE = "yyc3-test-passphrase-2026";

  it("应正确加密并解密字符串", async () => {
    const plaintext = "sk-openai-test-key-1234567890";
    const encrypted = await encryptString(plaintext, PASSPHRASE);
    expect(encrypted).not.toBe(plaintext);
    expect(encrypted.length).toBeGreaterThan(0);

    const decrypted = await decryptString(encrypted, PASSPHRASE);
    expect(decrypted).toBe(plaintext);
  });

  it("每次加密应使用独立 IV — 同一明文两次密文应不同", async () => {
    const plaintext = "sk-same-key";
    const enc1 = await encryptString(plaintext, PASSPHRASE);
    const enc2 = await encryptString(plaintext, PASSPHRASE);
    expect(enc1).not.toBe(enc2);
    expect(await decryptString(enc1, PASSPHRASE)).toBe(plaintext);
    expect(await decryptString(enc2, PASSPHRASE)).toBe(plaintext);
  });

  it("错误口令应无法解密", async () => {
    const encrypted = await encryptString("secret", PASSPHRASE);
    await expect(decryptString(encrypted, "wrong-passphrase")).rejects.toThrow();
  });

  it("应支持中文 / Unicode 字符", async () => {
    const plaintext = "密钥：我是中文 🔑 + emoji";
    const encrypted = await encryptString(plaintext, PASSPHRASE);
    const decrypted = await decryptString(encrypted, PASSPHRASE);
    expect(decrypted).toBe(plaintext);
  });

  it("空字符串应原样返回", async () => {
    const enc = await encryptString("", PASSPHRASE);
    expect(enc).toBe("");
    expect(await decryptString("", PASSPHRASE)).toBe("");
  });

  it("应支持长字符串 (API Key + 多行 metadata)", async () => {
    const longKey = "sk-" + "a".repeat(500);
    const enc = await encryptString(longKey, PASSPHRASE);
    const dec = await decryptString(enc, PASSPHRASE);
    expect(dec).toBe(longKey);
  });

  it("密文格式应为 base64 编码的 JSON Blob", async () => {
    const enc = await encryptString("test", PASSPHRASE);
    const blob = JSON.parse(atob(enc));
    expect(blob.v).toBe(1);
    expect(blob.salt).toMatch(/^[A-Za-z0-9+/]+={0,2}$/);
    expect(blob.iv).toMatch(/^[A-Za-z0-9+/]+={0,2}$/);
    expect(blob.ct).toMatch(/^[A-Za-z0-9+/]+={0,2}$/);
    expect(blob.iter).toBe(100_000);
  });
});

describe("设备指纹", () => {
  it("应返回稳定指纹 (同环境重复调用一致)", () => {
    const fp1 = getDeviceFingerprint();
    const fp2 = getDeviceFingerprint();
    expect(fp1).toBe(fp2);
    // 浏览器环境返回 yyc3-fp-<hash>; Node/SSR 环境返回服务端回退值
    const isBrowser = typeof window !== "undefined";
    expect(fp1.startsWith(isBrowser ? "yyc3-fp-" : "yyc3-server-fallback")).toBe(true);
  });
});

describe("演示 Key 生成", () => {
  it("应生成 32 字节 (64 hex) 的随机 Key", () => {
    const k1 = generateDemoKey();
    const k2 = generateDemoKey();
    expect(k1).not.toBe(k2);
    expect(k1).toMatch(/^sk-yyc3-[a-f0-9]{64}$/);
  });

  it("应支持自定义前缀", () => {
    const k = generateDemoKey("sk-custom");
    expect(k).toMatch(/^sk-custom-[a-f0-9]{64}$/);
  });
});
