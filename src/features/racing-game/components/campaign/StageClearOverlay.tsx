// ステージクリア オーバーレイ（spec §6.5）

import React, { useEffect, useRef } from 'react';
import styled, { keyframes, css } from 'styled-components';
import type { StageRank } from '../../domain/race/rank';
import { rankGlyph } from '../../domain/race/rank';
import { formatTimeMScc } from '../../domain/race/time-format';
import { Overlay, Panel, LargeTitle, PrimaryButton, TOKENS } from './campaign-styles';
import { ConfettiBurst } from './ConfettiBurst';

// ランク登場アニメーション（F3 強化版: スケール + 回転）
const rankAppear = keyframes`
  0%, 20% { opacity: 0; transform: scale(0.4) rotate(-15deg); }
  35%, 55% { opacity: 1; transform: scale(1.3) rotate(8deg); }
  70% { transform: scale(0.95) rotate(-3deg); }
  100% { opacity: 1; transform: scale(1) rotate(0); }
`;

const titlePulse = keyframes`
  0% { transform: scale(0.7); opacity: 0; }
  50% { transform: scale(1.2); opacity: 1; }
  100% { transform: scale(1); opacity: 1; }
`;

const ClearTitle = styled(LargeTitle)`
  color: ${TOKENS.accentGold};
  font-size: 40px;
  text-shadow: 0 0 12px ${TOKENS.accentGold};
  animation: ${css`${titlePulse} 0.6s ease-out`};

  @media (prefers-reduced-motion: reduce) {
    animation: none;
  }
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
  font-size: 36px;
  margin: 16px 0 24px;
  color: ${(p) =>
    p.$rank === 'GOLD'
      ? TOKENS.accentGold
      : p.$rank === 'SILVER'
        ? TOKENS.accentSilver
        : TOKENS.accentBronze};
  text-shadow: 0 0 10px currentColor;
  animation: ${css`${rankAppear} 1.2s cubic-bezier(0.34, 1.56, 0.64, 1)`};

  @media (prefers-reduced-motion: reduce) {
    animation: none;
  }
`;

const NewBest = styled.div`
  font-family: ${TOKENS.fontEnPixel};
  font-size: 14px;
  color: ${TOKENS.accentGold};
  letter-spacing: 2px;
  margin: -8px 0 16px;
  animation: ${css`${titlePulse} 0.8s ease-out 0.5s backwards`};

  @media (prefers-reduced-motion: reduce) {
    animation: none;
  }
`;

export interface StageClearOverlayProps {
  readonly goalTimeSec: number;
  readonly rank: Exclude<StageRank, 'NONE'>;
  /** ベストタイム更新時に NEW BEST! を表示 */
  readonly isNewBest?: boolean;
  /** クリア時に SE / BGM を再生するためのコールバック */
  readonly onPlayFanfare?: () => void;
  readonly onContinue: () => void;
}

export const StageClearOverlay: React.FC<StageClearOverlayProps> = ({
  goalTimeSec,
  rank,
  isNewBest,
  onPlayFanfare,
  onContinue,
}) => {
  // マウント時に 1 度だけファンファーレを鳴らす
  const playedRef = useRef(false);
  useEffect(() => {
    if (playedRef.current) return;
    playedRef.current = true;
    onPlayFanfare?.();
  }, [onPlayFanfare]);

  // 紙吹雪はマウントごとに新しい burstKey で 1 度だけ再生
  const burstKey = useRef(Date.now()).current;

  return (
    <Overlay role="dialog" aria-label="ステージクリア">
      <ConfettiBurst burstKey={burstKey} />
      <Panel>
        <ClearTitle>STAGE CLEAR!</ClearTitle>
        <Stat>TIME</Stat>
        <Time>{formatTimeMScc(goalTimeSec)}</Time>
        <Stat>RANK</Stat>
        <Rank $rank={rank}>{rankGlyph(rank)} {rank}</Rank>
        {isNewBest && <NewBest>★ NEW BEST! ★</NewBest>}
        <PrimaryButton onClick={onContinue} autoFocus>CONTINUE</PrimaryButton>
      </Panel>
    </Overlay>
  );
};
