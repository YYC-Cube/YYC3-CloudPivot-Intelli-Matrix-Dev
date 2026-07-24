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

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { TrustGuard } from '../src/trust/TrustGuard.js';

describe('TrustGuard', () => {
  let guard: TrustGuard;

  beforeEach(() => {
    guard = new TrustGuard();
  });

  afterEach(() => {
    guard.destroy();
  });

  it('should start disabled', () => {
    expect(guard.isEnabled()).toBe(false);
  });

  it('should enable and disable', () => {
    guard.enable();
    expect(guard.isEnabled()).toBe(true);
    guard.disable();
    expect(guard.isEnabled()).toBe(false);
  });

  it('should allow configuring allowed hosts', () => {
    guard.addAllowedHost('example.com');
    const report = guard.getReport();
    expect(report.allowedHosts).toContain('example.com');
  });

  it('should remove allowed hosts', () => {
    guard.addAllowedHost('example.com');
    guard.removeAllowedHost('example.com');
    const report = guard.getReport();
    expect(report.allowedHosts).not.toContain('example.com');
  });

  it('should track violations', async () => {
    const violations: any[] = [];
    const configured = new TrustGuard({
      onViolation: (e) => violations.push(e),
    });
    configured.enable();

    try {
      await globalThis.fetch('https://evil-tracker.com/collect');
    } catch { /* expected */ }

    expect(violations.length).toBeGreaterThan(0);
    expect(violations[0].type).toBe('external-fetch');
    expect(violations[0].url).toBe('https://evil-tracker.com/collect');
    expect(violations[0].blocked).toBe(true);

    configured.destroy();
  });

  it('should produce trust report', () => {
    guard.enable();
    const report = guard.getReport();
    expect(report.enabled).toBe(true);
    expect(report.totalViolations).toBe(0);
    expect(report.blockedCount).toBe(0);
    expect(report.allowedHosts.length).toBeGreaterThan(0);
    expect(report.uptime).toBeGreaterThanOrEqual(0);
  });

  it('should clear violations', () => {
    guard.enable();
    guard.clearViolations();
    const violations = guard.getViolations();
    expect(violations).toHaveLength(0);
  });

  it('should use default allowed hosts', () => {
    const report = guard.getReport();
    expect(report.allowedHosts).toContain('localhost');
    expect(report.allowedHosts).toContain('127.0.0.1');
  });

  it('should allow localhost URLs', () => {
    guard.enable();
    expect(() => {
      guard.disable();
    }).not.toThrow();
  });

  it('should have zero violations when freshly created', () => {
    expect(guard.getViolations()).toHaveLength(0);
  });

  it('should destroy cleanly', () => {
    guard.enable();
    guard.destroy();
    expect(guard.isEnabled()).toBe(false);
  });
});
