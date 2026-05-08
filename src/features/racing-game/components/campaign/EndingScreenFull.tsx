// エンディング本実装（spec §6.7 Phase 2 範囲）
//
// 黒背景 → 独白 3 画面 → THANK YOU FOR PLAYING → ステージ記録 + ランク集計
// → クレジットロール（30〜45 秒、Esc スキップ可、2 回目以降 4× 早送り）

import React, { useEffect, useState, useCallback } from 'react';
import styled, { keyframes, css } from 'styled-components';
import type { Stage } from '../../domain/race/stage';
import type { CampaignProgress } from '../../domain/race/campaign-progress';
import type { StageRank } from '../../domain/race/rank';
import { Overlay, PrimaryButton, TOKENS } from './campaign-styles';

const MONOLOGUE_LINES = [
  '風の温度が、最初のステージとは違っていた。',
  '夜明けは、まだ来ない。',
  'だが、お前と走ったこの道は、確かに東を向いていた。',
] as const;

const MONOLOGUE_DURATION_MS = 3000;

const fadeIn = keyframes`
  0% { opacity: 0; }
  100% { opacity: 1; }
`;

const Container = styled.div`
  background: ${TOKENS.bgPrimary};
  color: ${TOKENS.textPrimary};
  font-family: ${TOKENS.fontJpNarrative};
  text-align: center;
  padding: 48px;
  min-width: 400px;
  max-width: 600px;
  animation: ${css`${fadeIn} 0.6s ease-in`};
`;

const MonologueText = styled.p`
  font-size: 18px;
  line-height: 1.8;
  letter-spacing: 1px;
  margin: 0;
`;

const ThankYou = styled.h2`
  font-family: ${TOKENS.fontEnPixel};
  font-size: 32px;
  color: ${TOKENS.accentGold};
  letter-spacing: 4px;
  margin: 24px 0;
`;

const RankSummary = styled.div`
  font-family: ${TOKENS.fontEnPixel};
  font-size: 14px;
  margin: 16px 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
  align-items: center;
`;

const RankSummaryRow = styled.div<{ $rank: StageRank }>`
  color: ${(p) =>
    p.$rank === 'GOLD'
      ? TOKENS.accentGold
      : p.$rank === 'SILVER'
        ? TOKENS.accentSilver
        : TOKENS.accentBronze};
`;

const StageList = styled.ul`
  list-style: none;
  padding: 0;
  margin: 16px 0;
  font-family: ${TOKENS.fontEnPixel};
  font-size: 12px;
`;

const StageRow = styled.li<{ $rank: StageRank }>`
  display: flex;
  justify-content: space-between;
  padding: 4px 12px;
  color: ${(p) => (p.$rank === 'NONE' ? TOKENS.textSecondary : TOKENS.textPrimary)};
`;

const SkipHint = styled.div`
  position: fixed;
  bottom: 24px;
  right: 24px;
  font-size: 12px;
  color: ${TOKENS.textSecondary};
  font-family: ${TOKENS.fontEnPixel};
`;

export type EndingPhase =
  | 'monologue-1'
  | 'monologue-2'
  | 'monologue-3'
  | 'thank-you'
  | 'credits'
  | 'sound-test-link'
  | 'done';

const PHASE_ORDER: EndingPhase[] = [
  'monologue-1',
  'monologue-2',
  'monologue-3',
  'thank-you',
  'credits',
  'sound-test-link',
  'done',
];

const SOUND_TEST_HINT_MS = 3000;

export interface EndingScreenFullProps {
  readonly stages: readonly Stage[];
  readonly progress: CampaignProgress;
  /** 既視 (2 回目以降) なら 4× 早送り */
  readonly isReplay: boolean;
  readonly onComplete: () => void;
  readonly onSoundTest?: () => void;
}

const countByRank = (progress: CampaignProgress, rank: StageRank): number =>
  Object.values(progress.records).filter((r) => r.rank === rank).length;

