// 落ち物シューティング メインゲームコンポーネント

import React, { useState, useCallback, useEffect, useRef } from 'react';
import type { Difficulty, GameStatus } from './types';
import { CONFIG, SIMULTANEOUS_LINE_BONUS } from './constants';
import { DIFFICULTIES } from './difficulty';
import { useKeyboard, useIdleTimer } from './hooks';

import { useGameState } from './hooks/use-game-state';
import { useGameFlow } from './hooks/use-game-flow';
import { useGameControls } from './hooks/use-game-controls';
import { useSkillSystem } from './hooks/use-skill-system';
import { usePowerUp } from './hooks/use-power-up';
import { useGameLoop } from './hooks/use-game-loop';
import { useResponsiveSize } from './hooks/use-responsive-size';
import { useComboSystem } from './hooks/use-combo-system';
import { useScreenShake } from './hooks/use-screen-shake';
import { useTestMode } from './hooks/use-test-mode';

import { SkillGauge } from './components/SkillGauge';
import { PowerUpIndicator } from './components/PowerUpIndicator';
import { StatusBar } from './components/StatusBar';
import { DemoScreen } from './components/Overlays';
import { GameOverlays } from './components/GameOverlays';
import { GameBoard } from './components/GameBoard';
import { RankingOverlay } from './components/RankingOverlay';
import { GameController } from './components/GameController';
import { ComboDisplay } from './components/ComboDisplay';
import { FloatingScore } from './components/FloatingScore';
import { HighScoreEffect } from './components/HighScoreEffect';
import { TestModeIndicator } from './components/TestModeIndicator';
import { TestModePanel } from './components/TestModePanel';
import { useFloatingScores } from './hooks/use-floating-scores';

import {
  PageContainer,
  Header,
  Title,
  IconButton,
  HighScore,
  LandscapeLayout,
  SidePanel,
  ShakeKeyframes,
} from '../../pages/FallingShooterPage.styles';

