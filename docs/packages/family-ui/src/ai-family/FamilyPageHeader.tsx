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
 * FamilyPageHeader.tsx
 * =====================
 * AI Family 统一页面头部 · v2 — 返回按钮 + 全站导航下拉
 */

import React, { useState, useRef, useEffect } from "react";
import { ChevronLeft, ChevronDown, Menu } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { AI_FAMILY_NAV } from "./navigation-config";

interface FamilyPageHeaderProps {
  icon: React.ElementType;
  iconColor?: string;
  title: string;
  subtitle?: string;
  backPath?: string;
  backLabel?: string;
  actions?: React.ReactNode;
  /** 是否显示全站导航下拉 (默认 true) */
  showNav?: boolean;
}

export function FamilyPageHeader({
  icon: Icon,
  iconColor = "#00d4ff",
  title,
  subtitle,
  backPath = "/ai-family",
  backLabel = "返回家园",
  actions,
  showNav = true,
}: FamilyPageHeaderProps) {
  const nav = useNavigate();
  const [navOpen, setNavOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // 点击外部关闭下拉
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setNavOpen(false);
      }
    };
    if (navOpen) document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [navOpen]);

  return (
    <div className="px-4 md:px-8 pt-4 pb-3 border-b border-[rgba(0,180,255,0.06)]">
      <div className="max-w-5xl mx-auto">
        {/* 顶部操作栏：返回 + 导航下拉 + actions */}
        <div className="flex items-center justify-between mb-2" style={{ minHeight: 28 }}>
          <div className="flex items-center gap-3">
            <button
              onClick={() => nav(backPath)}
              className="flex items-center gap-1 text-[rgba(0,212,255,0.5)] hover:text-[#00d4ff] transition-colors"
              style={{ fontSize: "0.72rem" }}
            >
              <ChevronLeft className="w-3 h-3" /> {backLabel}
            </button>

            {showNav && (
              <div ref={dropdownRef} style={{ position: "relative" }}>
                <button
                  onClick={() => setNavOpen(!navOpen)}
                  className="flex items-center gap-1 text-[rgba(0,212,255,0.4)] hover:text-[#00d4ff] transition-colors"
                  style={{ fontSize: "0.68rem" }}
                >
                  <Menu className="w-3 h-3" /> 页面导航
                  <ChevronDown className={`w-2.5 h-2.5 transition-transform ${navOpen ? "rotate-180" : ""}`} />
                </button>

                {navOpen && (
                  <div
                    className="absolute left-0 top-full mt-1 z-50 rounded-lg border border-[rgba(0,212,255,0.12)] shadow-xl"
                    style={{
                      background: "rgba(8,16,32,0.98)",
                      backdropFilter: "blur(16px)",
                      minWidth: 200,
                      maxHeight: "60vh",
                      overflowY: "auto",
                    }}
                  >
                    {AI_FAMILY_NAV.subCategories.map((group) => (
                      <div key={group.id}>
                        <div
                          className="px-3 py-1.5 text-[rgba(0,212,255,0.3)] font-medium"
                          style={{ fontSize: "0.62rem", letterSpacing: "0.05em" }}
                        >
                          {group.labelZh}
                        </div>
                        {group.children.map((child) => (
                          <button
                            key={child.key}
                            onClick={() => {
                              nav(child.path);
                              setNavOpen(false);
                            }}
                            className="w-full text-left px-4 py-1.5 flex items-center gap-2 text-[#c8d8f0] hover:bg-[rgba(0,212,255,0.08)] transition-colors"
                            style={{ fontSize: "0.72rem" }}
                          >
                            {child.icon && <child.icon className="w-3.5 h-3.5" style={{ color: child.iconColor ?? "#00d4ff" }} />}
                            {child.label}
                          </button>
                        ))}
                        <div className="mx-3 border-b border-[rgba(0,180,255,0.04)]" />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
          {actions && <div>{actions}</div>}
        </div>

        {/* 标题行 */}
        <div className="flex items-center gap-2">
          <Icon className="w-5 h-5 flex-shrink-0" style={{ color: iconColor }} />
          <h1 className="text-[#e0f0ff] truncate" style={{ fontSize: "1.2rem" }}>
            {title}
          </h1>
        </div>
        {subtitle && (
          <p className="text-[rgba(224,240,255,0.35)] mt-0.5 ml-7" style={{ fontSize: "0.72rem" }}>
            {subtitle}
          </p>
        )}
      </div>
    </div>
  );
}
