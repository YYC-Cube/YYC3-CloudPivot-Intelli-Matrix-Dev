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

export type TrustViolation =
  | 'external-fetch'
  | 'external-xhr'
  | 'cookie-access'
  | 'fingerprint-attempt'
  | 'tracker-detected'
  | 'analytics-call'
  | 'beacon-send';

export interface TrustViolationEvent {
  type: TrustViolation;
  url?: string;
  timestamp: number;
  stack?: string;
  blocked: boolean;
}

export interface TrustGuardConfig {
  blockExternalFetch: boolean;
  blockExternalXHR: boolean;
  blockCookies: boolean;
  blockBeacons: boolean;
  allowedHosts: string[];
  onViolation?: (event: TrustViolationEvent) => void;
}

export interface TrustReport {
  enabled: boolean;
  violations: TrustViolationEvent[];
  totalViolations: number;
  blockedCount: number;
  allowedHosts: string[];
  uptime: number;
}

const DEFAULT_CONFIG: TrustGuardConfig = {
  blockExternalFetch: true,
  blockExternalXHR: true,
  blockCookies: true,
  blockBeacons: true,
  allowedHosts: ['localhost', '127.0.0.1', '::1'],
  onViolation: undefined,
};

export class TrustGuard {
  private config: TrustGuardConfig;
  private violations: TrustViolationEvent[] = [];
  private enabled: boolean = false;
  private originalFetch: typeof fetch | null = null;
  private originalXHROpen: typeof XMLHttpRequest.prototype.open | null = null;
  private originalSendBeacon: typeof navigator.sendBeacon | null = null;
  private startTime: number = 0;

  constructor(config: Partial<TrustGuardConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  enable(): void {
    if (this.enabled) return;
    this.enabled = true;
    this.startTime = Date.now();
    this.installGuards();
  }

  disable(): void {
    if (!this.enabled) return;
    this.enabled = false;
    this.uninstallGuards();
  }

  isEnabled(): boolean {
    return this.enabled;
  }

  getReport(): TrustReport {
    return {
      enabled: this.enabled,
      violations: [...this.violations],
      totalViolations: this.violations.length,
      blockedCount: this.violations.filter(v => v.blocked).length,
      allowedHosts: [...this.config.allowedHosts],
      uptime: this.enabled ? Date.now() - this.startTime : 0,
    };
  }

  getViolations(): TrustViolationEvent[] {
    return [...this.violations];
  }

  addAllowedHost(host: string): void {
    if (!this.config.allowedHosts.includes(host)) {
      this.config.allowedHosts.push(host);
    }
  }

  removeAllowedHost(host: string): void {
    this.config.allowedHosts = this.config.allowedHosts.filter(h => h !== host);
  }

  clearViolations(): void {
    this.violations = [];
  }

  destroy(): void {
    this.disable();
    this.violations = [];
  }

  private installGuards(): void {
    this.guardFetch();
    this.guardXHR();
    this.guardBeacon();
  }

  private uninstallGuards(): void {
    if (this.originalFetch && typeof globalThis.fetch === 'function') {
      globalThis.fetch = this.originalFetch;
    }
    if (this.originalXHROpen) {
      XMLHttpRequest.prototype.open = this.originalXHROpen;
    }
    if (this.originalSendBeacon && typeof navigator !== 'undefined') {
      (navigator as any).sendBeacon = this.originalSendBeacon;
    }
    this.originalFetch = null;
    this.originalXHROpen = null;
    this.originalSendBeacon = null;
  }

  private guardFetch(): void {
    if (typeof globalThis.fetch !== 'function') return;
    this.originalFetch = globalThis.fetch;

    // eslint-disable-next-line @typescript-eslint/no-this-alias -- needed to preserve TrustGuard context in function replacement
    const self = this;
    globalThis.fetch = function(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
      const url = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url;
      if (self.shouldBlock(url)) {
        self.recordViolation('external-fetch', url, true);
        return Promise.reject(new TypeError(`[TrustGuard] Blocked external fetch: ${url}`));
      }
      return self.originalFetch!.call(this, input, init);
    };
  }

  private guardXHR(): void {
    if (typeof XMLHttpRequest === 'undefined') return;
    this.originalXHROpen = XMLHttpRequest.prototype.open;

    // eslint-disable-next-line @typescript-eslint/no-this-alias -- needed to preserve TrustGuard context while keeping XHR this binding
    const self = this;
    const orig = this.originalXHROpen;
    XMLHttpRequest.prototype.open = function(method: string, url: string, async?: boolean, username?: string | null, password?: string | null) {
      if (self.shouldBlock(url)) {
        self.recordViolation('external-xhr', url, true);
        throw new TypeError(`[TrustGuard] Blocked external XHR: ${url}`);
      }
      return orig!.call(this, method, url, async ?? true, username ?? null, password ?? null);
    };
  }

  private guardBeacon(): void {
    if (typeof navigator === 'undefined' || typeof navigator.sendBeacon !== 'function') return;
    this.originalSendBeacon = navigator.sendBeacon.bind(navigator);

    // eslint-disable-next-line @typescript-eslint/no-this-alias -- needed to preserve TrustGuard context in function replacement
    const self = this;
    (navigator as any).sendBeacon = function(url: string, data?: any): boolean {
      if (self.shouldBlock(url)) {
        self.recordViolation('beacon-send', url, true);
        return false;
      }
      return self.originalSendBeacon!(url, data);
    };
  }

  private shouldBlock(url: string): boolean {
    if (!url) return false;
    try {
      const parsed = new URL(url, 'http://localhost');
      if (parsed.protocol === 'data:' || parsed.protocol === 'blob:') return false;
      for (const allowed of this.config.allowedHosts) {
        if (parsed.hostname === allowed || parsed.hostname.endsWith(`.${allowed}`)) {
          return false;
        }
      }
      return true;
    } catch {
      return false;
    }
  }

  private recordViolation(type: TrustViolation, url: string, blocked: boolean): void {
    const event: TrustViolationEvent = {
      type,
      url,
      timestamp: Date.now(),
      blocked,
    };
    this.violations.push(event);
    this.config.onViolation?.(event);
  }
}
