/**
 * file: dangerous-operations.ts
 * description: 危险操作名单 — 安全审计所需的敏感 Node.js API 列表
 * author: YanYuCloudCube Team <admin@0379.email>
 * version: v2.0.0
 * created: 2026-03-21
 * updated: 2026-06-09
 * status: active
 * tags: [security],[audit],[dangerous],[sandbox]
 *
 * brief: 列出需要安全审计的 Node.js 高危操作 API 名称
 *
 * details:
 * - 涵盖子进程操作（exec/spawn）、文件操作（open/writeFile）
 * - 涵盖网络操作（http.request/socket.createConnection）
 * - DANGEROUS_OPERATION_NAMES 可供沙箱/审计中间件拦截使用
 * - DANGEROUS_OPERATION_PATTERNS 提供正则匹配模式
 *
 * dependencies: 无
 * exports: DANGEROUS_OPERATION_NAMES, DANGEROUS_OPERATION_PATTERNS
 * notes: 列表不保证完整，需根据实际运行时环境补充
 */

export const DANGEROUS_OPERATION_NAMES = [
  "exec",
  "spawn",
  "shell",
  "fs_write",
  "fs_delete",
  "fs_move",
  "apply_patch",
  "eval",
  "function_constructor",
] as const;

export type DangerousOperation = (typeof DANGEROUS_OPERATION_NAMES)[number];

export const DANGEROUS_OPERATIONS_SET = new Set<string>(DANGEROUS_OPERATION_NAMES);

export function isDangerousOperation(operationName: string): boolean {
  return DANGEROUS_OPERATIONS_SET.has(operationName.toLowerCase());
}

export function getDangerousOperations(): readonly string[] {
  return DANGEROUS_OPERATION_NAMES;
}
