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
import { EmotionRippleBinding } from '../family-bindings/EmotionRippleBinding.js';
import type { RippleState } from '../family-bindings/EmotionRippleBinding.js';
import { FAMILY_PROFILES } from '@yyc3/family-agents';
import type { FamilyMemberId, FamilyEmotionState } from '@yyc3/family-agents';

export interface EmotionRippleProps {
  binding: EmotionRippleBinding;
  memberId?: FamilyMemberId;
}

export const EmotionRipple: React.FC<EmotionRippleProps> = ({ binding, memberId }) => {
  const [ripples, setRipples] = useState<RippleState[]>(binding.getAllRipples());

  useEffect(() => {
    setRipples(binding.getAllRipples());
    const unsub = binding.onRipplesChange((updated) => {
      setRipples(updated);
    });
    return unsub;
  }, [binding]);

  const displayRipples = memberId
    ? ripples.filter(r => r.memberId === memberId)
    : ripples;

  return React.createElement('div', {
    className: 'emotion-ripple-container',
    'data-testid': 'emotion-ripple',
    style: {
      display: 'flex',
      gap: '12px',
      padding: '8px',
      flexWrap: 'wrap',
    },
  },
    ...displayRipples.map(ripple =>
      React.createElement(EmotionRippleCircle, {
        key: ripple.memberId,
        ripple,
      })
    ),
  );
};

interface EmotionRippleCircleProps {
  ripple: RippleState;
}

const EmotionRippleCircle: React.FC<EmotionRippleCircleProps> = ({ ripple }) => {
  const profile = FAMILY_PROFILES[ripple.memberId];
  const size = 40 + ripple.intensity * 30;
  const opacity = 0.4 + ripple.intensity * 0.6;

  const animationStyle = ripple.phase === 'surge'
    ? { animation: 'ripple-surge 0.5s ease-in-out infinite alternate' }
    : ripple.phase === 'wave'
      ? { animation: 'ripple-wave 1s ease-in-out infinite alternate' }
      : ripple.phase === 'pulse'
        ? { animation: 'ripple-pulse 2s ease-in-out infinite alternate' }
        : {};

  return React.createElement('div', {
    className: `emotion-ripple emotion-ripple-${ripple.phase}`,
    'data-testid': `ripple-${ripple.memberId}`,
    'data-phase': ripple.phase,
    'data-intensity': ripple.intensity.toFixed(2),
    style: {
      width: `${size}px`,
      height: `${size}px`,
      borderRadius: '50%',
      backgroundColor: ripple.color,
      opacity,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: `${Math.max(14, size * 0.4)}px`,
      transition: 'all 0.5s ease',
      boxShadow: `0 0 ${ripple.intensity * 20}px ${ripple.color}${Math.round(ripple.intensity * 99).toString(16).padStart(2, '0')}`,
      ...animationStyle,
    },
  }, profile?.icon ?? '?');
};

export const EmotionRippleAnimator: React.FC<{
  binding: EmotionRippleBinding;
  emotions: FamilyEmotionState[];
}> = ({ binding, emotions }) => {
  useEffect(() => {
    for (const emotion of emotions) {
      const profile = FAMILY_PROFILES[emotion.memberId];
      binding.updateFromEmotion(emotion, profile?.color);
    }
  }, [binding, emotions]);

  return React.createElement(EmotionRipple, { binding });
};
