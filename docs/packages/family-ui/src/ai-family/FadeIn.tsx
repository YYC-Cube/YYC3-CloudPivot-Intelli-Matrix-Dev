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
 * FadeIn.tsx
 * ===========
 * 沙箱安全的入场动画组件
 * 纯 CSS transition + setTimeout，不依赖 IntersectionObserver
 * 兼容 Figma Make iframe 沙箱环境
 */

import React, { useState, useEffect } from "react";

interface FadeInProps {
  children: React.ReactNode;
  delay?: number;
  className?: string;
  style?: React.CSSProperties;
  onClick?: (e: React.MouseEvent) => void;
  direction?: "up" | "down" | "left" | "right" | "none";
}

export function FadeIn({
  children,
  delay = 0,
  className = "",
  style,
  onClick,
  direction = "up",
}: FadeInProps) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setShow(true), Math.min(delay * 1000, 1200));
    return () => clearTimeout(t);
  }, [delay]);

  const transforms: Record<string, string> = {
    up: "translateY(12px)",
    down: "translateY(-12px)",
    left: "translateX(12px)",
    right: "translateX(-12px)",
    none: "none",
  };

  return (
    <div
      className={className}
      onClick={onClick}
      style={{
        ...style,
        opacity: show ? 1 : 0,
        transform: show ? "none" : transforms[direction],
        transition: "opacity 0.5s ease, transform 0.5s ease",
      }}
    >
      {children}
    </div>
  );
}
