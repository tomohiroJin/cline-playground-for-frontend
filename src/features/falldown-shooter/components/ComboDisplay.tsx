// コンボ表示コンポーネント

import React from 'react';
import styled, { keyframes } from 'styled-components';
import type { ComboState } from '../types';

interface ComboDisplayProps {
  comboState: ComboState;
}

const popIn = keyframes`
  0% { transform: scale(0); opacity: 0; }
  60% { transform: scale(1.2); opacity: 1; }
  100% { transform: scale(1); opacity: 1; }
`;

/** コンボ数に応じた色を返す */
const getComboColor = (count: number): string => {
  if (count >= 10) return '#a855f7'; // 紫
  if (count >= 8) return '#ef4444';  // 赤
  if (count >= 5) return '#f59e0b';  // 黄
  return '#ffffff';                   // 白
};

/** コンボ数に応じたフォントサイズを返す */
const getComboFontSize = (count: number): string => {
  if (count >= 10) return '2.5rem';
  if (count >= 5) return '2rem';
  return '1.5rem';
};

const ComboContainer = styled.div`
  position: absolute;
  top: 20px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 10;
  text-align: center;
  animation: ${popIn} 0.3s ease-out;
  pointer-events: none;
`;

const ComboText = styled.div<{ $color: string; $fontSize: string }>`
  font-size: ${props => props.$fontSize};
  font-weight: 900;
  color: ${props => props.$color};
  text-shadow: 0 0 10px ${props => props.$color}80,
               0 2px 4px rgba(0, 0, 0, 0.5);
  letter-spacing: 2px;
`;

const MultiplierText = styled.div<{ $color: string }>`
  font-size: 1rem;
  font-weight: 700;
  color: ${props => props.$color};
  opacity: 0.9;
  margin-top: 2px;
`;

/** ゲーム画面上にコンボ情報を表示するコンポーネント */
export const ComboDisplay: React.FC<ComboDisplayProps> = ({ comboState }) => {
  if (!comboState.isActive || !comboState.displayText) {
    return null;
  }

  const color = getComboColor(comboState.count);
  const fontSize = getComboFontSize(comboState.count);

  return (
    <ComboContainer key={comboState.count} aria-live="polite">
      <ComboText $color={color} $fontSize={fontSize}>
        {comboState.displayText}
      </ComboText>
      <MultiplierText $color={color}>
        x{comboState.multiplier}
      </MultiplierText>
    </ComboContainer>
  );
};
