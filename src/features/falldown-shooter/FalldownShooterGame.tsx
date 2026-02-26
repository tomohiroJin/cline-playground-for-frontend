// 落ち物シューティング メインゲームコンポーネント

import React, { useState, useCallback } from 'react';
import type { Difficulty, GameStatus } from './types';
import { CONFIG } from './constants';
import { DIFFICULTIES } from './difficulty';
import { useKeyboard, useIdleTimer } from './hooks';

import { useGameState } from './hooks/use-game-state';
import { useGameFlow } from './hooks/use-game-flow';
import { useGameControls } from './hooks/use-game-controls';
import { useSkillSystem } from './hooks/use-skill-system';
import { usePowerUp } from './hooks/use-power-up';
import { useGameLoop } from './hooks/use-game-loop';
import { useResponsiveSize } from './hooks/use-responsive-size';

import { SkillGauge } from './components/SkillGauge';
import { PowerUpIndicator } from './components/PowerUpIndicator';
import { StatusBar } from './components/StatusBar';
import { DemoScreen } from './components/Overlays';
import { GameOverlays } from './components/GameOverlays';
import { GameBoard } from './components/GameBoard';
import { RankingOverlay } from './components/RankingOverlay';

import {
  PageContainer,
  Header,
  Title,
  IconButton,
  ControlsContainer,
  ControlBtn,
} from '../../pages/FallingShooterPage.styles';

export const FalldownShooterGame: React.FC = () => {
  const SZ = useResponsiveSize();

  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [showDemo, setShowDemo] = useState<boolean>(false);
  const [showRanking, setShowRanking] = useState<boolean>(false);
  const [difficulty, setDifficulty] = useState<Difficulty>('normal');
  const [status, setStatus] = useState<GameStatus>('idle');

  const isPlaying = status === 'playing';
  const isPaused = status === 'paused';
  const isIdle = status === 'idle';

  // カスタムフック
  const gameState = useGameState();
  const { state } = gameState;

  const powerUp = usePowerUp({ gameState, soundEnabled });
  const { powers, explosions, handlePowerUp } = powerUp;

  const controls = useGameControls({ gameState, powers, soundEnabled });
  const { playerX, moveLeft, moveRight, fire } = controls;

  const skill = useSkillSystem({
    gameState,
    playerX,
    isPlaying,
    soundEnabled,
    skillChargeMultiplier: DIFFICULTIES[difficulty].skillChargeMultiplier,
  });

  const flow = useGameFlow({
    difficulty,
    gameState,
    status,
    setStatus,
    setPlayerX: controls.setPlayerX,
    setPowers: powerUp.setPowers,
    setExplosions: powerUp.setExplosions,
    setLaserX: skill.setLaserX,
    setShowBlast: skill.setShowBlast,
    setSkillCharge: skill.setSkillCharge,
    setShowDemo,
    setCanFire: controls.setCanFire,
    soundEnabled,
    spawnTimeRef: { current: 0 } as React.MutableRefObject<number>,
    prevScoreRef: { current: 0 } as React.MutableRefObject<number>,
  });

  const { resetGame, goToTitle, nextStage } = flow;

  // ポーズトグル
  const togglePause = useCallback(() => {
    if (status === 'playing') {
      setStatus('paused');
    } else if (status === 'paused') {
      setStatus('playing');
    }
  }, [status, setStatus]);

  // ゲームループ（ポーズ中は停止）
  useGameLoop({
    gameState,
    isPlaying: isPlaying && !isPaused,
    powers,
    soundEnabled,
    handlePowerUp,
    setStatus,
    loadHighScore: flow.loadHighScore,
    difficulty,
  });

  // キーボード操作（プレイ中またはポーズ中）
  useKeyboard(isPlaying || isPaused, {
    left: isPlaying ? moveLeft : () => {},
    right: isPlaying ? moveRight : () => {},
    fire: isPlaying ? fire : () => {},
    skill1: isPlaying ? () => skill.activateSkill('laser') : () => {},
    skill2: isPlaying ? () => skill.activateSkill('blast') : () => {},
    skill3: isPlaying ? () => skill.activateSkill('clear') : () => {},
    pause: togglePause,
  });

  // アイドルタイマー
  useIdleTimer(CONFIG.demo.idleTimeout, () => setShowDemo(true), isIdle && !showDemo);

  return (
    <PageContainer>
      {showDemo && <DemoScreen onDismiss={() => setShowDemo(false)} />}
      {showRanking && <RankingOverlay onClose={() => setShowRanking(false)} />}

      <Header>
        <Title>落ち物シューティング</Title>
        <div
          style={{ fontSize: '0.9rem', color: '#fbbf24', marginLeft: 'auto', marginRight: '1rem' }}
        >
          High Score: {flow.highScore}
        </div>
        {isPlaying && (
          <IconButton onClick={togglePause} aria-label="ゲームを一時停止">
            ⏸
          </IconButton>
        )}
        <IconButton onClick={() => setSoundEnabled(s => !s)} aria-label="サウンドの切り替え">
          {soundEnabled ? '🔊' : '🔇'}
        </IconButton>
        <IconButton onClick={() => setShowDemo(true)} aria-label="ヘルプを表示">
          ❓
        </IconButton>
      </Header>

      <SkillGauge charge={skill.skillCharge} onUseSkill={skill.activateSkill} />
      <PowerUpIndicator powers={powers} />
      <StatusBar
        stage={state.stage}
        lines={state.lines}
        linesNeeded={state.linesNeeded}
        score={state.score}
      />

      <div style={{ position: 'relative' }}>
        <GameOverlays
          status={status}
          stage={state.stage}
          score={state.score}
          difficulty={difficulty}
          onDifficultyChange={setDifficulty}
          onStart={resetGame}
          onResume={togglePause}
          onTitle={goToTitle}
          onNext={nextStage}
          onRanking={() => setShowRanking(true)}
        />

        <GameBoard
          state={state}
          playerX={playerX}
          cellSize={SZ}
          explosions={explosions}
          laserX={skill.laserX}
          showBlast={skill.showBlast}
        />
      </div>

      <ControlsContainer>
        <ControlBtn onClick={moveLeft} aria-label="左に移動">←</ControlBtn>
        <ControlBtn onClick={fire} $variant="fire" aria-label="射撃">
          🎯
        </ControlBtn>
        <ControlBtn onClick={moveRight} aria-label="右に移動">→</ControlBtn>
      </ControlsContainer>
    </PageContainer>
  );
};
