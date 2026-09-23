/**
 * 灰燼の城壁 - 遠征の画面遷移（反復7 段階1・設計書 §3.2）
 *
 * ブリーフィング → [ステージ → 獲得3択]×2 → ステージ3 → 結果。
 * 敗北したステージからは結果へ直行する。遷移の判断はすべて useExpedition の
 * `expedition.phase` に従い、この部品は分岐して描くだけにする。
 */
import React, { useState } from 'react';
import { nextWavePreview } from './wave-preview';
import { useExpedition } from './useExpedition';
import { StageView } from './StageView';
import { ExpeditionBar } from './ExpeditionBar';
import { OfferChoice } from './OfferChoice';
import { ExpeditionSummary } from './ExpeditionSummary';
import { StartOverlay } from './StartOverlay';
import { markBriefingSeen, readBriefingSeen } from './briefing-seen';
import { currentStage } from '../domain/expedition/expedition-state';

interface Props {
  cards: string[];
  seed: number;
  onRetry: () => void;
  onRebuild: () => void;
}

/** ラン開始前（tick 0 より前）を表す。先頭の非空ウェーブが選ばれる（旧 FIRST_WAVE_PREVIEW と同じ） */
const BEFORE_START_TICK = -1;

export const ExpeditionView: React.FC<Props> = ({ cards, seed, onRetry, onRebuild }) => {
  const game = useExpedition({ cards, seed });
  const [isBriefingShown, setIsBriefingShown] = useState(() => !readBriefingSeen());
  const { expedition } = game;
  const stage = currentStage(expedition);

  const firstWaves = expedition.stages[0]?.waves ?? [];
  const briefing = isBriefingShown ? (
    <StartOverlay
      preview={nextWavePreview({ waves: firstWaves, tick: BEFORE_START_TICK })}
      onStart={() => {
        markBriefingSeen();
        setIsBriefingShown(false);
      }}
    />
  ) : null;

  // 結果画面は説明を開いている間もマウントしたままにする。外すと振り返りの
  // 記録済み状態が消え、閉じた後にもう一度記録させる（expedition_note が重複する）
  if (expedition.phase === 'ended') {
    return (
      <>
        {briefing}
        <ExpeditionSummary
          expedition={expedition}
          onNote={game.noteExpedition}
          exportLogJson={game.exportLogJson}
          onRetry={onRetry}
          onRebuild={onRebuild}
          onShowBriefing={() => setIsBriefingShown(true)}
        />
      </>
    );
  }
  if (briefing) return briefing;
  if (expedition.phase === 'offer') {
    return (
      <>
        <ExpeditionBar expedition={expedition} />
        <OfferChoice offer={expedition.offer} onChoose={game.acquire} />
      </>
    );
  }
  if (!stage || !game.stageCombat) return null;
  return (
    <StageView
      key={`${game.expeditionId}-${expedition.stageIndex}`}
      cards={expedition.deckCards}
      seed={expedition.seed}
      map={stage.map}
      initialState={game.stageCombat}
      expeditionId={game.expeditionId}
      stageIndex={expedition.stageIndex}
      isFinalStage={expedition.stageIndex === expedition.stages.length - 1}
      banner={<ExpeditionBar expedition={expedition} />}
      onSettled={game.settleStage}
    />
  );
};
