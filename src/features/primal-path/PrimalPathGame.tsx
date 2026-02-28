/**
 * 原始進化録 - PRIMAL PATH
 *
 * メインオーケストレータ: Labyrinth Echo パターン準拠。
 * iframe を廃止し、React コンポーネントで直接描画。
 */
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useGameState, useBattle, useAudio, useOverlay, usePersistence } from './hooks';
import type { GameAction } from './hooks';
import type { TickEvent, SfxType, BiomeId, BgmType } from './types';
import { ErrorBoundary } from './contracts';
import { DIFFS, BIO } from './constants';
import { pickBiomeAuto, formatEventResult, computeEventResult } from './game-logic';
import { MetaStorage } from './storage';

import { GameContainer, GameShell } from './styles';
import { Overlay } from './components/Overlay';
import { TitleScreen } from './components/TitleScreen';
import { DifficultyScreen } from './components/DifficultyScreen';
import { HowToPlayScreen } from './components/HowToPlayScreen';
import { TreeScreen } from './components/TreeScreen';
import { BiomeSelectScreen } from './components/BiomeSelectScreen';
import { EvolutionScreen } from './components/EvolutionScreen';
import { BattleScreen } from './components/BattleScreen';
import { AwakeningScreen } from './components/AwakeningScreen';
import { PreFinalScreen } from './components/PreFinalScreen';
import { GameOverScreen } from './components/GameOverScreen';
import { AllyReviveScreen } from './components/AllyReviveScreen';
import { EventScreen } from './components/EventScreen';
import { StatsScreen } from './components/StatsScreen';
import { AchievementScreen } from './components/AchievementScreen';
import { ChallengeScreen } from './components/ChallengeScreen';

