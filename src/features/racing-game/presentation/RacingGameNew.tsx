// Racing Game 新メインコンポーネント（薄い Wrapper）
// 旧 RacingGame.tsx の 758 行を置き換える、200 行以下のコンポーネント
// GameOrchestrator + useGameLoop + useGameState + useIdle を使用

import React, { useRef, useState, useEffect, useCallback } from 'react';
import { getHighScore } from '../../../utils/score-storage';
import { PageContainer, GameContainer, Title, SubTitle, CanvasContainer, Canvas, Overlay, ResultTitle, ActionButton, Button, MobileControls, TouchButton } from '../../../pages/RacingGamePage.styles';
import { Config, Colors, Options, Courses } from '../constants';
import { Utils } from '../utils';
import { SoundEngine } from '../audio';
import { useInput } from '../hooks';
import { useIdle } from './hooks/useIdle';
import { useGameState } from './hooks/useGameState';
import { MenuPanel } from './components/MenuPanel';
import { ResultPanel } from './components/ResultPanel';
import { VolumeCtrl } from './components/VolumeControl';
import { useGameLoop } from './hooks/useGameLoop';
import type { GameOrchestratorConfig } from '../application/game-orchestrator';
import { createCanvasRenderer } from '../infrastructure/renderer/canvas-renderer';
import { createWebAudioEngine } from '../infrastructure/audio/sound-engine';
import { createLocalStorageRepository } from '../infrastructure/storage/score-repository';
import { createKeyboardAdapter } from '../infrastructure/input/keyboard-adapter';
import type { CpuDifficulty } from '../domain/player/cpu-strategy';

