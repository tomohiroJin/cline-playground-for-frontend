import React, { useState, useEffect, useRef, useCallback } from 'react';

// ============================================
// Type Definitions
// ============================================
type Difficulty = 'easy' | 'normal' | 'hard';
type ScreenState = 'menu' | 'game' | 'result';
type Winner = 'player' | 'cpu' | null;

interface FieldConfig {
  id: string;
  name: string;
  goalSize: number;
  color: string;
  obstacles: { x: number; y: number; r: number }[];
}

interface Point {
  x: number;
  y: number;
}

interface Vector {
  vx: number;
  vy: number;
}

interface Entity extends Point, Vector {
  radius?: number;
}

interface Puck extends Entity {
  visible: boolean;
  invisibleCount: number;
}

interface Score {
  p: number;
  c: number;
}

interface CollisionResult {
  nx: number;
  ny: number;
  penetration: number;
}

interface Item {
  id: string;
  name: string;
  color: string;
  icon: string;
  x: number;
  y: number;
  r: number;
  vx: number;
  vy: number;
  active: boolean;
  type: string;
}

interface SoundEngine {
  start: () => void;
  hit: () => void;
  wall: () => void;
  item: () => void;
  goal: () => void;
  lose: () => void;
}

interface PlayerEffectState {
  speed: { start: number; duration: number } | null;
  invisible: number;
}

interface GameEffects {
  player: PlayerEffectState;
  cpu: PlayerEffectState;
}

interface GameState {
  player: Entity;
  cpu: Entity;
  pucks: Puck[];
  items: Item[];
  effects: GameEffects;
  flash: { type: string; time: number } | null;
  goalEffect: { scorer: string; time: number } | null;
  cpuTarget: Point | null;
  cpuTargetTime: number;
  lastItemSpawn: number;
}

// ============================================
// Constants - Single Source of Truth
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
  { id: 'classic', name: 'クラシック', goalSize: 80, color: '#00d4ff', obstacles: [] },
  { id: 'wide', name: 'ワイドゴール', goalSize: 120, color: '#00ff88', obstacles: [] },
  {
    id: 'pillars',
    name: 'ピラーズ',
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
  { id: 'split', name: '3分裂', color: '#FF6B6B', icon: '◆' },
  { id: 'speed', name: 'スピード', color: '#4ECDC4', icon: '⚡' },
  { id: 'invisible', name: '透明化', color: '#9B59B6', icon: '👻' },
]);

const DIFFICULTY_OPTIONS = ['easy', 'normal', 'hard'];
const DIFFICULTY_LABELS = { easy: '弱い', normal: '普通', hard: '強い' };
const WIN_SCORE_OPTIONS = [3, 7, 15];

// ============================================
// Pure Utility Functions
// ============================================
const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));
const distance = (x1: number, y1: number, x2: number, y2: number) =>
  Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
const magnitude = (vx: number, vy: number) => Math.sqrt(vx ** 2 + vy ** 2);
const randomRange = (min: number, max: number) => Math.random() * (max - min) + min;
const randomChoice = <T,>(arr: readonly T[]): T => arr[Math.floor(Math.random() * arr.length)];

