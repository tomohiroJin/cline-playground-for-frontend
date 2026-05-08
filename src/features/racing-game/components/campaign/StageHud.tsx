// ステージ実走 HUD（spec §6.3）
//
// レイアウト: 中央上に TIME（最重要）、左下に SPEED + STAGE、右上に LIVES。
// LAP 表示は stage.lapsToClear > 1 のときだけ（spec §6.3.1 / R1）。

import React from 'react';
import styled from 'styled-components';
import { TOKENS, blinkStyle } from './campaign-styles';

const TIME_WARNING_THRESHOLD_SEC = 10;

const Container = styled.div`
  position: absolute;
  inset: 0;
  pointer-events: none;
  font-family: ${TOKENS.fontEnPixel};
  color: ${TOKENS.textPrimary};
`;

const TimeDisplay = styled.div<{ $warning: boolean }>`
  position: absolute;
  top: 16px;
  left: 50%;
  transform: translateX(-50%);
  font-size: 48px;
  font-family: ${TOKENS.fontMonoNumeric};
  color: ${(p) => (p.$warning ? TOKENS.accentDanger : TOKENS.textPrimary)};
  ${(p) => p.$warning && blinkStyle}
`;

const StatusGroup = styled.div`
  position: absolute;
  bottom: 16px;
  left: 16px;
  font-size: 18px;
  color: ${TOKENS.textSecondary};
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

const Lives = styled.div<{ $warning: boolean }>`
  position: absolute;
  top: 16px;
  right: 16px;
  font-size: 16px;
  color: ${(p) => (p.$warning ? TOKENS.accentDanger : TOKENS.textPrimary)};
  ${(p) => p.$warning && blinkStyle}
`;

const Lap = styled.div`
  position: absolute;
  bottom: 16px;
  left: 50%;
  transform: translateX(-50%);
  font-size: 14px;
  color: ${TOKENS.textSecondary};
`;

export interface StageHudProps {
  /** 残り時間（秒、float 可） */
  readonly timeRemainingSec: number;
  /** 現ステージ番号（1〜8） */
  readonly stageNumber: number;
  /** 全ステージ数（通常 8） */
  readonly totalStages: number;
  /** 現在の速度（任意の数値） */
  readonly speed: number;
  /** 残機（0〜3） */
  readonly livesRemaining: number;
  /** 最大残機（通常 3） */
  readonly maxLives: number;
  /** ラップ数（lapsToClear が 1 を超えるステージのみ） */
  readonly currentLap?: number;
  readonly maxLaps?: number;
}

/** 残り時間を `M:SS` 形式に整形（spec §6.3 のモック表記） */
const formatTime = (seconds: number): string => {
  const safe = Math.max(0, Math.floor(seconds));
  const m = Math.floor(safe / 60);
  const s = safe % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
};

const renderLives = (current: number, max: number): string => {
  const filled = '●'.repeat(Math.max(0, current));
  const empty = '·'.repeat(Math.max(0, max - current));
  return filled + empty;
};

export const StageHud: React.FC<StageHudProps> = ({
  timeRemainingSec,
  stageNumber,
  totalStages,
  speed,
  livesRemaining,
  maxLives,
  currentLap,
  maxLaps,
}) => {
  const isTimeWarning = timeRemainingSec <= TIME_WARNING_THRESHOLD_SEC && timeRemainingSec > 0;
  const isLivesWarning = livesRemaining === 1;
  const showLap = maxLaps !== undefined && maxLaps > 1 && currentLap !== undefined;

  return (
    <Container aria-label="Stage HUD">
      <TimeDisplay $warning={isTimeWarning} aria-label="残り時間">
        TIME {formatTime(timeRemainingSec)}
      </TimeDisplay>
      <StatusGroup>
        <div>SPEED {Math.round(speed)}</div>
        <div>STAGE {stageNumber}/{totalStages}</div>
      </StatusGroup>
      <Lives $warning={isLivesWarning} aria-label="残機">
        LIVES {renderLives(livesRemaining, maxLives)}
      </Lives>
      {showLap && (
        <Lap>LAP {currentLap}/{maxLaps}</Lap>
      )}
    </Container>
  );
};
