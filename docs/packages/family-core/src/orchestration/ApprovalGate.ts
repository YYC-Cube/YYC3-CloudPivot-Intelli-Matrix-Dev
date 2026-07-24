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

/**
 * @file ApprovalGate.ts
 * @description Human-in-the-Loop 审批门控机制
 * @author YanYuCloudCube Team <admin@0379.email>
 * @version v1.0.0
 * @created 2026-06-12
 * @updated 2026-06-12
 * @status stable
 * @license MIT
 * @copyright Copyright (c) 2026 YanYuCloudCube Team
 */

import { EventEmitter } from 'events';
import { logger } from '../deps/logger';

export enum ApprovalStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  EXPIRED = 'expired',
  AUTO_APPROVED = 'auto_approved',
}

export interface ApprovalRequest {
  id: string;
  workflowId: string;
  nodeId: string;
  agentId: string;
  action: string;
  payload: Record<string, unknown>;
  requestedAt: number;
  expiresAt: number;
  status: ApprovalStatus;
  approvedBy?: string;
  approvedAt?: number;
  reason?: string;
}

export interface ApprovalGateConfig {
  defaultTimeoutMs: number;
  autoApprove?: boolean;
  autoApprovePatterns?: string[];
  requireApprovalFor?: string[];
  maxPendingRequests?: number;
}

export class ApprovalGate extends EventEmitter {
  private requests: Map<string, ApprovalRequest> = new Map();
  private config: ApprovalGateConfig;
  private cleanupInterval: ReturnType<typeof setInterval> | null = null;

  constructor(config: Partial<ApprovalGateConfig> = {}) {
    super();
    this.config = {
      defaultTimeoutMs: config.defaultTimeoutMs ?? 300000, // 5 minutes
      autoApprove: config.autoApprove ?? false,
      autoApprovePatterns: config.autoApprovePatterns ?? [],
      requireApprovalFor: config.requireApprovalFor ?? ['delete', 'deploy', 'transfer', 'shutdown'],
      maxPendingRequests: config.maxPendingRequests ?? 100,
    };

    // Periodically clean up expired requests
    this.cleanupInterval = setInterval(() => this.cleanupExpired(), 60000);
  }

