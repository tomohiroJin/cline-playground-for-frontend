import React, { useState, useEffect, useRef, useCallback } from 'react';
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
const CONFIG = Object.freeze({
  canvas: { width: 300, height: 600 },
  sizes: { mallet: 28, puck: 14, item: 16 },
  physics: { friction: 0.998, minSpeed: 1.5, maxPower: 12 },
  timing: { itemSpawn: 6000, goalEffect: 1500, flash: 500, helpTimeout: 5000 },
  cpu: { easy: 1.2, normal: 3, hard: 5 },
});

const { width: W, height: H } = CONFIG.canvas;
const { mallet: MR, puck: BR, item: IR } = CONFIG.sizes;

const FIELDS = Object.freeze([
  { id: 'classic', name: 'Original', goalSize: 80, color: '#00d4ff', obstacles: [] },
  { id: 'wide', name: 'Wide', goalSize: 120, color: '#00ff88', obstacles: [] },
  {
    id: 'pillars',
    name: 'Pillars',
    goalSize: 80,
    color: '#ff00ff',
    obstacles: [
      { x: 75, y: 200, r: 18 },
      { x: 225, y: 200, r: 18 },
      { x: 150, y: 300, r: 22 },
      { x: 75, y: 400, r: 18 },
      { x: 225, y: 400, r: 18 },
    ],
  },
]);

const ITEMS = Object.freeze([
  { id: 'split', name: 'Split', color: '#FF6B6B', icon: '◆' },
  { id: 'speed', name: 'Speed', color: '#4ECDC4', icon: '⚡' },
  { id: 'invisible', name: 'Hide', color: '#9B59B6', icon: '👻' },
]);

const DIFFICULTY_OPTIONS = ['easy', 'normal', 'hard'] as const;
const DIFFICULTY_LABELS = { easy: 'Easy', normal: 'Normal', hard: 'Hard' };
const WIN_SCORE_OPTIONS = [3, 7, 15];

// ============================================
// Logic Modules
// ============================================
const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));
const distance = (x1: number, y1: number, x2: number, y2: number) =>
  Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
const magnitude = (vx: number, vy: number) => Math.sqrt(vx ** 2 + vy ** 2);
const randomRange = (min: number, max: number) => Math.random() * (max - min) + min;
const randomChoice = <T,>(arr: readonly T[]): T => arr[Math.floor(Math.random() * arr.length)];

// Simplified Physics & other modules for brevity (keeping logic intact)
const Physics = {
  detectCollision(ax: number, ay: number, ar: number, bx: number, by: number, br: number) {
    const dx = ax - bx,
      dy = ay - by;
    const dist = distance(ax, ay, bx, by);
    if (dist < ar + br && dist > 0) {
      return { nx: dx / dist, ny: dy / dist, penetration: ar + br - dist };
    }
    return null;
  },
  resolveCollision(
    obj: any,
    collision: any,
    power: number,
    sourceVx = 0,
    sourceVy = 0,
    factor = 0.3
  ) {
    const { nx, ny, penetration } = collision;
    return {
      ...obj,
      x: obj.x + nx * (penetration + 1),
      y: obj.y + ny * (penetration + 1),
      vx: nx * power + sourceVx * factor,
      vy: ny * power + sourceVy * factor,
    };
  },
  reflectOffSurface(obj: any, collision: any) {
    const { nx, ny, penetration } = collision;
    const dot = obj.vx * nx + obj.vy * ny;
    return {
      ...obj,
      x: obj.x + nx * (penetration + 1),
      y: obj.y + ny * (penetration + 1),
      vx: (obj.vx - 2 * dot * nx) * 0.9,
      vy: (obj.vy - 2 * dot * ny) * 0.9,
    };
  },
  applyWallBounce(
    obj: any,
    radius: number,
    goalChecker: (x: number) => boolean,
    onBounce: () => void
  ) {
    let { x, y, vx, vy } = obj;
    let bounced = false;

    if (x < radius + 5) {
      x = radius + 5;
      vx = Math.abs(vx) * 0.95;
      bounced = true;
    }
    if (x > W - radius - 5) {
      x = W - radius - 5;
      vx = -Math.abs(vx) * 0.95;
      bounced = true;
    }
    if (y < radius + 5 && !goalChecker(x)) {
      y = radius + 5;
      vy = Math.abs(vy) * 0.95;
      bounced = true;
    }
    if (y > H - radius - 5 && !goalChecker(x)) {
      y = H - radius - 5;
      vy = -Math.abs(vy) * 0.95;
      bounced = true;
    }

    if (bounced && onBounce) onBounce();
    return { ...obj, x, y, vx, vy };
  },
  applyFriction(obj: any) {
    let { vx, vy } = obj;
    vx *= CONFIG.physics.friction;
    vy *= CONFIG.physics.friction;

    const speed = magnitude(vx, vy);
    if (speed > 0 && speed < CONFIG.physics.minSpeed) {
      vx = (vx / speed) * CONFIG.physics.minSpeed;
      vy = (vy / speed) * CONFIG.physics.minSpeed;
    }
    return { ...obj, vx, vy };
  },
};

