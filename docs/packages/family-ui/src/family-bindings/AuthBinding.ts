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

import { EventEmitter } from 'eventemitter3';

export type AuthState = 'unauthenticated' | 'authenticating' | 'authenticated' | 'ghost';
export type AuthProvider = 'supabase' | 'local' | 'custom';

export interface AuthUser {
  id: string;
  email: string;
  displayName: string;
  avatar?: string;
  locale: string;
  preferences: Record<string, unknown>;
  role?: 'admin' | 'moderator' | 'user' | 'guest';
}

export interface AuthSession {
  id: string;
  user: AuthUser;
  provider: AuthProvider;
  startedAt: number;
  expiresAt: number | null;
  token?: string;
}

export interface TokenPayload {
  sub: string;
  email: string;
  name?: string;
  iat: number;
  exp: number;
  role?: string;
}

export interface AuthConfig {
  provider: AuthProvider;
  tokenExpiryMs: number;
  ghostTTL: number;
  minPasswordLength: number;
  storageKey: string;
}

const DEFAULT_AUTH_CONFIG: AuthConfig = {
  provider: 'local',
  tokenExpiryMs: 86400000, // 24h
  ghostTTL: 3600000, // 1h
  minPasswordLength: 6,
  storageKey: 'yyc3_auth_session',
};

function simpleHash(str: string): string {
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) + hash + str.charCodeAt(i)) & 0xffffffff;
  }
  return hash.toString(36);
}

function encodeToken(payload: TokenPayload): string {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const signature = simpleHash(`${header}.${body}`);
  return `${header}.${body}.${signature}`;
}

function decodeToken(token: string): TokenPayload | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const payload = JSON.parse(Buffer.from(parts[1]!, 'base64url').toString());
    const expectedSig = simpleHash(`${parts[0]!}.${parts[1]!}`);
    if (expectedSig !== parts[2]) return null;
    if (payload.exp && Date.now() > payload.exp * 1000) return null;
    return payload as TokenPayload;
  } catch {
    return null;
  }
}

export class AuthBinding extends EventEmitter {
  private state: AuthState = 'unauthenticated';
  private session: AuthSession | null = null;
  private config: AuthConfig;

  constructor(provider: AuthProvider = 'local', config?: Partial<AuthConfig>) {
    super();
    this.config = { ...DEFAULT_AUTH_CONFIG, ...config, provider };
    this.tryRestoreSession();
  }

  private tryRestoreSession(): void {
    try {
      if (typeof localStorage === 'undefined') return;
      const stored = localStorage.getItem(this.config.storageKey);
      if (!stored) return;
      const session: AuthSession = JSON.parse(stored);
      if (session.expiresAt && Date.now() > session.expiresAt) {
        localStorage.removeItem(this.config.storageKey);
        return;
      }
      if (session.token) {
        const payload = decodeToken(session.token);
        if (!payload) {
          localStorage.removeItem(this.config.storageKey);
          return;
        }
      }
      this.session = session;
      this.state = 'authenticated';
      this.emit('state:change', this.state);
      this.emit('session:restored', session);
    } catch {
      // localStorage not available, skip restore
    }
  }

  private persistSession(): void {
    try {
      if (typeof localStorage === 'undefined') return;
      if (this.session) {
        localStorage.setItem(this.config.storageKey, JSON.stringify(this.session));
      } else {
        localStorage.removeItem(this.config.storageKey);
      }
    } catch {
      // ignore storage errors
    }
  }

  async login(email: string, password: string): Promise<AuthSession> {
    if (!email || !email.includes('@')) {
      throw new Error('Invalid email format');
    }
    if (!password || password.length < this.config.minPasswordLength) {
      throw new Error(`Password must be at least ${this.config.minPasswordLength} characters`);
    }

    this.state = 'authenticating';
    this.emit('state:change', this.state);

    const now = Date.now();
    const userId = `user-${simpleHash(email)}`;
    const tokenPayload: TokenPayload = {
      sub: userId,
      email,
      name: email.split('@')[0],
      iat: Math.floor(now / 1000),
      exp: Math.floor((now + this.config.tokenExpiryMs) / 1000),
      role: 'user',
    };

    const token = encodeToken(tokenPayload);

    const user: AuthUser = {
      id: userId,
      email,
      displayName: email.split('@')[0] ?? 'User',
      locale: 'zh-CN',
      preferences: {},
      role: 'user',
    };

    this.session = {
      id: `session-${now}-${Math.random().toString(36).substring(2, 10)}`,
      user,
      provider: this.config.provider,
      startedAt: now,
      expiresAt: now + this.config.tokenExpiryMs,
      token,
    };

    this.state = 'authenticated';
    this.persistSession();
    this.emit('state:change', this.state);
    this.emit('login', this.session);

    return this.session;
  }

  enterGhostMode(): AuthSession {
    const now = Date.now();
    const ghostUser: AuthUser = {
      id: `ghost-${simpleHash(`ghost-${now}`)}`,
      email: 'ghost@yyc3.local',
      displayName: '访客',
      locale: 'zh-CN',
      preferences: { ghostMode: true },
      role: 'guest',
    };

    this.session = {
      id: `ghost-session-${now}-${Math.random().toString(36).substring(2, 10)}`,
      user: ghostUser,
      provider: this.config.provider,
      startedAt: now,
      expiresAt: now + this.config.ghostTTL,
    };

    this.state = 'ghost';
    this.persistSession();
    this.emit('state:change', this.state);
    this.emit('ghost:enter', this.session);

    return this.session;
  }

  logout(): void {
    const previousSession = this.session;
    this.session = null;
    this.state = 'unauthenticated';
    this.persistSession();
    this.emit('state:change', this.state);
    this.emit('logout', { previousSession });
  }

  validateToken(token: string): TokenPayload | null {
    return decodeToken(token);
  }

  isSessionExpired(): boolean {
    if (!this.session) return true;
    if (!this.session.expiresAt) return false;
    return Date.now() > this.session.expiresAt;
  }

  refreshSession(): AuthSession | null {
    if (!this.session || this.state === 'ghost') return null;
    if (this.isSessionExpired()) {
      this.logout();
      return null;
    }

    const now = Date.now();
    const tokenPayload: TokenPayload = {
      sub: this.session.user.id,
      email: this.session.user.email,
      name: this.session.user.displayName,
      iat: Math.floor(now / 1000),
      exp: Math.floor((now + this.config.tokenExpiryMs) / 1000),
      role: this.session.user.role,
    };

    this.session.token = encodeToken(tokenPayload);
    this.session.expiresAt = now + this.config.tokenExpiryMs;
    this.persistSession();
    this.emit('session:refreshed', this.session);
    return this.session;
  }

  getState(): AuthState {
    return this.state;
  }

  getSession(): AuthSession | null {
    return this.session ? { ...this.session } : null;
  }

  getUser(): AuthUser | null {
    return this.session?.user ?? null;
  }

  isAuthenticated(): boolean {
    if (this.state !== 'authenticated' && this.state !== 'ghost') return false;
    return !this.isSessionExpired();
  }

  isGhostMode(): boolean {
    return this.state === 'ghost';
  }

  onStateChange(callback: (state: AuthState) => void): () => void {
    this.on('state:change', callback);
    return () => this.off('state:change', callback);
  }

  destroy(): void {
    this.logout();
    this.removeAllListeners();
  }
}