  /**
   * 提交一个需要审批的请求
   */
  async submit(request: Omit<ApprovalRequest, 'id' | 'status' | 'requestedAt' | 'expiresAt'>): Promise<ApprovalRequest> {
    const pendingCount = Array.from(this.requests.values()).filter(r => r.status === ApprovalStatus.PENDING).length;
    if (pendingCount >= (this.config.maxPendingRequests ?? 100)) {
      throw new Error('Approval queue is full — too many pending requests');
    }

    const id = `approval-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    const now = Date.now();

    const fullRequest: ApprovalRequest = {
      ...request,
      id,
      status: ApprovalStatus.PENDING,
      requestedAt: now,
      expiresAt: now + this.config.defaultTimeoutMs,
    };

    // Auto-approve if enabled and action matches patterns
    if (this.config.autoApprove || this.matchesAutoApprovePattern(request.action)) {
      fullRequest.status = ApprovalStatus.AUTO_APPROVED;
      fullRequest.approvedAt = now;
      fullRequest.reason = 'Auto-approved by policy';
      logger.info('Auto-approved request', 'ApprovalGate', { id, action: request.action });
      this.emit('approved', fullRequest);
      this.requests.set(id, fullRequest);
      return fullRequest;
    }

    this.requests.set(id, fullRequest);
    this.emit('pending', fullRequest);

    logger.info('Approval requested', 'ApprovalGate', {
      id,
      workflowId: request.workflowId,
      action: request.action,
      expiresAt: fullRequest.expiresAt,
    });

    return fullRequest;
  }

  /**
   * 批准请求
   */
  approve(id: string, approver: string, reason?: string): ApprovalRequest | null {
    const request = this.requests.get(id);
    if (!request) return null;
    if (request.status !== ApprovalStatus.PENDING) return null;
    if (Date.now() > request.expiresAt) {
      request.status = ApprovalStatus.EXPIRED;
      this.emit('expired', request);
      return null;
    }

    request.status = ApprovalStatus.APPROVED;
    request.approvedBy = approver;
    request.approvedAt = Date.now();
    request.reason = reason;

    logger.info('Request approved', 'ApprovalGate', { id, approver, action: request.action });
    this.emit('approved', request);
    return request;
  }

  /**
   * 拒绝请求
   */
  reject(id: string, approver: string, reason?: string): ApprovalRequest | null {
    const request = this.requests.get(id);
    if (!request) return null;
    if (request.status !== ApprovalStatus.PENDING) return null;

    request.status = ApprovalStatus.REJECTED;
    request.approvedBy = approver;
    request.approvedAt = Date.now();
    request.reason = reason;

    logger.warn('Request rejected', 'ApprovalGate', { id, approver, action: request.action, reason });
    this.emit('rejected', request);
    return request;
  }

  /**
   * 等待请求被批准（Promise API）
   */
  async waitForApproval(id: string): Promise<ApprovalRequest> {
    const request = this.requests.get(id);
    if (!request) {
      throw new Error(`Approval request ${id} not found`);
    }

    if (request.status === ApprovalStatus.APPROVED || request.status === ApprovalStatus.AUTO_APPROVED) {
      return request;
    }
    if (request.status === ApprovalStatus.REJECTED) {
      throw new Error(`Approval request ${id} was rejected: ${request.reason ?? 'No reason given'}`);
    }
    if (request.status === ApprovalStatus.EXPIRED) {
      throw new Error(`Approval request ${id} expired`);
    }

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        cleanup();
        reject(new Error(`Approval request ${id} timed out`));
      }, Math.max(request.expiresAt - Date.now(), 0));

      const onApproved = (req: ApprovalRequest) => {
        if (req.id === id) {
          clearTimeout(timeout);
          cleanup();
          resolve(req);
        }
      };

      const onRejected = (req: ApprovalRequest) => {
        if (req.id === id) {
          clearTimeout(timeout);
          cleanup();
          reject(new Error(`Approval request ${id} was rejected: ${req.reason ?? 'No reason given'}`));
        }
      };

      const cleanup = () => {
        this.off('approved', onApproved);
        this.off('rejected', onRejected);
      };

      this.on('approved', onApproved);
      this.on('rejected', onRejected);
    });
  }

  /**
   * 查询请求状态
   */
  getRequest(id: string): ApprovalRequest | undefined {
    return this.requests.get(id);
  }

  /**
   * 列出待审批请求
   */
  getPendingRequests(): ApprovalRequest[] {
    const now = Date.now();
    return Array.from(this.requests.values()).filter(
      r => r.status === ApprovalStatus.PENDING && r.expiresAt > now
    );
  }

  /**
   * 列出所有请求
   */
  getAllRequests(): ApprovalRequest[] {
    return Array.from(this.requests.values());
  }

  /**
   * 是否需要审批
   */
  requiresApproval(action: string): boolean {
    if (this.config.autoApprove) return false;
    if (this.matchesAutoApprovePattern(action)) return false;
    if (!this.config.requireApprovalFor || this.config.requireApprovalFor.length === 0) return true;
    return this.config.requireApprovalFor.some(pattern =>
      action.toLowerCase().includes(pattern.toLowerCase())
    );
  }

  /**
   * 关闭门控，清理资源
   */
  dispose(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
    this.requests.clear();
    this.removeAllListeners();
  }

  private matchesAutoApprovePattern(action: string): boolean {
    if (!this.config.autoApprovePatterns || this.config.autoApprovePatterns.length === 0) return false;
    return this.config.autoApprovePatterns.some(pattern =>
      new RegExp(pattern, 'i').test(action)
    );
  }

  private cleanupExpired(): void {
    const now = Date.now();
    for (const [id, request] of this.requests) {
      if (request.status === ApprovalStatus.PENDING && now > request.expiresAt) {
        request.status = ApprovalStatus.EXPIRED;
        this.emit('expired', request);
        logger.warn('Approval request expired', 'ApprovalGate', { id, action: request.action });
      }
    }
  }
}
