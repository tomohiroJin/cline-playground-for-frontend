/**
 * 実績獲得トースト通知コンポーネント
 */
import React, { useEffect, useState } from 'react';
import styled, { keyframes } from 'styled-components';
import { COLORS, FONTS } from '../constants';
import { AchievementDefinition, AchievementRarity } from '../types';

interface AchievementToastProps {
  /** 新たに獲得した実績リスト */
  achievements: AchievementDefinition[];
  /** 表示完了コールバック */
  onComplete?: () => void;
}

/** レア度ごとの色 */
const RARITY_COLORS: Record<AchievementRarity, string> = {
  Bronze: '#cd7f32',
  Silver: '#c0c0c0',
  Gold: '#ffd700',
  Platinum: '#e5e4e2',
};

/** トースト表示時間 */
const TOAST_DURATION = 3000;
const TOAST_INTERVAL = 500;

const slideInUp = keyframes`
  0% { transform: translateY(60px); opacity: 0; }
  15% { transform: translateY(0); opacity: 1; }
  85% { transform: translateY(0); opacity: 1; }
  100% { transform: translateY(-20px); opacity: 0; }
`;

const ToastContainer = styled.div`
  position: fixed;
  bottom: 80px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 2000;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  pointer-events: none;
`;

const ToastItem = styled.div<{ $color: string }>`
  background: ${COLORS.glass};
  backdrop-filter: blur(12px);
  border: 1px solid ${({ $color }) => `${$color}40`};
  border-radius: 12px;
  padding: 10px 20px;
  display: flex;
  align-items: center;
  gap: 10px;
  animation: ${slideInUp} ${TOAST_DURATION}ms ease-out forwards;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.4), 0 0 12px ${({ $color }) => `${$color}20`};
  min-width: 240px;

  @media (prefers-reduced-motion: reduce) {
    animation: none;
    opacity: 1;
  }
`;

export const AchievementToast: React.FC<AchievementToastProps> = ({
  achievements,
  onComplete,
}) => {
  const [visibleAchievements, setVisibleAchievements] = useState<AchievementDefinition[]>([]);

  useEffect(() => {
    if (achievements.length === 0) return;

    // 順番に表示
    achievements.forEach((achievement, index) => {
      const showDelay = index * TOAST_INTERVAL;
      setTimeout(() => {
        setVisibleAchievements(prev => [...prev, achievement]);
      }, showDelay);
    });

    // 全トースト終了後にコールバック
    const totalTime = (achievements.length - 1) * TOAST_INTERVAL + TOAST_DURATION;
    const timer = setTimeout(() => {
      setVisibleAchievements([]);
      onComplete?.();
    }, totalTime);

    return () => clearTimeout(timer);
  }, [achievements, onComplete]);

  if (visibleAchievements.length === 0) return null;

  return (
    <ToastContainer>
      {visibleAchievements.map(achievement => (
        <ToastItem key={achievement.id} $color={RARITY_COLORS[achievement.rarity]}>
          <span style={{ fontSize: 10, letterSpacing: 2, color: RARITY_COLORS[achievement.rarity], fontFamily: FONTS.mono, fontWeight: 700 }}>
            ACHIEVEMENT
          </span>
          <span style={{ fontSize: 14, fontWeight: 700, color: COLORS.text2 }}>
            {achievement.name}
          </span>
          <span style={{ fontSize: 10, color: COLORS.muted }}>
            {achievement.description}
          </span>
        </ToastItem>
      ))}
    </ToastContainer>
  );
};
