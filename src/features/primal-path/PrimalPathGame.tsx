/**
 * 原始進化録 - PRIMAL PATH
 *
 * メインオーケストレータ: Labyrinth Echo パターン準拠。
 * iframe を廃止し、React コンポーネントで直接描画。
 */
import React, { useCallback, useEffect, useState } from 'react';
import { useGameState, useBattle, useAudio, useOverlay, usePersistence } from './hooks';
import type { GameAction } from './hooks';
import type { TickEvent, SfxType } from './types';
import { ErrorBoundary } from './contracts';
import { DIFFS, BIO } from './constants';
import { pickBiomeAuto, formatEventResult } from './game-logic';

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

function GameInner() {
  const { state, dispatch } = useGameState();
  const { init: initAudio, playSfx } = useAudio();
  const { overlay, showOverlay } = useOverlay();
  const { loaded } = usePersistence(state, dispatch);

  const [tickEvents, setTickEvents] = useState<TickEvent[]>([]);

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

  const handleStartRun = useCallback(async (di: number) => {
    initAudio();
    const d = DIFFS[di];
    await showOverlay(d.ic, d.n + 'モード開始！', 1100);
    dispatch({ type: 'START_RUN', di });
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
              const { icon, text } = formatEventResult(choice.effect, choice.cost);
              await showOverlay(icon, text, 1200);
              dispatch({ type: 'CHOOSE_EVENT', choice });
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
          <GameOverScreen run={run} won={gameResult} save={save} dispatch={dispatch} playSfx={playSfx} />
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
