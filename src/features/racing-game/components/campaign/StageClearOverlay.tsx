// ステージクリア オーバーレイ（spec §6.5）

import React from 'react';
import styled from 'styled-components';
import type { StageRank } from '../../domain/race/rank';
import { Overlay, Panel, LargeTitle, PrimaryButton, TOKENS } from './campaign-styles';

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
`;

const RANK_GLYPH: Record<Exclude<StageRank, 'NONE'>, string> = {
  GOLD: '★ ★ ★ GOLD',
  SILVER: '★ ★ · SILVER',
  BRONZE: '★ · · BRONZE',
};

export interface StageClearOverlayProps {
  readonly goalTimeSec: number;
  readonly rank: Exclude<StageRank, 'NONE'>;
  readonly onContinue: () => void;
}

const formatTime = (seconds: number): string => {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  const cs = Math.floor((seconds * 100) % 100);
  return `${m}:${s.toString().padStart(2, '0')}:${cs.toString().padStart(2, '0')}`;
};

export const StageClearOverlay: React.FC<StageClearOverlayProps> = ({
  goalTimeSec,
  rank,
  onContinue,
}) => (
  <Overlay role="dialog" aria-label="ステージクリア">
    <Panel>
      <LargeTitle>STAGE CLEAR!</LargeTitle>
      <Stat>TIME</Stat>
      <Time>{formatTime(goalTimeSec)}</Time>
      <Stat>RANK</Stat>
      <Rank $rank={rank}>{RANK_GLYPH[rank]}</Rank>
      <PrimaryButton onClick={onContinue} autoFocus>CONTINUE</PrimaryButton>
    </Panel>
  </Overlay>
);