function GameInner() {
  const { state, dispatch } = useGameState();
  const { init: initAudio, playSfx, playBgm, stopBgm, setBgmVolume, setSfxVolume } = useAudio();
  const { overlay, showOverlay } = useOverlay();
  const { loaded } = usePersistence(state, dispatch);

  const [tickEvents, setTickEvents] = useState<TickEvent[]>([]);
  /** ラン終了記録の二重発火防止用 */
  const recordedRef = useRef(false);

  const handleEvents = useCallback((events: TickEvent[]) => {
    for (const ev of events) {
      if (ev.type === 'sfx') playSfx(ev.sfx);
    }
    setTickEvents(events);
  }, [playSfx]);

  useBattle(state, dispatch, handleEvents);

  // Init audio on first click
  useEffect(() => {
    const handler = () => { initAudio(); document.removeEventListener('click', handler); };
    document.addEventListener('click', handler, { once: true });
    return () => document.removeEventListener('click', handler);
  }, [initAudio]);

  // メタ進行データの読込（初期化時）
  useEffect(() => {
    if (loaded) {
      dispatch({ type: 'LOAD_META' });
    }
  }, [loaded, dispatch]);

  // フェーズに応じたBGM切替
  useEffect(() => {
    if (state.phase === 'title') {
      playBgm('title');
    } else if (state.phase === 'battle' && state.run) {
      const biome = state.run.cBT as BiomeId;
      const bgmMap: Record<string, BgmType> = {
        grassland: 'grassland',
        glacier: 'glacier',
        volcano: 'volcano',
      };
      const bgmType = bgmMap[biome];
      if (bgmType) playBgm(bgmType);
    } else if (state.phase === 'over') {
      stopBgm();
    }
  }, [state.phase, state.run?.cBT, playBgm, stopBgm]);

  // ゲームオーバー時にラン統計を記録
  useEffect(() => {
    if (state.phase === 'over' && state.gameResult !== null && !recordedRef.current) {
      recordedRef.current = true;
      dispatch({ type: 'RECORD_RUN_END', won: state.gameResult });
    }
    if (state.phase !== 'over') {
      recordedRef.current = false;
    }
  }, [state.phase, state.gameResult, dispatch]);

  // メタ進行データの永続化
  const prevMetaRef = useRef('');
  useEffect(() => {
    if (!loaded) return;
    const key = JSON.stringify({
      rs: state.runStats.length,
      ag: state.aggregate.totalRuns,
      ac: state.achievementStates.filter(a => a.unlocked).length,
    });
    if (key !== prevMetaRef.current) {
      prevMetaRef.current = key;
      MetaStorage.saveRunStats(state.runStats);
      MetaStorage.saveAggregate(state.aggregate);
      MetaStorage.saveAchievements(state.achievementStates);
    }
  }, [state.runStats, state.aggregate, state.achievementStates, loaded]);

  const handleStartRun = useCallback(async (di: number) => {
    initAudio();
    const d = DIFFS[di];
    await showOverlay(d.ic, d.n + 'モード開始！', 1100);
    dispatch({ type: 'START_RUN', di });
  }, [dispatch, showOverlay, initAudio]);

  const handleStartChallenge = useCallback(async (challengeId: string, di: number) => {
    initAudio();
    await showOverlay('⚔️', 'チャレンジ開始！', 1100);
    dispatch({ type: 'START_CHALLENGE', challengeId, di });
  }, [dispatch, showOverlay, initAudio]);

  if (!loaded) return null;

  const { phase, run, save, finalMode, battleSpd, evoPicks, pendingAwk, gameResult, currentEvent } = state;

  return (
    <GameContainer>
      <GameShell>
        <Overlay overlay={overlay} />

        {phase === 'title' && (
          <TitleScreen save={save} dispatch={dispatch} playSfx={playSfx} />
        )}

        {phase === 'diff' && (
          <DifficultyScreen save={save} dispatch={dispatch} playSfx={playSfx} onStart={handleStartRun} />
        )}

        {phase === 'how' && (
          <HowToPlayScreen dispatch={dispatch} playSfx={playSfx} />
        )}

        {phase === 'tree' && (
          <TreeScreen save={save} dispatch={dispatch} playSfx={playSfx} showOverlay={showOverlay} />
        )}

        {phase === 'biome' && run && (
          <BiomeSelectScreen
            run={run}
            options={pickBiomeAuto(run).options}
            dispatch={dispatch}
            playSfx={playSfx}
            showOverlay={showOverlay}
          />
        )}

        {phase === 'evo' && run && (
          <EvolutionScreen run={run} evoPicks={evoPicks} dispatch={dispatch} playSfx={playSfx} battleSpd={battleSpd} />
        )}

        {phase === 'event' && run && currentEvent && (
          <EventScreen
            event={currentEvent}
            run={run}
            onChoose={async (choice) => {
              playSfx('event');
              // 事前計算で結果を確定し、正確なフィードバックを表示
              const { nextRun, evoName } = computeEventResult(run, choice);
              const { icon, text } = formatEventResult(choice.effect, choice.cost, evoName);
              await showOverlay(icon, text, 1200);
              dispatch({ type: 'APPLY_EVENT_RESULT', nextRun });
            }}
            playSfx={playSfx}
          />
        )}

        {phase === 'battle' && run && (
          <BattleScreen
            run={run}
            finalMode={finalMode}
            battleSpd={battleSpd}
            dispatch={dispatch}
            playSfx={playSfx}
            tickEvents={tickEvents}
          />
        )}

        {phase === 'awakening' && run && pendingAwk && (
          <AwakeningScreen
            run={run}
            awkId={pendingAwk.id}
            awkType={pendingAwk.t}
            awkTier={pendingAwk.tier}
            dispatch={dispatch}
            playSfx={playSfx}
            showOverlay={showOverlay}
          />
        )}

        {phase === 'prefinal' && run && (
          <PreFinalScreen run={run} dispatch={dispatch} playSfx={playSfx} />
        )}

        {phase === 'ally_revive' && run && (
          <AllyReviveScreen run={run} dispatch={dispatch} playSfx={playSfx} showOverlay={showOverlay} />
        )}

        {phase === 'over' && run && gameResult !== null && (
          <GameOverScreen
            run={run}
            won={gameResult}
            save={save}
            dispatch={dispatch}
            playSfx={playSfx}
            newAchievements={state.newAchievements}
          />
        )}

        {phase === 'stats' && (
          <StatsScreen
            runStats={state.runStats}
            aggregate={state.aggregate}
            dispatch={dispatch}
            playSfx={playSfx}
          />
        )}

        {phase === 'achievements' && (
          <AchievementScreen
            achievementStates={state.achievementStates}
            dispatch={dispatch}
            playSfx={playSfx}
          />
        )}

        {phase === 'challenge' && (
          <ChallengeScreen
            aggregate={state.aggregate}
            dispatch={dispatch}
            playSfx={playSfx}
            onStartChallenge={handleStartChallenge}
          />
        )}
      </GameShell>
    </GameContainer>
  );
}

const PrimalPathGame: React.FC = () => (
  <ErrorBoundary>
    <GameInner />
  </ErrorBoundary>
);

export default PrimalPathGame;
