/* eslint-disable react-hooks/refs */
// 注: このファイルではパフォーマンス最適化のため、ref経由でゲーム状態を管理しています
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { clamp, distance } from '../utils/math-utils';
import { saveScore, getHighScore } from '../utils/score-storage';
import { ShareButton } from '../components/molecules/ShareButton';
import {
  PageContainer,
  Canvas,
  Overlay,
  TitleContainer,
  TitleMain,
  TitleSub,
  TitleJapanese,
  MenuContainer,
  DiffButton,
  ButtonContent,
  ButtonInfo,
  StoryText,
  HUDContainer,
  HUDGroup,
  HUDPanel,
  BarContainer,
  BarFill,
  MinimapContainer,
  ControlsContainer,
  ControlBtn,
  ModalContent,
  MessageOverlay,
  DemoDots,
  DemoDot,
  HelpPanel,
  HelpGrid,
  KeyHelp,
} from './MazeHorrorPage.styles';

// ==================== CONFIG ====================
const CONFIG = {
  render: { fov: Math.PI / 3, rayCount: 100, maxDepth: 18, width: 900, height: 560 },
  player: { rotSpeed: 0.003, moveSpeed: 0.0024, radius: 0.2, sprintMult: 1.5 },
  hiding: { drainRate: 0.02, rechargeRate: 0.016, minEnergy: 5 },
  stamina: { drainRate: 0.022, rechargeRate: 0.014 },
  enemy: { chaseRange: 8, minSpawnDist: 5 },
  timing: { invinceDuration: 2500, msgDuration: 2000, trapPenalty: 12000 },
  score: { keyBase: 100, victoryBonus: 500, damagePenalty: 50 },
  difficulties: {
    EASY: {
      size: 9,
      keys: 2,
      traps: 1,
      time: 200,
      enemySpeed: 0.006,
      enemyCount: 1,
      lives: 5,
      label: '初級',
      gradient: 'easy',
    },
    NORMAL: {
      size: 11,
      keys: 3,
      traps: 2,
      time: 170,
      enemySpeed: 0.009,
      enemyCount: 2,
      lives: 3,
      label: '中級',
      gradient: 'normal',
    },
    HARD: {
      size: 14,
      keys: 4,
      traps: 3,
      time: 140,
      enemySpeed: 0.012,
      enemyCount: 3,
      lives: 2,
      label: '上級',
      gradient: 'hard',
    },
  },
} as const;

const CONTENT = {
  stories: {
    intro: [
      'ここは...どこだ...',
      '気がつくと、暗い迷宮の中にいた。',
      '「鍵」を見つけて脱出しろ。',
      '奴らに捕まるな...',
    ],
    victory: ['光が差し込む...脱出成功だ！', 'だが、迷宮は次の犠牲者を待っている...'],
    gameover: ['冷たい手に捕まった...', '意識が闇に飲まれる...', '【 GAME OVER 】'],
    timeout: ['時間切れだ...', '迷宮が崩れ落ちる...', '【 GAME OVER 】'],
  },
  items: {
    key: { emoji: '🔑', name: '鍵', color: '#ffdd00', bgColor: '#4a3800' },
    trap: { emoji: '📦', name: '？箱', color: '#ff8844', bgColor: '#4a2200' },
    exit: { emoji: '🚪', name: '出口', color: '#44ff88', bgColor: '#003a00' },
    exitLocked: { emoji: '🔒', name: '施錠中', color: '#888888', bgColor: '#333333' },
    enemy: { emoji: '👹', name: '敵', color: '#ff0044', bgColor: '#4a0020' },
  },
  sounds: {
    footstep: [90, 'triangle', 0.06],
    sprint: [120, 'triangle', 0.05],
    enemy: [42, 'sawtooth', 0.15],
    key: [988, 'sine', 0.3],
    trap: [110, 'square', 0.35],
    door: [660, 'sine', 0.25],
    hurt: [70, 'sawtooth', 0.45],
    heartbeat: [55, 'sine', 0.2],
  },
  demo: [
    {
      title: '🎯 ゲームの目的',
      items: ['鍵を全て集める', '出口から脱出する', '制限時間内にクリア'],
      icon: '🏆',
    },
    {
      title: '🔑 アイテム',
      items: ['🔑 鍵：出口を開ける', '📦 ？箱：罠かも...', '🚪 出口：脱出口'],
      icon: '📦',
    },
    {
      title: '👹 敵について',
      items: ['プレイヤーを追跡する', '触れるとダメージ', '⚠️で接近を察知'],
      icon: '⚠️',
    },
    {
      title: '🙈 隠れる',
      items: ['Spaceで隠れる', '敵に見つからない', '動けずゲージ消費'],
      icon: '👁️',
    },
    {
      title: '🏃 ダッシュ',
      items: ['Shiftで高速移動', '逃げる時に有効', 'スタミナ消費'],
      icon: '💨',
    },
  ],
} as const;

// ==================== TYPES ====================
type Difficulty = keyof typeof CONFIG.difficulties;
type EntityType = keyof typeof CONTENT.items;
type SoundName = keyof typeof CONTENT.sounds;

interface Entity {
  x: number;
  y: number;
}
interface Player extends Entity {
  angle: number;
  stamina: number;
}
interface Enemy extends Entity {
  dir: number;
  active: boolean;
  actTime: number;
  lastSeenX: number;
  lastSeenY: number;
}
interface Item extends Entity {
  type: EntityType;
  got: boolean;
}

interface Sprite extends Entity {
  type: string;
  emoji: string;
  name: string;
  color: string;
  bgColor: string;
  sc?: number;
  glow?: boolean;
  bob?: boolean;
  pulse?: boolean;
  isEnemy?: boolean;
}

interface GameState {
  maze: number[][];
  items: Item[];
  enemies: Enemy[];
  difficulty: Difficulty;
  player: Player;
  exit: Entity;
  keys: number;
  reqKeys: number;
  time: number;
  lives: number;
  maxLives: number;
  hiding: boolean;
  energy: number;
  invince: number;
  sprinting: boolean;
  eSpeed: number;
  gTime: number;
  lastT: number;
  timers: { footstep: number; enemySound: number; heartbeat: number };
  msg: string | null;
  msgTimer: number;
  score: number;
  combo: number;
  lastKeyTime: number;
  explored: Record<string, boolean>;
}

interface HUDData {
  keys: number;
  req: number;
  maxL: number;
  lives: number;
  stamina: number;
  time: number;
  score: number;
  eNear: number;
  hide: boolean;
  energy: number;
  highScore: number;
}