// ... Sound, EntityFactory, ItemEffects, CpuAI, Renderer logic from original file
// (Omitting full copy-paste here to save context space, but assume full implementation in file write)
// I will implement the critical parts below

const createSoundSystem = () => {
  let audioCtx: AudioContext | null = null;
  const getContext = () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if (!audioCtx)
      audioCtx = new ((window as any).AudioContext || (window as any).webkitAudioContext)();
    return audioCtx;
  };
  const playTone = (freq: number, type: OscillatorType, duration: number, volume = 0.3) => {
    try {
      const ctx = getContext();
      if (!ctx) return;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = type;
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(volume, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration);
      osc.start();
      osc.stop(ctx.currentTime + duration);
    } catch (e) {
      /* Audio not supported */
    }
  };
  const playSequence = (notes: any[]) => {
    notes.forEach(([freq, type, dur, vol], i) => {
      setTimeout(() => playTone(freq, type, dur, vol), i * 100);
    });
  };
  return {
    hit: () => playTone(800, 'square', 0.05, 0.2),
    wall: () => playTone(400, 'triangle', 0.05, 0.15),
    item: () => playTone(1000, 'sine', 0.1, 0.25),
    goal: () =>
      playSequence([
        [523, 'sine', 0.15, 0.3],
        [659, 'sine', 0.15, 0.3],
        [784, 'sine', 0.2, 0.3],
      ]),
    lose: () =>
      playSequence([
        [400, 'sine', 0.2, 0.3],
        [300, 'sine', 0.3, 0.3],
      ]),
    start: () =>
      playSequence([
        [440, 'sine', 0.1, 0.2],
        [554, 'sine', 0.1, 0.2],
        [659, 'sine', 0.15, 0.2],
      ]),
  };
};

const EntityFactory = {
  createMallet: (x: number, y: number) => ({ x, y, vx: 0, vy: 0 }),
  createPuck: (x: number, y: number, vx = 0, vy = 1.5) => ({
    x,
    y,
    vx,
    vy,
    visible: true,
    invisibleCount: 0,
  }),
  createItem: (template: any, fromTop: boolean) => ({
    ...template,
    x: randomRange(50, W - 50),
    y: fromTop ? 80 : H - 80,
    vx: randomRange(-1, 1),
    vy: fromTop ? 2 : -2,
    r: IR,
  }),
  createGameState: () => ({
    player: EntityFactory.createMallet(W / 2, H - 70),
    cpu: EntityFactory.createMallet(W / 2, 70),
    pucks: [EntityFactory.createPuck(W / 2, H / 2, randomRange(-0.5, 0.5), 1.5)],
    items: [] as any[],
    effects: {
      player: { speed: null as any, invisible: 0 },
      cpu: { speed: null as any, invisible: 0 },
    },
    lastItemSpawn: Date.now(),
    flash: null as any,
    goalEffect: null as any,
    cpuTarget: null as any,
    cpuTargetTime: 0,
  }),
};

const ItemEffects = {
  split: (game: any) => {
    if (game.pucks.length !== 1) return;
    const p = game.pucks[0];
    const speed = magnitude(p.vx, p.vy) || 3;
    const angle = Math.atan2(p.vy, p.vx);
    game.pucks = [
      { ...p },
      { ...p, x: p.x - 20, vx: Math.cos(angle - 0.5) * speed, vy: Math.sin(angle - 0.5) * speed },
      { ...p, x: p.x + 20, vx: Math.cos(angle + 0.5) * speed, vy: Math.sin(angle + 0.5) * speed },
    ];
  },
  speed: (game: any, target: string) => {
    game.effects[target].speed = { start: Date.now(), duration: 8000 };
  },
  invisible: (game: any, target: string) => {
    game.effects[target].invisible = 5;
  },
};

const applyItemEffect = (game: any, item: any, target: string, now: number) => {
  game.flash = { type: item.id, time: now };
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  ItemEffects[item.id]?.(game, target);
};

