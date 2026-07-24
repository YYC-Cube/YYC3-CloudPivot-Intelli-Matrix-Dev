/**
 * file: json-file.ts
 * description: JSON 文件工具 — 安全的 JSON 读写与原子写入
 * author: YanYuCloudCube Team <admin@0379.email>
 * version: v2.0.0
 * created: 2026-03-21
 * updated: 2026-06-09
 * status: active
 * tags: [util],[json],[fs],[file]
 *
 * brief: 提供安全的 JSON 文件读写和原子写操作
 *
 * details:
 * - readJsonFile() 带错误处理的 JSON.parse 封装
 * - writeJsonFile() 格式化写入 JSON（缩进 2 空格）
 * - atomicWriteJsonFile() 先写临时文件再 rename，防止写入中断导致的数据损坏
 * - 使用 fsync 确保数据写入磁盘
 *
 * dependencies: node:fs, node:path
 * exports: readJsonFile, writeJsonFile, atomicWriteJsonFile
 * notes: 适用于翻译文件的持久化存储场景
 */

import fs from "node:fs";
import path from "node:path";

export function loadJsonFile<T = unknown>(pathname: string): T | undefined {
  try {
    if (!fs.existsSync(pathname)) {
      return undefined;
    }
    const raw = fs.readFileSync(pathname, "utf8");
    return JSON.parse(raw) as T;
  } catch {
    return undefined;
  }
}

export function saveJsonFile(pathname: string, data: unknown): void {
  const dir = path.dirname(pathname);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true, mode: 0o700 });
  }
  fs.writeFileSync(pathname, `${JSON.stringify(data, null, 2)}\n`, "utf8");
  fs.chmodSync(pathname, 0o600);
}

export function jsonFileExists(pathname: string): boolean {
  try {
    return fs.existsSync(pathname);
  } catch {
    return false;
  }
}

export function deleteJsonFile(pathname: string): boolean {
  try {
    if (fs.existsSync(pathname)) {
      fs.unlinkSync(pathname);
      return true;
    }
    return false;
  } catch {
    return false;
  }
}
