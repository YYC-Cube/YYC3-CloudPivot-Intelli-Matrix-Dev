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

import React, { useState, useEffect, useCallback, useRef } from 'react';
import type { ChatMessage } from '../family-bindings/FamilyChatBinding.js';
import { FamilyChatBinding } from '../family-bindings/FamilyChatBinding.js';
import type { FamilyBindingState } from '../family-bindings/FamilyBinding.js';
import { FAMILY_PROFILES } from '@yyc3/family-agents';

export interface FamilyChatProps {
  chatBinding: FamilyChatBinding;
  onClose?: () => void;
}

export const FamilyChat: React.FC<FamilyChatProps> = ({ chatBinding, onClose }) => {
  const profile = FAMILY_PROFILES[chatBinding.getMemberId()];
  const [history, setHistory] = useState<ChatMessage[]>(chatBinding.getHistory());
  const [input, setInput] = useState('');
  const [typing, setTyping] = useState(false);
  const [bindingState, setBindingState] = useState<FamilyBindingState>(
    chatBinding.getBinding().getState(),
  );
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setHistory(chatBinding.getHistory());

    const unsubMessage = chatBinding.onMessage(() => {
      setHistory(chatBinding.getHistory());
    });

    const unsubHistory = chatBinding.onHistoryChange((h) => {
      setHistory(h);
    });

    const unsubBinding = chatBinding.getBinding().onStateChange((state) => {
      setBindingState(state);
    });

    return () => {
      unsubMessage();
      unsubHistory();
      unsubBinding();
    };
  }, [chatBinding]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [history]);

  const handleSend = useCallback(async () => {
    if (!input.trim()) return;
    const text = input;
    setInput('');
    setTyping(true);
    try {
      await chatBinding.sendMessage(text);
    } finally {
      setTyping(false);
    }
  }, [input, chatBinding]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }, [handleSend]);

  return React.createElement('div', {
    className: 'family-chat',
    'data-testid': `chat-${chatBinding.getMemberId()}`,
    style: {
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      borderLeft: `4px solid ${profile.color}`,
      borderRadius: '8px',
      overflow: 'hidden',
      backgroundColor: '#fff',
    },
  },
    React.createElement('div', {
      className: 'chat-header',
      style: {
        display: 'flex',
        alignItems: 'center',
        padding: '12px',
        borderBottom: `2px solid ${profile.color}`,
        backgroundColor: `${profile.color}10`,
      },
    },
      React.createElement('span', { style: { fontSize: '1.5em', marginRight: '8px' } }, profile.icon),
      React.createElement('span', { style: { fontWeight: 'bold', color: profile.color } }, profile.name),
      React.createElement('span', { style: { marginLeft: 'auto', fontSize: '0.8em', color: '#888' } },
        `🌹 ${bindingState.status}`),
      onClose && React.createElement('button', {
        onClick: onClose,
        style: { marginLeft: '8px', cursor: 'pointer', border: 'none', background: 'transparent', fontSize: '1.2em' },
      }, '✕'),
    ),
    React.createElement('div', {
      className: 'chat-messages',
      'data-testid': 'chat-messages',
      style: {
        flex: 1,
        overflowY: 'auto',
        padding: '12px',
      },
    },
      ...history.map((msg) =>
        React.createElement('div', {
          key: msg.id,
          className: `chat-bubble chat-bubble-${msg.role}`,
          'data-testid': `msg-${msg.role}`,
          style: {
            maxWidth: '80%',
            marginBottom: '8px',
            padding: '8px 12px',
            borderRadius: msg.role === 'user' ? '12px 12px 4px 12px' : '12px 12px 12px 4px',
            backgroundColor: msg.role === 'user' ? '#e3f2fd' : `${profile.color}15`,
            alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
            marginLeft: msg.role === 'user' ? 'auto' : undefined,
            marginRight: msg.role === 'agent' ? 'auto' : undefined,
          },
        },
          React.createElement('div', null, msg.text),
          msg.role === 'agent' && React.createElement('div', {
            style: { fontSize: '0.7em', color: '#999', marginTop: '4px', textAlign: 'right' },
          }, '🌹'),
        )
      ),
      typing && React.createElement('div', {
        className: 'typing-indicator',
        'data-testid': 'typing-indicator',
        style: { color: '#999', fontStyle: 'italic', padding: '4px 12px' },
      }, `${profile.name} 正在思考...`),
      React.createElement('div', { ref: messagesEndRef }),
    ),
    React.createElement('div', {
      className: 'chat-input',
      style: {
        display: 'flex',
        padding: '8px',
        borderTop: '1px solid #eee',
      },
    },
      React.createElement('input', {
        type: 'text',
        value: input,
        onChange: (e: React.ChangeEvent<HTMLInputElement>) => setInput(e.target.value),
        onKeyDown: handleKeyDown,
        placeholder: `与 ${profile.name} 对话...`,
        'data-testid': 'chat-input',
        style: {
          flex: 1,
          padding: '8px 12px',
          border: `1px solid ${profile.color}40`,
          borderRadius: '20px',
          outline: 'none',
          fontSize: '14px',
        },
      }),
      React.createElement('button', {
        onClick: handleSend,
        disabled: !input.trim(),
        'data-testid': 'chat-send',
        style: {
          marginLeft: '8px',
          padding: '8px 16px',
          backgroundColor: profile.color,
          color: '#fff',
          border: 'none',
          borderRadius: '20px',
          cursor: input.trim() ? 'pointer' : 'not-allowed',
          opacity: input.trim() ? 1 : 0.5,
        },
      }, '发送'),
    ),
  );
};
