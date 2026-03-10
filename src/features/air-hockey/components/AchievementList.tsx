import React from 'react';
import { MenuCard, GameTitle, StartButton } from '../styles';
import { ACHIEVEMENTS, getUnlockedAchievements } from '../core/achievements';

type AchievementListProps = {
  onBack: () => void;
};

export const AchievementList: React.FC<AchievementListProps> = ({ onBack }) => {
  const unlocked = getUnlockedAchievements();

  return (
    <MenuCard>
      <GameTitle>実績</GameTitle>
      <div style={{ width: '100%', marginBottom: '1.5rem' }}>
        {ACHIEVEMENTS.map(a => {
          const isUnlocked = unlocked.includes(a.id);
          return (
            <div
              key={a.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '10px',
                marginBottom: '8px',
                background: isUnlocked ? 'rgba(0, 210, 255, 0.1)' : 'rgba(0, 0, 0, 0.3)',
                borderRadius: '8px',
                border: isUnlocked ? '1px solid rgba(0, 210, 255, 0.3)' : '1px solid transparent',
                opacity: isUnlocked ? 1 : 0.5,
              }}
            >
              <span style={{ fontSize: '1.5rem' }}>{a.icon}</span>
              <div>
                <div style={{ color: isUnlocked ? 'var(--accent-color)' : '#888', fontWeight: 'bold', fontSize: '0.9rem' }}>
                  {a.name}
                </div>
                <div style={{ color: '#aaa', fontSize: '0.75rem' }}>
                  {a.description}
                </div>
              </div>
            </div>
          );
        })}
      </div>
      <div style={{ color: '#aaa', fontSize: '0.85rem', marginBottom: '1rem' }}>
        {unlocked.length} / {ACHIEVEMENTS.length} 解除済み
      </div>
      <StartButton onClick={onBack}>BACK</StartButton>
    </MenuCard>
  );
};
