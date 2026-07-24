/**
 * @file: key-manager.ts
 * @description: API Key 管理 — AES-256-GCM 加密存储 + 多 Provider Keyring
 *
 * 存储:
 * - localStorage: 加密后的 Key (base64 blob)
 * - sessionStorage: 运行时解密后的 Key (会话级, 标签页关闭即清除)
 * - 内存 Map: 实际使用的 Key (与 sessionStorage 同步)
 *
 * 工作流:
 * 1. 用户首次进入 → setMasterPassword(password) 派生主密钥
 * 2. 用户输入 API Key → setKey(provider, apiKey) 加密后存 localStorage
 * 3. 应用启动 → unlock(password) 解密所有 Key 到内存
 * 4. 调用 LLM 时 → getKey(provider) 从内存取
 * 5. 用户退出 → lock() 清除内存和 sessionStorage
 */
import { decryptString, encryptString, getDeviceFingerprint } from "./crypto";
import { PROVIDER_PRESETS } from "./providers";
import type { LLMProvider, ProviderConfig } from "./types";

const STORAGE_KEY = "yyc3:llm:keyring:v1";
const SESSION_KEY = "yyc3:llm:unlocked:v1";

/** Keyring 条目 (单条 Provider Key) */
export interface KeyringEntry {
  provider: LLMProvider;
  encryptedKey: string;
  baseURL?: string;
  defaultModel?: string;
  addedAt: number;
}

/** Keyring 完整结构 */
interface Keyring {
  v: 1;
  entries: KeyringEntry[];
}

/** Keyring 状态 */
export type KeyringStatus = "uninitialized" | "locked" | "unlocked";

/** 空 Keyring */
const emptyKeyring = (): Keyring => ({ v: 1, entries: [] });

/**
 * API Key 管理器
 *
 * 加密口令派生:
 * - 默认: 设备指纹 (无需用户输入, 但安全性较低, 适合本地开发)
 * - 推荐: 用户主口令 (setMasterPassword)
 *
 * 注意: Web Crypto API 是异步的, 因此初始化方法都是 async
 * 应用启动时必须调用 await keyManager.initWithDeviceFingerprint() 或 await keyManager.unlock(password)
 */
export class APIKeyManager {
  private status: KeyringStatus = "uninitialized";
  private passphrase: string | null = null;
  private keys: Map<LLMProvider, string> = new Map();
  private keyringCache: Keyring | null = null;

  constructor() {
    // 仅同步检测状态, 不做异步解密
    if (typeof window === "undefined") return;
    if (this.readKeyring()) {
      this.status = "locked";
    } else {
      this.status = "uninitialized";
    }
  }

  /** 当前状态 */
  getStatus(): KeyringStatus {
    return this.status;
  }

  /** 检查 sessionStorage 是否存在恢复口令 */
  canRestoreFromSession(): boolean {
    if (typeof sessionStorage === "undefined") return false;
    return sessionStorage.getItem(SESSION_KEY) !== null;
  }

  /** 从 sessionStorage 恢复口令并解密 (应用启动时调用) */
  async restoreFromSession(): Promise<boolean> {
    if (typeof sessionStorage === "undefined") return false;
    const session = sessionStorage.getItem(SESSION_KEY);
    if (!session) return false;
    this.passphrase = session;
    try {
      await this.unlockFromStorage();
      return this.status === "unlocked";
    } catch {
      sessionStorage.removeItem(SESSION_KEY);
      this.passphrase = null;
      return false;
    }
  }

  /** 初始化 (无需主口令, 使用设备指纹) */
  async initWithDeviceFingerprint(): Promise<void> {
    this.passphrase = getDeviceFingerprint();
    if (!this.readKeyring()) {
      this.writeKeyring(emptyKeyring());
    }
    await this.unlockFromStorage();
    if (typeof sessionStorage !== "undefined") {
      sessionStorage.setItem(SESSION_KEY, this.passphrase);
    }
  }

  /** 设置主口令 (用户首次设置) */
  async setMasterPassword(password: string): Promise<void> {
    if (!password || password.length < 8) {
      throw new Error("主口令至少 8 位");
    }
    this.passphrase = `${getDeviceFingerprint()}:${password}`;
    if (!this.readKeyring()) {
      this.writeKeyring(emptyKeyring());
    }
    await this.unlockFromStorage();
    if (typeof sessionStorage !== "undefined") {
      sessionStorage.setItem(SESSION_KEY, this.passphrase);
    }
  }