export const EndingScreenFull: React.FC<EndingScreenFullProps> = ({
  stages,
  progress,
  isReplay,
  onComplete,
  onSoundTest,
}) => {
  const [phaseIdx, setPhaseIdx] = useState(0);
  const phase = PHASE_ORDER[phaseIdx];
  const speedMul = isReplay ? 4 : 1;

  const advance = useCallback(() => {
    setPhaseIdx((i) => Math.min(i + 1, PHASE_ORDER.length - 1));
  }, []);

  // 自動進行（各画面の duration が経過したら次へ）
  useEffect(() => {
    if (phase === 'done') {
      onComplete();
      return;
    }
    if (phase === 'sound-test-link') {
      const id = window.setTimeout(advance, SOUND_TEST_HINT_MS / speedMul);
      return () => window.clearTimeout(id);
    }
    if (phase === 'monologue-1' || phase === 'monologue-2' || phase === 'monologue-3') {
      const id = window.setTimeout(advance, MONOLOGUE_DURATION_MS / speedMul);
      return () => window.clearTimeout(id);
    }
    // thank-you と credits は手動 or 長時間
    if (phase === 'thank-you') {
      const id = window.setTimeout(advance, 2000 / speedMul);
      return () => window.clearTimeout(id);
    }
    if (phase === 'credits') {
      const id = window.setTimeout(advance, 30000 / speedMul);
      return () => window.clearTimeout(id);
    }
  }, [phase, speedMul, advance, onComplete]);

  // Esc / クリックでスキップ
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onComplete();
      else advance();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [advance, onComplete]);

  const goldCount = countByRank(progress, 'GOLD');
  const silverCount = countByRank(progress, 'SILVER');
  const bronzeCount = countByRank(progress, 'BRONZE');

  if (phase === 'done') return null;

  if (phase === 'monologue-1' || phase === 'monologue-2' || phase === 'monologue-3') {
    const idx = phase === 'monologue-1' ? 0 : phase === 'monologue-2' ? 1 : 2;
    return (
      <Overlay role="dialog" aria-label="エンディング独白">
        <Container>
          <MonologueText>{MONOLOGUE_LINES[idx]}</MonologueText>
        </Container>
        <SkipHint>▶ ESC TO SKIP / TAP TO ADVANCE</SkipHint>
      </Overlay>
    );
  }

  if (phase === 'thank-you') {
    return (
      <Overlay role="dialog" aria-label="エンディング感謝">
        <Container>
          <ThankYou>THANK YOU FOR PLAYING</ThankYou>
        </Container>
      </Overlay>
    );
  }

  if (phase === 'credits') {
    return (
      <Overlay role="dialog" aria-label="クレジット">
        <Container>
          <RankSummary>
            <RankSummaryRow $rank="GOLD">★★★ GOLD × {goldCount}</RankSummaryRow>
            <RankSummaryRow $rank="SILVER">★★· SILVER × {silverCount}</RankSummaryRow>
            <RankSummaryRow $rank="BRONZE">★·· BRONZE × {bronzeCount}</RankSummaryRow>
          </RankSummary>
          <StageList aria-label="ステージ記録">
            {stages.map((s) => {
              const r = progress.records[s.id];
              return (
                <StageRow key={s.id} $rank={r.rank}>
                  <span>{s.numberLabel} {s.title}</span>
                  <span>
                    {r.bestTimeSec !== undefined
                      ? `${Math.floor(r.bestTimeSec / 60)}:${(Math.floor(r.bestTimeSec) % 60).toString().padStart(2, '0')}`
                      : '--:--'}
                    {' '}{r.rank === 'GOLD' ? '★★★' : r.rank === 'SILVER' ? '★★·' : r.rank === 'BRONZE' ? '★··' : '···'}
                  </span>
                </StageRow>
              );
            })}
          </StageList>
        </Container>
        <SkipHint>▶ ESC TO SKIP</SkipHint>
      </Overlay>
    );
  }

  if (phase === 'sound-test-link') {
    return (
      <Overlay role="dialog" aria-label="サウンドテスト案内">
        <Container>
          <PrimaryButton onClick={() => onSoundTest?.()}>▶ SOUND TEST</PrimaryButton>
        </Container>
      </Overlay>
    );
  }

  return null;
};
