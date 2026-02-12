import React, { useState, useEffect, useRef, useCallback } from 'react';
import { saveScore, getHighScore } from '../utils/score-storage';
import { ShareButton } from '../components/molecules/ShareButton';
import styled from 'styled-components';
import { GlassCard } from '../components/atoms/GlassCard';

// ============================================
// Styles
// ============================================
const PageContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  background: var(--bg-gradient);
  padding: 20px;
  touch-action: none;
`;

const GameTitle = styled.h1`
  font-size: 2rem;
  font-weight: 800;
  color: var(--accent-color);
  margin-bottom: 20px;
  text-shadow: 0 0 10px rgba(0, 210, 255, 0.5);
`;

const MenuCard = styled(GlassCard)`
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 40px;
  max-width: 500px;
  width: 100%;
`;

const OptionContainer = styled.div`
  background: rgba(0, 0, 0, 0.3);
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 20px;
  width: 100%;
`;

const OptionTitle = styled.p`
  color: var(--text-primary);
  font-size: 0.9rem;
  margin-bottom: 10px;
  text-align: center;
  font-weight: 600;
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 10px;
`;

const ModeButton = styled.button<{ $selected?: boolean }>`
  flex: 1;
  padding: 10px;
  border-radius: 8px;
  border: 1px solid ${props => (props.$selected ? 'var(--accent-color)' : 'transparent')};
  background: ${props => (props.$selected ? 'rgba(0, 210, 255, 0.2)' : 'rgba(255, 255, 255, 0.1)')};
  color: ${props => (props.$selected ? 'var(--accent-color)' : 'var(--text-secondary)')};
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: rgba(0, 210, 255, 0.1);
  }
