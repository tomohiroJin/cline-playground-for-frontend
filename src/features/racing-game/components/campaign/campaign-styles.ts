// キャンペーン UI 共通の styled-components とデザイントークン
//
// spec.md §6.8.3 のカラートークン / §6.8.2 のフォントスタック / §6.9 モーション
// を CSS 変数として実装する。

import styled, { css, keyframes, createGlobalStyle } from 'styled-components';

/**
 * デザイントークン（spec §6.8.3 / §6.8.2）。
 * Phase 0 で HEX 値を Figma で実測し、4.5:1 を割る組合せがあれば調整する。
 */
export const TOKENS = {
  bgPrimary: '#0E1530',
  bgPanel: '#1E2856',
  textPrimary: '#F5F5F5',
  textSecondary: 'rgba(245, 245, 245, 0.7)',
  accentDanger: '#E63946',
  accentGold: '#FFD166',
  accentSilver: '#C8C8C8',
  accentBronze: '#CD7F32',
  focusRing: '#7DD3FC',
  fontEnPixel: "'Press Start 2P', 'Silkscreen', 'Courier New', monospace",
  fontJpNarrative: "'DotGothic16', 'PixelMplus10', 'Noto Sans JP', sans-serif",
  fontMonoNumeric: "'Silkscreen', 'Roboto Mono', 'SF Mono', monospace",
} as const;

/** キーボードフォーカス時のリング（:focus-visible） */
export const focusRingStyle = css`
  outline: none;
  &:focus-visible {
    box-shadow: 0 0 0 2px ${TOKENS.focusRing};
  }
`;

/** 共通オーバーレイ（半透明黒の上に Panel を載せる） */
export const Overlay = styled.div`
  position: fixed;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.65);
  color: ${TOKENS.textPrimary};
  font-family: ${TOKENS.fontEnPixel};
  z-index: 50;
`;

/** 中身の Panel */
export const Panel = styled.div`
  background: ${TOKENS.bgPanel};
  border: 2px solid ${TOKENS.textPrimary};
  padding: 24px 32px;
  text-align: center;
  min-width: 280px;
`;

/** 大型タイトル（"GAME OVER" など） */
export const LargeTitle = styled.h2`
  font-size: 32px;
  font-family: ${TOKENS.fontEnPixel};
  margin: 0 0 16px;
  color: ${TOKENS.textPrimary};
  letter-spacing: 2px;
`;

/** 標準ボタン */
export const PrimaryButton = styled.button`
  background: transparent;
  color: ${TOKENS.textPrimary};
  border: 2px solid ${TOKENS.textPrimary};
  font-family: ${TOKENS.fontEnPixel};
  font-size: 14px;
  padding: 12px 24px;
  cursor: pointer;
  min-width: 160px;
  min-height: 44px;
  ${focusRingStyle}

  &:hover {
    background: ${TOKENS.textPrimary};
    color: ${TOKENS.bgPrimary};
  }

  &:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }
`;

/** 警告色ボタン（RESET PROGRESS 等） */
export const DangerButton = styled(PrimaryButton)`
  border-color: ${TOKENS.accentDanger};
  color: ${TOKENS.accentDanger};

  &:hover {
    background: ${TOKENS.accentDanger};
    color: ${TOKENS.textPrimary};
  }
`;

/**
 * グローバル reduced-motion ルール（spec §6.9 / S3 対応）。
 * RacingGameCampaign のマウント時に挿入する。各コンポーネントは個別の
 * 代替挙動を引き続き定義してよいが、全体としての安全網として機能する。
 */
export const ReducedMotionGlobalStyle = createGlobalStyle`
  @media (prefers-reduced-motion: reduce) {
    *, *::before, *::after {
      animation-duration: 0.01ms !important;
      animation-iteration-count: 1 !important;
      transition-duration: 0.01ms !important;
      scroll-behavior: auto !important;
    }
  }
`;

/** タイムカウンタ点滅（reduced-motion で減衰） */
const blink2Hz = keyframes`
  0%, 49% { opacity: 1; }
  50%, 100% { opacity: 0.3; }
`;

const blink1Hz = keyframes`
  0%, 50% { opacity: 1; }
  51%, 100% { opacity: 0.5; }
`;

export const blinkStyle = css`
  animation: ${blink2Hz} 0.5s steps(1, end) infinite;
  @media (prefers-reduced-motion: reduce) {
    animation: ${blink1Hz} 1s steps(1, end) infinite;
  }
`;
