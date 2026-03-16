/**
 * Agile Quiz Sugoroku - アニメーション定義
 */
import { keyframes } from 'styled-components';
import { DESIGN_TOKENS } from '../../presentation/styles/design-tokens';

const { colors: COLORS } = DESIGN_TOKENS;

export const pulse = keyframes`
  0%, 100% { opacity: 1; }
  50% { opacity: 0.35; }
`;

export const shake = keyframes`
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(-2px); }
  75% { transform: translateX(2px); }
`;

export const fadeSlideIn = keyframes`
  from {
    opacity: 0;
    transform: translateY(12px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
`;

export const floatY = keyframes`
  0%, 100% {
    transform: translateY(0) translateX(0);
  }
  25% {
    transform: translateY(-35px) translateX(12px);
  }
  50% {
    transform: translateY(-18px) translateX(-10px);
  }
  75% {
    transform: translateY(-45px) translateX(6px);
  }
`;

export const comboGlow = keyframes`
  0%, 100% { text-shadow: 0 0 4px ${COLORS.orange}44; }
  50% { text-shadow: 0 0 16px ${COLORS.orange}aa; }
`;

export const popIn = keyframes`
  from {
    transform: scale(0);
    opacity: 0;
  }
  to {
    transform: scale(1);
    opacity: 1;
  }
`;

export const titleGlow = keyframes`
  0%, 100% { text-shadow: 0 0 4px ${COLORS.accent}22; }
  50% { text-shadow: 0 0 20px ${COLORS.accent}44; }
`;

export const gradeReveal = keyframes`
  0% {
    transform: scale(0) rotate(-20deg);
    opacity: 0;
  }
  60% {
    transform: scale(1.15) rotate(5deg);
    opacity: 1;
  }
  100% {
    transform: scale(1) rotate(0deg);
    opacity: 1;
  }
`;

export const barGrow = keyframes`
  from { height: 0; }
`;

export const radarFill = keyframes`
  from {
    opacity: 0;
    transform: scale(0.3);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
`;

// 正解時の緑フラッシュ
export const greenFlash = keyframes`
  0% { opacity: 0; }
  30% { opacity: 0.15; }
  100% { opacity: 0; }
`;

// 不正解時の赤フラッシュ
export const redFlash = keyframes`
  0% { opacity: 0; }
  30% { opacity: 0.15; }
  100% { opacity: 0; }
`;

// タイムアップ時のグレーアウト
export const grayOut = keyframes`
  from { opacity: 0; }
  to { opacity: 0.3; }
`;

// バウンスイン
export const bounceIn = keyframes`
  0% { transform: scale(0.8); opacity: 0; }
  50% { transform: scale(1.05); }
  100% { transform: scale(1); opacity: 1; }
`;

// 横方向シェイク（不正解用、既存のshakeより大きい）
export const shakeX = keyframes`
  0%, 100% { transform: translateX(0); }
  20% { transform: translateX(-6px); }
  40% { transform: translateX(6px); }
  60% { transform: translateX(-4px); }
  80% { transform: translateX(4px); }
`;

// 上方向フロート（スコア表示用）
export const floatUp = keyframes`
  0% { transform: translateY(0); opacity: 1; }
  100% { transform: translateY(-40px); opacity: 0; }
`;

// スライド移動（ボードのコマ用）
export const slideMove = keyframes`
  from { transform: translateX(var(--slide-from, 0)); }
  to { transform: translateX(0); }
`;

// コンボ炎エフェクト
export const comboFire = keyframes`
  0%, 100% { text-shadow: 0 0 4px ${COLORS.orange}44; transform: scale(1); }
  50% { text-shadow: 0 0 20px ${COLORS.orange}aa, 0 -4px 12px ${COLORS.orange}66; transform: scale(1.05); }
`;

// コンボ稲妻エフェクト
export const comboLightning = keyframes`
  0%, 100% { text-shadow: 0 0 6px ${COLORS.purple}44; transform: scale(1); }
  25% { text-shadow: 0 0 24px ${COLORS.purple}cc, 0 0 40px ${COLORS.purple}44; transform: scale(1.08); }
  50% { text-shadow: 0 0 8px ${COLORS.purple}66; transform: scale(1.02); }
  75% { text-shadow: 0 0 28px ${COLORS.purple}dd; transform: scale(1.06); }
`;

// コンボ虹エフェクト
export const comboRainbow = keyframes`
  0% { filter: hue-rotate(0deg); text-shadow: 0 0 12px ${COLORS.cyan}88; }
  50% { filter: hue-rotate(180deg); text-shadow: 0 0 24px ${COLORS.pink}88; }
  100% { filter: hue-rotate(360deg); text-shadow: 0 0 12px ${COLORS.cyan}88; }
`;

// コンボレジェンダリーエフェクト
export const comboLegendary = keyframes`
  0%, 100% { text-shadow: 0 0 16px ${COLORS.yellow}aa, 0 0 40px ${COLORS.yellow}44; transform: scale(1); }
  50% { text-shadow: 0 0 32px ${COLORS.yellow}ff, 0 0 60px ${COLORS.yellow}88; transform: scale(1.1); }
`;

// 緊急マス点滅
export const emergencyBlink = keyframes`
  0%, 100% { opacity: 1; }
  50% { opacity: 0.4; }
`;

// 吹き出しフェードイン/アウト
export const bubbleFadeIn = keyframes`
  0% { opacity: 0; transform: translateY(8px) scale(0.9); }
  100% { opacity: 1; transform: translateY(0) scale(1); }
`;

export const bubbleFadeOut = keyframes`
  0% { opacity: 1; transform: translateY(0) scale(1); }
  100% { opacity: 0; transform: translateY(-8px) scale(0.9); }
`;

// タイプライター風カーソル
export const typewriterCursor = keyframes`
  0%, 100% { border-color: transparent; }
  50% { border-color: ${COLORS.green}; }
`;
