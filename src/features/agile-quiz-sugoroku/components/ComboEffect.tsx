/**
 * Agile Quiz Sugoroku - コンボエフェクト
 *
 * 連続正解数に応じて段階的にエスカレートするコンボ表示演出
 */
import React from 'react';
import styled, { css, keyframes } from 'styled-components';
import { COLORS, FONTS } from '../constants';
import {
  fadeSlideIn,
  comboFire,
  comboLightning,
  comboRainbow,
  comboLegendary,
} from './styles';

// ── Props 型定義 ─────────────────────────────────────────────

interface ComboEffectProps {
  /** 現在のコンボ数 */
  combo: number;
  /** コンボ途切れ演出フラグ */
  isBreak?: boolean;
}

// ── コンボ段階の定義 ─────────────────────────────────────────

interface ComboStage {
  label: string;
  color: string;
  animation: ReturnType<typeof keyframes>;
}

/** コンボ数からステージを決定する閾値 */
const COMBO_LEGENDARY_MIN = 8;
const COMBO_RAINBOW_MIN = 6;
const COMBO_LIGHTNING_MIN = 4;

const COMBO_STAGES: { min: number; stage: ComboStage }[] = [
  {
    min: COMBO_LEGENDARY_MIN,
    stage: {
      label: 'LEGENDARY',
      color: COLORS.yellow,
      animation: comboLegendary,
    },
  },
  {
    min: COMBO_RAINBOW_MIN,
    stage: {
      label: 'RAINBOW',
      color: COLORS.cyan,
      animation: comboRainbow,
    },
  },
  {
    min: COMBO_LIGHTNING_MIN,
    stage: {
      label: 'LIGHTNING',
      color: COLORS.purple,
      animation: comboLightning,
    },
  },
  {
    min: 2,
    stage: {
      label: 'FIRE',
      color: COLORS.orange,
      animation: comboFire,
    },
  },
];

/** コンボ数に応じたステージを取得 */
const getComboStage = (combo: number): ComboStage => {
  const match = COMBO_STAGES.find((s) => combo >= s.min);
  return match?.stage ?? COMBO_STAGES[COMBO_STAGES.length - 1].stage;
};

// ── styled-components ────────────────────────────────────────

const ComboContainer = styled.div<{ $color: string; $animation: ReturnType<typeof keyframes> }>`
  display: flex;
  flex-direction: column;
  align-items: center;
  font-family: ${FONTS.mono};
  color: ${({ $color }) => $color};

  ${({ $animation }) => css`
    animation: ${$animation} 1.2s ease-in-out infinite;

    @media (prefers-reduced-motion: reduce) {
      animation: none;
    }
  `}
`;

const ComboNumber = styled.div`
  font-size: 28px;
  font-weight: bold;
  line-height: 1;
`;

const ComboLabel = styled.div`
  font-size: 11px;
  letter-spacing: 2px;
  margin-top: 2px;
`;

const ComboStageLabel = styled.div`
  font-size: 9px;
  letter-spacing: 1px;
  opacity: 0.8;
  margin-top: 1px;
`;

const BreakText = styled.div`
  font-family: ${FONTS.mono};
  font-size: 14px;
  color: ${COLORS.muted};
  animation: ${fadeSlideIn} 0.4s ease-out;

  @media (prefers-reduced-motion: reduce) {
    animation: none;
  }
`;

// ── コンポーネント ───────────────────────────────────────────

export const ComboEffect: React.FC<ComboEffectProps> = ({ combo, isBreak }) => {
  // コンボ途切れ演出
  if (isBreak) {
    return <BreakText>Combo Break...</BreakText>;
  }

  // コンボ2未満は非表示
  if (combo < 2) {
    return null;
  }

  const stage = getComboStage(combo);

  return (
    <ComboContainer $color={stage.color} $animation={stage.animation}>
      <ComboNumber>{combo}</ComboNumber>
      <ComboLabel>COMBO</ComboLabel>
      <ComboStageLabel>{stage.label}</ComboStageLabel>
    </ComboContainer>
  );
};
