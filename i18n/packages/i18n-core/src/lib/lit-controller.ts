/**
 * file: lit-controller.ts
 * description: Lit Reactive Controller — Web Components 集成的 i18n 响应式控制器
 * author: YanYuCloudCube Team <admin@0379.email>
 * version: v2.0.0
 * created: 2026-03-21
 * updated: 2026-06-09
 * status: active
 * tags: [controller],[i18n],[lit],[web-components]
 *
 * brief: 为 Lit 组件提供响应式 i18n 支持
 *
 * details:
 * - 实现 Lit ReactiveController 接口（hostConnected/hostDisconnected）
 * - 订阅 I18nManager 语言变更事件，自动触发 host.requestUpdate()
 * - t() 便捷方法直接翻译
 * - 组件销毁时自动取消订阅，防止内存泄漏
 *
 * dependencies: lit (peerDependency, optional), translate.js
 * exports: I18nController
 * notes: 仅在 Lit 环境中使用，peerDependency 标记为 optional
 */

import type { ReactiveController, ReactiveControllerHost } from "lit";
import { i18n } from "./translate.js";

export class I18nController implements ReactiveController {
  private host: ReactiveControllerHost;
  private unsubscribe?: () => void;

  constructor(host: ReactiveControllerHost) {
    this.host = host;
    this.host.addController(this);
  }

  hostConnected() {
    this.unsubscribe = i18n.subscribe(() => {
      this.host.requestUpdate();
    });
  }

  hostDisconnected() {
    this.unsubscribe?.();
  }
}
