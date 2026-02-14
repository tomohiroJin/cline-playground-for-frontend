// 落ち物シューティング メインゲームコンポーネント

// 注: このファイルではパフォーマンス最適化のため、ref経由でゲーム状態を管理しています
// ゲームループでの高頻度更新に対応するための意図的な設計パターンです

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { clamp } from '../../utils/math-utils';
import { saveScore, getHighScore } from '../../utils/score-storage';

import type {
  GameState,
  GameStatus,
  PowerType,
  SkillType,
  BulletData,
  ExplosionData,
  Powers,
} from './types';
import { CONFIG } from './constants';
import { uid } from './utils';
import { Audio } from './audio';
import { Grid } from './grid';
import { Block } from './block';
import { Bullet } from './bullet';
import { GameLogic } from './game-logic';
import { Stage } from './stage';
import { useInterval, useKeyboard, useIdleTimer } from './hooks';

import { CellComponent } from './components/CellView';
import { BulletView } from './components/BulletView';
import { PlayerShip } from './components/PlayerShip';
import { SkillGauge } from './components/SkillGauge';
import { PowerUpIndicator } from './components/PowerUpIndicator';
import { StatusBar } from './components/StatusBar';
import { LaserEffectComponent, ExplosionEffectComponent, BlastEffectComponent } from './components/Effects';
import {
  StartScreen,
  ClearScreen,
  GameOverScreen,
  EndingScreen,
  DemoScreen,
} from './components/Overlays';

import {
  PageContainer,
  Header,
  Title,
  IconButton,
  GameArea,
  ControlsContainer,
  ControlBtn,
  DangerLine,
} from '../../pages/FallingShooterPage.styles';

