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

import React from 'react';
import { describe, it, expect, vi, beforeAll } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { AIAssistant } from '../src/app/AIAssistant.js';
import { AIAssistantBinding } from '../src/family-bindings/AIAssistantBinding.js';
import { FamilyBinding } from '../src/family-bindings/FamilyBinding.js';
import { FAMILY_PROFILES } from '@yyc3/family-agents';
import type { FamilyMemberId } from '@yyc3/family-agents';
import { EventEmitter } from 'eventemitter3';

beforeAll(() => {
  Element.prototype.scrollIntoView = vi.fn();
});

function createMockAgent(memberId: FamilyMemberId): any {
  const profile = FAMILY_PROFILES[memberId];
  const emitter = new EventEmitter();
  const emotion = {
    memberId,
    tone: profile.emotionTone,
    temperature: 0.5,
    engagement: 0,
    lastUpdated: Date.now(),
  };

  return {
    memberId,
    config: { id: `family-${memberId}`, name: profile.name },
    getEmotion: () => ({ ...emotion }),
    updateEmotion: (updates: any) => {
      Object.assign(emotion, updates, { lastUpdated: Date.now() });
      emitter.emit('emotion:updated', { ...emotion });
    },
    getCapabilities: () => [],
    handleFamilyMessage: vi.fn(async (msg: any) => ({
      success: true,
      data: `${profile.name} received: ${msg.payload?.text ?? ''}`,
      executionTime: 10,
      timestamp: Date.now(),
    })),
    on: emitter.on.bind(emitter),
    off: emitter.off.bind(emitter),
    emit: emitter.emit.bind(emitter),
    removeAllListeners: emitter.removeAllListeners.bind(emitter),
    _emitter: emitter,
  };
}

function makeBinding(memberId: FamilyMemberId = 'qianhang'): AIAssistantBinding {
  const familyBinding = new FamilyBinding(memberId);
  const agent = createMockAgent(memberId);
  familyBinding.bind(agent);
  return new AIAssistantBinding(familyBinding);
}

describe('AIAssistant Component', () => {
  it('should render FAB when closed', () => {
    const binding = makeBinding();
    render(React.createElement(AIAssistant, { binding }));
    const fab = screen.getByTestId('ai-assistant-fab');
    expect(fab).toBeDefined();
    expect(fab.textContent).toContain(FAMILY_PROFILES.qianhang.icon);
  });

  it('should render minimized state', () => {
    const binding = makeBinding();
    binding.open();
    binding.minimize();
    render(React.createElement(AIAssistant, { binding }));
    const minimized = screen.getByTestId('ai-assistant-minimized');
    expect(minimized).toBeDefined();
    expect(minimized.textContent).toContain(FAMILY_PROFILES.qianhang.name);
  });

  it('should render expanded panel with FamilyChat when chatBinding available', () => {
    const binding = makeBinding();
    binding.open();
    render(React.createElement(AIAssistant, { binding }));
    const panel = screen.getByTestId('ai-assistant-panel');
    expect(panel).toBeDefined();

    const chatContainer = screen.getByTestId('chat-qianhang');
    expect(chatContainer).toBeDefined();
  });

  it('should render chat input with member-specific placeholder', () => {
    const binding = makeBinding();
    binding.open();
    render(React.createElement(AIAssistant, { binding }));
    const input = screen.getByTestId('chat-input');
    expect(input).toBeDefined();
    expect(input.getAttribute('placeholder')).toContain('千行');
  });

  it('should render fullscreen dimensions when fullscreen', () => {
    const binding = makeBinding();
    binding.open();
    binding.toggleFullscreen();
    render(React.createElement(AIAssistant, { binding }));
    const panel = screen.getByTestId('ai-assistant-panel');
    const style = (panel as HTMLElement).style;
    expect(style.width).toBe('100vw');
    expect(style.height).toBe('100vh');
  });

  it('should render header with control buttons', () => {
    const binding = makeBinding();
    binding.open();
    render(React.createElement(AIAssistant, { binding }));
    expect(screen.getByTestId('btn-fullscreen')).toBeDefined();
    expect(screen.getByTestId('btn-minimize')).toBeDefined();
    expect(screen.getByTestId('btn-close')).toBeDefined();
  });

  it('should render with different family members', () => {
    const binding = makeBinding('thinker');
    render(React.createElement(AIAssistant, { binding }));
    const fab = screen.getByTestId('ai-assistant-fab');
    expect(fab.textContent).toContain(FAMILY_PROFILES.thinker.icon);
  });

  it('should open panel when FAB is clicked', () => {
    const binding = makeBinding();
    render(React.createElement(AIAssistant, { binding }));

    act(() => {
      fireEvent.click(screen.getByTestId('ai-assistant-fab'));
    });

    expect(screen.getByTestId('ai-assistant-panel')).toBeDefined();
  });

  it('should show profile icon in expanded panel header', () => {
    const binding = makeBinding();
    binding.open();
    render(React.createElement(AIAssistant, { binding }));
    const panel = screen.getByTestId('ai-assistant-panel');
    expect(panel.textContent).toContain(FAMILY_PROFILES.qianhang.icon);
    expect(panel.textContent).toContain(FAMILY_PROFILES.qianhang.name);
  });
});