// ==================== UTILITIES ====================
const Utils = {
  clamp,
  dist: distance,
  manhattan: (x1: number, y1: number, x2: number, y2: number) =>
    Math.abs(x2 - x1) + Math.abs(y2 - y1),
  normAngle: (a: number) => {
    while (a > Math.PI) a -= Math.PI * 2;
    while (a < -Math.PI) a += Math.PI * 2;
    return a;
  },
  toHex: (n: number) => Math.floor(n).toString(16).padStart(2, '0').slice(-2),
  formatTime: (sec: number) => Math.floor(sec / 60) + ':' + String(sec % 60).padStart(2, '0'),
};

// ==================== SERVICES ====================
const MazeService = {
  create(size: number) {
    const maze = Array.from({ length: size }, () => Array(size).fill(1));
    const carve = (x: number, y: number) => {
      maze[y][x] = 0;
      [
        [0, -2],
        [2, 0],
        [0, 2],
        [-2, 0],
      ]
        .sort(() => Math.random() - 0.5)
        .forEach(([dx, dy]) => {
          const nx = x + dx,
            ny = y + dy;
          if (nx > 0 && nx < size - 1 && ny > 0 && ny < size - 1 && maze[ny][nx] === 1) {
            maze[y + dy / 2][x + dx / 2] = 0;
            carve(nx, ny);
          }
        });
    };
    carve(1, 1);
    return maze;
  },

  getEmptyCells(maze: number[][]) {
    const cells = [];
    for (let y = 1; y < maze.length - 1; y++)
      for (let x = 1; x < maze[0].length - 1; x++) if (maze[y][x] === 0) cells.push({ x, y });
    return cells.sort(() => Math.random() - 0.5);
  },

  isWalkable(maze: number[][], x: number, y: number) {
    const my = Math.floor(y),
      mx = Math.floor(x);
    return maze[my]?.[mx] === 0;
  },

  hasLineOfSight(maze: number[][], x1: number, y1: number, x2: number, y2: number) {
    const d = Utils.dist(x1, y1, x2, y2);
    const steps = Math.ceil(d * 10);
    for (let i = 1; i < steps; i++) {
      const t = i / steps;
      if (!this.isWalkable(maze, x1 + (x2 - x1) * t, y1 + (y2 - y1) * t)) return false;
    }
    return true;
  },
};