// ============================================
// Physics Module - Single Responsibility
// ============================================
const Physics = {
  detectCollision(
    ax: number,
    ay: number,
    ar: number,
    bx: number,
    by: number,
    br: number
  ): CollisionResult | null {
    const dx = ax - bx,
      dy = ay - by;
    const dist = distance(ax, ay, bx, by);
    if (dist < ar + br && dist > 0) {
      return { nx: dx / dist, ny: dy / dist, penetration: ar + br - dist };
    }
    return null;
  },

  resolveCollision(
    obj: Entity,
    collision: CollisionResult,
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

  reflectOffSurface(obj: Entity, collision: CollisionResult) {
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
    obj: Entity,
    radius: number,
    goalChecker: (x: number) => boolean,
    onBounce?: () => void
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

  applyFriction(obj: Puck): Puck {
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

// ============================================
// Sound Module - Single Responsibility
// ============================================
const createSoundSystem = (): SoundEngine => {
  let audioCtx: AudioContext | null = null;

  const getContext = () => {
    if (!audioCtx) audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
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
    } catch {
      /* Audio not supported */
    }
  };

  const playSequence = (notes: [number, OscillatorType, number, number?][]) => {
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

// ============================================
// Entity Factories - Factory Pattern
// ============================================
const EntityFactory = {
  createMallet: (x: number, y: number): Entity => ({ x, y, vx: 0, vy: 0 }),

  createPuck: (x: number, y: number, vx = 0, vy = 1.5): Puck => ({
    x,
    y,
    vx,
    vy,
    visible: true,
    invisibleCount: 0,
  }),

  createItem: (template: Partial<Item>, fromTop: boolean): Item =>
    ({
      x: randomRange(50, W - 50),
      y: fromTop ? 80 : H - 80,
      vx: randomRange(-1, 1),
      vy: fromTop ? 2 : -2,
      r: IR,
      active: true,
      id: template.id!,
      icon: template.icon!,
      name: template.name!,
      type: template.id!,
      ...template,
    }) as Item,

  createGameState: (): GameState => ({
    player: EntityFactory.createMallet(W / 2, H - 70),
    cpu: EntityFactory.createMallet(W / 2, 70),
    pucks: [EntityFactory.createPuck(W / 2, H / 2, randomRange(-0.5, 0.5), 1.5)],
    items: [],
    effects: { player: { speed: null, invisible: 0 }, cpu: { speed: null, invisible: 0 } },
    lastItemSpawn: Date.now(),
    flash: null,
    goalEffect: null,
    cpuTarget: null,
    cpuTargetTime: 0,
  }),
};

// ============================================
// Item Effect Strategies - Strategy Pattern
// ============================================
const ItemEffects = {
  split: (game: GameState, target: 'player' | 'cpu') => {
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
  speed: (game: GameState, target: 'player' | 'cpu') => {
    game.effects[target].speed = { start: Date.now(), duration: 8000 };
  },
  invisible: (game: GameState, target: 'player' | 'cpu') => {
    game.effects[target].invisible = 5;
  },
};

const applyItemEffect = (game: GameState, item: Item, target: 'player' | 'cpu', now: number) => {
  game.flash = { type: item.id, time: now };
  ItemEffects[item.id as keyof typeof ItemEffects]?.(game, target);
};

// ============================================
// CPU AI Module - Single Responsibility
// ============================================
const CpuAI = {
  calculateTarget(game: GameState, difficulty: Difficulty, now: number): Point {
    const { cpu, pucks, cpuTarget, cpuTargetTime } = game;
    const puck = pucks[0];

    // 端に固まっていたら中央へ戻す
    if (cpu.x < 50 || cpu.x > W - 50) {
      return { x: W / 2, y: 80 };
    }

    // パックが向かってきている場合は迎撃
    if (puck && puck.vy < 0 && puck.y < H / 2 + 50) {
      const predictionFactor = difficulty === 'hard' ? 8 : difficulty === 'normal' ? 4 : 1;
      return {
        x: puck.x + puck.vx * predictionFactor,
        y: Math.min(puck.y - 10, H / 2 - 60),
      };
    }

    // 待機中はランダム巡回
    if (!cpuTarget || now - cpuTargetTime > 2000) {
      game.cpuTarget = { x: randomRange(80, W - 80), y: randomRange(50, 130) };
      game.cpuTargetTime = now;
    }
    // cpuTarget is Point | null, but logic ensures it returns Point?
    // If cpuTarget is null, the if block above sets it.
    // So it should be non-null here.
    return game.cpuTarget!;
  },

  update(game: GameState, difficulty: Difficulty, now: number) {
    const target = this.calculateTarget(game, difficulty, now);

    // 弱い難易度は反応を鈍くする
    if (difficulty === 'easy') {
      target.x = target.x * 0.3 + (W / 2) * 0.7;
      if (Math.random() < 0.03) return; // たまに動かない
    }

    target.x = clamp(target.x, 60, W - 60);
    target.y = clamp(target.y, 50, H / 2 - 50);

    const dx = target.x - game.cpu.x;
    const dy = target.y - game.cpu.y;
    const dist = distance(0, 0, dx, dy);

    if (dist > 3) {
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

// ============================================
// Renderer Module - Single Responsibility
// ============================================
const Renderer = {
  clear(ctx: CanvasRenderingContext2D) {
    ctx.fillStyle = '#0d1117';
    ctx.fillRect(0, 0, W, H);
  },

  drawField(ctx: CanvasRenderingContext2D, field: FieldConfig) {
    // Border
    ctx.strokeStyle = field.color;
    ctx.lineWidth = 5;
    ctx.shadowColor = field.color;
    ctx.shadowBlur = 10;
    ctx.strokeRect(5, 5, W - 10, H - 10);
    ctx.shadowBlur = 0;

    // Center line
    ctx.strokeStyle = field.color + '55';
    ctx.setLineDash([8, 8]);
    ctx.beginPath();
    ctx.moveTo(10, H / 2);
    ctx.lineTo(W - 10, H / 2);
    ctx.stroke();
    ctx.setLineDash([]);

    // Center circle
    ctx.beginPath();
    ctx.arc(W / 2, H / 2, 40, 0, Math.PI * 2);
    ctx.stroke();

    // Goals
    const gs = field.goalSize;
    ctx.shadowBlur = 15;
    ctx.shadowColor = '#ff0000';
    ctx.fillStyle = '#ff3333';
    ctx.fillRect(W / 2 - gs / 2, 0, gs, 8);
    ctx.shadowColor = '#00ffff';
    ctx.fillStyle = '#33ffff';
    ctx.fillRect(W / 2 - gs / 2, H - 8, gs, 8);
    ctx.shadowBlur = 0;

    // Obstacles
    field.obstacles.forEach(ob => {
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
    const isActive = (eff: PlayerEffectState) =>
      eff?.speed && now - eff.speed.start < eff.speed.duration;
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

  drawMallet(ctx: CanvasRenderingContext2D, mallet: Entity, color: string, hasGlow?: boolean) {
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
      ctx.fillText(`⚡${remaining}秒`, W / 2, H - 25);
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

  drawGoalEffect(
    ctx: CanvasRenderingContext2D,
    effect: { scorer: string; time: number } | null,
    now: number
  ) {
    if (!effect) return;
    const elapsed = now - effect.time;
    if (elapsed >= CONFIG.timing.goalEffect) return;

    const isPlayerGoal = effect.scorer === 'cpu';
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
    ctx.fillText(isPlayerGoal ? '🎉 +1点！' : '😢 -1点', W / 2, textY + 40);
    ctx.shadowBlur = 0;

    if (isPlayerGoal) {
      for (let i = 0; i < 8; i++) {
        const angle = (i / 8) * Math.PI * 2 + elapsed * 0.003;
        const dist = 50 + elapsed * 0.05;
        this.drawCircle(
          ctx,
          W / 2 + Math.cos(angle) * dist,
          H / 2 + Math.sin(angle) * dist,
          5,
          `rgba(0,255,255,${Math.max(0, 1 - elapsed / 1500)})`
        );
      }
    }
  },

  drawHelp(ctx: CanvasRenderingContext2D) {
    ctx.fillStyle = 'rgba(0,0,0,0.9)';
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = '#fff';
    ctx.textAlign = 'center';
    ctx.font = 'bold 18px Arial';
    ctx.fillText('🎮 遊び方', W / 2, 40);
    ctx.font = '13px Arial';
    ctx.fillText('マレットでパックを打ち返せ！', W / 2, 70);
    ctx.font = 'bold 14px Arial';
    ctx.fillText('◆3分裂 ⚡スピード 👻透明化', W / 2, 110);
    ctx.font = '12px Arial';
    ctx.fillText('アイテムを相手ゴールへ！', W / 2, 140);
    ctx.fillStyle = '#888';
    ctx.fillText('タッチで再開', W / 2, H - 20);
  },
};

// ============================================
// UI Components - Composition
// ============================================
const Button: React.FC<{
  onClick: () => void;
  selected: boolean;
  children: React.ReactNode;
  className?: string;
}> = ({ onClick, selected, children, className = '' }) => (
  <button
    onClick={onClick}
    className={`py-2 rounded text-white text-sm ${selected ? 'bg-cyan-500' : 'bg-gray-700'} ${className}`}
  >
    {children}
  </button>
);

const OptionGroup: React.FC<{
  title: string;
  children: React.ReactNode;
}> = ({ title, children }) => (
  <div className="bg-gray-800 rounded p-3 mb-3 w-72">
    <p className="text-white text-sm mb-2 text-center">{title}</p>
    <div className="flex gap-2">{children}</div>
  </div>
);

const MenuScreen: React.FC<{
  diff: Difficulty;
  setDiff: (d: Difficulty) => void;
  field: FieldConfig;
  setField: (f: FieldConfig) => void;
  winScore: number;
  setWinScore: (s: number) => void;
  onStart: () => void;
}> = ({ diff, setDiff, field, setField, winScore, setWinScore, onStart }) => (
  <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 p-4">
    <h1 className="text-2xl font-bold text-cyan-400 mb-5">🏒 エアホッケー</h1>

    <OptionGroup title="難易度">
      {DIFFICULTY_OPTIONS.map(d => (
        <Button
          key={d}
          onClick={() => setDiff(d as Difficulty)}
          selected={diff === d}
          className="flex-1"
        >
          {DIFFICULTY_LABELS[d as keyof typeof DIFFICULTY_LABELS]}
        </Button>
      ))}
    </OptionGroup>

    <OptionGroup title="フィールド">
      {FIELDS.map(f => (
        <Button
          key={f.id}
          onClick={() => setField(f)}
          selected={field.id === f.id}
          className="flex-1"
        >
          {f.name}
        </Button>
      ))}
    </OptionGroup>

    <OptionGroup title="勝利点数">
      {WIN_SCORE_OPTIONS.map(s => (
        <Button key={s} onClick={() => setWinScore(s)} selected={winScore === s} className="flex-1">
          {s}点
        </Button>
      ))}
    </OptionGroup>

    <button
      onClick={onStart}
      className="bg-cyan-500 text-white font-bold py-3 px-10 rounded-full text-lg"
    >
      スタート
    </button>
  </div>
);

const ResultScreen: React.FC<{
  winner: Winner;
  scores: Score;
  onMenu: () => void;
}> = ({ winner, scores, onMenu }) => (
  <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 p-4">
    <div className="text-6xl mb-4">{winner === 'player' ? '🎉' : '😢'}</div>
    <h1
      className={`text-4xl font-bold mb-4 ${winner === 'player' ? 'text-cyan-400' : 'text-red-400'}`}
    >
      {winner === 'player' ? 'YOU WIN!' : 'YOU LOSE'}
    </h1>
    <p className="text-2xl text-white mb-6">
      {scores.p} - {scores.c}
    </p>
    {winner === 'player' && (
      <div className="flex gap-2 mb-4">
        {[0, 1, 2, 3, 4].map(i => (
          <span
            key={i}
            className="text-3xl animate-bounce"
            style={{ animationDelay: `${i * 0.1}s` }}
          >
            ⭐
          </span>
        ))}
      </div>
    )}
    <button onClick={onMenu} className="bg-cyan-500 text-white py-3 px-8 rounded-full text-lg">
      メニュー
    </button>
  </div>
);

const GameScreen: React.FC<{
  scores: Score;
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  onMove: (e: React.MouseEvent | React.TouchEvent) => void;
  onDown: (e: React.MouseEvent | React.TouchEvent) => void;
  onMenu: () => void;
}> = ({ scores, canvasRef, onMove, onDown, onMenu }) => (
  <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 p-2">
    <div className="flex justify-between w-full max-w-xs mb-2">
      <span className="text-red-400 font-bold text-lg">CPU: {scores.c}</span>
      <button onClick={onMenu} className="text-gray-500 text-sm">
        メニュー
      </button>
      <span className="text-cyan-400 font-bold text-lg">YOU: {scores.p}</span>
    </div>
    <canvas
      ref={canvasRef}
      width={W}
      height={H}
      className="rounded-lg touch-none border-2 border-cyan-600"
      style={{ maxWidth: '100%', maxHeight: 'calc(100vh - 70px)' }}
      onMouseMove={onMove}
      onMouseDown={onDown}
      onTouchMove={onMove}
      onTouchStart={onDown}
    />
  </div>
);

// ============================================
// Custom Hooks - Separation of Concerns
// ============================================
const usePreventScroll = () => {
  useEffect(() => {
    const handler = (e: Event) => e.preventDefault();
    document.addEventListener('touchmove', handler, { passive: false });
    return () => document.removeEventListener('touchmove', handler);
  }, []);
};

// ============================================
// Main Component - Orchestration
// ============================================
export default function AirHockey() {
  const [screen, setScreen] = useState<ScreenState>('menu');
  const [diff, setDiff] = useState<Difficulty>('normal');
  const [field, setField] = useState<FieldConfig>(FIELDS[0]);
  const [winScore, setWinScore] = useState(7);
  const [scores, setScores] = useState<Score>({ p: 0, c: 0 });
  const [winner, setWinner] = useState<Winner>(null);
  const [showHelp, setShowHelp] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameRef = useRef<GameState | null>(null);
  const lastInputRef = useRef<number>(0);
  useEffect(() => {
    lastInputRef.current = Date.now();
  }, []);
  const scoreRef = useRef<Score>({ p: 0, c: 0 });
  const soundRef = useRef<SoundEngine | null>(null);

  usePreventScroll();

  // Initialize sound system lazily
  const getSound = useCallback((): SoundEngine => {
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
    (e: React.MouseEvent | React.TouchEvent) => {
      const game = gameRef.current;
      if (!game || screen !== 'game' || !canvasRef.current) return;

      e.preventDefault();
      lastInputRef.current = Date.now();

      if (showHelp) {
        setShowHelp(false);
        return;
      }

      const rect = canvasRef.current.getBoundingClientRect();
      const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
      const clientY = 'touches' in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY;

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

    const processCollisions = (
      obj: Puck | Item,
      radius: number,
      game: GameState,
      isPuck = false
    ): Puck | Item => {
      const mallets = [
        { mallet: game.player, isPlayer: true },
        { mallet: game.cpu, isPlayer: false },
      ];

      for (const { mallet, isPlayer } of mallets) {
        const col = Physics.detectCollision(obj.x, obj.y, radius, mallet.x, mallet.y, MR);
        if (col) {
          const speed = magnitude(mallet.vx, mallet.vy);
          const power = Math.min(CONFIG.physics.maxPower, 5 + speed * 1.2);
          // resolveCollision returns Entity, but we need to preserve obj properties (Item/Puck).
          // Assuming resolveCollision just updates physics props and returns strict Entity structure is WRONG if we assign it back to obj.
          // We should cast it or trust it returns spread.
          // Physics.resolveCollision logic: return { ...obj, vx..., vy... }
          // So it is safe to cast back to typeof obj (Puck | Item).
          obj = Physics.resolveCollision(obj, col, power, mallet.vx, mallet.vy, 0.4) as Puck | Item;

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
          // reflectOffSurface returns Entity. Cast back.
          obj = Physics.reflectOffSurface(obj, col) as Puck | Item;
          sound.wall();
        }
      }

      return obj;
    };

    const gameLoop = () => {
      const game = gameRef.current;
      const ctx = canvasRef.current?.getContext('2d');
      if (!game || !ctx) {
        animationRef = requestAnimationFrame(gameLoop);
        return;
      }

      const now = Date.now();

      // ゴール演出中
      if (game.goalEffect && now - game.goalEffect.time < CONFIG.timing.goalEffect) {
        Renderer.clear(ctx);
        Renderer.drawField(ctx, field);
        Renderer.drawGoalEffect(ctx, game.goalEffect, now);
        animationRef = requestAnimationFrame(gameLoop);
        return;
      }
      game.goalEffect = null;

      // ヘルプ表示チェック
      if (now - lastInputRef.current > CONFIG.timing.helpTimeout && !showHelp) {
        setShowHelp(true);
      }

      // CPU AI更新
      CpuAI.update(game, diff, now);

      // アイテム生成
      if (now - game.lastItemSpawn > CONFIG.timing.itemSpawn && game.items.length < 2) {
        game.items.push(EntityFactory.createItem(randomChoice(ITEMS), Math.random() > 0.5));
        game.lastItemSpawn = now;
      }

      // アイテム更新
      for (let i = game.items.length - 1; i >= 0; i--) {
        let item = game.items[i];
        item.x += item.vx;
        item.y += item.vy;

        item = Physics.applyWallBounce(item, IR, goalChecker, sound.wall) as Item;
        item = processCollisions(item, IR, game, false) as Item;
        game.items[i] = item;

        // ゴール判定
        const scoredTarget =
          item.y < 5 && goalChecker(item.x)
            ? 'cpu'
            : item.y > H - 5 && goalChecker(item.x)
              ? 'player'
              : null;

        if (scoredTarget) {
          applyItemEffect(game, item, scoredTarget, now);
          sound.item();
          game.items.splice(i, 1);
        }
      }

      // パック更新
      let scored: Winner = null;
      let scoredIndex = -1;

      for (let i = 0; i < game.pucks.length; i++) {
        let puck = game.pucks[i];

        // スピード効果
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

        // 透明化カウントダウン
        if (!puck.visible) {
          puck.invisibleCount--;
          if (puck.invisibleCount <= 0) puck.visible = true;
        }

        puck = Physics.applyWallBounce(puck, BR, goalChecker, sound.wall) as Puck;
        puck = processCollisions(puck, BR, game, true) as Puck;
        puck = Physics.applyFriction(puck);
        game.pucks[i] = puck;

        // ゴール判定
        if (scored === null) {
          if (puck.y < 5 && goalChecker(puck.x)) {
            scored = 'cpu';
            scoredIndex = i;
          } else if (puck.y > H - 5 && goalChecker(puck.x)) {
            scored = 'player';
            scoredIndex = i;
          }
        }
      }

      // ゴールしたパックのみ削除
      if (scoredIndex >= 0) {
        game.pucks.splice(scoredIndex, 1);
      }

      // パックがなくなったら追加
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

      // 描画
      Renderer.clear(ctx);
      Renderer.drawField(ctx, field);
      Renderer.drawEffectZones(ctx, game.effects, now);
      game.items.forEach(item => Renderer.drawItem(ctx, item, now));
      game.pucks.forEach(puck => Renderer.drawPuck(ctx, puck));
      Renderer.drawMallet(ctx, game.cpu, '#e74c3c', false);
      Renderer.drawMallet(ctx, game.player, '#3498db', game.effects.player.invisible > 0);
      Renderer.drawHUD(ctx, game.effects, now);
      Renderer.drawFlash(ctx, game.flash, now);

      if (showHelp) {
        Renderer.drawHelp(ctx);
      }

      // 得点処理
      if (scored) {
        const key = scored === 'cpu' ? 'p' : 'c';
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

    let animationRef = requestAnimationFrame(gameLoop);
    return () => cancelAnimationFrame(animationRef);
  }, [screen, diff, field, winScore, showHelp, getSound]);

  // Screen Router
  switch (screen) {
    case 'menu':
      return (
        <MenuScreen
          diff={diff}
          setDiff={setDiff}
          field={field}
          setField={setField}
          winScore={winScore}
          setWinScore={setWinScore}
          onStart={startGame}
        />
      );
    case 'result':
      return <ResultScreen winner={winner} scores={scores} onMenu={() => setScreen('menu')} />;
    case 'game':
      return (
        <GameScreen
          scores={scores}
          canvasRef={canvasRef}
          onMove={handleInput}
          onDown={handleInput}
          onMenu={() => setScreen('menu')}
        />
      );
    default:
      return null;
  }
}