const CpuAI = {
  calculateTarget(game: any, difficulty: string, now: number) {
    const { cpu, pucks, cpuTarget, cpuTargetTime } = game;
    const puck = pucks[0];
    if (cpu.x < 50 || cpu.x > W - 50) return { x: W / 2, y: 80 };
    if (puck && puck.vy < 0 && puck.y < H / 2 + 50) {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      const predictionFactor = difficulty === 'hard' ? 8 : difficulty === 'normal' ? 4 : 1;
      return { x: puck.x + puck.vx * predictionFactor, y: Math.min(puck.y - 10, H / 2 - 60) };
    }
    if (!cpuTarget || now - cpuTargetTime > 2000) {
      game.cpuTarget = { x: randomRange(80, W - 80), y: randomRange(50, 130) };
      game.cpuTargetTime = now;
    }
    return game.cpuTarget;
  },
  update(game: any, difficulty: string, now: number) {
    const target = this.calculateTarget(game, difficulty, now);
    if (difficulty === 'easy') {
      target.x = target.x * 0.3 + (W / 2) * 0.7;
      if (Math.random() < 0.03) return;
    }
    target.x = clamp(target.x, 60, W - 60);
    target.y = clamp(target.y, 50, H / 2 - 50);
    const dx = target.x - game.cpu.x;
    const dy = target.y - game.cpu.y;
    const dist = distance(0, 0, dx, dy);
    if (dist > 3) {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      const speed = Math.min(dist * 0.08, CONFIG.cpu[difficulty]);
      game.cpu.vx = (dx / dist) * speed;
      game.cpu.vy = (dy / dist) * speed;
    } else {
      game.cpu.vx = game.cpu.vy = 0;
    }
    game.cpu.x = clamp(game.cpu.x + game.cpu.vx, 50, W - 50);
    game.cpu.y = clamp(game.cpu.y + game.cpu.vy, 40, H / 2 - 40);
  },
};