const AudioService = {
  ctx: null as AudioContext | null,

  play(type: SoundName, vol = 0.3) {
    try {
      if (!this.ctx)
        this.ctx = new (
          window.AudioContext ||
          (window as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
        )();
      const sound = CONTENT.sounds[type] || CONTENT.sounds.footstep;
      const [freq, wave, dur] = sound;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.frequency.value = freq + (Math.random() - 0.5) * 10;
      osc.type = wave;
      gain.gain.setValueAtTime(vol * 0.1, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + dur);
      osc.start();
      osc.stop(this.ctx.currentTime + dur);
    } catch {}
  },
};

const EntityFactory = {
  createPlayer: (x: number, y: number): Player => ({
    x: x + 0.5,
    y: y + 0.5,
    angle: 0,
    stamina: 100,
  }),
  createEnemy: (x: number, y: number, idx: number): Enemy => ({
    x: x + 0.5,
    y: y + 0.5,
    dir: Math.random() * Math.PI * 2,
    active: false,
    actTime: 4000 + idx * 2500,
    lastSeenX: -1,
    lastSeenY: -1,
  }),
  createItem: (x: number, y: number, type: EntityType): Item => ({ x, y, type, got: false }),
  createExit: (x: number, y: number): Entity => ({ x: x + 0.5, y: y + 0.5 }),
};

const GameStateFactory = {
  create(difficulty: Difficulty): GameState {
    const cfg = CONFIG.difficulties[difficulty];
    const maze = MazeService.create(cfg.size);
    const cells = MazeService.getEmptyCells(maze);

    const playerCell = cells.shift()!;
    const exitCell = cells.pop()!;
    const farCells = cells.filter(
      c => Utils.manhattan(c.x, c.y, playerCell.x, playerCell.y) >= CONFIG.enemy.minSpawnDist
    );

    const items = [
      ...cells.splice(0, cfg.keys).map(c => EntityFactory.createItem(c.x, c.y, 'key')),
      ...cells.splice(0, cfg.traps).map(c => EntityFactory.createItem(c.x, c.y, 'trap')),
    ];

    const enemies: Enemy[] = Array.from({ length: cfg.enemyCount }, (_, i) => {
      const c = farCells.shift() || cells.shift();
      return c ? EntityFactory.createEnemy(c.x, c.y, i) : null;
    }).filter((e): e is Enemy => e !== null);

    return {
      maze,
      items,
      enemies,
      difficulty,
      player: EntityFactory.createPlayer(playerCell.x, playerCell.y),
      exit: EntityFactory.createExit(exitCell.x, exitCell.y),
      keys: 0,
      reqKeys: cfg.keys,
      time: cfg.time * 1000,
      lives: cfg.lives,
      maxLives: cfg.lives,
      hiding: false,
      energy: 100,
      invince: 0,
      sprinting: false,
      eSpeed: cfg.enemySpeed,
      gTime: 0,
      lastT: performance.now(),
      timers: { footstep: 0, enemySound: 0, heartbeat: 0 },
      msg: null,
      msgTimer: 0,
      score: 0,
      combo: 0,
      lastKeyTime: 0,
      explored: { [`${playerCell.x},${playerCell.y}`]: true },
    };
  },
};

const GameLogic = {
  updateHiding(g: GameState, wantHide: boolean, dt: number) {
    if (wantHide && g.energy > CONFIG.hiding.minEnergy) {
      g.hiding = true;
      g.energy = Math.max(0, g.energy - dt * CONFIG.hiding.drainRate);
    } else {
      g.hiding = false;
      g.energy = Math.min(100, g.energy + dt * CONFIG.hiding.rechargeRate);
    }
  },

  updateSprinting(g: GameState, wantSprint: boolean, dt: number) {
    g.sprinting = wantSprint && !g.hiding && g.player.stamina > 5;
    const rate = g.sprinting ? -CONFIG.stamina.drainRate : CONFIG.stamina.rechargeRate;
    g.player.stamina = Utils.clamp(g.player.stamina + dt * rate, 0, 100);
  },

  updatePlayer(
    g: GameState,
    input: { left: boolean; right: boolean; forward: boolean; backward: boolean },
    dt: number
  ) {
    if (g.hiding) return false;

    const { rotSpeed, moveSpeed, radius, sprintMult } = CONFIG.player;
    const speed = moveSpeed * (g.sprinting ? sprintMult : 1);

    if (input.left) g.player.angle -= rotSpeed * dt;
    if (input.right) g.player.angle += rotSpeed * dt;

    let dx = 0,
      dy = 0,
      moved = false;
    if (input.forward) {
      dx = Math.cos(g.player.angle) * speed * dt;
      dy = Math.sin(g.player.angle) * speed * dt;
      moved = true;
    }
    if (input.backward) {
      dx = -Math.cos(g.player.angle) * speed * dt * 0.5;
      dy = -Math.sin(g.player.angle) * speed * dt * 0.5;
      moved = true;
    }

    if (MazeService.isWalkable(g.maze, g.player.x + dx + (dx > 0 ? radius : -radius), g.player.y))
      g.player.x += dx;
    if (MazeService.isWalkable(g.maze, g.player.x, g.player.y + dy + (dy > 0 ? radius : -radius)))
      g.player.y += dy;

    this.updateExplored(g);
    return moved;
  },

  updateExplored(g: GameState) {
    const px = Math.floor(g.player.x),
      py = Math.floor(g.player.y);
    for (let ox = -1; ox <= 1; ox++)
      for (let oy = -1; oy <= 1; oy++) g.explored[`${px + ox},${py + oy}`] = true;
  },

  updateItems(g: GameState) {
    for (const item of g.items) {
      if (item.got || Utils.dist(g.player.x, g.player.y, item.x + 0.5, item.y + 0.5) >= 0.5)
        continue;

      item.got = true;
      if (item.type === 'key') {
        g.combo = g.gTime - g.lastKeyTime < 10000 ? g.combo + 1 : 1;
        g.lastKeyTime = g.gTime;
        const bonus = CONFIG.score.keyBase * g.combo;
        g.keys++;
        g.score += bonus;
        g.msg = `🔑 鍵を入手！ +${bonus}pt (${g.keys}/${g.reqKeys})`;
        AudioService.play('key', 0.45);
      } else {
        g.time -= CONFIG.timing.trapPenalty;
        g.combo = 0;
        g.msg = '📦 罠だ！時間 -12秒！';
        AudioService.play('trap', 0.45);
      }
      g.msgTimer = CONFIG.timing.msgDuration;
    }
  },

  checkExit(g: GameState): keyof typeof CONTENT.stories | null {
    if (Utils.dist(g.player.x, g.player.y, g.exit.x, g.exit.y) >= 0.55) return null;

    if (g.keys >= g.reqKeys) {
      g.score += Math.floor(g.time / 100) + CONFIG.score.victoryBonus;
      AudioService.play('door', 0.5);
      return 'victory';
    }
    if (g.msgTimer <= 0) {
      g.msg = `🔒 鍵が足りない！ (${g.keys}/${g.reqKeys})`;
      g.msgTimer = 1500;
    }
    return null;
  },

  updateEnemy(g: GameState, e: Enemy, dt: number) {
    if (!e.active) {
      if (g.gTime >= e.actTime) e.active = true;
      return Infinity;
    }

    const d = Utils.dist(g.player.x, g.player.y, e.x, e.y);

    // Collision
    if (d < 0.45 && !g.hiding && g.invince <= 0) {
      g.lives--;
      g.invince = CONFIG.timing.invinceDuration;
      g.score = Math.max(0, g.score - CONFIG.score.damagePenalty);
      g.combo = 0;
      g.msg = '💔 ダメージ！';
      g.msgTimer = 1500;
      AudioService.play('hurt', 0.5);

      const edx = g.player.x - e.x,
        edy = g.player.y - e.y;
      e.x -= (edx / d) * 2.5;
      e.y -= (edy / d) * 2.5;
      e.dir += Math.PI;
    }

    // AI
    if (!g.hiding && d < CONFIG.enemy.chaseRange) {
      e.lastSeenX = g.player.x;
      e.lastSeenY = g.player.y;
      e.dir += Utils.normAngle(Math.atan2(g.player.y - e.y, g.player.x - e.x) - e.dir) * 0.045;
    } else if (e.lastSeenX > 0 && Utils.dist(e.x, e.y, e.lastSeenX, e.lastSeenY) > 1) {
      e.dir += Utils.normAngle(Math.atan2(e.lastSeenY - e.y, e.lastSeenX - e.x) - e.dir) * 0.025;
    } else {
      e.dir += (Math.random() - 0.5) * 0.055;
      e.lastSeenX = -1;
    }

    // Movement
    const nx = e.x + Math.cos(e.dir) * g.eSpeed * dt;
    const ny = e.y + Math.sin(e.dir) * g.eSpeed * dt;
    if (MazeService.isWalkable(g.maze, nx, ny)) {
      e.x = nx;
      e.y = ny;
    } else {
      e.dir += Math.PI * 0.5 + Math.random() * 0.5;
    }

    return d;
  },

  updateEnemies(g: GameState, dt: number) {
    let closest = 99;
    for (const e of g.enemies) {
      const d = this.updateEnemy(g, e, dt);
      if (d < closest) closest = d;
    }
    return closest;
  },

  updateSounds(g: GameState, closestEnemy: number, dt: number) {
    g.timers.enemySound -= dt;
    g.timers.heartbeat -= dt;

    if (closestEnemy < 10 && g.timers.enemySound <= 0) {
      AudioService.play('enemy', Math.max(0.05, 0.45 * (1 - closestEnemy / 10)));
      g.timers.enemySound = 400;
    }
    if (closestEnemy < 6 && g.timers.heartbeat <= 0) {
      AudioService.play('heartbeat', Math.max(0.08, 0.35 * (1 - closestEnemy / 6)));
      g.timers.heartbeat = Math.max(280, 750 * (closestEnemy / 6));
    }
  },

  updateFootstep(g: GameState, moved: boolean, dt: number) {
    g.timers.footstep -= dt;
    if (moved && g.timers.footstep <= 0) {
      AudioService.play(g.sprinting ? 'sprint' : 'footstep', g.sprinting ? 0.18 : 0.1);
      g.timers.footstep = g.sprinting ? 200 : 300;
    }
  },
};

const Renderer = {
  drawBackground(
    ctx: CanvasRenderingContext2D,
    g: GameState,
    W: number,
    H: number,
    danger: number
  ) {
    const r = Math.floor(8 + danger * 22),
      gr = Math.floor(8 - danger * 3),
      b = Math.floor(26 - danger * 11);
    ctx.fillStyle = g.hiding ? '#010106' : `rgb(${r},${gr},${b})`;
    ctx.fillRect(0, 0, W, H / 2);
    ctx.fillStyle = g.hiding ? '#080812' : '#181828';
    ctx.fillRect(0, H / 2, W, H / 2);
  },

  drawWalls(ctx: CanvasRenderingContext2D, g: GameState, W: number, H: number) {
    const { fov, rayCount, maxDepth } = CONFIG.render;
    const zBuf = [];

    for (let i = 0; i < rayCount; i++) {
      const ang = g.player.angle - fov / 2 + (i / rayCount) * fov;
      const cos = Math.cos(ang),
        sin = Math.sin(ang);
      let d = 0,
        hitX = 0,
        hitY = 0;

      while (d < maxDepth) {
        d += 0.04;
        hitX = g.player.x + cos * d;
        hitY = g.player.y + sin * d;
        if (!MazeService.isWalkable(g.maze, hitX, hitY)) break;
      }

      const corr = d * Math.cos(ang - g.player.angle);
      zBuf[i] = corr;
      const wH = Math.min(H * 1.8, H / corr);
      const shade = Math.max(0.05, 1 - corr / maxDepth);
      const texVar = (Math.sin((hitX + hitY) * 6) * 0.5 + 0.5) * 0.15;

      ctx.fillStyle = `rgb(${Math.floor((65 + texVar * 25) * shade)},${Math.floor((38 + texVar * 15) * shade)},${Math.floor((48 + texVar * 18) * shade)})`;
      ctx.fillRect(
        Math.floor(i * (W / rayCount)),
        Math.floor((H - wH) / 2),
        Math.ceil(W / rayCount) + 1,
        Math.ceil(wH)
      );
    }
    return zBuf;
  },

  getSprites(g: GameState) {
    const sprites: Sprite[] = g.items
      .filter(i => !i.got)
      .map(i => ({
        x: i.x + 0.5,
        y: i.y + 0.5,
        type: i.type,
        ...CONTENT.items[i.type],
        sc: 1.2,
        glow: true,
        bob: true,
      }));

    const exitType: EntityType = g.keys >= g.reqKeys ? 'exit' : 'exitLocked';
    sprites.push({
      x: g.exit.x,
      y: g.exit.y,
      type: exitType,
      ...CONTENT.items[exitType],
      sc: 1.5,
      glow: g.keys >= g.reqKeys,
      pulse: g.keys >= g.reqKeys,
    });

    g.enemies
      .filter(e => e.active)
      .forEach(e => {
        sprites.push({
          x: e.x,
          y: e.y,
          type: 'enemy',
          ...CONTENT.items.enemy,
          sc: 1.6,
          isEnemy: true,
          glow: true,
        });
      });

    return sprites.sort(
      (a, b) =>
        Utils.dist(b.x, b.y, g.player.x, g.player.y) - Utils.dist(a.x, a.y, g.player.x, g.player.y)
    );
  },

  drawSprite(
    ctx: CanvasRenderingContext2D,
    g: GameState,
    s: Sprite,
    W: number,
    H: number,
    zBuf: number[],
    time: number
  ) {
    const { fov, rayCount, maxDepth } = CONFIG.render;
    const d = Utils.dist(g.player.x, g.player.y, s.x, s.y);

    if (d < 0.2 || d > maxDepth) return;
    if (!MazeService.hasLineOfSight(g.maze, g.player.x, g.player.y, s.x, s.y)) return;

    const ang = Utils.normAngle(Math.atan2(s.y - g.player.y, s.x - g.player.x) - g.player.angle);
    if (Math.abs(ang) > fov / 2 + 0.2) return;

    const sx = W / 2 - (ang / fov) * W;
    const ri = Math.floor((sx / W) * rayCount);
    if (ri >= 0 && ri < rayCount && zBuf[ri] < d * 0.92) return;

    let sz = Math.min(350, (H / d) * 0.8 * (s.sc ?? 1));
    const alpha = s.isEnemy
      ? Utils.clamp(1.2 - d / 8, 0.5, 1)
      : Utils.clamp(1.1 - d / maxDepth, 0.4, 1);
    const offsetY = s.bob ? Math.sin(time * 4) * 6 : 0;
    if (s.pulse) sz *= 1 + Math.sin(time * 5) * 0.06;

    if (sz > 18) {
      ctx.beginPath();
      ctx.arc(sx, H / 2 + offsetY, sz * 0.675, 0, Math.PI * 2);
      ctx.fillStyle = s.bgColor + Utils.toHex(alpha * 200);
      ctx.fill();
      ctx.strokeStyle = s.color + Utils.toHex(alpha * 200);
      ctx.lineWidth = Math.max(2, sz / 18);
      ctx.stroke();
    }

    if (s.glow && sz > 22) {
      const glow = ctx.createRadialGradient(sx, H / 2 + offsetY, 0, sx, H / 2 + offsetY, sz);
      glow.addColorStop(0, s.color + '55');
      glow.addColorStop(0.35, s.color + '25');
      glow.addColorStop(1, 'transparent');
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(sx, H / 2 + offsetY, sz, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.globalAlpha = alpha;
    ctx.font = `${Math.floor(sz)}px Arial`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(s.emoji, sx, H / 2 + offsetY);

    if (d < 4.5 && sz > 32) {
      ctx.font = `bold ${Math.floor(Utils.clamp(sz / 3.5, 11, 22))}px sans-serif`;
      ctx.fillStyle = s.color;
      ctx.fillText(s.name, sx, H / 2 + offsetY + sz / 2 + 12);
    }
    ctx.globalAlpha = 1;
  },

  drawEffects(
    ctx: CanvasRenderingContext2D,
    g: GameState,
    W: number,
    H: number,
    danger: number,
    time: number
  ) {
    if (g.invince > 2000) {
      ctx.fillStyle = `rgba(255,0,0,${(0.4 * (g.invince - 2000)) / 500})`;
      ctx.fillRect(0, 0, W, H);
    }

    if (g.hiding) {
      const v = ctx.createRadialGradient(W / 2, H / 2, H * 0.1, W / 2, H / 2, H * 0.6);
      v.addColorStop(0, 'rgba(0,0,0,0)');
      v.addColorStop(0.6, 'rgba(0,0,40,0.55)');
      v.addColorStop(1, 'rgba(0,0,30,0.85)');
      ctx.fillStyle = v;
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = 'rgba(100,150,255,0.18)';
      ctx.font = 'bold 24px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('🙈 息を潜めている...', W / 2, 42);
    }

    if (danger > 0.45) {
      ctx.fillStyle = `rgba(255,0,0,${danger * (Math.sin(time * 8) * 0.5 + 0.5) * 0.12})`;
      ctx.fillRect(0, 0, W, H);
    }
  },

  drawCompass(ctx: CanvasRenderingContext2D, g: GameState, W: number, H: number) {
    if (g.keys < g.reqKeys) return;
    const exitAng = Utils.normAngle(
      Math.atan2(g.exit.y - g.player.y, g.exit.x - g.player.x) - g.player.angle
    );
    const exitDist = Utils.dist(g.player.x, g.player.y, g.exit.x, g.exit.y);
    if (exitDist <= 2) return;

    const arrowX = W / 2 + Math.sin(exitAng) * 70;
    ctx.fillStyle = 'rgba(68,255,136,0.75)';
    ctx.font = '18px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('🚪', arrowX, H - 45);
    ctx.font = '11px sans-serif';
    ctx.fillText(`${Math.floor(exitDist)}m`, arrowX, H - 28);
  },

  render(ctx: CanvasRenderingContext2D, g: GameState, W: number, H: number, closestEnemy: number) {
    const time = g.gTime / 1000;
    const danger = Utils.clamp(1 - closestEnemy / 8, 0, 1);

    this.drawBackground(ctx, g, W, H, danger);
    const zBuf = this.drawWalls(ctx, g, W, H);
    this.getSprites(g).forEach(s => this.drawSprite(ctx, g, s, W, H, zBuf, time));
    this.drawEffects(ctx, g, W, H, danger, time);
    this.drawCompass(ctx, g, W, H);
  },
};

// ==================== COMPONENTS ====================

const Story: React.FC<{
  type: keyof typeof CONTENT.stories;
  onDone: () => void;
  score?: number;
  time?: number;
  highScore?: number;
}> = ({ type, onDone, score, time, highScore }) => {
  const [idx, setIdx] = useState(0);
  const [ready, setReady] = useState(false);
  const lines = CONTENT.stories[type] || CONTENT.stories.intro;

  useEffect(() => {
    const t = setTimeout(
      () => (idx < lines.length - 1 ? setIdx(i => i + 1) : setReady(true)),
      1800
    );
    return () => clearTimeout(t);
  }, [idx, lines.length]);

  return (
    <Overlay>
      <div style={{ maxWidth: '36rem', textAlign: 'center', padding: '0 2rem' }}>
        {lines.slice(0, idx + 1).map((text, i) => (
          <StoryText key={i} $active={i === idx}>
            {text}
          </StoryText>
        ))}
      </div>

      {type !== 'intro' && ready && (
        <ModalContent style={{ marginTop: '1.5rem', width: '100%', maxWidth: '32rem' }}>
          <h3
            style={{
              color: type === 'victory' ? '#facc15' : '#ef4444',
              fontSize: '1.25rem',
              fontWeight: 'bold',
              marginBottom: '1rem',
            }}
          >
            {type === 'victory' ? '🏆 クリア結果' : '💀 結果'}
          </h3>
          <div
            style={{
              display: 'flex',
              gap: '2rem',
              color: 'white',
              justifyContent: 'center',
              marginBottom: '1rem',
            }}
          >
            <div style={{ textAlign: 'center' }}>
              <div
                style={{
                  fontSize: '1.875rem',
                  fontWeight: 'bold',
                  color: type === 'victory' ? '#facc15' : 'white',
                }}
              >
                {(score || 0).toLocaleString()}
              </div>
              <div style={{ fontSize: '0.875rem', color: '#9ca3af' }}>スコア</div>
            </div>
            {type === 'victory' && (
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '1.875rem', fontWeight: 'bold', color: '#22d3ee' }}>
                  {time || 0}秒
                </div>
                <div style={{ fontSize: '0.875rem', color: '#9ca3af' }}>クリアタイム</div>
              </div>
            )}
          </div>
          {highScore !== undefined && (
            <div style={{ color: '#fbbf24', fontSize: '1rem', marginBottom: '1rem' }}>
              HIGH SCORE: {highScore.toLocaleString()}
            </div>
          )}
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <ShareButton
              text={`Maze Horrorを${type === 'victory' ? 'クリア！' : 'プレイ！'} スコア: ${score}点`}
              hashtags={['MazeHorror', 'GamePlatform']}
            />
          </div>
        </ModalContent>
      )}

      <div style={{ position: 'absolute', bottom: '2.5rem', display: 'flex', gap: '1rem' }}>
        <ControlBtn onClick={onDone} style={{ width: 'auto', padding: '0.75rem 1.5rem' }}>
          スキップ
        </ControlBtn>
        {ready && (
          <ControlBtn
            onClick={onDone}
            style={{
              width: 'auto',
              padding: '0.75rem 2rem',
              backgroundColor: '#b91c1c',
              borderColor: '#ef4444',
            }}
          >
            {type === 'intro' ? '🎮 ゲーム開始' : '🏠 タイトルへ'}
          </ControlBtn>
        )}
      </div>
    </Overlay>
  );
};

const Title: React.FC<{
  onStart: (d: Difficulty) => void;
  highScores: Record<string, number>;
}> = ({ onStart, highScores }) => {
  const [demoIdx, setDemoIdx] = useState(-1);
  const [demoActive, setDemoActive] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => {
      setDemoActive(true);
      setDemoIdx(0);
    }, 4000);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (!demoActive || demoIdx < 0) return;
    const t = setTimeout(() => setDemoIdx((demoIdx + 1) % CONTENT.demo.length), 4500);
    return () => clearTimeout(t);
  }, [demoActive, demoIdx]);

  const closeDemo = useCallback(() => {
    if (demoActive) {
      setDemoActive(false);
      setDemoIdx(-1);
    }
  }, [demoActive]);

  useEffect(() => {
    ['keydown', 'mousedown', 'touchstart'].forEach(e => window.addEventListener(e, closeDemo));
    return () =>
      ['keydown', 'mousedown', 'touchstart'].forEach(e => window.removeEventListener(e, closeDemo));
  }, [closeDemo]);

  const currentSlide = demoActive && demoIdx >= 0 ? CONTENT.demo[demoIdx] : null;

  return (
    <PageContainer>
      <div style={{ position: 'absolute', inset: 0, opacity: 0.2, pointerEvents: 'none' }}>
        <div
          style={{
            position: 'absolute',
            top: '25%',
            left: '25%',
            width: '16rem',
            height: '16rem',
            background: 'red',
            borderRadius: '50%',
            filter: 'blur(60px)',
            animation: 'pulse 2s infinite',
          }}
        />
      </div>

      {currentSlide && (
        <Overlay>
          <ModalContent>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>{currentSlide.icon}</div>
            <h2
              style={{
                fontSize: '1.5rem',
                fontWeight: 'bold',
                color: '#facc15',
                marginBottom: '1.5rem',
              }}
            >
              {currentSlide.title}
            </h2>
            <ul style={{ width: '100%', marginBottom: '2rem' }}>
              {currentSlide.items.map((item, i) => (
                <li
                  key={i}
                  style={{
                    display: 'flex',
                    gap: '0.75rem',
                    marginBottom: '0.5rem',
                    fontSize: '1.125rem',
                  }}
                >
                  <span style={{ color: '#4ade80' }}>✓</span>
                  {item}
                </li>
              ))}
            </ul>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                width: '100%',
                alignItems: 'center',
              }}
            >
              <DemoDots>
                {CONTENT.demo.map((_, i) => (
                  <DemoDot key={i} $active={i === demoIdx} />
                ))}
              </DemoDots>
              <span style={{ color: '#9ca3af', fontSize: '0.875rem' }}>クリックで閉じる</span>
            </div>
          </ModalContent>
        </Overlay>
      )}

      <TitleContainer>
        <TitleMain>LABYRINTH</TitleMain>
        <TitleSub>OF SHADOWS</TitleSub>
        <TitleJapanese>〜 影の迷宮 〜</TitleJapanese>

        <MenuContainer>
          {(
            Object.entries(CONFIG.difficulties) as [
              Difficulty,
              { label: string; size: number; time: number; lives: number; gradient: string },
            ][]
          ).map(([key, cfg]) => (
            <DiffButton key={key} onClick={() => onStart(key)} $gradientClass={cfg.gradient}>
              <ButtonContent>
                <div>{cfg.label}</div>
                <ButtonInfo>
                  <div>
                    {cfg.size}×{cfg.size}
                  </div>
                  <div>
                    {cfg.time}秒 | ❤️×{cfg.lives}
                  </div>
                  <div style={{ color: '#fbbf24', fontSize: '0.75rem' }}>
                    HI: {highScores[key] || 0}
                  </div>
                </ButtonInfo>
              </ButtonContent>
            </DiffButton>
          ))}
        </MenuContainer>

        <HelpPanel>
          <HelpGrid>
            {[
              ['W A S D', '移動'],
              ['Space', '隠れる'],
              ['Shift', 'ダッシュ'],
              ['矢印キー', '移動'],
            ].map(([key, desc]) => (
              <KeyHelp key={key}>
                <span style={{ color: '#d1d5db' }}>{key}</span>
                <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>{desc}</div>
              </KeyHelp>
            ))}
          </HelpGrid>
          {!demoActive && (
            <div style={{ color: '#6b7280', fontSize: '0.75rem', animation: 'pulse 2s infinite' }}>
              💡 待つと詳しい説明が表示されます
            </div>
          )}
        </HelpPanel>
      </TitleContainer>
    </PageContainer>
  );
};

