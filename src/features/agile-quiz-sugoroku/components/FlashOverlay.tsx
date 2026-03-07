/**
 * Agile Quiz Sugoroku - 正解/不正解フラッシュオーバーレイ
 *
 * 回答直後に画面全体に色フラッシュを表示して視覚フィードバックを与える
 */
import React from 'react';
import styled, { css } from 'styled-components';
import { COLORS } from '../constants';
import { greenFlash, redFlash, grayOut } from './styles';

// ── Props 型定義 ─────────────────────────────────────────────

interface FlashOverlayProps {
  /** フラッシュの種類 */
  type?: 'correct' | 'incorrect' | 'timeup';
}

// ── フラッシュ設定マップ ─────────────────────────────────────

const FLASH_CONFIG = {
  correct: {
    color: COLORS.green,
    animation: greenFlash,
    duration: '500ms',
  },
  incorrect: {
    color: COLORS.red,
    animation: redFlash,
    duration: '500ms',
  },
  timeup: {
    color: COLORS.muted,
    animation: grayOut,
    duration: '300ms',
  },
} as const;

// ── styled-components ────────────────────────────────────────

const Overlay = styled.div<{ $type: 'correct' | 'incorrect' | 'timeup' }>`
  position: fixed;
  inset: 0;
  pointer-events: none;
  z-index: 100;

  ${({ $type }) => {
    const config = FLASH_CONFIG[$type];
    return css`
      background: ${config.color};
      animation: ${config.animation} ${config.duration} ease-out forwards;

      @media (prefers-reduced-motion: reduce) {
        animation: none;
        opacity: 0.1;
      }
    `;
  }}
`;

// ── コンポーネント ───────────────────────────────────────────

export const FlashOverlay: React.FC<FlashOverlayProps> = ({ type }) => {
  if (!type) {
    return null;
  }

  return <Overlay $type={type} />;
};
