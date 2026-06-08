// ステージセレクトの 1 セル（spec §6.2.2）
// StageSelectScreen から分割（S2 対応 / コンポーネント 200 行制限）

import React, { forwardRef } from 'react';
import styled from 'styled-components';
import type { Stage } from '../../domain/race/stage';
import type { StageRecord } from '../../domain/race/campaign-progress';
import type { StageRank } from '../../domain/race/rank';
import { rankGlyph } from '../../domain/race/rank';
import { formatTimeMS } from '../../domain/race/time-format';
import { TOKENS, focusRingStyle } from './campaign-styles';

const Card = styled.button<{ $locked: boolean }>`
  background: ${TOKENS.bgPanel};
  color: ${(p) => (p.$locked ? TOKENS.textSecondary : TOKENS.textPrimary)};
  border: 2px solid ${(p) => (p.$locked ? TOKENS.textSecondary : TOKENS.textPrimary)};
  font-family: ${TOKENS.fontEnPixel};
  padding: 16px 8px;
  cursor: ${(p) => (p.$locked ? 'not-allowed' : 'pointer')};
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  min-height: 120px;
  filter: ${(p) => (p.$locked ? 'grayscale(0.7)' : 'none')};
  ${focusRingStyle}

  &:hover {
    ${(p) =>
      !p.$locked &&
      `
      background: ${TOKENS.textPrimary};
      color: ${TOKENS.bgPrimary};
    `}
  }
`;

const StageNumber = styled.div`
  font-size: 14px;
`;

const RankRow = styled.div<{ $rank: StageRank }>`
  font-size: 14px;
  color: ${(p) =>
    p.$rank === 'GOLD'
      ? TOKENS.accentGold
      : p.$rank === 'SILVER'
        ? TOKENS.accentSilver
        : p.$rank === 'BRONZE'
          ? TOKENS.accentBronze
          : TOKENS.textSecondary};
`;

const StageTitle = styled.div`
  font-size: 11px;
  letter-spacing: 0.5px;
`;

const TimeLine = styled.div`
  font-size: 11px;
  font-family: ${TOKENS.fontMonoNumeric};
  color: ${TOKENS.textSecondary};
`;

const LastPlayed = styled.div`
  font-size: 9px;
  color: ${TOKENS.textSecondary};
  opacity: 0.6;
`;

export interface StageCardProps {
  readonly stage: Stage;
  readonly record: StageRecord;
  readonly isLocked: boolean;
  readonly lastPlayed?: string;
  readonly onSelect: () => void;
  readonly onFocus: () => void;
}

export const StageCard = forwardRef<HTMLButtonElement, StageCardProps>(
  ({ stage, record, isLocked, lastPlayed, onSelect, onFocus }, ref) => (
    <Card
      ref={ref}
      $locked={isLocked}
      onClick={onSelect}
      onFocus={onFocus}
      aria-label={`STAGE ${stage.id} ${stage.title}${isLocked ? ' (locked)' : ''}`}
      aria-disabled={isLocked}
    >
      <StageNumber>[ {stage.id.toString().padStart(2, '0')} ]</StageNumber>
      <RankRow $rank={isLocked ? 'NONE' : record.rank}>
        {isLocked ? '🔒' : rankGlyph(record.rank)}
      </RankRow>
      <StageTitle>{isLocked ? '?????' : stage.title}</StageTitle>
      <TimeLine>
        {record.bestTimeSec !== undefined ? formatTimeMS(record.bestTimeSec) : '--:--'}
      </TimeLine>
      {lastPlayed && <LastPlayed>LAST: {lastPlayed}</LastPlayed>}
    </Card>
  ),
);
StageCard.displayName = 'StageCard';
