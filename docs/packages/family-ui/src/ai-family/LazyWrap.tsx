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
 * LazyWrap.tsx
 * =============
 * React.lazy Suspense 包装器
 * 独立 .tsx 文件以支持 JSX 语法
 */

import React, { Suspense } from "react";

function LoadingSpinner() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-[rgba(0,212,255,0.15)] border-t-[rgba(0,212,255,0.6)] rounded-full animate-spin" />
    </div>
  );
}

export function LazyWrap({
  Component,
}: {
  Component: React.LazyExoticComponent<React.ComponentType>;
}) {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <Component />
    </Suspense>
  );
}
