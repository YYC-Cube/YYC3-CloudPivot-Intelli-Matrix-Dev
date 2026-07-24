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

import React, { useState, useEffect, useCallback } from 'react';
import { AIAssistantBinding } from '../family-bindings/AIAssistantBinding.js';
import type { AssistantState } from '../family-bindings/AIAssistantBinding.js';
import { FamilyChat } from './FamilyChat.js';
import { FAMILY_PROFILES } from '@yyc3/family-agents';

export interface AIAssistantProps {
  binding: AIAssistantBinding;
  onExpand?: () => void;
}

export const AIAssistant: React.FC<AIAssistantProps> = ({ binding, onExpand: _onExpand }) => {
  const profile = FAMILY_PROFILES[binding.getMemberId()];
  const [state, setState] = useState<AssistantState>(binding.getState());
  const [position] = useState(binding.getPosition());

  useEffect(() => {
    const unsubState = binding.onStateChange((s) => {
      setState(s);
    });
    return unsubState;
  }, [binding]);

  const handleToggle = useCallback(() => {
    if (state === 'closed') {
      binding.open();
    } else if (state === 'minimized') {
      binding.expand();
    } else {
      binding.minimize();
    }
  }, [binding, state]);

  const handleClose = useCallback(() => {
    binding.close();
  }, [binding]);

  const chatBinding = binding.getChatBinding();

  if (state === 'closed') {
    return React.createElement('div', {
      className: 'ai-assistant-fab',
      'data-testid': 'ai-assistant-fab',
      onClick: handleToggle,
      style: {
        position: 'fixed',
        bottom: `${position.y}px`,
        right: `${position.x}px`,
        width: '56px',
        height: '56px',
        borderRadius: '50%',
        backgroundColor: profile.color,
        color: '#fff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '1.8em',
        cursor: 'pointer',
        boxShadow: `0 4px 12px ${profile.color}60`,
        zIndex: 9999,
        transition: 'transform 0.2s ease',
      },
    }, profile.icon);
  }

  if (state === 'minimized') {
    return React.createElement('div', {
      className: 'ai-assistant-minimized',
      'data-testid': 'ai-assistant-minimized',
      onClick: handleToggle,
      style: {
        position: 'fixed',
        bottom: `${position.y}px`,
        right: `${position.x}px`,
        padding: '8px 16px',
        borderRadius: '24px',
        backgroundColor: profile.color,
        color: '#fff',
        cursor: 'pointer',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        boxShadow: `0 4px 12px ${profile.color}60`,
      },
    },
      React.createElement('span', null, profile.icon),
      React.createElement('span', { style: { fontSize: '0.9em' } }, profile.name),
    );
  }

  return React.createElement('div', {
    className: 'ai-assistant-panel',
    'data-testid': 'ai-assistant-panel',
    style: {
      position: 'fixed',
      bottom: `${position.y}px`,
      right: `${position.x}px`,
      width: state === 'fullscreen' ? '100vw' : '380px',
      height: state === 'fullscreen' ? '100vh' : '520px',
      borderRadius: state === 'fullscreen' ? '0' : '16px',
      backgroundColor: '#fff',
      boxShadow: '0 8px 32px rgba(0,0,0,0.15)',
      zIndex: 9999,
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
      border: `2px solid ${profile.color}`,
    },
  },
    React.createElement('div', {
      className: 'assistant-header',
      style: {
        display: 'flex',
        alignItems: 'center',
        padding: '12px',
        backgroundColor: `${profile.color}10`,
        borderBottom: `1px solid ${profile.color}30`,
      },
    },
      React.createElement('span', { style: { fontSize: '1.5em', marginRight: '8px' } }, profile.icon),
      React.createElement('span', { style: { fontWeight: 'bold', color: profile.color } }, profile.name),
      React.createElement('div', { style: { marginLeft: 'auto', display: 'flex', gap: '8px' } },
        React.createElement('button', {
          onClick: () => binding.toggleFullscreen(),
          style: { border: 'none', background: 'transparent', cursor: 'pointer', fontSize: '1em' },
          'data-testid': 'btn-fullscreen',
        }, state === 'fullscreen' ? '⬜' : '⬛'),
        React.createElement('button', {
          onClick: () => binding.minimize(),
          style: { border: 'none', background: 'transparent', cursor: 'pointer', fontSize: '1em' },
          'data-testid': 'btn-minimize',
        }, '➖'),
        React.createElement('button', {
          onClick: handleClose,
          style: { border: 'none', background: 'transparent', cursor: 'pointer', fontSize: '1em' },
          'data-testid': 'btn-close',
        }, '✕'),
      ),
    ),
    React.createElement('div', {
      style: { flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' },
    },
      chatBinding
        ? React.createElement(FamilyChat, { chatBinding })
        : React.createElement('div', {
            style: { flex: 1, padding: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center' },
          },
            React.createElement('div', { style: { textAlign: 'center', color: '#666' } },
              React.createElement('div', { style: { fontSize: '2em' } }, profile.icon),
              React.createElement('div', { style: { fontWeight: 'bold', color: profile.color, marginTop: '8px' } }, profile.name),
              React.createElement('div', { style: { fontSize: '0.85em', fontStyle: 'italic', marginTop: '4px' } }, profile.motto),
            ),
          ),
    ),
  );
};