  /** 解锁 (使用已有口令) */
  async unlock(password: string): Promise<boolean> {
    const candidate = `${getDeviceFingerprint()}:${password}`;
    try {
      const keyring = this.readKeyring();
      if (!keyring) return false;
      // 尝试解密第一条 (验证口令正确性)
      if (keyring.entries.length > 0) {
        await decryptString(keyring.entries[0].encryptedKey, candidate);
      }
      this.passphrase = candidate;
      await this.unlockFromStorage();
      if (typeof sessionStorage !== "undefined") {
        sessionStorage.setItem(SESSION_KEY, this.passphrase);
      }
      return true;
    } catch {
      return false;
    }
  }

  /** 锁定 (清除内存) */
  lock(): void {
    this.keys.clear();
    this.passphrase = null;
    this.keyringCache = null;
    if (typeof sessionStorage !== "undefined") {
      sessionStorage.removeItem(SESSION_KEY);
    }
    this.status = this.readKeyring() ? "locked" : "uninitialized";
  }

  /** 设置某 Provider 的 Key */
  async setKey(
    provider: LLMProvider,
    apiKey: string,
    opts?: { baseURL?: string; defaultModel?: string }
  ): Promise<void> {
    this.ensureUnlocked();
    if (!apiKey) throw new Error("API Key 不能为空");

    const encryptedKey = await encryptString(apiKey, this.passphrase!);

    const keyring = this.readKeyring()!;
    const existing = keyring.entries.findIndex(e => e.provider === provider);
    const entry: KeyringEntry = {
      provider,
      encryptedKey,
      baseURL: opts?.baseURL,
      defaultModel: opts?.defaultModel,
      addedAt: Date.now(),
    };
    if (existing >= 0) keyring.entries[existing] = entry;
    else keyring.entries.push(entry);

    this.writeKeyring(keyring);
    this.keys.set(provider, apiKey);
  }

  /** 获取某 Provider 的 Key (明文, 仅内存) */
  getKey(provider: LLMProvider): string | null {
    return this.keys.get(provider) || null;
  }

  /** 删除某 Provider 的 Key */
  removeKey(provider: LLMProvider): void {
    this.ensureUnlocked();
    const keyring = this.readKeyring()!;
    keyring.entries = keyring.entries.filter(e => e.provider !== provider);
    this.writeKeyring(keyring);
    this.keys.delete(provider);
  }

  /** 列出已配置的 Providers (不含 Key 明文) */
  listProviders(): { provider: LLMProvider; baseURL?: string; defaultModel?: string; addedAt: number }[] {
    const keyring = this.readKeyring();
    if (!keyring) return [];
    return keyring.entries.map(e => ({
      provider: e.provider,
      baseURL: e.baseURL,
      defaultModel: e.defaultModel,
      addedAt: e.addedAt,
    }));
  }

  /** 构造 ProviderConfig 列表 (用于 LLMRouter) */
  buildProviderConfigs(): ProviderConfig[] {
    const result: ProviderConfig[] = [];
    const keyring = this.readKeyring();
    if (!keyring) return result;

    for (const entry of keyring.entries) {
      const apiKey = this.keys.get(entry.provider);
      if (!apiKey) continue;
      const preset = entry.provider === "custom" ? undefined : PROVIDER_PRESETS[entry.provider];
      result.push({
        provider: entry.provider,
        apiKey,
        baseURL: entry.baseURL,
        defaultModel: entry.defaultModel || preset?.defaultModel || "",
        models: preset?.models || [],
      });
    }
    return result;
  }

  /** 检测 Key 是否已配置 */
  hasKey(provider: LLMProvider): boolean {
    return this.keys.has(provider);
  }

  // ===== 私有方法 =====

  private ensureUnlocked(): void {
    if (this.status !== "unlocked" || !this.passphrase) {
      throw new Error(`Keyring 未解锁 (当前状态: ${this.status})`);
    }
  }

  private readKeyring(): Keyring | null {
    if (this.keyringCache) return this.keyringCache;
    if (typeof localStorage === "undefined") return null;
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      const kr = JSON.parse(raw) as Keyring;
      if (kr.v !== 1) return null;
      this.keyringCache = kr;
      return kr;
    } catch {
      return null;
    }
  }

  private writeKeyring(kr: Keyring): void {
    this.keyringCache = kr;
    if (typeof localStorage !== "undefined") {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(kr));
    }
  }

  private async unlockFromStorage(): Promise<void> {
    const keyring = this.readKeyring();
    if (!keyring || !this.passphrase) {
      this.status = "uninitialized";
      return;
    }
    this.keys.clear();
    for (const entry of keyring.entries) {
      try {
        const key = await decryptString(entry.encryptedKey, this.passphrase);
        this.keys.set(entry.provider, key);
      } catch {
        // 解密失败, 跳过 (口令错误或数据损坏)
      }
    }
    this.status = "unlocked";
  }
}

/** 全局单例 */
export const keyManager = new APIKeyManager();
