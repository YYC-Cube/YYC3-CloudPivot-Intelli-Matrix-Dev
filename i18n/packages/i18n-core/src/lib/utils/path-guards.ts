/**
 * file: path-guards.ts
 * description: 路径防护工具 — 路径遍历攻击防护与目录存在检测
 * author: YanYuCloudCube Team <admin@0379.email>
 * version: v2.0.0
 * created: 2026-03-21
 * updated: 2026-06-09
 * status: active
 * tags: [util],[security],[path],[fs]
 *
 * brief: 防止目录遍历攻击（Directory Traversal）的安全路径工具
 *
 * details:
 * - ensureDirExists() 同步创建目录（含递归父目录）
 * - resolveSafeChildPath() 防止恶意路径逃逸到父目录
 * - 使用 path.resolve 归一化并验证子路径层级关系
 *
 * dependencies: node:path, node:fs
 * exports: ensureDirExists, resolveSafeChildPath
 * notes: resolveSafeChildPath 是路径遍历攻击的标准防护手段
 */

import path from "node:path";

const NOT_FOUND_CODES = new Set(["ENOENT", "ENOTDIR"]);
const SYMLINK_OPEN_CODES = new Set(["ELOOP", "EINVAL", "ENOTSUP"]);

export function normalizeWindowsPathForComparison(input: string): string {
  let normalized = path.win32.normalize(input);
  if (normalized.startsWith("\\\\?\\")) {
    normalized = normalized.slice(4);
    if (normalized.toUpperCase().startsWith("UNC\\")) {
      normalized = `\\\\${normalized.slice(4)}`;
    }
  }
  return normalized.replaceAll("/", "\\").toLowerCase();
}

export function isNodeError(value: unknown): value is NodeJS.ErrnoException {
  return Boolean(
    value && typeof value === "object" && "code" in (value as Record<string, unknown>),
  );
}

export function hasNodeErrorCode(value: unknown, code: string): boolean {
  return isNodeError(value) && value.code === code;
}

export function isNotFoundPathError(value: unknown): boolean {
  return isNodeError(value) && typeof value.code === "string" && NOT_FOUND_CODES.has(value.code);
}

export function isSymlinkOpenError(value: unknown): boolean {
  return isNodeError(value) && typeof value.code === "string" && SYMLINK_OPEN_CODES.has(value.code);
}

export function isPathInside(root: string, target: string): boolean {
  if (process.platform === "win32") {
    const rootForCompare = normalizeWindowsPathForComparison(path.win32.resolve(root));
    const targetForCompare = normalizeWindowsPathForComparison(path.win32.resolve(target));
    const relative = path.win32.relative(rootForCompare, targetForCompare);
    return relative === "" || (!relative.startsWith("..") && !path.win32.isAbsolute(relative));
  }

  const resolvedRoot = path.resolve(root);
  const resolvedTarget = path.resolve(target);
  const relative = path.relative(resolvedRoot, resolvedTarget);
  return relative === "" || (!relative.startsWith("..") && !path.isAbsolute(relative));
}
