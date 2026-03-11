// フローティングスコア表示コンポーネント

import React from 'react';
import styled, { keyframes } from 'styled-components';

export interface FloatingScoreItem {
  id: string;
  x: number;
  y: number;
  score: number;
  multiplier: number;
}

interface FloatingScoreProps {
  items: FloatingScoreItem[];
}

const floatUp = keyframes`
  0% { transform: translateY(0); opacity: 1; }
  100% { transform: translateY(-40px); opacity: 0; }
`;

/** 倍率に応じた色を返す */
const getScoreColor = (multiplier: number): string => {
  if (multiplier >= 4.0) return '#a855f7'; // 紫
  if (multiplier >= 2.0) return '#f59e0b'; // 黄
  if (multiplier > 1.0) return '#4ade80';  // 緑
  return '#ffffff';                         // 白
};

const ScoreItem = styled.div<{ $x: number; $y: number; $color: string }>`
  position: absolute;
  left: ${props => props.$x}px;
  top: ${props => props.$y}px;
  color: ${props => props.$color};
  font-size: 0.875rem;
  font-weight: 700;
  pointer-events: none;
  animation: ${floatUp} 0.8s ease-out forwards;
  text-shadow: 0 1px 3px rgba(0, 0, 0, 0.7);
  z-index: 5;
`;

/** ブロック破壊時にスコアをフローティング表示するコンポーネント */
export const FloatingScore: React.FC<FloatingScoreProps> = ({ items }) => {
  if (items.length === 0) return null;

  return (
    <>
      {items.map(item => {
        const displayScore = Math.round(item.score * item.multiplier);
        const color = getScoreColor(item.multiplier);
        return (
          <ScoreItem key={item.id} $x={item.x} $y={item.y} $color={color}>
            +{displayScore}
          </ScoreItem>
        );
      })}
    </>
  );
};
