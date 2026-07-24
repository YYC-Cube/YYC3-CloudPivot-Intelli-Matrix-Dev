/**
 * @file: ErrorBoundary.tsx
 * @description: 全局错误边界 — 生产级兜底
 */
import React, { Component, type ErrorInfo, type ReactNode } from "react";

interface Props { children: ReactNode; fallback?: ReactNode; onError?: (error: Error, info: ErrorInfo) => void; }
interface State { hasError: boolean; error: Error | null; }

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    this.props.onError?.(error, info);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;
      return (
        <div className="flex items-center justify-center min-h-screen p-8" style={{ background: "radial-gradient(ellipse at center, rgba(255,60,60,0.03) 0%, rgba(4,8,20,1) 70%)" }}>
          <div className="text-center max-w-sm">
            <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-[rgba(255,60,60,0.1)] flex items-center justify-center">
              <span className="text-2xl">⚠</span>
            </div>
            <h2 className="text-[#ff6060] text-lg font-medium mb-2">页面出错了</h2>
            <p className="text-[rgba(255,96,96,0.4)] text-sm mb-4">{this.state.error?.message ?? "未知错误"}</p>
            <button onClick={() => this.setState({ hasError: false, error: null })} className="px-4 py-2 rounded-xl text-sm" style={{ background: "rgba(255,60,60,0.1)", border: "1px solid rgba(255,60,60,0.2)", color: "#ff6060" }}>
              重试
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