export const FalldownShooterGame: React.FC = () => {
  const { cellSize: SZ, isLandscape } = useResponsiveSize();

  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [showDemo, setShowDemo] = useState<boolean>(false);
  const [showRanking, setShowRanking] = useState<boolean>(false);
  const [difficulty, setDifficulty] = useState<Difficulty>('normal');
  const [status, setStatus] = useState<GameStatus>('idle');

  const isPlaying = status === 'playing';
  const isPaused = status === 'paused';
  const isIdle = status === 'idle';

  // テストモード
  const { isTestMode } = useTestMode(status);

  // エフェクトフック
  const combo = useComboSystem();
  const shake = useScreenShake();
  const floatingScores = useFloatingScores();
  const [showHighScoreEffect, setShowHighScoreEffect] = useState(false);

  // カスタムフック
  const gameState = useGameState();
  const { state } = gameState;

  const powerUp = usePowerUp({ gameState, soundEnabled, onBomb: shake.bombShake });
  const { powers, explosions, handlePowerUp } = powerUp;

  const controls = useGameControls({ gameState, powers, soundEnabled });
  const { playerX, moveLeft, moveRight, fire } = controls;

  const skill = useSkillSystem({
    gameState,
    playerX,
    isPlaying,
    soundEnabled,
    skillChargeMultiplier: DIFFICULTIES[difficulty].skillChargeMultiplier,
    onBlast: shake.blastShake,
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

  // ライン消しコンボ処理
  const handleLineClear = useCallback((clearedLines: number) => {
    for (let i = 0; i < clearedLines; i++) {
      const result = combo.registerHit();
      if (result.skillBonus > 0) {
        skill.setSkillCharge((prev: number) => Math.min(prev + result.skillBonus, 100));
      }
    }
    // フローティングスコア表示（同時消しボーナス × コンボ倍率を反映）
    const simultaneousBonus = SIMULTANEOUS_LINE_BONUS[clearedLines] ?? 1.0;
    const fx = Math.round(CONFIG.grid.width * SZ * 0.3 + Math.random() * CONFIG.grid.width * SZ * 0.4);
    const fy = Math.round(CONFIG.grid.height * SZ * 0.6 + Math.random() * CONFIG.grid.height * SZ * 0.2);
    floatingScores.addScore(fx, fy, clearedLines * CONFIG.score.line, simultaneousBonus * combo.comboState.multiplier);
  }, [combo, skill, floatingScores, SZ]);

  // ハイスコア更新検知
  const highScoreNotifiedRef = useRef(false);
  useEffect(() => {
    const isNewHighScore = isPlaying && state.score > 0 && flow.highScore > 0 && state.score > flow.highScore;
    if (isNewHighScore && !highScoreNotifiedRef.current) {
      highScoreNotifiedRef.current = true;
      setShowHighScoreEffect(true);
      setTimeout(() => setShowHighScoreEffect(false), 3000);
    }
    if (status === 'idle') {
      highScoreNotifiedRef.current = false;
    }
  }, [state.score, flow.highScore, isPlaying, status]);

  // ゲームオーバー時のシェイク
  const prevStatusRef = useRef<GameStatus>(status);
  useEffect(() => {
    if (status === 'over' && prevStatusRef.current !== 'over') {
      shake.gameOverShake();
    }
    prevStatusRef.current = status;
  }, [status, shake]);

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
    onLineClear: handleLineClear,
    comboMultiplier: combo.comboState.multiplier,
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

  // テストモード用操作ハンドラー
  const handleFillRows = useCallback((rows: number) => {
    const grid = gameState.stateRef.current.grid;
    const newGrid = grid.map(row => [...row]);
    const { width: W, height: H } = CONFIG.grid;
    // プレイヤー行の1つ上から指定行数分を埋める（プレイヤーXの列だけ空ける）
    const playerRow = H - 1;
    const fillColor = '#888888';
    for (let r = 0; r < rows; r++) {
      const targetRow = playerRow - 1 - r;
      if (targetRow >= 0) {
        for (let x = 0; x < W; x++) {
          newGrid[targetRow][x] = x === playerX ? null : fillColor;
        }
      }
    }
    gameState.updateState({ grid: newGrid });
  }, [gameState, playerX]);

  const handleClearGrid = useCallback(() => {
    const { width: W, height: H } = CONFIG.grid;
    const emptyGrid = Array.from({ length: H }, () => Array(W).fill(null) as (string | null)[]);
    gameState.updateState({ grid: emptyGrid, blocks: [] });
  }, [gameState]);

  const handleAddScore = useCallback(() => {
    gameState.updateState({ score: gameState.stateRef.current.score + 1000 });
  }, [gameState]);

  const handleSkillMax = useCallback(() => {
    skill.setSkillCharge(100);
  }, [skill]);

  const handleHighScoreEffect = useCallback(() => {
    setShowHighScoreEffect(true);
    setTimeout(() => setShowHighScoreEffect(false), 3000);
  }, []);

  // HUD部分（スキルゲージ、パワーアップ、ステータスバー、コントローラー）
  const hudContent = (
    <>
      <SkillGauge charge={skill.skillCharge} onUseSkill={skill.activateSkill} />
      <PowerUpIndicator powers={powers} />
      <StatusBar
        stage={state.stage}
        lines={state.lines}
        linesNeeded={state.linesNeeded}
        score={state.score}
      />
    </>
  );

  // ゲーム盤面部分
  const gameBoardContent = (
    <div style={{ position: 'relative', ...shake.shakeStyle }}>
      <ComboDisplay comboState={combo.comboState} />
      <FloatingScore items={floatingScores.items} />
      <HighScoreEffect show={showHighScoreEffect} />
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
  );

  // テストモード用デバッグパネル
  const testModePanel = isTestMode ? (
    <TestModePanel
      onFillRows={handleFillRows}
      onClearGrid={handleClearGrid}
      playerX={playerX}
      onBombShake={shake.bombShake}
      onBlastShake={shake.blastShake}
      onLineShake={shake.lineShake}
      onGameOverShake={shake.gameOverShake}
      onHighScoreEffect={handleHighScoreEffect}
      onAddScore={handleAddScore}
      onSkillMax={handleSkillMax}
      onNextStage={nextStage}
      comboCount={combo.comboState.count}
      comboMultiplier={combo.comboState.multiplier}
      skillCharge={skill.skillCharge}
      score={state.score}
      stage={state.stage}
    />
  ) : null;

  return (
    <PageContainer>
      <ShakeKeyframes />
      <TestModeIndicator isTestMode={isTestMode} />
      {showDemo && <DemoScreen onDismiss={() => setShowDemo(false)} />}
      {showRanking && <RankingOverlay onClose={() => setShowRanking(false)} />}

      <Header>
        <Title>落ち物シューティング</Title>
        <HighScore>High Score: {flow.highScore}</HighScore>
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

      {isLandscape ? (
        // 横向きレイアウト: ゲーム盤面 + HUD/コントローラー横並び
        <LandscapeLayout>
          {gameBoardContent}
          <SidePanel>
            {hudContent}
            <GameController onMoveLeft={moveLeft} onMoveRight={moveRight} onFire={fire} />
            {testModePanel}
          </SidePanel>
        </LandscapeLayout>
      ) : (
        // 縦向きレイアウト: 従来の縦積み
        <>
          {hudContent}
          {gameBoardContent}
          <GameController onMoveLeft={moveLeft} onMoveRight={moveRight} onFire={fire} />
          {testModePanel}
        </>
      )}
    </PageContainer>
  );
};