export const FalldownShooterGame: React.FC = () => {
  const { width: W, height: H, cellSize: SZ } = CONFIG.grid;

  // State
  const stateRef = useRef<GameState>(Stage.create(1, 0, W, H));
  const spawnTimeRef = useRef<number>(0);
  const prevScoreRef = useRef<number>(0);

  const [, forceUpdate] = useState<number>(0);
  const [playerX, setPlayerX] = useState<number>(Math.floor(W / 2));
  const [status, setStatus] = useState<GameStatus>('idle');
  const [canFire, setCanFire] = useState<boolean>(true);
  const [powers, setPowers] = useState<Powers>({
    triple: false,
    pierce: false,
    slow: false,
    downshot: false,
  });
  const [explosions, setExplosions] = useState<ExplosionData[]>([]);
  const [laserX, setLaserX] = useState<number | null>(null);
  const [showBlast, setShowBlast] = useState<boolean>(false);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [showDemo, setShowDemo] = useState<boolean>(false);

  const [skillCharge, setSkillCharge] = useState<number>(0);
  const [highScore, setHighScore] = useState<number>(0);

  // パフォーマンス最適化のため、ref経由で状態を管理（ゲームループでの高頻度更新に対応）
  const state = stateRef.current;
  const isPlaying = status === 'playing';
  const isIdle = status === 'idle';

  // Helpers
  const updateState = useCallback((changes: Partial<GameState>) => {
    Object.assign(stateRef.current, changes);
    forceUpdate(n => n + 1);
  }, []);

  const playSound = useCallback(
    (sound: () => void) => {
      if (soundEnabled) sound();
    },
    [soundEnabled]
  );

  const loadHighScore = useCallback(() => {
    getHighScore('falling-shooter').then(setHighScore);
  }, []);

  useEffect(() => {
    loadHighScore();
  }, [loadHighScore]);

  // スキルチャージエフェクト
  useEffect(() => {
    if (!isPlaying) return;
    const scoreDiff = state.score - prevScoreRef.current;
    if (scoreDiff > 0) {
      const chargeGain = (scoreDiff / CONFIG.skill.chargeRate) * 100;
      setSkillCharge(c => {
        const newCharge = Math.min(CONFIG.skill.maxCharge, c + chargeGain);
        if (c < 100 && newCharge >= 100) playSound(Audio.charge);
        return newCharge;
      });
    }
    prevScoreRef.current = state.score;
  }, [state.score, isPlaying, playSound]);

  // パワーアップハンドラー
  const handlePowerExpire = useCallback((type: PowerType) => {
    setPowers(p => ({ ...p, [type]: false }));
  }, []);

  const handlePowerUp = useCallback(
    (type: PowerType, x: number, y: number) => {
      if (type === 'bomb') {
        playSound(Audio.bomb);
        setExplosions(e => [...e, { id: uid(), x, y }]);
        setTimeout(() => {
          const st = stateRef.current;
          const result = GameLogic.applyExplosion(x, y, st.blocks, st.grid, W, H);
          updateState({
            blocks: result.blocks,
            grid: result.grid,
            score: st.score + result.score,
          });
        }, 0);
      } else {
        playSound(Audio.power);
        setPowers(p => ({ ...p, [type]: true }));
        setTimeout(() => handlePowerExpire(type), CONFIG.powerUp.duration[type]);
      }
    },
    [playSound, updateState, handlePowerExpire, W, H]
  );

  // スキルハンドラー
  const activateSkill = useCallback(
    (skillType: SkillType) => {
      if (skillCharge < CONFIG.skill.maxCharge) return;

      playSound(Audio.skill);
      setSkillCharge(0);

      const st = stateRef.current;

      switch (skillType) {
        case 'laser': {
          setLaserX(playerX);
          setTimeout(() => setLaserX(null), 300);
          const result = GameLogic.applyLaserColumn(playerX, st.blocks, st.grid);
          updateState({ blocks: result.blocks, grid: result.grid, score: st.score + result.score });
          break;
        }
        case 'blast': {
          setShowBlast(true);
          setTimeout(() => setShowBlast(false), 400);
          const result = GameLogic.applyBlastAll(st.blocks);
          updateState({ blocks: result.blocks, score: st.score + result.score });
          break;
        }
        case 'clear': {
          const result = GameLogic.applyClearBottom(st.grid);
          if (result.cleared) {
            const newPlayerY = GameLogic.calculatePlayerY(result.grid);
            updateState({ grid: result.grid, score: st.score + result.score, playerY: newPlayerY });
          }
          break;
        }
      }
    },
    [skillCharge, playerX, playSound, updateState]
  );

  // ゲームフローハンドラー
  const startStage = useCallback(
    (num: number, score: number = 0) => {
      stateRef.current = Stage.create(num, score, W, H);
      prevScoreRef.current = score;
      setPlayerX(Math.floor(W / 2));
      setCanFire(true);
      setPowers({ triple: false, pierce: false, slow: false, downshot: false });
      setExplosions([]);
      setLaserX(null);
      setShowBlast(false);
      spawnTimeRef.current = 0;
      setStatus('playing');
      setShowDemo(false);
      forceUpdate(n => n + 1);
    },
    [W, H]
  );

  const goToTitle = useCallback(() => {
    stateRef.current = Stage.create(1, 0, W, H);
    prevScoreRef.current = 0;
    setPlayerX(Math.floor(W / 2));
    setPowers({ triple: false, pierce: false, slow: false, downshot: false });
    setExplosions([]);
    setSkillCharge(0);
    setStatus('idle');
    forceUpdate(n => n + 1);
  }, [W, H]);

  const resetGame = useCallback(() => {
    setSkillCharge(0);
    startStage(1, 0);
  }, [startStage]);

  const nextStage = useCallback(() => {
    playSound(Audio.win);
    startStage(state.stage + 1, state.score);
  }, [startStage, state.stage, state.score, playSound]);

  // 操作
  const moveLeft = useCallback(() => setPlayerX(x => clamp(x - 1, 0, W - 1)), [W]);
  const moveRight = useCallback(() => setPlayerX(x => clamp(x + 1, 0, W - 1)), [W]);

  const fire = useCallback(() => {
    if (!canFire) return;
    playSound(Audio.shoot);
    const y = stateRef.current.playerY - 1;

    let newBullets: BulletData[];
    if (powers.triple && powers.downshot) {
      newBullets = Bullet.createSpreadWithDownshot(playerX, y, powers.pierce);
    } else if (powers.triple) {
      newBullets = Bullet.createSpread(playerX, y, powers.pierce);
    } else if (powers.downshot) {
      newBullets = Bullet.createWithDownshot(playerX, y, powers.pierce);
    } else {
      newBullets = [Bullet.create(playerX, y, 0, -1, powers.pierce)];
    }

    updateState({ bullets: [...stateRef.current.bullets, ...newBullets] });
    setCanFire(false);
    setTimeout(() => setCanFire(true), CONFIG.timing.bullet.cooldown);
  }, [canFire, playerX, powers, playSound, updateState]);

  // Hooks
  useIdleTimer(CONFIG.demo.idleTimeout, () => setShowDemo(true), isIdle && !showDemo);

  useKeyboard(isPlaying, {
    left: moveLeft,
    right: moveRight,
    fire,
    skill1: () => activateSkill('laser'),
    skill2: () => activateSkill('blast'),
    skill3: () => activateSkill('clear'),
  });

  // ゲームループ
  useInterval(() => updateState({ time: state.time + 1 }), 1000, isPlaying);

  useInterval(
    () => {
      const now = Date.now();
      const spawnInterval = GameLogic.getSpawnInterval(state.time, state.stage);

      if (now - spawnTimeRef.current > spawnInterval) {
        if (GameLogic.canSpawnBlock(state.blocks)) {
          updateState({ blocks: [...state.blocks, Block.create(W, state.blocks)] });
          spawnTimeRef.current = now;
        }
      }
    },
    100,
    isPlaying
  );

  useInterval(
    () => {
      if (!state.bullets.length) return;

      const result = GameLogic.processBullets(
        state.bullets,
        state.blocks,
        state.grid,
        W,
        H,
        handlePowerUp
      );

      if (result.hitCount > 0) playSound(Audio.hit);

      updateState({
        bullets: result.bullets,
        blocks: result.blocks,
        grid: result.grid,
        score: state.score + result.score,
      });

      result.pendingBombs.forEach(({ x, y }) => handlePowerUp('bomb', x, y));
    },
    CONFIG.timing.bullet.speed,
    isPlaying
  );

  useInterval(
    () => {
      if (!state.blocks.length) return;

      const { falling, landing } = GameLogic.processBlockFalling(state.blocks, state.grid, H);

      if (!landing.length) {
        updateState({ blocks: falling });
        return;
      }

      playSound(Audio.land);

      const gridWithLanded = Block.placeOnGrid(landing, state.grid);
      const { grid: clearedGrid, cleared } = Grid.clearFullLines(gridWithLanded);

      if (cleared > 0) playSound(Audio.line);

      const newLines = state.lines + cleared;
      const newPlayerY = GameLogic.calculatePlayerY(clearedGrid);
      const lineScore = cleared * CONFIG.score.line * state.stage;

      updateState({
        blocks: falling,
        grid: clearedGrid,
        playerY: newPlayerY,
        score: state.score + lineScore,
        lines: newLines,
      });

      if (newLines >= state.linesNeeded) {
        setStatus(Stage.isFinal(state.stage) ? 'ending' : 'clear');
        return;
      }

      if (GameLogic.isGameOver(clearedGrid)) {
        playSound(Audio.over);
        saveScore('falling-shooter', state.score)
          .then(() => loadHighScore())
          .catch(err => console.error(err));
        setStatus('over');
      }
    },
    GameLogic.getFallSpeed(state.time, state.stage, powers.slow),
    isPlaying
  );

  // Render
  return (
    <PageContainer>
      {showDemo && <DemoScreen onDismiss={() => setShowDemo(false)} />}

      <Header>
        <Title>落ち物シューティング</Title>
        <div
          style={{ fontSize: '0.9rem', color: '#fbbf24', marginLeft: 'auto', marginRight: '1rem' }}
        >
          High Score: {highScore}
        </div>
        <IconButton onClick={() => setSoundEnabled(s => !s)}>
          {soundEnabled ? '🔊' : '🔇'}
        </IconButton>
        <IconButton onClick={() => setShowDemo(true)}>❓</IconButton>
      </Header>

      <SkillGauge charge={skillCharge} onUseSkill={activateSkill} />
      <PowerUpIndicator powers={powers} />
      <StatusBar
        stage={state.stage}
        lines={state.lines}
        linesNeeded={state.linesNeeded}
        score={state.score}
      />

      <div style={{ position: 'relative' }}>
        {status === 'idle' && <StartScreen onStart={resetGame} />}
        {status === 'clear' && <ClearScreen stage={state.stage} onNext={nextStage} />}
        {status === 'over' && (
          <GameOverScreen score={state.score} onRetry={resetGame} onTitle={goToTitle} />
        )}
        {status === 'ending' && (
          <EndingScreen score={state.score} onRetry={resetGame} onTitle={goToTitle} />
        )}

        <GameArea
          $width={W * SZ}
          $height={H * SZ}
          role="region"
          aria-label="シューティングパズルゲーム画面"
          tabIndex={0}
        >
          {state.grid.map((row, y) =>
            row.map(
              (color, x) =>
                color && <CellComponent key={`g${x}${y}`} x={x} y={y} color={color} size={SZ} />
            )
          )}

          {state.blocks.map(block =>
            Block.getCells(block).map(
              (cell, i) =>
                cell.y >= 0 && (
                  <CellComponent
                    key={`b${block.id}${i}`}
                    x={cell.x}
                    y={cell.y}
                    color={block.color}
                    size={SZ}
                    power={i === 0 ? block.power : null}
                  />
                )
            )
          )}

          {state.bullets.map(b => (
            <BulletView key={b.id} bullet={b} size={SZ} />
          ))}
          {explosions.map(e => (
            <ExplosionEffectComponent key={e.id} x={e.x} y={e.y} size={SZ} />
          ))}
          {laserX !== null && <LaserEffectComponent x={laserX} size={SZ} height={H} />}
          <BlastEffectComponent visible={showBlast} />
          <PlayerShip x={playerX} y={state.playerY} size={SZ} />

          <DangerLine $top={SZ * CONFIG.dangerLine} />
        </GameArea>
      </div>

      <ControlsContainer>
        <ControlBtn onClick={moveLeft}>←</ControlBtn>
        <ControlBtn onClick={fire} $variant="fire">
          🎯
        </ControlBtn>
        <ControlBtn onClick={moveRight}>→</ControlBtn>
      </ControlsContainer>
    </PageContainer>
  );
};
