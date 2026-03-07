/**
 * Agile Quiz Sugoroku - スコアフロートテキスト
 *
 * 正解時にスコアが上方向にフロートして消えるアニメーション演出
 */
import React from 'react';
import styled from 'styled-components';
import { COLORS, FONTS } from '../constants';
import { floatUp } from './styles';

// ── Props 型定義 ─────────────────────────────────────────────

interface ScoreFloatProps {
  /** 表示するスコアテキスト（例: "+10pt"） */
  text: string;
  /** テキストの色（省略時はアクセントカラー） */
  color?: string;
}

// ── styled-components ────────────────────────────────────────

const FloatText = styled.div<{ $color: string }>`
  position: absolute;
  top: -8px;
  left: 50%;
  transform: translateX(-50%);
  font-family: ${FONTS.mono};
  font-size: 16px;
  font-weight: bold;
  color: ${({ $color }) => $color};
  white-space: nowrap;
  pointer-events: none;
  animation: ${floatUp} 800ms ease-out forwards;

  @media (prefers-reduced-motion: reduce) {
    animation: none;
    opacity: 0;
  }
`;

// ── コンポーネント ───────────────────────────────────────────

export const ScoreFloat: React.FC<ScoreFloatProps> = ({
  text,
  color = COLORS.accent,
}) => {
  if (!text) {
    return null;
  }

  return <FloatText $color={color}>{text}</FloatText>;
};
