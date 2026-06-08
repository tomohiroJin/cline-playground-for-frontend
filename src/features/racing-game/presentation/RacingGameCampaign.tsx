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
import { ReducedMotionGlobalStyle } from '../components/campaign/campaign-styles';
import { StageSelectScreen } from '../components/campaign/StageSelectScreen';
import { OptionsModal, DEFAULT_VOLUME_SETTINGS } from '../components/campaign/OptionsModal';
import type { VolumeSettings } from '../components/campaign/OptionsModal';
import { StageHud } from '../components/campaign/StageHud';
import { CheckpointBonusToast } from '../components/campaign/CheckpointBonusToast';
import { StageClearOverlay } from '../components/campaign/StageClearOverlay';
import { GameOverOverlay } from '../components/campaign/GameOverOverlay';
import { RetryConfirmOverlay } from '../components/campaign/RetryConfirmOverlay';
import { EndingScreen } from '../components/campaign/EndingScreen';
import { StageIntroOverlay } from '../components/campaign/StageIntroOverlay';
import { createCampaignSeEngine } from '../components/campaign/campaign-se-engine';

const CAMPAIGN_BASE_SPEED = 3.2;

export interface RacingGameCampaignProps {
  /** メニューに戻るコールバック */
  readonly onExit: () => void;
}

