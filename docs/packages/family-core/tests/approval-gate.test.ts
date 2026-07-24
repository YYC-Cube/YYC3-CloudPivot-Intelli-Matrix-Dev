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

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ApprovalGate, ApprovalStatus } from '../src/orchestration/ApprovalGate';

describe('ApprovalGate', () => {
  let gate: ApprovalGate;

  beforeEach(() => {
    vi.useFakeTimers();
    gate = new ApprovalGate({ defaultTimeoutMs: 300000 });
  });

  afterEach(() => {
    vi.useRealTimers();
    gate.dispose();
  });

  function makeRequest(overrides?: Record<string, unknown>) {
    return {
      workflowId: 'wf-1',
      nodeId: 'node-1',
      agentId: 'agent-1',
      action: 'delete',
      payload: { resource: 'db/prod' },
      ...overrides,
    };
  }

  describe('submit', () => {
    it('should submit a pending request', async () => {
      const request = await gate.submit(makeRequest());
      expect(request.status).toBe(ApprovalStatus.PENDING);
      expect(request.id).toContain('approval-');
      expect(request.requestedAt).toBeGreaterThan(0);
      expect(request.expiresAt).toBeGreaterThan(request.requestedAt);
    });

    it('should auto-approve when config.autoApprove is true', async () => {
      const autoGate = new ApprovalGate({ autoApprove: true });
      const request = await autoGate.submit(makeRequest());
      expect(request.status).toBe(ApprovalStatus.AUTO_APPROVED);
      autoGate.dispose();
    });

    it('should auto-approve when action matches autoApprovePatterns', async () => {
      const patternGate = new ApprovalGate({ autoApprovePatterns: ['read', 'list'] });
      const request = await patternGate.submit(makeRequest({ action: 'read-data' }));
      expect(request.status).toBe(ApprovalStatus.AUTO_APPROVED);
      patternGate.dispose();
    });

    it('should throw when max pending requests exceeded', async () => {
      const smallGate = new ApprovalGate({ maxPendingRequests: 1, defaultTimeoutMs: 600000 });
      await smallGate.submit(makeRequest({ action: 'one' }));
      await expect(smallGate.submit(makeRequest({ action: 'two' }))).rejects.toThrow('queue is full');
      smallGate.dispose();
    });

    it('should emit pending event', async () => {
      const handler = vi.fn();
      gate.on('pending', handler);
      await gate.submit(makeRequest());
      expect(handler).toHaveBeenCalled();
    });

    it('should emit approved event on auto-approve', async () => {
      const handler = vi.fn();
      const autoGate = new ApprovalGate({ autoApprove: true });
      autoGate.on('approved', handler);
      await autoGate.submit(makeRequest());
      expect(handler).toHaveBeenCalled();
      autoGate.dispose();
    });
  });

  describe('approve', () => {
    it('should approve a pending request', async () => {
      const request = await gate.submit(makeRequest());
      const approved = gate.approve(request.id, 'admin', 'Looks good');
      expect(approved).not.toBeNull();
      expect(approved!.status).toBe(ApprovalStatus.APPROVED);
      expect(approved!.approvedBy).toBe('admin');
    });

    it('should return null for non-existent request', () => {
      expect(gate.approve('nonexistent', 'admin')).toBeNull();
    });

    it('should return null for already processed request', async () => {
      const request = await gate.submit(makeRequest());
      gate.approve(request.id, 'admin');
      expect(gate.approve(request.id, 'admin')).toBeNull();
    });

    it('should return null for expired request', async () => {
      const request = await gate.submit(makeRequest({ action: 'quick' }));
      vi.advanceTimersByTime(310000);
      expect(gate.approve(request.id, 'admin')).toBeNull();
    });

    it('should emit approved event', async () => {
      const handler = vi.fn();
      gate.on('approved', handler);
      const request = await gate.submit(makeRequest());
      gate.approve(request.id, 'admin');
      expect(handler).toHaveBeenCalled();
    });
  });

  describe('reject', () => {
    it('should reject a pending request', async () => {
      const request = await gate.submit(makeRequest());
      const rejected = gate.reject(request.id, 'admin', 'Not authorized');
      expect(rejected).not.toBeNull();
      expect(rejected!.status).toBe(ApprovalStatus.REJECTED);
      expect(rejected!.reason).toBe('Not authorized');
    });

    it('should return null for non-existent request', () => {
      expect(gate.reject('nope', 'admin')).toBeNull();
    });

    it('should return null for already processed request', async () => {
      const request = await gate.submit(makeRequest());
      gate.reject(request.id, 'admin');
      expect(gate.reject(request.id, 'admin')).toBeNull();
    });

    it('should emit rejected event', async () => {
      const handler = vi.fn();
      gate.on('rejected', handler);
      const request = await gate.submit(makeRequest());
      gate.reject(request.id, 'admin');
      expect(handler).toHaveBeenCalled();
    });
  });

  describe('waitForApproval', () => {
    it('should resolve when request is approved', async () => {
      const request = await gate.submit(makeRequest());
      const waitPromise = gate.waitForApproval(request.id);

      gate.approve(request.id, 'admin');
      await expect(waitPromise).resolves.toBeDefined();
    });

    it('should throw when request is rejected', async () => {
      const request = await gate.submit(makeRequest());
      const waitPromise = gate.waitForApproval(request.id);

      gate.reject(request.id, 'admin', 'Denied');
      await expect(waitPromise).rejects.toThrow('was rejected');
    });

    it('should throw if request not found', async () => {
      await expect(gate.waitForApproval('ghost')).rejects.toThrow('not found');
    });

    it('should resolve immediately if already approved', async () => {
      const autoGate = new ApprovalGate({ autoApprove: true });
      const request = await autoGate.submit(makeRequest({ action: 'test' }));
      await expect(autoGate.waitForApproval(request.id)).resolves.toBeDefined();
      autoGate.dispose();
    });
  });

  describe('query methods', () => {
    it('getRequest should return request by ID', async () => {
      const request = await gate.submit(makeRequest());
      const found = gate.getRequest(request.id);
      expect(found).toBeDefined();
      expect(found!.id).toBe(request.id);
    });

    it('getRequest should return undefined for unknown ID', () => {
      expect(gate.getRequest('ghost')).toBeUndefined();
    });

    it('getPendingRequests should list only pending non-expired', async () => {
      await gate.submit(makeRequest({ action: 'delete' }));
      expect(gate.getPendingRequests()).toHaveLength(1);
    });

    it('getAllRequests should list all requests', async () => {
      await gate.submit(makeRequest({ action: 'a' }));
      await gate.submit(makeRequest({ action: 'b' }));
      expect(gate.getAllRequests()).toHaveLength(2);
    });
  });

  describe('requiresApproval', () => {
    it('should return true for protected actions', () => {
      expect(gate.requiresApproval('delete')).toBe(true);
      expect(gate.requiresApproval('deploy')).toBe(true);
    });

    it('should return false when autoApprove is on', () => {
      const autoGate = new ApprovalGate({ autoApprove: true });
      expect(autoGate.requiresApproval('delete')).toBe(false);
      autoGate.dispose();
    });

    it('should return false for matching autoApprovePatterns', () => {
      const patternGate = new ApprovalGate({ autoApprovePatterns: ['view', 'list'] });
      expect(patternGate.requiresApproval('view-dashboard')).toBe(false);
      patternGate.dispose();
    });

    it('should return true for unspecified actions when requireApprovalFor is empty', () => {
      const emptyGate = new ApprovalGate({ requireApprovalFor: [] });
      expect(emptyGate.requiresApproval('anything')).toBe(true);
      emptyGate.dispose();
    });
  });

  describe('dispose', () => {
    it('should clean up resources', async () => {
      await gate.submit(makeRequest());
      gate.dispose();
      expect(gate.getPendingRequests()).toHaveLength(0);
    });
  });
});
