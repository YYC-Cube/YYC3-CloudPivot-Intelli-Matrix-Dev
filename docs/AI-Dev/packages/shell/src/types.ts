/**
 * @file: types.ts
 * @description: 系统注册接口类型定义
 */
import type { RouteObject } from "react-router-dom";
import type React from "react";

/** 侧边栏菜单项 */
export interface MenuItem {
  path: string;
  label: string;           // i18n key 或直接文本
  icon?: React.ElementType;
  badge?: string | number;
}

/** 浮窗 Hub 快捷命令 */
export interface HubCommand {
  id: string;
  label: string;
  systemId: string;
  icon: React.ElementType;
  action: () => void;
}

/** 子系统注册信息 */
export interface SystemRegistration {
  id: string;
  name: string;
  description: string;
  icon: React.ElementType;
  color: string;
  order: number;

  /** 侧边栏菜单 */
  menuItems: MenuItem[];
  /** 路由配置 (相对路径) */
  routes: RouteObject[];
  /** 翻译贡献 */
  i18n?: Record<string, string>;
  /** 浮窗 Hub 命令 */
  hubCommands?: HubCommand[];
}

/** 欢迎页系统卡片 */
export interface SystemCard {
  id: string;
  name: string;
  description: string;
  icon: React.ElementType;
  color: string;
  path: string;
  badge?: string;
}