`;

const StartButton = styled.button`
  background: linear-gradient(135deg, var(--accent-color), #3a7bd5);
  color: white;
  font-size: 1.2rem;
  font-weight: 800;
  padding: 15px 60px;
  border-radius: 50px;
  border: none;
  cursor: pointer;
  margin-top: 20px;
  box-shadow: 0 4px 15px rgba(0, 210, 255, 0.3);
  transition: all 0.2s;

  &:hover {
    transform: scale(1.05);
    box-shadow: 0 6px 20px rgba(0, 210, 255, 0.5);
  }
`;

const ScoreBoard = styled.div`
  display: flex;
  justify-content: space-between;
  width: 100%;
  max-width: 300px;
  margin-bottom: 10px;
`;

const ScoreText = styled.span<{ $color: string }>`
  font-size: 1.5rem;
  font-weight: 800;
  color: ${props => props.$color};
  text-shadow: 0 0 10px ${props => props.$color};
`;

const GameCanvas = styled.canvas`
  border-radius: 12px;
  border: 2px solid var(--glass-border);
  box-shadow: 0 0 20px rgba(0, 0, 0, 0.5);
  background: #0d1117;
  max-width: 100%;
  max-height: calc(100vh - 100px);
  touch-action: none;
`;

const MenuButton = styled.button`
  background: none;
  border: 1px solid var(--text-secondary);
  color: var(--text-secondary);
  padding: 5px 15px;
  border-radius: 20px;
  cursor: pointer;

  &:hover {
    background: rgba(255, 255, 255, 0.1);
    color: var(--text-primary);
  }
`;

// ============================================
// Constants
// ============================================
import { Physics } from '../features/air-hockey/core/physics';
import { CpuAI } from '../features/air-hockey/core/ai';
import { EntityFactory } from '../features/air-hockey/core/entities';
import { applyItemEffect } from '../features/air-hockey/core/items';
import { createSoundSystem } from '../features/air-hockey/core/sound';
import { clamp, randomRange, magnitude } from '../utils/math-utils';
import { CONSTANTS } from '../features/air-hockey/core/constants';
import {
  FIELDS,
  ITEMS,
  DIFFICULTY_OPTIONS,
  DIFFICULTY_LABELS,
  WIN_SCORE_OPTIONS,
} from '../features/air-hockey/core/config';
import {
  GameState,
  FieldConfig,
  Difficulty,
  SoundSystem,
  GameEffects,
  EffectState,
  Item,
  GoalEffect,
  Mallet,
  Puck,
  Obstacle,
} from '../features/air-hockey/core/types';

const { WIDTH: W, HEIGHT: H } = CONSTANTS.CANVAS;
const { MALLET: MR, PUCK: BR, ITEM: IR } = CONSTANTS.SIZES;

// Helper - randomChoice is specific to this module
const randomChoice = <T,>(arr: readonly T[]): T => arr[Math.floor(Math.random() * arr.length)];

// Renderer Module - Single Responsibility (Presentation)
export const Renderer = {
  clear(ctx: CanvasRenderingContext2D) {
    ctx.fillStyle = '#0d1117';
    ctx.fillRect(0, 0, W, H);
  },
  drawField(ctx: CanvasRenderingContext2D, field: FieldConfig) {
    ctx.strokeStyle = field.color;
    ctx.lineWidth = 5;
    ctx.shadowColor = field.color;
    ctx.shadowBlur = 10;
    ctx.strokeRect(5, 5, W - 10, H - 10);
    ctx.shadowBlur = 0;
    ctx.strokeStyle = field.color + '55';
    ctx.setLineDash([8, 8]);
    ctx.beginPath();
    ctx.moveTo(10, H / 2);
    ctx.lineTo(W - 10, H / 2);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.beginPath();
    ctx.arc(W / 2, H / 2, 40, 0, Math.PI * 2);
    ctx.stroke();
    const gs = field.goalSize;
    ctx.shadowBlur = 15;
    ctx.shadowColor = '#ff0000';
    ctx.fillStyle = '#ff3333';
    ctx.fillRect(W / 2 - gs / 2, 0, gs, 8);
    ctx.shadowColor = '#00ffff';
    ctx.fillStyle = '#33ffff';
    ctx.fillRect(W / 2 - gs / 2, H - 8, gs, 8);
    ctx.shadowBlur = 0;
    field.obstacles.forEach((ob: Obstacle) => {
      ctx.beginPath();
      ctx.arc(ob.x, ob.y, ob.r, 0, Math.PI * 2);
      ctx.fillStyle = field.color + '44';
      ctx.fill();
      ctx.strokeStyle = field.color;
      ctx.lineWidth = 2;
      ctx.stroke();
    });
  },
  drawEffectZones(ctx: CanvasRenderingContext2D, effects: GameEffects, now: number) {
    const isActive = (eff: EffectState) => eff?.speed && now - eff.speed.start < eff.speed.duration;
    if (isActive(effects.player)) {
      ctx.fillStyle = '#00ffff20';
      ctx.fillRect(5, H / 2, W - 10, H / 2 - 5);
    }
    if (isActive(effects.cpu)) {
      ctx.fillStyle = '#ff444420';
      ctx.fillRect(5, 5, W - 10, H / 2 - 5);
    }
  },
  drawCircle(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    r: number,
    fillStyle: string,
    strokeStyle: string | null = null,
    lineWidth = 2
  ) {
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fillStyle = fillStyle;
    ctx.fill();
    if (strokeStyle) {
      ctx.strokeStyle = strokeStyle;
      ctx.lineWidth = lineWidth;
      ctx.stroke();
    }
  },
  drawMallet(ctx: CanvasRenderingContext2D, mallet: Mallet, color: string, hasGlow: boolean) {
    if (hasGlow) {
      ctx.shadowColor = '#ff00ff';
      ctx.shadowBlur = 15;
    }
    this.drawCircle(ctx, mallet.x, mallet.y, MR, color, '#fff', 3);
    ctx.shadowBlur = 0;
    this.drawCircle(ctx, mallet.x, mallet.y, 8, '#fff');
  },
  drawPuck(ctx: CanvasRenderingContext2D, puck: Puck) {
    if (!puck.visible) return;
    this.drawCircle(ctx, puck.x, puck.y, BR, '#fff', '#888', 2);
  },
  drawItem(ctx: CanvasRenderingContext2D, item: Item, now: number) {
    const pulse = 1 + Math.sin(now * 0.008) * 0.2;
    this.drawCircle(ctx, item.x, item.y, IR * pulse, item.color);
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 14px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(item.icon, item.x, item.y);
  },
  drawHUD(ctx: CanvasRenderingContext2D, effects: GameEffects, now: number) {
    ctx.textAlign = 'center';
    ctx.font = 'bold 12px Arial';
    const playerEff = effects.player;
    if (playerEff.speed && now - playerEff.speed.start < playerEff.speed.duration) {
      const remaining = Math.ceil(
        (playerEff.speed.duration - (now - playerEff.speed.start)) / 1000
      );
      ctx.fillStyle = '#00ffff';
      ctx.fillText(`⚡${remaining}s`, W / 2, H - 25);
    }
    if (playerEff.invisible > 0) {
      ctx.fillStyle = '#ff00ff';
      ctx.fillText(`👻x${playerEff.invisible}`, W / 2, H - 45);
    }
  },
  drawFlash(
    ctx: CanvasRenderingContext2D,
    flash: { type: string; time: number } | null,
    now: number
  ) {
    if (!flash || now - flash.time >= CONSTANTS.TIMING.FLASH) return;
    const alpha = 1 - (now - flash.time) / CONSTANTS.TIMING.FLASH;
    ctx.fillStyle = `rgba(255,255,255,${alpha * 0.3})`;
    ctx.fillRect(0, 0, W, H);
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    const item = ITEMS.find(i => i.id === flash.type);
    if (item) {
      ctx.font = 'bold 18px Arial';
      ctx.textAlign = 'center';
      ctx.fillStyle = `rgba(255,255,255,${alpha})`;
      ctx.fillText(`${item.icon} ${item.name}!`, W / 2, H / 2);
    }
  },
  drawGoalEffect(ctx: CanvasRenderingContext2D, effect: GoalEffect | null, now: number) {
    if (!effect) return;
    const elapsed = now - effect.time;
    if (elapsed >= CONSTANTS.TIMING.GOAL_EFFECT) return;
    const isPlayerGoal = effect.scorer === 'cpu'; // Correct logic based on original code: cpu scored means puck is at bottom (y > H) or top? Wait.
    // Original: if (puck.y < 5) scored = 'cpu' (in cpu's goal? no cpu goal is at top).
    // Wait, normally cpu goal is top, player goal is bottom.
    // If puck.y < 5 (TOP), CPU goal. That means PLAYER scored?
    // Let's re-read original:
    // if (puck.y < 5 && goalChecker(puck.x)) { scored = 'cpu'; ... }
    // if (scored === 'cpu') sound.goal() else sound.lose();
    // So 'cpu' score means Player scored into CPU's goal (top). Variables are confusing.
    // Let's stick to original logic: 'cpu' means player scored.
    const alpha = Math.max(0, 0.5 - elapsed / 1000);
    ctx.fillStyle = isPlayerGoal ? `rgba(0,255,255,${alpha})` : `rgba(255,0,0,${alpha})`;
    ctx.fillRect(0, 0, W, H);
    ctx.textAlign = 'center';
    ctx.font = 'bold 36px Arial';
    const textY = H / 2 + Math.sin(elapsed * 0.01) * 10;
    ctx.fillStyle = isPlayerGoal ? '#00ffff' : '#ff4444';
    ctx.shadowColor = isPlayerGoal ? '#00ffff' : '#ff0000';
    ctx.shadowBlur = 20;
    ctx.fillText(isPlayerGoal ? 'GOAL!' : 'LOSE...', W / 2, textY);
    ctx.font = 'bold 20px Arial';
    ctx.fillText(isPlayerGoal ? '🎉 +1 Pt!' : '😢 -1 Pt', W / 2, textY + 40);
    ctx.shadowBlur = 0;
  },
  drawHelp(ctx: CanvasRenderingContext2D) {
    ctx.fillStyle = 'rgba(0,0,0,0.9)';
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = '#fff';
    ctx.textAlign = 'center';
    ctx.font = 'bold 18px Arial';
    ctx.fillText('🎮 How to Play', W / 2, 40);
    ctx.font = '13px Arial';
    ctx.fillText('Hit the puck with your mallet!', W / 2, 70);
    ctx.font = 'bold 14px Arial';
    ctx.fillText('◆Split ⚡Speed 👻Hide', W / 2, 110);
    ctx.font = '12px Arial';
    ctx.fillText('Shoot items into opponent goal!', W / 2, 140);
    ctx.fillStyle = '#888';
    ctx.fillText('Tap to Start', W / 2, H - 20);
  },
};

const AirHockeyPage: React.FC = () => {
  const [screen, setScreen] = useState<'menu' | 'game' | 'result'>('menu');
  const [diff, setDiff] = useState<Difficulty>('normal');
  const [field, setField] = useState<FieldConfig>(FIELDS[0]);
  const [winScore, setWinScore] = useState(3);
  const [scores, setScores] = useState({ p: 0, c: 0 });
  const [winner, setWinner] = useState<string | null>(null);
  const [showHelp, setShowHelp] = useState(false);
  const [highScore, setHighScore] = useState(0);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameRef = useRef<GameState | null>(null);
  const lastInputRef = useRef(0);

  const scoreRef = useRef({ p: 0, c: 0 });
  const soundRef = useRef<SoundSystem | null>(null);

  // usePreventScroll
  useEffect(() => {
    const handler = (e: TouchEvent) => e.preventDefault();
    document.addEventListener('touchmove', handler, { passive: false });
    return () => document.removeEventListener('touchmove', handler);
  }, []);

  // Load High Score
  useEffect(() => {
    getHighScore('air_hockey', `${diff}_${winScore}`).then(setHighScore);
  }, [diff, winScore]);

  // Save Score on Result
  useEffect(() => {
    if (screen === 'result') {
      const margin = scoreRef.current.p - scoreRef.current.c;
      const key = `${diff}_${winScore}`;
      saveScore('air_hockey', margin, key).then(() => {
        getHighScore('air_hockey', key).then(setHighScore);
      });
    }
  }, [screen, diff, winScore]);

  const getSound = useCallback(() => {
    if (!soundRef.current) soundRef.current = createSoundSystem();
    return soundRef.current;
  }, []);

  const startGame = useCallback(() => {
    gameRef.current = EntityFactory.createGameState();
    scoreRef.current = { p: 0, c: 0 };
    setScores({ p: 0, c: 0 });
    setWinner(null);
    setShowHelp(false);
    setScreen('game');
    lastInputRef.current = Date.now();
    getSound().start();
  }, [getSound]);

  const handleInput = useCallback(
    (e: React.MouseEvent | React.TouchEvent) => {
      const game = gameRef.current;
      if (!game || screen !== 'game') return;

      // e.preventDefault(); // Moved to passive listener logic or handled by styled component via touch-action
      // But standard e.preventDefault() on SyntheticEvent might be needed if not passive.
      // Keeping it simple.

      const now = Date.now();
      lastInputRef.current = now;

      if (showHelp) {
        setShowHelp(false);
        return;
      }

      if (!canvasRef.current) return;
      const rect = canvasRef.current.getBoundingClientRect();
      let clientX, clientY;

      if ('touches' in e) {
        clientX = e.touches[0].clientX;
        clientY = e.touches[0].clientY;
      } else {
        clientX = (e as React.MouseEvent).clientX;
        clientY = (e as React.MouseEvent).clientY;
      }

      const newX = clamp(((clientX - rect.left) / rect.width) * W, MR + 5, W - MR - 5);
      const newY = clamp(((clientY - rect.top) / rect.height) * H, H / 2 + MR + 10, H - MR - 5);

      game.player.vx = newX - game.player.x;
      game.player.vy = newY - game.player.y;
      game.player.x = newX;
      game.player.y = newY;
    },
    [screen, showHelp]
  );

  // Game Loop
  useEffect(() => {
    if (screen !== 'game') return;

    const sound = getSound();
    const goalChecker = (x: number) =>
      x > W / 2 - field.goalSize / 2 && x < W / 2 + field.goalSize / 2;

    const processCollisions = <T extends Puck | Item>(
      obj: T,
      radius: number,
      game: GameState,
      isPuck = false
    ): T => {
      const mallets = [
        { mallet: game.player, isPlayer: true },
        { mallet: game.cpu, isPlayer: false },
      ];

      for (const { mallet, isPlayer } of mallets) {
        const col = Physics.detectCollision(obj.x, obj.y, radius, mallet.x, mallet.y, MR);
        if (col) {
          const speed = magnitude(mallet.vx, mallet.vy);
          const power = Math.min(CONSTANTS.PHYSICS.MAX_POWER, 5 + speed * 1.2);
           
          obj = Physics.resolveCollision(obj, col, power, mallet.vx, mallet.vy, 0.4);

          if (isPuck && isPlayer && game.effects.player.invisible > 0) {
             
            (obj as Puck).visible = false;
             
            (obj as Puck).invisibleCount = 25;
            game.effects.player.invisible--;
          }
          sound.hit();
        }
      }

      for (const ob of field.obstacles) {
        const col = Physics.detectCollision(obj.x, obj.y, radius, ob.x, ob.y, ob.r);
        if (col) {
           
          obj = Physics.reflectOffSurface(obj, col);
          sound.wall();
        }
      }

      return obj;
    };

    let animationRef: number;
    const gameLoop = () => {
      const game = gameRef.current;
      const ctx = canvasRef.current?.getContext('2d');
      if (!game || !ctx) {
        animationRef = requestAnimationFrame(gameLoop);
        return;
      }

      const now = Date.now();

      if (game.goalEffect && now - game.goalEffect.time < CONSTANTS.TIMING.GOAL_EFFECT) {
        Renderer.clear(ctx);
        Renderer.drawField(ctx, field);
        Renderer.drawGoalEffect(ctx, game.goalEffect, now);
        animationRef = requestAnimationFrame(gameLoop);
        return;
      }
      game.goalEffect = null;

      if (now - lastInputRef.current > CONSTANTS.TIMING.HELP_TIMEOUT && !showHelp) {
        setShowHelp(true);
      }

      const cpuUpdate = CpuAI.update(game, diff, now);
      if (cpuUpdate) {
        game.cpu = cpuUpdate.cpu;
        game.cpuTarget = cpuUpdate.cpuTarget;
        game.cpuTargetTime = cpuUpdate.cpuTargetTime;
      }

      if (now - game.lastItemSpawn > CONSTANTS.TIMING.ITEM_SPAWN && game.items.length < 2) {
        game.items.push(EntityFactory.createItem(randomChoice(ITEMS), Math.random() > 0.5));
        game.lastItemSpawn = now;
      }

      for (let i = game.items.length - 1; i >= 0; i--) {
        let item = game.items[i];
        item.x += item.vx;
        item.y += item.vy;

        item = Physics.applyWallBounce(item, IR, goalChecker, sound.wall);
        item = processCollisions(item, IR, game, false);
        game.items[i] = item;

        const scoredTarget =
          item.y < 5 && goalChecker(item.x)
            ? 'cpu' // Player scores into Top goal
            : item.y > H - 5 && goalChecker(item.x)
              ? 'player'
              : null; // CPU scores into Bottom goal

        if (scoredTarget) {
          const itemEffect = applyItemEffect(game, item, scoredTarget, now);
          if (itemEffect.pucks) game.pucks = itemEffect.pucks;
          if (itemEffect.effects) game.effects = itemEffect.effects;
          if (itemEffect.flash) game.flash = itemEffect.flash;
          sound.item();
          game.items.splice(i, 1);
        }
      }

      let scored: 'player' | 'cpu' | null = null;
      let scoredIndex = -1;

      for (let i = 0; i < game.pucks.length; i++) {
        let puck = game.pucks[i];
        const playerSpeedActive =
          game.effects.player.speed &&
          now - game.effects.player.speed.start < game.effects.player.speed.duration;
        const cpuSpeedActive =
          game.effects.cpu.speed &&
          now - game.effects.cpu.speed.start < game.effects.cpu.speed.duration;

        let speedMultiplier = 1;
        if (playerSpeedActive) speedMultiplier = puck.y > H / 2 ? 0.5 : 1.5;
        if (cpuSpeedActive) speedMultiplier = puck.y < H / 2 ? 0.5 : 1.5;

        puck.x += puck.vx * speedMultiplier;
        puck.y += puck.vy * speedMultiplier;

        if (!puck.visible) {
          puck.invisibleCount--;
          if (puck.invisibleCount <= 0) puck.visible = true;
        }

        puck = Physics.applyWallBounce(puck, BR, goalChecker, sound.wall);
        puck = processCollisions(puck, BR, game, true);
        puck = Physics.applyFriction(puck);
        game.pucks[i] = puck;

        if (scored === null) {
          if (puck.y < 5 && goalChecker(puck.x)) {
            scored = 'cpu';
            scoredIndex = i;
          } // 'cpu' means Player scored
          else if (puck.y > H - 5 && goalChecker(puck.x)) {
            scored = 'player';
            scoredIndex = i;
          } // 'player' means CPU scored
        }
      }

      if (scoredIndex >= 0) {
        game.pucks.splice(scoredIndex, 1);
      }

      if (game.pucks.length === 0) {
        game.pucks.push(
          EntityFactory.createPuck(
            W / 2,
            H / 2,
            randomRange(-0.5, 0.5),
            scored === 'cpu' ? -1.5 : 1.5
          )
        );
      }

      Renderer.clear(ctx);
      Renderer.drawField(ctx, field);
      Renderer.drawEffectZones(ctx, game.effects, now);
      game.items.forEach((item: Item) => Renderer.drawItem(ctx, item, now));
      game.pucks.forEach((puck: Puck) => Renderer.drawPuck(ctx, puck));
      Renderer.drawMallet(ctx, game.cpu, '#e74c3c', false);
      Renderer.drawMallet(ctx, game.player, '#3498db', game.effects.player.invisible > 0);
      Renderer.drawHUD(ctx, game.effects, now);
      Renderer.drawFlash(ctx, game.flash, now);

      if (showHelp) {
        Renderer.drawHelp(ctx);
      }

      if (scored) {
        const key = scored === 'cpu' ? 'p' : 'c';
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        scoreRef.current[key]++;
        setScores({ ...scoreRef.current });

        if (scored === 'cpu') {
          sound.goal();
        } else {
          sound.lose();
        }
        game.goalEffect = { scorer: scored, time: now };

        if (scoreRef.current.p >= winScore) {
          setTimeout(() => {
            setWinner('player');
            setScreen('result');
          }, CONSTANTS.TIMING.GOAL_EFFECT);
          return;
        }
        if (scoreRef.current.c >= winScore) {
          setTimeout(() => {
            setWinner('cpu');
            setScreen('result');
          }, CONSTANTS.TIMING.GOAL_EFFECT);
          return;
        }
      }

      animationRef = requestAnimationFrame(gameLoop);
    };

    animationRef = requestAnimationFrame(gameLoop);
    return () => cancelAnimationFrame(animationRef);
  }, [screen, diff, field, winScore, showHelp, getSound]);

  return (
    <PageContainer>
      {screen === 'menu' && (
        <MenuCard>
          <GameTitle>🏒 Air Hockey</GameTitle>

          <OptionContainer>
            <OptionTitle>Difficulty</OptionTitle>
            <ButtonGroup>
              {DIFFICULTY_OPTIONS.map(d => (
                <ModeButton key={d} onClick={() => setDiff(d)} $selected={diff === d}>
                  {DIFFICULTY_LABELS[d]}
                </ModeButton>
              ))}
            </ButtonGroup>
          </OptionContainer>

          <OptionContainer>
            <OptionTitle>Field</OptionTitle>
            <ButtonGroup>
              {FIELDS.map(f => (
                <ModeButton key={f.id} onClick={() => setField(f)} $selected={field.id === f.id}>
                  {f.name}
                </ModeButton>
              ))}
            </ButtonGroup>
          </OptionContainer>

          <OptionContainer>
            <OptionTitle>Win Score</OptionTitle>
            <ButtonGroup>
              {WIN_SCORE_OPTIONS.map(s => (
                <ModeButton key={s} onClick={() => setWinScore(s)} $selected={winScore === s}>
                  {s}
                </ModeButton>
              ))}
            </ButtonGroup>
          </OptionContainer>

          <StartButton onClick={startGame}>START</StartButton>
          <div style={{ marginTop: '1rem', color: 'var(--accent-color)', fontWeight: 'bold' }}>
            Best Margin: {highScore > 0 ? '+' + highScore : highScore}
          </div>
        </MenuCard>
      )}

      {screen === 'game' && (
        <>
          <ScoreBoard>
            <ScoreText $color="#e74c3c">CPU: {scores.c}</ScoreText>
            <MenuButton onClick={() => setScreen('menu')}>Menu</MenuButton>
            <ScoreText $color="#3498db">YOU: {scores.p}</ScoreText>
          </ScoreBoard>
          <GameCanvas
            ref={canvasRef}
            width={W}
            height={H}
            onMouseMove={handleInput}
            onMouseDown={handleInput}
            onTouchMove={handleInput}
            onTouchStart={handleInput}
            role="img"
            aria-label="エアホッケーゲーム画面"
            tabIndex={0}
          />
        </>
      )}

      {screen === 'result' && (
        <MenuCard>
          <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>
            {winner === 'player' ? '🎉' : '😢'}
          </div>
          <GameTitle style={{ color: winner === 'player' ? 'var(--accent-color)' : '#ff4444' }}>
            {winner === 'player' ? 'YOU WIN!' : 'YOU LOSE'}
          </GameTitle>
          <p style={{ fontSize: '2rem', color: 'white', fontWeight: 'bold', marginBottom: '20px' }}>
            {scores.p} - {scores.c}
          </p>
          <div style={{ marginBottom: '1.5rem' }}>
            <ShareButton
              text={`Air Hockeyで${winner === 'player' ? '勝利' : '敗北'}！ スコア: ${scores.p} - ${scores.c}`}
              hashtags={['AirHockey', 'GamePlatform']}
            />
          </div>
          <StartButton onClick={() => setScreen('menu')}>BACK TO MENU</StartButton>
        </MenuCard>
      )}
    </PageContainer>
  );
};

export default AirHockeyPage;