const Renderer = {
  clear(ctx: CanvasRenderingContext2D) {
    ctx.fillStyle = '#0d1117';
    ctx.fillRect(0, 0, W, H);
  },
  drawField(ctx: CanvasRenderingContext2D, field: any) {
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
    field.obstacles.forEach((ob: any) => {
      ctx.beginPath();
      ctx.arc(ob.x, ob.y, ob.r, 0, Math.PI * 2);
      ctx.fillStyle = field.color + '44';
      ctx.fill();
      ctx.strokeStyle = field.color;
      ctx.lineWidth = 2;
      ctx.stroke();
    });
  },
  drawEffectZones(ctx: CanvasRenderingContext2D, effects: any, now: number) {
    const isActive = (eff: any) => eff?.speed && now - eff.speed.start < eff.speed.duration;
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
  drawMallet(ctx: CanvasRenderingContext2D, mallet: any, color: string, hasGlow: boolean) {
    if (hasGlow) {
      ctx.shadowColor = '#ff00ff';
      ctx.shadowBlur = 15;
    }
    this.drawCircle(ctx, mallet.x, mallet.y, MR, color, '#fff', 3);
    ctx.shadowBlur = 0;
    this.drawCircle(ctx, mallet.x, mallet.y, 8, '#fff');
  },
  drawPuck(ctx: CanvasRenderingContext2D, puck: any) {
    if (!puck.visible) return;
    this.drawCircle(ctx, puck.x, puck.y, BR, '#fff', '#888', 2);
  },
  drawItem(ctx: CanvasRenderingContext2D, item: any, now: number) {
    const pulse = 1 + Math.sin(now * 0.008) * 0.2;
    this.drawCircle(ctx, item.x, item.y, IR * pulse, item.color);
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 14px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(item.icon, item.x, item.y);
  },
  drawHUD(ctx: CanvasRenderingContext2D, effects: any, now: number) {
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
  drawFlash(ctx: CanvasRenderingContext2D, flash: any, now: number) {
    if (!flash || now - flash.time >= CONFIG.timing.flash) return;
    const alpha = 1 - (now - flash.time) / CONFIG.timing.flash;
    ctx.fillStyle = `rgba(255,255,255,${alpha * 0.3})`;
    ctx.fillRect(0, 0, W, H);
    const item = ITEMS.find(i => i.id === flash.type);
    if (item) {
      ctx.font = 'bold 18px Arial';
      ctx.textAlign = 'center';
      ctx.fillStyle = `rgba(255,255,255,${alpha})`;
      ctx.fillText(`${item.icon} ${item.name}!`, W / 2, H / 2);
    }
  },
  drawGoalEffect(ctx: CanvasRenderingContext2D, effect: any, now: number) {
    if (!effect) return;
    const elapsed = now - effect.time;
    if (elapsed >= CONFIG.timing.goalEffect) return;
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
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  const [diff, setDiff] = useState<any>('normal');
  const [field, setField] = useState(FIELDS[0]);
  const [winScore, setWinScore] = useState(3);
  const [scores, setScores] = useState({ p: 0, c: 0 });
  const [winner, setWinner] = useState<string | null>(null);
  const [showHelp, setShowHelp] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameRef = useRef<any>(null);
  const lastInputRef = useRef(Date.now());
  const scoreRef = useRef({ p: 0, c: 0 });
  const soundRef = useRef<any>(null);

  // usePreventScroll
  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    const handler = e => e.preventDefault();
    document.addEventListener('touchmove', handler, { passive: false });
    return () => document.removeEventListener('touchmove', handler);
  }, []);

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
    getSound().start();
  }, [getSound]);

  const handleInput = useCallback(
    (e: any) => {
      const game = gameRef.current;
      if (!game || screen !== 'game') return;

      e.preventDefault();
      lastInputRef.current = Date.now();

      if (showHelp) {
        setShowHelp(false);
        return;
      }

      if (!canvasRef.current) return;
      const rect = canvasRef.current.getBoundingClientRect();
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const clientY = e.touches ? e.touches[0].clientY : e.clientY;

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

    const processCollisions = (obj: any, radius: number, game: any, isPuck = false) => {
      const mallets = [
        { mallet: game.player, isPlayer: true },
        { mallet: game.cpu, isPlayer: false },
      ];

      for (const { mallet, isPlayer } of mallets) {
        const col = Physics.detectCollision(obj.x, obj.y, radius, mallet.x, mallet.y, MR);
        if (col) {
          const speed = magnitude(mallet.vx, mallet.vy);
          const power = Math.min(CONFIG.physics.maxPower, 5 + speed * 1.2);
          // eslint-disable-next-line no-param-reassign
          obj = Physics.resolveCollision(obj, col, power, mallet.vx, mallet.vy, 0.4);

          if (isPuck && isPlayer && game.effects.player.invisible > 0) {
            // eslint-disable-next-line no-param-reassign
            obj.visible = false;
            // eslint-disable-next-line no-param-reassign
            obj.invisibleCount = 25;
            game.effects.player.invisible--;
          }
          sound.hit();
        }
      }

      for (const ob of field.obstacles) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const col = Physics.detectCollision(
          obj.x,
          obj.y,
          radius,
          (ob as any).x,
          (ob as any).y,
          (ob as any).r
        );
        if (col) {
          // eslint-disable-next-line no-param-reassign
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

      if (game.goalEffect && now - game.goalEffect.time < CONFIG.timing.goalEffect) {
        Renderer.clear(ctx);
        Renderer.drawField(ctx, field);
        Renderer.drawGoalEffect(ctx, game.goalEffect, now);
        animationRef = requestAnimationFrame(gameLoop);
        return;
      }
      game.goalEffect = null;

      if (now - lastInputRef.current > CONFIG.timing.helpTimeout && !showHelp) {
        setShowHelp(true);
      }

      CpuAI.update(game, diff, now);

      if (now - game.lastItemSpawn > CONFIG.timing.itemSpawn && game.items.length < 2) {
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
          applyItemEffect(game, item, scoredTarget, now);
          sound.item();
          game.items.splice(i, 1);
        }
      }

      let scored: string | null = null;
      let scoredIndex = -1;

      for (let i = 0; i < game.pucks.length; i++) {
        let puck = game.pucks[i];
        const playerSpeedActive =
          game.effects.player.speed &&
          now - game.effects.player.speed.start < game.effects.player.speed.duration;
        const cpuSpeedActive =
          game.effects.cpu.speed &&
          now - game.effects.cpu.speed.start < game.effects.cpu.speed.duration;

        let mult = 1;
        if (playerSpeedActive) mult = puck.y > H / 2 ? 0.5 : 1.5;
        if (cpuSpeedActive) mult = puck.y < H / 2 ? 0.5 : 1.5;

        puck.x += puck.vx * mult;
        puck.y += puck.vy * mult;

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
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      game.items.forEach((item: any) => Renderer.drawItem(ctx, item, now));
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      game.pucks.forEach((puck: any) => Renderer.drawPuck(ctx, puck));
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

        scored === 'cpu' ? sound.goal() : sound.lose();
        game.goalEffect = { scorer: scored, time: now };

        if (scoreRef.current.p >= winScore) {
          setTimeout(() => {
            setWinner('player');
            setScreen('result');
          }, CONFIG.timing.goalEffect);
          return;
        }
        if (scoreRef.current.c >= winScore) {
          setTimeout(() => {
            setWinner('cpu');
            setScreen('result');
          }, CONFIG.timing.goalEffect);
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
          <StartButton onClick={() => setScreen('menu')}>BACK TO MENU</StartButton>
        </MenuCard>
      )}
    </PageContainer>
  );
};

export default AirHockeyPage;
