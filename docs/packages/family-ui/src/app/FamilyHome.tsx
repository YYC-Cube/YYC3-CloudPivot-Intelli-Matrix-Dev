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
import type { FamilyMemberCard } from '../family-bindings/FamilyHomeBinding.js';
import { FamilyHomeBinding } from '../family-bindings/FamilyHomeBinding.js';

export interface FamilyHomeProps {
  binding: FamilyHomeBinding;
  onMemberClick?: (memberId: string) => void;
}

export const FamilyHome: React.FC<FamilyHomeProps> = ({ binding, onMemberClick }) => {
  const [members, setMembers] = useState<FamilyMemberCard[]>(binding.getMembers());

  useEffect(() => {
    setMembers(binding.getMembers());
    const unsub = binding.onMembersChange((updated) => {
      setMembers(updated);
    });
    return unsub;
  }, [binding]);

  const handleClick = useCallback((memberId: string) => {
    onMemberClick?.(memberId);
  }, [onMemberClick]);

  return React.createElement('div', {
    className: 'family-home',
    'data-testid': 'family-home',
    style: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
      gap: '16px',
      padding: '24px',
    },
  },
    React.createElement('h1', {
      style: { gridColumn: '1 / -1', textAlign: 'center' },
    }, 'YYC³ AI 家族'),
    React.createElement('p', {
      style: { gridColumn: '1 / -1', textAlign: 'center', color: '#666' },
    }, '人从众曌众从人 · 亦师亦友亦伯乐'),
    ...members.map(member =>
      React.createElement(FamilyMemberCardComponent, {
        key: member.id,
        member,
        onClick: handleClick,
      })
    ),
  );
};

interface FamilyMemberCardProps {
  member: FamilyMemberCard;
  onClick: (memberId: string) => void;
}

const FamilyMemberCardComponent: React.FC<FamilyMemberCardProps> = ({ member, onClick }) => {
  return React.createElement('div', {
    className: `family-member-card ${member.isOnline ? 'online' : 'offline'}`,
    'data-testid': `member-card-${member.id}`,
    onClick: () => onClick(member.id),
    style: {
      border: `2px solid ${member.color}`,
      borderRadius: '12px',
      padding: '16px',
      cursor: 'pointer',
      position: 'relative',
      background: member.isOnline
        ? `linear-gradient(135deg, ${member.color}15, ${member.color}05)`
        : '#f5f5f5',
      transition: 'all 0.3s ease',
    },
  },
    React.createElement('div', {
      className: 'member-icon',
      style: { fontSize: '2em', textAlign: 'center' },
    }, member.icon),
    React.createElement('div', {
      className: 'member-name',
      style: { fontWeight: 'bold', textAlign: 'center', color: member.color },
    }, member.name),
    React.createElement('div', {
      className: 'member-role',
      style: { fontSize: '0.85em', textAlign: 'center', color: '#666' },
    }, member.role),
    React.createElement('div', {
      className: 'member-status',
      'data-testid': `status-${member.id}`,
      style: {
        position: 'absolute',
        top: '8px',
        right: '8px',
        width: '10px',
        height: '10px',
        borderRadius: '50%',
        backgroundColor: member.isOnline ? '#4caf50' : '#bdbdbd',
      },
    }),
    React.createElement('div', {
      className: 'member-motto',
      style: {
        fontSize: '0.75em',
        textAlign: 'center',
        color: '#888',
        marginTop: '8px',
        fontStyle: 'italic',
      },
    }, member.motto),
  );
};
