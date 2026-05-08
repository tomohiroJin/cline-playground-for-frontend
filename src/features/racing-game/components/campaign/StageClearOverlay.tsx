// ステージクリア オーバーレイ（spec §6.5）

import React from 'react';
import styled, { keyframes, css } from 'styled-components';
import type { StageRank } from '../../domain/race/rank';
import { rankGlyph } from '../../domain/race/rank';
import { formatTimeMScc } from '../../domain/race/time-format';
import { Overlay, Panel, LargeTitle, PrimaryButton, TOKENS } from './campaign-styles';

// ランク登場アニメーション（Phase 2.2 演出強化）
const rankAppear = keyframes`
  0%, 30% { opacity: 0; transform: scale(0.8); }
  40%, 60% { opacity: 1; transform: scale(1.15); }
  100% { opacity: 1; transform: scale(1); }
`;

const Stat = styled.div`
  font-family: ${TOKENS.fontEnPixel};
  font-size: 16px;
  color: ${TOKENS.textPrimary};
  margin: 8px 0;
`;

const Time = styled.div`
  font-family: ${TOKENS.fontMonoNumeric};
  font-size: 24px;
  color: ${TOKENS.textPrimary};
`;

const Rank = styled.div<{ $rank: StageRank }>`
  font-family: ${TOKENS.fontEnPixel};
  font-size: 28px;
  margin: 16px 0 24px;
  color: ${(p) =>
    p.$rank === 'GOLD'
      ? TOKENS.accentGold
      : p.$rank === 'SILVER'
        ? TOKENS.accentSilver
        : TOKENS.accentBronze};
  animation: ${css`${rankAppear} 1s ease-out`};

  @media (prefers-reduced-motion: reduce) {
    animation: none;
  }
`;

export interface StageClearOverlayProps {
  readonly goalTimeSec: number;
  readonly rank: Exclude<StageRank, 'NONE'>;
  readonly onContinue: () => void;
}

export const StageClearOverlay: React.FC<StageClearOverlayProps> = ({
  goalTimeSec,
  rank,
  onContinue,
}) => (
  <Overlay role="dialog" aria-label="ステージクリア">
    <Panel>
      <LargeTitle>STAGE CLEAR!</LargeTitle>
      <Stat>TIME</Stat>
      <Time>{formatTimeMScc(goalTimeSec)}</Time>
      <Stat>RANK</Stat>
      <Rank $rank={rank}>{rankGlyph(rank)} {rank}</Rank>
      <PrimaryButton onClick={onContinue} autoFocus>CONTINUE</PrimaryButton>
    </Panel>
  </Overlay>
);
