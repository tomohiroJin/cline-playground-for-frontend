// キャンペーンモードのメイン Presentation
//
// 既存 RacingGameNew.tsx と並列に動く独立コンポーネント。
// 起動条件: ユーザーがメニューで CAMPAIGN を選択したとき（pages 側で切替）。

import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  PageContainer, GameContainer, Title, CanvasContainer, Canvas,
} from '../../../pages/RacingGamePage.styles';
import { Config, Colors, Courses } from '../constants';
import { useInput } from '../hooks';
import { useCampaignSession } from './hooks/useCampaignSession';
import { useCampaignGameLoop } from './hooks/useCampaignGameLoop';
import { createCanvasRenderer } from '../infrastructure/renderer/canvas-renderer';
import { createWebAudioEngine } from '../infrastructure/audio/sound-engine';
import { createLocalStorageRepository } from '../infrastructure/storage/score-repository';
import { createKeyboardAdapter } from '../infrastructure/input/keyboard-adapter';
import { createCampaignProgressRepository } from '../infrastructure/storage/campaign-progress-repository';
import { startCampaignStage } from '../application/use-cases/start-campaign-stage';
import { getAllStages } from '../domain/race/stage-catalog';
import type { GameOrchestratorConfig } from '../application/game-orchestrator';
import { StageSelectScreen } from '../components/campaign/StageSelectScreen';
import { OptionsModal } from '../components/campaign/OptionsModal';
import { StageHud } from '../components/campaign/StageHud';
import { CheckpointBonusToast } from '../components/campaign/CheckpointBonusToast';
import { StageClearOverlay } from '../components/campaign/StageClearOverlay';
import { GameOverOverlay } from '../components/campaign/GameOverOverlay';
import { EndingScreen } from '../components/campaign/EndingScreen';

const CAMPAIGN_BASE_SPEED = 3.2;

export interface RacingGameCampaignProps {
  /** メニューに戻るコールバック */
  readonly onExit: () => void;
}

const RacingGameCampaign: React.FC<RacingGameCampaignProps> = ({ onExit }) => {
  const port = useMemo(() => createCampaignProgressRepository(), []);
  const session = useCampaignSession(port);
  const stages = getAllStages();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { keys, touch } = useInput();
  const [optionsOpen, setOptionsOpen] = useState(false);
  const [orchConfig, setOrchConfig] = useState<GameOrchestratorConfig | null>(null);

  // セッション初期化（マウント時に STAGE SELECT へ）
  useEffect(() => {
    session.enterStageSelect();
  }, []);  // eslint-disable-line react-hooks/exhaustive-deps

  // racing 突入時に orchestrator config を構築
  useEffect(() => {
    if (session.phase !== 'racing' || !session.currentStage) {
      setOrchConfig(null);
      return;
    }
    if (!canvasRef.current) return;
    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) return;

    const { width, height } = Config.canvas;
    canvasRef.current.width = width;
    canvasRef.current.height = height;

    const stage = session.currentStage;
    const { raceConfig } = startCampaignStage({
      stage,
      livesRemaining: session.livesRemaining,
      baseSpeed: CAMPAIGN_BASE_SPEED,
    });
    const courseIdx = raceConfig.courseIndex;
    const cur = Courses[courseIdx];

    setOrchConfig({
      renderer: createCanvasRenderer(ctx, width, height),
      audio: createWebAudioEngine(),
      storage: createLocalStorageRepository(),
      input: createKeyboardAdapter(keys, touch, 'solo'),
      raceConfig,
      course: cur,
      playerColors: [Colors.car[0], Colors.car[1]],
      playerNames: ['P1', '—'],
    });
  }, [session.phase, session.currentStage, session.livesRemaining, keys, touch]);

  const loop = useCampaignGameLoop(canvasRef, orchConfig, session.currentStage, session.livesRemaining);

  // ループ結果に応じてセッション状態を進める
  useEffect(() => {
    if (loop.phase === 'cleared' && loop.outcome.kind === 'cleared') {
      session.handleClear(loop.outcome.goalTimeSec, loop.outcome.rank);
    } else if (loop.phase === 'time_up') {
      session.handleTimeUp();
    } else if (loop.phase === 'game_over') {
      // useCampaignSession が lives 0 の判定をするのでここでは handleTimeUp 経由で OK
      session.handleTimeUp();
    }
  }, [loop.phase]);  // eslint-disable-line react-hooks/exhaustive-deps

  const totalStages = stages.length;
  const stageNumber = session.currentStage?.id ?? 1;

  return (
    <PageContainer>
      <GameContainer>
        <div style={{ textAlign: 'center' }}>
          <Title>Racing Game — CAMPAIGN</Title>
        </div>

        <CanvasContainer>
          <Canvas ref={canvasRef} role="img" aria-label="レーシングキャンペーン画面" tabIndex={0} />

          {session.phase === 'stage_select' && (
            <StageSelectScreen
              stages={stages}
              progress={session.progress}
              onSelectStage={session.selectStage}
              onBackToMenu={() => { session.leaveToMenu(); onExit(); }}
              onOpenOptions={() => setOptionsOpen(true)}
            />
          )}

          {session.phase === 'racing' && (
            <>
              <StageHud
                timeRemainingSec={loop.runtime?.timeRemainingSec ?? 0}
                stageNumber={stageNumber}
                totalStages={totalStages}
                speed={CAMPAIGN_BASE_SPEED * 60}  /* 表示用 */
                livesRemaining={session.livesRemaining}
                maxLives={3}
              />
              <CheckpointBonusToast
                bonusSec={loop.bonusEvent?.sec}
                triggerKey={loop.bonusEvent?.key ?? 0}
              />
            </>
          )}

          {session.phase === 'stage_clear' && loop.outcome.kind === 'cleared' && (
            <StageClearOverlay
              goalTimeSec={loop.outcome.goalTimeSec}
              rank={loop.outcome.rank}
              onContinue={session.continueAfterClear}
            />
          )}

          {session.phase === 'game_over' && (
            <GameOverOverlay
              stageNumber={stageNumber}
              totalStages={totalStages}
              onBackToStageSelect={session.returnToStageSelect}
            />
          )}

          {session.phase === 'ending' && (
            <EndingScreen onBackToStageSelect={session.returnToStageSelect} />
          )}

          {optionsOpen && (
            <OptionsModal
              canReplayEnding={session.canReplayEnding}
              onReplayEnding={() => { setOptionsOpen(false); session.viewEnding(); }}
              onResetProgress={() => { setOptionsOpen(false); session.resetAllProgress(); }}
              onClose={() => setOptionsOpen(false)}
            />
          )}
        </CanvasContainer>

        <div style={{ marginTop: '1rem', textAlign: 'center', color: '#9ca3af', fontSize: '0.8rem' }}>
          ←→: ステージ移動 / Enter: 選択 / Esc: メニューへ戻る
        </div>
      </GameContainer>
    </PageContainer>
  );
};

export default RacingGameCampaign;