const HUD: React.FC<{ h: HUDData }> = ({ h }) => (
  <HUDContainer>
    <HUDGroup>
      <HUDPanel $borderColor="#b45309">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ fontSize: '1.5rem' }}>🔑</span>
          <div>
            <div style={{ color: '#facc15', fontWeight: 'bold' }}>
              {h.keys} / {h.req}
            </div>
            <div style={{ color: '#fde047', opacity: 0.5, fontSize: '0.75rem' }}>鍵を集めろ</div>
          </div>
        </div>
      </HUDPanel>
      <HUDPanel $borderColor="#b91c1c">
        <div style={{ display: 'flex', gap: '0.25rem' }}>
          {Array.from({ length: h.maxL }).map((_, i) => (
            <span
              key={i}
              style={{
                fontSize: '1.25rem',
                opacity: i < h.lives ? 1 : 0.3,
                filter: i < h.lives ? 'none' : 'grayscale(100%)',
              }}
            >
              {i < h.lives ? '❤️' : '🖤'}
            </span>
          ))}
        </div>
      </HUDPanel>
      <HUDPanel $borderColor="#15803d">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ fontSize: '0.875rem' }}>🏃</span>
          <BarContainer>
            <BarFill $percent={h.stamina} $color={h.stamina > 30 ? '#22c55e' : '#f97316'} />
          </BarContainer>
        </div>
      </HUDPanel>
    </HUDGroup>

    <HUDGroup $align="right">
      <HUDPanel $animate={h.time <= 30} $borderColor={h.time <= 30 ? '#ef4444' : undefined}>
        <div style={{ fontSize: '0.75rem', opacity: 0.5, marginBottom: '0.125rem' }}>残り時間</div>
        <div
          style={{
            fontFamily: 'monospace',
            fontWeight: 'bold',
            fontSize: '1.5rem',
            color: h.time <= 30 ? '#f87171' : h.time <= 60 ? '#facc15' : 'white',
          }}
        >
          {Utils.formatTime(h.time)}
        </div>
      </HUDPanel>
      <HUDPanel
        $bg={h.hide ? 'rgba(30, 58, 138, 0.4)' : undefined}
        $borderColor={h.hide ? '#60a5fa' : undefined}
      >
        <div
          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}
        >
          <span style={{ fontSize: '1.125rem' }}>{h.hide ? '🙈' : '👁️'}</span>
          <span style={{ fontSize: '0.75rem', opacity: 0.6 }}>
            {h.hide ? '隠れ中' : '隠れゲージ'}
          </span>
        </div>
        <div
          style={{
            width: '5rem',
            height: '0.625rem',
            backgroundColor: '#1f2937',
            borderRadius: '9999px',
            overflow: 'hidden',
          }}
        >
          <BarFill $percent={h.energy} $color={h.energy > 30 ? '#3b82f6' : '#ef4444'} />
        </div>
      </HUDPanel>
      {h.eNear > 0.2 && (
        <HUDPanel $bg="rgba(127, 29, 29, 0.9)" $borderColor="#ef4444" $animate>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontSize: '1.25rem' }}>⚠️</span>
            <div>
              <div style={{ color: '#fca5a5', fontSize: '0.75rem', fontWeight: 'bold' }}>
                敵が近い！
              </div>
              <div
                style={{
                  width: '3.5rem',
                  height: '0.5rem',
                  backgroundColor: '#1f2937',
                  borderRadius: '9999px',
                  overflow: 'hidden',
                }}
              >
                <BarFill $percent={h.eNear * 100} $color="#ef4444" />
              </div>
            </div>
          </div>
        </HUDPanel>
      )}
      <HUDPanel>
        <div style={{ color: '#facc15', fontSize: '0.875rem', fontWeight: 'bold' }}>
          SCORE: {h.score.toLocaleString()}
        </div>
        <div style={{ color: '#fbbf24', fontSize: '0.7rem', opacity: 0.8 }}>
          HI: {h.highScore.toLocaleString()}
        </div>
      </HUDPanel>
    </HUDGroup>
  </HUDContainer>
);

