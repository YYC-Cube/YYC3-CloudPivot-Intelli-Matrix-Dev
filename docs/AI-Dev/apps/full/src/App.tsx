/**
 * @file: App.tsx
 * @description: YYC³ 合并版 — 加载全部 6 个子系统
 *
 * 展示按导航分类拆分后，通过 Shell 统一组合的效果。
 * 6 个插件各自独立开发、构建、版本管理，在 Shell 层合并。
 */
import React, { useState } from "react";
import { createHashRouter, RouterProvider, Navigate, Outlet } from "react-router-dom";
import { WelcomePage, eventBus, Events } from "@yyc3/shell";
import { AIAssistantHub, FAMILY_PERSONAS, register as aiFamily } from "@yyc3/plugin-ai-family";
import { register as monitor } from "@yyc3/plugin-monitor";
import { register as ops } from "@yyc3/plugin-ops";
import { register as ai } from "@yyc3/plugin-ai";
import { register as dev } from "@yyc3/plugin-dev";
import { register as admin } from "@yyc3/plugin-admin";

// 收集所有注册的系统
const SYSTEMS = [monitor(), ops(), ai(), aiFamily(), dev(), admin()];

// 构建 WelcomePage 卡片数据
const SYSTEM_CARDS = SYSTEMS.map(s => ({
  id: s.id, name: s.name, description: s.description,
  icon: s.icon, color: s.color, path: `/${s.id}`,
}));

// 构建所有 Hub 命令
const ALL_HUB_COMMANDS = SYSTEMS.flatMap(s => s.hubCommands ?? []);

// AI Family 摘要
const familySummary = `${FAMILY_PERSONAS.length} 位家人 · ${FAMILY_PERSONAS.filter(p => p.mood !== "idle").length} 人在线`;

// ===== Layout 组件 =====
function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen" style={{ background: "radial-gradient(ellipse at center, rgba(0,180,255,0.03) 0%, rgba(4,8,20,1) 70%)" }}>
      {/* AI Family 中枢浮窗 — 全局统一入口 */}
      <AIAssistantHub
        externalCommands={ALL_HUB_COMMANDS}
        isMobile={window.innerWidth < 768}
      />
      {children}
    </div>
  );
}

// ===== 应用入口 =====
export default function App() {
  const [showWelcome, setShowWelcome] = useState(true);

  if (showWelcome) {
    return (
      <WelcomePage
        systems={SYSTEM_CARDS}
        mode="modal"
        onNavigate={() => setShowWelcome(false)}
        familySummary={familySummary}
      />
    );
  }

  // 动态构建路由: 每个系统的路由统一加其 ID 前缀
  const systemRoutes = SYSTEMS.flatMap(sys =>
    sys.routes.map(route => ({
      ...route,
      path: route.index ? `/${sys.id}` : `/${sys.id}/${route.path}`,
    }))
  );

  const router = createHashRouter([
    {
      element: <Layout><Outlet /></Layout>,
      children: [
        { index: true, element: <Navigate to={`/${SYSTEMS[0].id}`} replace /> },
        ...systemRoutes,
      ],
    },
  ]);

  return <RouterProvider router={router} />;
}


