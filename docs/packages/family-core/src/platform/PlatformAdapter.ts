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

export interface ScreenSize {
  width: number;
  height: number;
}

export type DeviceType = 'mobile' | 'tablet' | 'desktop';

export interface PlatformAdapter {
  getScreenSize(): ScreenSize;
  getDeviceType(): DeviceType;
  getPlatform(): string;
  getLanguage(): string;
  getAgentManager(): unknown;
  isBrowser(): boolean;
  isNode(): boolean;
}

export class BrowserAdapter implements PlatformAdapter {
  getScreenSize(): ScreenSize {
    return { width: window.innerWidth, height: window.innerHeight };
  }

  getDeviceType(): DeviceType {
    const width = window.innerWidth;
    if (width < 768) return 'mobile';
    if (width < 1024) return 'tablet';
    return 'desktop';
  }

  getPlatform(): string {
    return navigator.platform;
  }

  getLanguage(): string {
    return navigator.language;
  }

  getAgentManager(): unknown {
    return (window as any).agentManager;
  }

  isBrowser(): boolean {
    return true;
  }

  isNode(): boolean {
    return false;
  }
}

export class NodeAdapter implements PlatformAdapter {
  getScreenSize(): ScreenSize {
    return { width: 1920, height: 1080 };
  }

  getDeviceType(): DeviceType {
    return 'desktop';
  }

  getPlatform(): string {
    return process.platform;
  }

  getLanguage(): string {
    return process.env.LANG?.split('.')[0] ?? 'en-US';
  }

  getAgentManager(): unknown {
    return undefined;
  }

  isBrowser(): boolean {
    return false;
  }

  isNode(): boolean {
    return true;
  }
}

let currentAdapter: PlatformAdapter | null = null;

export function getPlatformAdapter(): PlatformAdapter {
  if (currentAdapter) return currentAdapter;
  const adapter = typeof window !== 'undefined' ? new BrowserAdapter() : new NodeAdapter();
  currentAdapter = adapter;
  return adapter;
}

export function setPlatformAdapter(adapter: PlatformAdapter): void {
  currentAdapter = adapter;
}

export function resetPlatformAdapter(): void {
  currentAdapter = null;
}