interface MinimapProps {
  maze: number[][];
  player: Entity;
  exit: Entity;
  items: Item[];
  enemies: Enemy[];
  keys: number;
  reqKeys: number;
  explored: Record<string, boolean>;
}

const Minimap: React.FC<MinimapProps> = ({
  maze,
  player,
  exit,
  items,
  enemies,
  keys,
  reqKeys,
  explored,
}) => (
  <MinimapContainer>
    <div style={{ position: 'relative', width: maze.length * 4, height: maze.length * 4 }}>
      {maze.map((row, y) =>
        row.map((val, x) => {
          const isExplored = explored[`${x},${y}`];
          return (
            <div
              key={`${x}-${y}`}
              style={{
                position: 'absolute',
                left: x * 4,
                top: y * 4,
                width: 4,
                height: 4,
                backgroundColor: val === 1 ? '#333' : isExplored ? '#1a1a2e' : '#0a0a15',
                opacity: isExplored ? 1 : 0.25,
              }}
            />
          );
        })
      )}
      {items
        .filter(i => !i.got && explored[`${i.x},${i.y}`])
        .map((item, i) => (
          <div
            key={`i${i}`}
            style={{
              position: 'absolute',
              left: item.x * 4,
              top: item.y * 4,
              width: 4,
              height: 4,
              borderRadius: '50%',
              backgroundColor: item.type === 'key' ? '#ffdd00' : '#ff8844',
            }}
          />
        ))}
      <div
        style={{
          position: 'absolute',
          left: exit.x * 4,
          top: exit.y * 4,
          width: 6,
          height: 6,
          borderRadius: 1,
          backgroundColor: keys >= reqKeys ? '#44ff88' : '#666',
        }}
      />
      {enemies
        .filter(e => e.active)
        .map((e, i) => (
          <div
            key={`e${i}`}
            style={{
              position: 'absolute',
              left: e.x * 4,
              top: e.y * 4,
              width: 4,
              height: 4,
              borderRadius: '50%',
              backgroundColor: '#ff0044',
              animation: 'pulse 0.5s infinite',
            }}
          />
        ))}
      <div
        style={{
          position: 'absolute',
          left: player.x * 4 - 1,
          top: player.y * 4 - 1,
          width: 6,
          height: 6,
          borderRadius: '50%',
          backgroundColor: '#60a5fa',
          boxShadow: '0 0 4px #60a5fa',
        }}
      />
    </div>
  </MinimapContainer>
);