export default function RacingGameNew() {
  const {
    config: gameConfig, setMode, setCourse, setSpeed, setCpu, setLaps,
    setColor1, setColor2, setCardsEnabled, bests, setBests,
  } = useGameState();
  const { mode, course, speed, cpu, laps, color1, color2, cardsEnabled } = gameConfig;

  const [vol, setVol] = useState(Config.audio.defaultVolume);
  const [muted, setMuted] = useState(false);
  const [results, setResults] = useState<{
    winnerName: string; winnerColor: string;
    times: { p1: number; p2: number }; fastest: number;
  } | null>(null);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { keys, touch, setTouch, onKeyDown } = useInput();

  // GameOrchestrator 設定の構築
  const [orchConfig, setOrchConfig] = useState<GameOrchestratorConfig | null>(null);
  const { phase, paused, highlightSummary, togglePause, reset: resetLoop } = useGameLoop(canvasRef, orchConfig);

  const [_demo, _setDemo] = useIdle(!orchConfig, Config.timing.idle);

  // ゲーム開始
  const startGame = useCallback(() => {
    if (!canvasRef.current) return;
    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) return;

    const { width, height } = Config.canvas;
    canvasRef.current.width = width;
    canvasRef.current.height = height;

    const cIdx = Utils.clamp(course, 0, Courses.length - 1);
    const cur = Courses[cIdx];
    const baseSpd = Utils.safeIndex(Options.speed, speed, Options.speed[1]).value;
    const col1 = Colors.car[Utils.clamp(color1, 0, 5)];
    const col2 = Colors.car[Utils.clamp(color2, 0, 5)];
    const DIFFICULTY_MAP: CpuDifficulty[] = ['easy', 'normal', 'hard'];
    const difficulty: CpuDifficulty = DIFFICULTY_MAP[Utils.clamp(cpu, 0, 2)];

    setOrchConfig({
      renderer: createCanvasRenderer(ctx, width, height),
      audio: createWebAudioEngine(),
      storage: createLocalStorageRepository(),
      input: createKeyboardAdapter(keys, touch, mode),
      raceConfig: {
        mode: mode as 'solo' | '2p' | 'cpu',
        courseIndex: cIdx,
        maxLaps: laps,
        baseSpeed: baseSpd,
        cpuDifficulty: difficulty,
        cardsEnabled,
      },
      course: cur,
      playerColors: [col1, col2],
      playerNames: ['P1', mode === 'cpu' ? 'CPU' : 'P2'],
    });
    setResults(null);
  }, [course, speed, cpu, laps, color1, color2, cardsEnabled, mode, keys, touch]);

  // リセット
  const reset = useCallback(() => {
    setOrchConfig(null);
    resetLoop();
    setResults(null);
    SoundEngine.cleanup();
  }, [resetLoop]);

  // P/ESC キーハンドリング
  useEffect(() => {
    onKeyDown.current = (key: string) => {
      if (key === 'p' || key === 'P') {
        if (phase === 'race' || phase === 'draft' || phase === 'countdown') {
          togglePause();
        }
      } else if (key === 'Escape') {
        if (phase === 'result' || paused) {
          reset();
        } else if (phase === 'race' || phase === 'draft' || phase === 'countdown') {
          togglePause();
        }
      }
    };
    return () => { onKeyDown.current = null; };
  });

  // ベストタイム読み込み
  useEffect(() => {
    const loadBests = async () => {
      const newBests: Record<string, number> = {};
      for (let c = 0; c < Courses.length; c++) {
        for (const l of Options.laps) {
          const key = `c${c}-l${l}`;
          const time = await getHighScore('racing', key, 'asc');
          if (time > 0) newBests[key] = time;
        }
      }
      setBests(newBests);
    };
    loadBests();
    return () => SoundEngine.cleanup();
  }, [setBests]);

  const bestKey = `c${course}-l${laps}`;
  const bestTimeStr = bests[bestKey] ? Utils.formatTime(bests[bestKey]) : '--:--.-';

  return (
    <PageContainer>
      <GameContainer>
        <div style={{ textAlign: 'center' }}>
          <Title>Racing Game</Title>
          <SubTitle>{Courses[Utils.clamp(course, 0, Courses.length - 1)]?.name || ''}</SubTitle>
          <div style={{ color: '#fbbf24', fontSize: '1rem', marginTop: '0.5rem' }}>
            Best: {bestTimeStr}
          </div>
        </div>

        <CanvasContainer>
          <Canvas ref={canvasRef} role="img" aria-label="レーシングゲーム画面" tabIndex={0} />

          {(!orchConfig || phase === 'menu') && (
            <MenuPanel
              mode={mode} setMode={setMode}
              course={course} setCourse={setCourse}
              speed={speed} setSpeed={setSpeed}
              cpu={cpu} setCpu={setCpu}
              laps={laps} setLaps={setLaps}
              c1={color1} setC1={setColor1}
              c2={color2} setC2={setColor2}
              cardsEnabled={cardsEnabled} setCardsEnabled={setCardsEnabled}
              onStart={startGame}
            />
          )}

          {phase === 'result' && results && (
            <ResultPanel
              mode={mode}
              results={results}
              highlightSummary={highlightSummary}
              bestTime={bestTimeStr}
              onReset={reset}
            />
          )}

          {paused && (
            <Overlay>
              <ResultTitle>PAUSED</ResultTitle>
              <ActionButton onClick={() => togglePause()}>Resume</ActionButton>
              <Button onClick={reset} style={{ marginTop: '1rem' }}>Exit</Button>
              <p style={{ color: '#9ca3af', fontSize: '0.7rem', marginTop: '0.5rem' }}>
                P: 再開 / ESC: メニューへ戻る
              </p>
            </Overlay>
          )}
        </CanvasContainer>

        <MobileControls>
          <TouchButton onTouchStart={() => setTouch('L', true)} onTouchEnd={() => setTouch('L', false)}>◀</TouchButton>
          <TouchButton onTouchStart={() => setTouch('R', true)} onTouchEnd={() => setTouch('R', false)}>▶</TouchButton>
        </MobileControls>

        <div style={{ marginTop: '1rem', textAlign: 'center' }}>
          <VolumeCtrl vol={vol} setVol={setVol} muted={muted} setMuted={setMuted} />
          <p style={{ color: '#9ca3af', fontSize: '0.75rem', marginTop: '0.5rem' }}>
            P1:A/D{mode !== 'solo' ? ' P2:←/→' : ''} ドリフト:{mode === '2p' ? 'Shift' : 'Space'}+左右 P:ポーズ ESC:終了
          </p>
        </div>
      </GameContainer>
    </PageContainer>
  );
}
