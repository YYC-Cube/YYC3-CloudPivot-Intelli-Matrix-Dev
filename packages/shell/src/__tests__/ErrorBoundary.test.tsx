/**
 * @file: ErrorBoundary.test.tsx
 * @description: ErrorBoundary 组件测试 — 错误捕获、兜底渲染、重试恢复
 */
import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ErrorBoundary } from "../ErrorBoundary";

// 制造错误的子组件
const ThrowComponent = ({ message = "测试崩溃" }: { message?: string }) => {
  throw new Error(message);
};

// 正常子组件
const NormalComponent = () => <div>正常内容</div>;

describe("ErrorBoundary", () => {
  // 抑制 React 错误日志噪声
  const originalError = console.error;
  beforeEach(() => {
    console.error = vi.fn();
    localStorage.clear();
  });
  afterEach(() => {
    console.error = originalError;
  });

  describe("正常渲染", () => {
    it("无错误时应渲染 children", () => {
      render(
        <ErrorBoundary>
          <NormalComponent />
        </ErrorBoundary>
      );
      expect(screen.getByText("正常内容")).toBeInTheDocument();
    });

    it("自定义 fallback 存在时应渲染自定义兜底", () => {
      render(
        <ErrorBoundary fallback={<div>自定义错误页</div>}>
          <ThrowComponent />
        </ErrorBoundary>
      );
      expect(screen.getByText("自定义错误页")).toBeInTheDocument();
    });
  });

  describe("错误捕获", () => {
    it("子组件抛错时应渲染默认兜底 UI", () => {
      render(
        <ErrorBoundary>
          <ThrowComponent message="网络异常" />
        </ErrorBoundary>
      );
      expect(screen.getByText("页面出错了")).toBeInTheDocument();
      expect(screen.getByText("网络异常")).toBeInTheDocument();
    });

    it("兜底 UI 应包含重试按钮", () => {
      render(
        <ErrorBoundary>
          <ThrowComponent />
        </ErrorBoundary>
      );
      expect(screen.getByText("重试")).toBeInTheDocument();
    });

    it("空错误消息时应仍渲染兜底 UI", () => {
      render(
        <ErrorBoundary>
          <ThrowComponent message="" />
        </ErrorBoundary>
      );
      // Error message 为空字符串时，?? 不触发（空串非 null/undefined），但兜底 UI 仍渲染
      expect(screen.getByText("页面出错了")).toBeInTheDocument();
    });

    it("onError 回调应被调用", () => {
      const onError = vi.fn();
      render(
        <ErrorBoundary onError={onError}>
          <ThrowComponent message="回调测试" />
        </ErrorBoundary>
      );
      expect(onError).toHaveBeenCalledTimes(1);
      expect(onError.mock.calls[0][0]).toBeInstanceOf(Error);
      expect(onError.mock.calls[0][0].message).toBe("回调测试");
    });
  });

  describe("重试恢复", () => {
    it("点击重试应重置错误状态", () => {
      let shouldThrow = true;
      const ConditionalComponent = () => {
        if (shouldThrow) throw new Error("条件崩溃");
        return <div>恢复成功</div>;
      };

      const { rerender } = render(
        <ErrorBoundary>
          <ConditionalComponent />
        </ErrorBoundary>
      );
      expect(screen.getByText("页面出错了")).toBeInTheDocument();

      // 修复错误源
      shouldThrow = false;
      fireEvent.click(screen.getByText("重试"));

      // 重试后重置状态，但需重渲染才能看到恢复
      rerender(
        <ErrorBoundary>
          <ConditionalComponent />
        </ErrorBoundary>
      );
      expect(screen.queryByText("页面出错了")).not.toBeInTheDocument();
      expect(screen.getByText("恢复成功")).toBeInTheDocument();
    });
  });
});