const Controls: React.FC<{
  keysRef: React.RefObject<Record<string, boolean>>;
  hiding: boolean;
  energy: number;
  stamina: number;
}> = ({
  keysRef,
  hiding,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  energy,
  stamina,
}) => (
  <ControlsContainer>
    <ControlBtn
      $variant="dpad"
      onPointerDown={e => {
        e.preventDefault();
        keysRef.current['a'] = true;
      }}
      onPointerUp={e => {
        e.preventDefault();
        keysRef.current['a'] = false;
      }}
      onPointerLeave={e => {
        e.preventDefault();
        keysRef.current['a'] = false;
      }}
    >
      ◀
    </ControlBtn>
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
      <ControlBtn
        $variant="dpad"
        onPointerDown={e => {
          e.preventDefault();
          keysRef.current['w'] = true;
        }}
        onPointerUp={e => {
          e.preventDefault();
          keysRef.current['w'] = false;
        }}
        onPointerLeave={e => {
          e.preventDefault();
          keysRef.current['w'] = false;
        }}
      >
        ▲
      </ControlBtn>
      <ControlBtn
        $variant="dpad"
        onPointerDown={e => {
          e.preventDefault();
          keysRef.current['s'] = true;
        }}
        onPointerUp={e => {
          e.preventDefault();
          keysRef.current['s'] = false;
        }}
        onPointerLeave={e => {
          e.preventDefault();
          keysRef.current['s'] = false;
        }}
      >
        ▼
      </ControlBtn>
    </div>
    <ControlBtn
      $variant="dpad"
      onPointerDown={e => {
        e.preventDefault();
        keysRef.current['d'] = true;
      }}
      onPointerUp={e => {
        e.preventDefault();
        keysRef.current['d'] = false;
      }}
      onPointerLeave={e => {
        e.preventDefault();
        keysRef.current['d'] = false;
      }}
    >
      ▶
    </ControlBtn>

    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginLeft: '2rem' }}>
      <ControlBtn
        $variant="shift"
        onPointerDown={e => {
          e.preventDefault();
          keysRef.current['shift'] = true;
        }}
        onPointerUp={e => {
          e.preventDefault();
          keysRef.current['shift'] = false;
        }}
        onPointerLeave={e => {
          e.preventDefault();
          keysRef.current['shift'] = false;
        }}
        style={{ backgroundColor: stamina > 10 ? 'rgba(21, 128, 61, 0.9)' : undefined }}
      >
        🏃 走る
      </ControlBtn>
      <ControlBtn
        $variant="action"
        onPointerDown={e => {
          e.preventDefault();
          keysRef.current[' '] = true;
        }}
        onPointerUp={e => {
          e.preventDefault();
          keysRef.current[' '] = false;
        }}
        onPointerLeave={e => {
          e.preventDefault();
          keysRef.current[' '] = false;
        }}
        style={{ backgroundColor: hiding ? '#1d4ed8' : undefined }}
      >
        <div style={{ fontSize: '1.25rem' }}>{hiding ? '🙈' : '👁️'}</div>
        <div style={{ fontSize: '0.75rem' }}>{hiding ? '隠れ中' : '隠れる'}</div>
      </ControlBtn>
    </div>
  </ControlsContainer>
);

