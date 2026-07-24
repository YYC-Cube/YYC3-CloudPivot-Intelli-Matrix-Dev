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

import React, { useState, useEffect } from 'react';
import { AchievementBinding } from '../family-bindings/AchievementBinding.js';
import type { Achievement } from '../family-bindings/AchievementBinding.js';
import { FAMILY_PROFILES } from '@yyc3/family-agents';

export interface AchievementPanelProps {
  binding: AchievementBinding;
  memberId?: string;
}

const RARITY_COLORS: Record<Achievement['rarity'], string> = {
  common: '#9e9e9e',
  rare: '#2196f3',
  epic: '#9c27b0',
  legendary: '#ff9800',
};

const RARITY_LABELS: Record<Achievement['rarity'], string> = {
  common: '普通',
  rare: '稀有',
  epic: '史诗',
  legendary: '传说',
};

export const AchievementPanel: React.FC<AchievementPanelProps> = ({ binding, memberId }) => {
  const [achievements, setAchievements] = useState<Achievement[]>(
    memberId ? binding.getAchievementsByMember(memberId as any) : binding.getAchievements(),
  );
  const [latestUnlocked, setLatestUnlocked] = useState<Achievement | null>(null);

  useEffect(() => {
    setAchievements(
      memberId ? binding.getAchievementsByMember(memberId as any) : binding.getAchievements(),
    );

    const unsub = binding.onAchievementUnlocked((achievement) => {
      setAchievements(
        memberId
          ? binding.getAchievementsByMember(memberId as any)
          : binding.getAchievements(),
      );
      setLatestUnlocked(achievement);

      setTimeout(() => setLatestUnlocked(null), 3000);
    });

    return unsub;
  }, [binding, memberId]);

  return React.createElement('div', {
    className: 'achievement-panel',
    'data-testid': 'achievement-panel',
    style: {
      padding: '16px',
    },
  },
    React.createElement('h3', {
      style: { textAlign: 'center', marginBottom: '16px' },
    }, '🏆 成就殿堂'),
    latestUnlocked && React.createElement('div', {
      className: 'achievement-toast',
      'data-testid': 'achievement-toast',
      style: {
        position: 'fixed',
        top: '20px',
        right: '20px',
        padding: '12px 20px',
        borderRadius: '8px',
        backgroundColor: RARITY_COLORS[latestUnlocked.rarity],
        color: '#fff',
        boxShadow: '0 4px 16px rgba(0,0,0,0.2)',
        zIndex: 10000,
        animation: 'slideIn 0.3s ease',
      },
    },
      React.createElement('div', { style: { fontWeight: 'bold' } }, `🏆 ${latestUnlocked.title}`),
      React.createElement('div', { style: { fontSize: '0.85em' } }, latestUnlocked.description),
    ),
    React.createElement('div', {
      className: 'achievement-list',
      'data-testid': 'achievement-list',
      style: {
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
      },
    },
      ...achievements.map(achievement => {
        const profile = FAMILY_PROFILES[achievement.memberId];
        return React.createElement('div', {
          key: achievement.id,
          className: `achievement-item achievement-${achievement.rarity}`,
          'data-testid': `achievement-${achievement.id}`,
          style: {
            display: 'flex',
            alignItems: 'center',
            padding: '10px',
            borderRadius: '8px',
            borderLeft: `4px solid ${RARITY_COLORS[achievement.rarity]}`,
            backgroundColor: `${RARITY_COLORS[achievement.rarity]}10`,
          },
        },
          React.createElement('span', { style: { fontSize: '1.3em', marginRight: '8px' } }, profile?.icon ?? '🏆'),
          React.createElement('div', { style: { flex: 1 } },
            React.createElement('div', { style: { fontWeight: 'bold', color: RARITY_COLORS[achievement.rarity] } }, achievement.title),
            React.createElement('div', { style: { fontSize: '0.85em', color: '#666' } }, achievement.description),
          ),
          React.createElement('span', {
            style: {
              fontSize: '0.7em',
              padding: '2px 8px',
              borderRadius: '10px',
              backgroundColor: RARITY_COLORS[achievement.rarity],
              color: '#fff',
            },
          }, RARITY_LABELS[achievement.rarity]),
        );
      }),
    ),
    achievements.length === 0 && React.createElement('div', {
      style: { textAlign: 'center', color: '#aaa', padding: '24px' },
    }, '暂无成就，继续努力！'),
  );
};