const RacingGameCampaign: React.FC<RacingGameCampaignProps> = ({ onExit }) => {
  const port = useMemo(() => createCampaignProgressRepository(), []);
  const seEngine = useMemo(() => createCampaignSeEngine(), []);
  const session = useCampaignSession(port);
  const stages = getAllStages();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { keys, touch } = useInput();
  const [optionsOpen, setOptionsOpen] = useState(false);
  const [volume, setVolume] = useState<VolumeSettings>(DEFAULT_VOLUME_SETTINGS);
  const [orchConfig, setOrchConfig] = useState<GameOrchestratorConfig | null>(null);
  // F3: ステージ intro 表示フラグ。selectStage 直後 → intro 表示 → racing 開始の順
  const [showingIntro, setShowingIntro] = useState(false);
  // 直前のベストタイムを記憶し、ステージクリア時に NEW BEST! 判定に使う
  const prevBestRef = useRef<number | undefined>(undefined);

  // セッション初期化（マウント時に STAGE SELECT へ）
  useEffect(() => {
    session.enterStageSelect();
  }, []);  // eslint-disable-line react-hooks/exhaustive-deps

  // アンマウント時に SE エンジンをクリーンアップ
  useEffect(() => {
    return () => seEngine.cleanup();
  }, [seEngine]);

  // master 音量を SE エンジンへ反映（マウント時の既定値 + スライダー変更の双方を宣言的に処理）
  useEffect(() => {
    seEngine.setMasterVolume(volume.master);
  }, [seEngine, volume.master]);

  // F3: ステージ選択 → intro 表示 → racing 突入のフロー
  useEffect(() => {
    if (session.phase === 'racing' && session.currentStage) {
      // 既クリアステージの再挑戦は短縮版 intro
      const stageId = session.currentStage.id;
      prevBestRef.current = session.progress.records[stageId]?.bestTimeSec;
      seEngine.play('info');
      setShowingIntro(true);
    } else {
      setShowingIntro(false);
    }
  }, [session.phase, session.currentStage, session.progress, seEngine]);

  // racing 突入時に orchestrator config を構築（intro 表示中は遅延）
  useEffect(() => {
    if (session.phase !== 'racing' || !session.currentStage || showingIntro) {
      if (session.phase !== 'racing') setOrchConfig(null);
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
  }, [session.phase, session.currentStage, session.livesRemaining, keys, touch, showingIntro]);

  const loop = useCampaignGameLoop(canvasRef, orchConfig, session.currentStage, session.livesRemaining);

  // ループ結果に応じてセッション状態を進める（Q2 対応: 重複呼び出し排除）
  useEffect(() => {
    if (loop.phase === 'cleared' && loop.outcome.kind === 'cleared') {
      session.handleClear(loop.outcome.goalTimeSec, loop.outcome.rank);
    } else if (loop.phase === 'time_up' || loop.phase === 'game_over') {
      seEngine.play(loop.phase === 'game_over' ? 'game-over' : 'lives-warn');
      session.handleTimeUp();
    }
  }, [loop.phase]);  // eslint-disable-line react-hooks/exhaustive-deps

  // F3: チェックポイント時間延長で SE 鳴動
  useEffect(() => {
    if (loop.bonusEvent) seEngine.play('bonus');
  }, [loop.bonusEvent, seEngine]);

  const totalStages = stages.length;
  const stageNumber = session.currentStage?.id ?? 1;

  // 現ステージのベスト更新判定（F3: NEW BEST 表示用）
  const isNewBest =
    loop.outcome.kind === 'cleared' &&
    (prevBestRef.current === undefined ||
      loop.outcome.goalTimeSec < prevBestRef.current);

  // S1 対応: stage_select は Canvas と無関係なので CanvasContainer の外、
  // 画面全体を使うレイアウトにする。レース・結果系は Canvas オーバーレイなので
  // CanvasContainer 内に配置する。
  const isStageSelect = session.phase === 'stage_select';

  return (
    <PageContainer>
      <ReducedMotionGlobalStyle />
      <GameContainer>
        <div style={{ textAlign: 'center' }}>
          <Title>Racing Game — CAMPAIGN</Title>
        </div>

        {/* F2 対応: stage_select 中は CanvasContainer 自体をアンマウント（display:none ではなく条件レンダリング）
            メニューに戻った際の Canvas ステートのリーク・サイズ崩れを防ぐ。 */}
        {isStageSelect ? (
          <StageSelectScreen
            stages={stages}
            progress={session.progress}
            onSelectStage={session.selectStage}
            onBackToMenu={() => { session.leaveToMenu(); onExit(); }}
            onOpenOptions={() => setOptionsOpen(true)}
          />
        ) : (
        <CanvasContainer>
          <Canvas ref={canvasRef} role="img" aria-label="レーシングキャンペーン画面" tabIndex={0} />

          {/* F3: カウントダウン中（loop.phase==='countdown'）は HUD を隠し、
              キャンバスの「3,2,1 → GO!」演出だけを見せる */}
          {session.phase === 'racing' && !showingIntro && loop.phase !== 'countdown' && (
            <>
              <StageHud
                timeRemainingSec={loop.display.timeRemainingSec}
                stageNumber={stageNumber}
                totalStages={totalStages}
                speed={CAMPAIGN_BASE_SPEED * 60}  /* 表示用 */
                livesRemaining={session.livesRemaining}
                maxLives={3}
                currentLap={loop.display.currentLap}
                maxLaps={orchConfig?.raceConfig.maxLaps}
              />
              <CheckpointBonusToast
                bonusSec={loop.bonusEvent?.sec}
                triggerKey={loop.bonusEvent?.key ?? 0}
              />
            </>
          )}

          {/* F3: ステージ突入時にナラティブを表示してわくわく感を演出 */}
          {session.phase === 'racing' && showingIntro && session.currentStage && (
            <StageIntroOverlay
              numberLabel={session.currentStage.numberLabel}
              title={session.currentStage.title}
              intro={session.currentStage.intro}
              isReplay={prevBestRef.current !== undefined}
              onComplete={() => setShowingIntro(false)}
            />
          )}

          {session.phase === 'stage_clear' && loop.outcome.kind === 'cleared' && (
            <StageClearOverlay
              goalTimeSec={loop.outcome.goalTimeSec}
              rank={loop.outcome.rank}
              isNewBest={isNewBest}
              onPlayFanfare={() => seEngine.play('clear-fanfare')}
              onContinue={session.continueAfterClear}
            />
          )}

          {session.phase === 'retry' && (
            <RetryConfirmOverlay
              stageNumber={stageNumber}
              totalStages={totalStages}
              livesRemaining={session.livesRemaining}
              onRetry={session.retryStage}
              onBackToStageSelect={session.returnToStageSelect}
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

        </CanvasContainer>
        )}

        {/* OPTIONS は stage_select / racing どちらからも開く可能性があるため
            CanvasContainer の外で fixed Overlay として常時マウント可能に */}
        {optionsOpen && (
          <OptionsModal
            canReplayEnding={session.canReplayEnding}
            onReplayEnding={() => { setOptionsOpen(false); session.viewEnding(); }}
            onResetProgress={() => { setOptionsOpen(false); session.resetAllProgress(); }}
            onClose={() => setOptionsOpen(false)}
            volume={volume}
            onVolumeChange={setVolume}
          />
        )}

        <div style={{ marginTop: '1rem', textAlign: 'center', color: '#9ca3af', fontSize: '0.8rem' }}>
          ←→: ステージ移動 / Enter: 選択 / Esc: メニューへ戻る
        </div>
      </GameContainer>
    </PageContainer>
  );
};

export default RacingGameCampaign;