// ==================== MAIN PAGE ====================
export default function MazeHorrorPage() {
  const [screen, setScreen] = useState<'title' | 'story' | 'playing'>('title');
  const [storyType, setStoryType] = useState<keyof typeof CONTENT.stories>('intro');
  const [diff, setDiff] = useState<Difficulty>('NORMAL');
  const [resultData, setResultData] = useState({ score: 0, time: 0 });
  const [hud, setHud] = useState({
    keys: 0,
    req: 3,
    time: 150,
    lives: 3,
    maxL: 3,
    hide: false,
    energy: 100,
    eNear: 0,
    score: 0,
    stamina: 100,
    highScore: 0,
  });
  const [mapData, setMapData] = useState({
    maze: [] as number[][],
    player: { x: 0, y: 0 },
    exit: { x: 0, y: 0 },
    items: [] as Item[],
    enemies: [] as Enemy[],
    keys: 0,
    reqKeys: 0,
    explored: {} as Record<string, boolean>,
  });

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameRef = useRef<GameState | null>(null);
  const keysRef = useRef<Record<string, boolean>>({});
  const rafRef = useRef<number | null>(null);
  const [highScores, setHighScores] = useState<Record<string, number>>({});

  useEffect(() => {
    Promise.all(Object.keys(CONFIG.difficulties).map(d => getHighScore('maze_horror', d))).then(
      scores => {
        const newScores: Record<string, number> = {};
        Object.keys(CONFIG.difficulties).forEach((k, i) => {
          newScores[k] = scores[i];
        });
        setHighScores(newScores);
      }
    );
  }, []);

  const endGame = useCallback(
    (type: keyof typeof CONTENT.stories) => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
      const g = gameRef.current;
      if (g) {
        setResultData({
          score: g.score,
          time: Math.floor((CONFIG.difficulties[diff].time * 1000 - g.time) / 1000),
        });
        saveScore('maze_horror', g.score, diff).then(() => {
          if (g.score > (highScores[diff] || 0)) {
            setHighScores(prev => ({ ...prev, [diff]: g.score }));
          }
        });
      }
      setStoryType(type);
      setScreen('story');
    },
    [diff, highScores]
  );

  const startGame = useCallback((d: Difficulty) => {
    setDiff(d);
    setStoryType('intro');
    setScreen('story');
  }, []);

  const onStoryDone = useCallback(() => {
    if (storyType === 'intro') {
      gameRef.current = GameStateFactory.create(diff);
      setScreen('playing');
    } else setScreen('title');
  }, [storyType, diff]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      keysRef.current[e.key.toLowerCase()] = true;
      if (e.key === ' ' || e.key.startsWith('Arrow')) e.preventDefault();
    };
    const onKeyUp = (e: KeyboardEvent) => {
      keysRef.current[e.key.toLowerCase()] = false;
    };
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
    };
  }, []);

  useEffect(() => {
    if (screen !== 'playing' || !gameRef.current || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const { width: W, height: H } = CONFIG.render;

    const loop = () => {
      const g = gameRef.current;
      if (!g) return;

      const now = performance.now();
      const dt = Math.min(50, now - g.lastT);
      g.lastT = now;
      g.gTime += dt;
      g.time -= dt;
      if (g.invince > 0) g.invince -= dt;
      if (g.msgTimer > 0) g.msgTimer -= dt;

      if (g.time <= 0) {
        endGame('timeout');
        return;
      }

      const k = keysRef.current;
      const input = {
        left: k['a'] || k['arrowleft'],
        right: k['d'] || k['arrowright'],
        forward: k['w'] || k['arrowup'],
        backward: k['s'] || k['arrowdown'],
      };

      GameLogic.updateHiding(g, k[' '], dt);
      GameLogic.updateSprinting(g, k['shift'], dt);
      const moved = GameLogic.updatePlayer(g, input, dt);
      GameLogic.updateFootstep(g, moved, dt);
      GameLogic.updateItems(g);

      const exitResult = GameLogic.checkExit(g);
      if (exitResult) {
        endGame(exitResult);
        return;
      }

      const closestEnemy = GameLogic.updateEnemies(g, dt);
      if (g.lives <= 0) {
        endGame('gameover');
        return;
      }

      GameLogic.updateSounds(g, closestEnemy, dt);
      Renderer.render(ctx, g, W, H, closestEnemy);

      setHud({
        keys: g.keys,
        req: g.reqKeys,
        time: Math.ceil(g.time / 1000),
        lives: g.lives,
        maxL: g.maxLives,
        hide: g.hiding,
        energy: Math.round(g.energy),
        eNear: Math.max(0, 1 - closestEnemy / 7),
        score: g.score,
        stamina: Math.round(g.player.stamina),
        highScore: highScores[diff] || 0,
      });

      setMapData({
        maze: g.maze,
        player: g.player,
        exit: g.exit,
        items: g.items,
        enemies: g.enemies,
        keys: g.keys,
        reqKeys: g.reqKeys,
        explored: g.explored,
      });

      rafRef.current = requestAnimationFrame(loop);
    };

    rafRef.current = requestAnimationFrame(loop);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [screen, endGame, diff, highScores]);

  if (screen === 'title') return <Title onStart={startGame} highScores={highScores} />;
  if (screen === 'story')
    return (
      <Story
        type={storyType}
        onDone={onStoryDone}
        score={resultData.score}
        time={resultData.time}
        highScore={highScores[diff]}
      />
    );

  return (
    <PageContainer>
      <Canvas
        ref={canvasRef}
        width={CONFIG.render.width}
        height={CONFIG.render.height}
        role="img"
        aria-label="3D迷宮ホラーゲーム画面"
        tabIndex={0}
      />
      <HUD h={hud} />
      <Controls keysRef={keysRef} hiding={hud.hide} energy={hud.energy} stamina={hud.stamina} />
      {mapData.maze.length > 0 && <Minimap {...mapData} />}
      <MessageOverlay $visible={!!(gameRef.current && gameRef.current.msgTimer > 0)}>
        {gameRef.current?.msg}
      </MessageOverlay>
    </PageContainer>
  );
}
