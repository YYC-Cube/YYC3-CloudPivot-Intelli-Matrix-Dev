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

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AuthBinding } from '../src/family-bindings/AuthBinding.js';

class MockStorage {
  private store: Map<string, string> = new Map();
  getItem(key: string) { return this.store.get(key) ?? null; }
  setItem(key: string, value: string) { this.store.set(key, value); }
  removeItem(key: string) { this.store.delete(key); }
  key(_index: number) { return ''; }
  clear() { this.store.clear(); }
  get length() { return this.store.size; }
}

describe('AuthBinding — Token, Session, Refresh', () => {
  let storage: MockStorage;

  beforeEach(() => {
    storage = new MockStorage();
    (globalThis as any).localStorage = storage;
  });

  describe('login validation', () => {
    it('should reject empty email', async () => {
      const auth = new AuthBinding('local', { storageKey: 'test-auth' });
      await expect(auth.login('', 'password')).rejects.toThrow('Invalid email format');
    });

    it('should reject email without @', async () => {
      const auth = new AuthBinding('local', { storageKey: 'test-auth' });
      await expect(auth.login('notanemail', 'password')).rejects.toThrow('Invalid email format');
    });

    it('should reject short password', async () => {
      const auth = new AuthBinding('local', { storageKey: 'test-auth' });
      await expect(auth.login('a@b.com', '123')).rejects.toThrow('Password must be at least');
    });

    it('should reject empty password', async () => {
      const auth = new AuthBinding('local', { storageKey: 'test-auth' });
      await expect(auth.login('a@b.com', '')).rejects.toThrow('Password must be at least');
    });

    it('should respect custom minPasswordLength', async () => {
      const auth = new AuthBinding('local', { minPasswordLength: 12, storageKey: 'test-auth' });
      await expect(auth.login('a@b.com', 'short123')).rejects.toThrow('12');
    });
  });

  describe('token encode/decode', () => {
    it('should generate a valid token on login', async () => {
      const auth = new AuthBinding('local', { storageKey: 'test-auth' });
      const session = await auth.login('user@yyc3.ai', 'password123');
      expect(session.token).toBeDefined();
      expect(session.token!.split('.').length).toBe(3);
    });

    it('should validate token round-trip', async () => {
      const auth = new AuthBinding('local', { storageKey: 'test-auth' });
      const session = await auth.login('user@yyc3.ai', 'password123');
      const payload = auth.validateToken(session.token!);
      expect(payload).not.toBeNull();
      expect(payload!.email).toBe('user@yyc3.ai');
      expect(payload!.sub).toContain('user-');
    });

    it('should reject tampered token', async () => {
      const auth = new AuthBinding('local', { storageKey: 'test-auth' });
      const session = await auth.login('user@yyc3.ai', 'password123');
      const tampered = session.token! + 'x';
      expect(auth.validateToken(tampered)).toBeNull();
    });

    it('should reject malformed token', () => {
      const auth = new AuthBinding('local', { storageKey: 'test-auth' });
      expect(auth.validateToken('not.a.valid.token.format')).toBeNull();
      expect(auth.validateToken('onlyonepart')).toBeNull();
    });

    it('should include role in token', async () => {
      const auth = new AuthBinding('local', { storageKey: 'test-auth' });
      const session = await auth.login('admin@yyc3.ai', 'password123');
      const payload = auth.validateToken(session.token!);
      expect(payload!.role).toBe('user');
    });
  });

  describe('session persistence', () => {
    it('should persist session to localStorage', async () => {
      const auth = new AuthBinding('local', { storageKey: 'test-persist' });
      await auth.login('user@yyc3.ai', 'password123');
      const stored = storage.getItem('test-persist');
      expect(stored).not.toBeNull();
      const parsed = JSON.parse(stored!);
      expect(parsed.user.email).toBe('user@yyc3.ai');
    });

    it('should restore session from localStorage', () => {
      const auth1 = new AuthBinding('local', { storageKey: 'test-restore' });
      const session = auth1.enterGhostMode();
      const stored = storage.getItem('test-restore');
      expect(stored).not.toBeNull();

      const auth2 = new AuthBinding('local', { storageKey: 'test-restore' });
      expect(auth2.getState()).toBe('authenticated');
      expect(auth2.getSession()?.user.displayName).toBe('访客');
    });

    it('should clear localStorage on logout', async () => {
      const auth = new AuthBinding('local', { storageKey: 'test-logout' });
      await auth.login('user@yyc3.ai', 'password123');
      expect(storage.getItem('test-logout')).not.toBeNull();
      auth.logout();
      expect(storage.getItem('test-logout')).toBeNull();
    });

    it('should not restore expired session', () => {
      const auth = new AuthBinding('local', { tokenExpiryMs: 1, storageKey: 'test-expired' });
      auth.enterGhostMode();
      const stored = JSON.parse(storage.getItem('test-expired')!);
      stored.expiresAt = Date.now() - 1000;
      storage.setItem('test-expired', JSON.stringify(stored));

      const auth2 = new AuthBinding('local', { storageKey: 'test-expired' });
      expect(auth2.getState()).toBe('unauthenticated');
    });
  });

  describe('session expiry & refresh', () => {
    it('should report expired when no session', () => {
      const auth = new AuthBinding('local', { storageKey: 'test-exp' });
      expect(auth.isSessionExpired()).toBe(true);
    });

    it('should report not expired for fresh session', async () => {
      const auth = new AuthBinding('local', { storageKey: 'test-exp' });
      await auth.login('user@yyc3.ai', 'password123');
      expect(auth.isSessionExpired()).toBe(false);
    });

    it('should refresh session and issue new token', async () => {
      const auth = new AuthBinding('local', { tokenExpiryMs: 3600000, storageKey: 'test-refresh' });
      const session1 = await auth.login('user@yyc3.ai', 'password123');
      const oldToken = session1.token;

      const refreshed = auth.refreshSession();
      expect(refreshed).not.toBeNull();
      expect(refreshed!.token).toBeDefined();
      expect(refreshed!.token!.split('.').length).toBe(3);
      expect(refreshed!.expiresAt).toBeGreaterThanOrEqual(session1.expiresAt);
    });

    it('should emit session:refreshed on refresh', async () => {
      const auth = new AuthBinding('local', { storageKey: 'test-refr' });
      await auth.login('user@yyc3.ai', 'password123');
      let emitted = false;
      auth.on('session:refreshed', () => { emitted = true; });
      auth.refreshSession();
      expect(emitted).toBe(true);
    });

    it('should return null when refreshing ghost session', () => {
      const auth = new AuthBinding('local', { storageKey: 'test-refr-ghost' });
      auth.enterGhostMode();
      expect(auth.refreshSession()).toBeNull();
    });

    it('should return null when refreshing with no session', () => {
      const auth = new AuthBinding('local', { storageKey: 'test-refr-none' });
      expect(auth.refreshSession()).toBeNull();
    });
  });

  describe('ghost mode', () => {
    it('should set guest role in ghost mode', () => {
      const auth = new AuthBinding('local', { storageKey: 'test-ghost' });
      const session = auth.enterGhostMode();
      expect(session.user.role).toBe('guest');
      expect(session.user.email).toBe('ghost@yyc3.local');
      expect(session.user.displayName).toBe('访客');
    });

    it('should use ghostTTL for expiry', () => {
      const auth = new AuthBinding('local', { ghostTTL: 60000, storageKey: 'test-ghost-ttl' });
      const before = Date.now();
      const session = auth.enterGhostMode();
      expect(session.expiresAt).toBeGreaterThanOrEqual(before + 59000);
      expect(session.expiresAt).toBeLessThanOrEqual(before + 70000);
    });
  });

  describe('events', () => {
    it('should emit login event', async () => {
      const auth = new AuthBinding('local', { storageKey: 'test-evt' });
      let fired = false;
      auth.on('login', () => { fired = true; });
      await auth.login('user@yyc3.ai', 'password123');
      expect(fired).toBe(true);
    });

    it('should emit logout event', async () => {
      const auth = new AuthBinding('local', { storageKey: 'test-evt' });
      await auth.login('user@yyc3.ai', 'password123');
      let fired = false;
      auth.on('logout', () => { fired = true; });
      auth.logout();
      expect(fired).toBe(true);
    });

    it('should emit ghost:enter event', () => {
      const auth = new AuthBinding('local', { storageKey: 'test-evt' });
      let fired = false;
      auth.on('ghost:enter', () => { fired = true; });
      auth.enterGhostMode();
      expect(fired).toBe(true);
    });

    it('should emit state:change through authenticating and authenticated', async () => {
      const auth = new AuthBinding('local', { storageKey: 'test-evt' });
      const states: string[] = [];
      auth.onStateChange((s) => { states.push(s); });
      await auth.login('user@yyc3.ai', 'password123');
      expect(states).toContain('authenticating');
      expect(states).toContain('authenticated');
    });
  });

  describe('destroy', () => {
    it('should clear session and remove listeners', async () => {
      const auth = new AuthBinding('local', { storageKey: 'test-destroy' });
      await auth.login('user@yyc3.ai', 'password123');
      auth.destroy();
      expect(auth.getState()).toBe('unauthenticated');
      expect(auth.getSession()).toBeNull();
    });
  });
});
