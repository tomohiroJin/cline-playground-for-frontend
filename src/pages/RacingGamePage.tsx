import React, { useEffect, useRef, useState, memo, useCallback } from 'react';
import { saveScore, getHighScore } from '../utils/score-storage';
import {
  PageContainer,
  GameContainer,
  Title,
  SubTitle,
  CanvasContainer,
  Canvas,
  ControlGroup,
  Label,
  Button,
  Overlay,
  ResultCard,
  ResultTitle,
  ResultRow,
  ActionButton,
  MobileControls,
  TouchButton,
  Btn,
  ColorBtn,
} from './RacingGamePage.styles';

// ============================================
// 1. 定数 & 型定義
// ============================================

type Point = { x: number; y: number };
type Checkpoint = Point & { idx: number };
type StartLine = {
  cx: number;
  cy: number;
  px: number;
  py: number;
  dx: number;
  dy: number;
  len: number;
};
type Particle = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  life: number;
};
type Spark = { x: number; y: number; vx: number; vy: number; color: string; life: number };
type Confetti = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  rot: number;
  rotSpd: number;
};

interface Course {
  name: string;
  bg: string;
  ground: string;
  deco: 'forest' | 'city' | 'mountain' | 'beach' | 'night' | 'snow';
  pts: Array<[number, number]>;
  points: Point[];
  checkpoints: number[];
  checkpointCoords: Checkpoint[];
}

const Config = Object.freeze({
  canvas: { width: 900, height: 700 },
  game: {
    trackWidth: 55,
    turnRate: 0.065,
    collisionDist: 25,
    wallWarpThreshold: 10,
    speedRecovery: 0.02,
    sparkThreshold: 1.5,
    particleCount: 8,
    decoCount: 35,
    confettiCount: 100,
    maxParticles: 200,
    maxSparks: 100,
    checkpointRadius: 90,
  },
  timing: {
    demo: 15000,
    idle: 8,
    countdown: 3500,
    lapAnnounce: 1500,
  },
  startLine: { width: 12, squares: 6 },
  audio: {
    defaultVolume: 0.5,
    minVolume: 0,
    maxVolume: 1,
    freq: {
      collision: [200, 150],
      wall: [100, 80],
      lap: [523, 659, 784],
      finalLap: [784, 988, 1175],
      countdown: [440],
      go: [880, 1760],
      finish: [523, 659, 784, 1047],
      engine: [80, 100],
      checkpoint: [660, 880],
    },
  },
});

const Colors = Object.freeze({
  car: ['#E60012', '#0066FF', '#00AA00', '#FF6600', '#AA00AA', '#FFCC00'],
  particle: ['#ff0', '#f80', '#f00'],
  confetti: ['#ff0', '#f0f', '#0ff', '#f00', '#0f0', '#00f'],
  firework: ['#ff0', '#f0f', '#0ff', '#f00', '#0f0'],
});

const Options = Object.freeze({
  speed: [
    { label: '🐢ゆっくり', value: 2.2 },
    { label: '🚗ふつう', value: 3.2 },
    { label: '🚀はやい', value: 4.5 },
  ],
  cpu: [
    { label: '😊よわい', skill: 0.25, miss: 0.12 },
    { label: '🙂ふつう', skill: 0.5, miss: 0.05 },
    { label: '😈つよい', skill: 1.0, miss: 0 },
  ],
  laps: [1, 3, 5],
});

// コースデータ
// PLACEHOLDER_COURSES
const Courses: Course[] = [
  {
    name: '🌳フォレスト',
    bg: '#228B22',
    ground: '#1e7a1e',
    deco: 'forest',
    pts: [
      [450, 650],
      [300, 650],
      [150, 600],
      [80, 500],
      [60, 380],
      [80, 260],
      [150, 160],
      [280, 100],
      [450, 80],
      [620, 100],
      [750, 160],
      [820, 260],
      [840, 380],
      [820, 500],
      [750, 600],
      [600, 650],
    ],
    checkpoints: [0, 4, 8, 12],
  },
  {
    name: '🏙️シティ',
    bg: '#3a3a4a',
    ground: '#2a2a3a',
    deco: 'city',
    pts: [
      [450, 650],
      [250, 650],
      [100, 600],
      [100, 450],
      [200, 350],
      [200, 200],
      [100, 100],
      [300, 100],
      [400, 200],
      [500, 100],
      [700, 100],
      [800, 200],
      [800, 400],
      [700, 500],
      [700, 600],
      [600, 650],
    ],
    checkpoints: [0, 4, 8, 12],
  },
  {
    name: '🌋マウンテン',
    bg: '#4a2020',
    ground: '#3a1515',
    deco: 'mountain',
    pts: [
      [450, 650],
      [300, 620],
      [150, 550],
      [80, 450],
      [120, 350],
      [80, 250],
      [150, 150],
      [280, 120],
      [350, 200],
      [300, 300],
      [400, 350],
      [500, 300],
      [550, 200],
      [620, 120],
      [750, 150],
      [820, 250],
      [780, 350],
      [820, 450],
      [750, 550],
      [600, 620],
    ],
    checkpoints: [0, 5, 10, 15],
  },
  {
    name: '🏖️ビーチ',
    bg: '#d4a574',
    ground: '#c49a6c',
    deco: 'beach',
    pts: [
      [450, 650],
      [300, 640],
      [180, 600],
      [100, 520],
      [80, 400],
      [120, 280],
      [200, 180],
      [320, 120],
      [450, 100],
      [580, 120],
      [700, 180],
      [780, 280],
      [820, 400],
      [800, 520],
      [720, 600],
      [600, 640],
    ],
    checkpoints: [0, 4, 8, 12],
  },
  {
    name: '🌙ナイト',
    bg: '#1a1a2e',
    ground: '#16163a',
    deco: 'night',
    pts: [
      [450, 650],
      [300, 600],
      [180, 500],
      [150, 380],
      [200, 280],
      [300, 220],
      [420, 200],
      [480, 280],
      [420, 360],
      [300, 380],
      [250, 300],
      [200, 180],
      [300, 100],
      [450, 80],
      [600, 100],
      [700, 180],
      [750, 300],
      [700, 420],
      [600, 500],
      [550, 600],
    ],
    checkpoints: [0, 5, 9, 14],
  },
  {
    name: '❄️スノー',
    bg: '#e8f4f8',
    ground: '#d0e8f0',
    deco: 'snow',
    pts: [
      [450, 650],
      [280, 630],
      [150, 570],
      [80, 470],
      [60, 350],
      [80, 230],
      [150, 140],
      [280, 80],
      [420, 60],
      [550, 80],
      [680, 60],
      [780, 100],
      [850, 180],
      [870, 300],
      [850, 420],
      [780, 520],
      [680, 580],
      [580, 620],
    ],
    checkpoints: [0, 4, 9, 14],
  },
].map(
  c =>
    ({
      ...c,
      points: c.pts.map(([x, y]) => ({ x, y })),
      checkpointCoords: c.checkpoints.map(idx => {
        const [x, y] = c.pts[idx];
        return { x, y, idx };
      }),
    }) as Course
);

// ============================================
// 2. ユーティリティ
// ============================================

const Utils = {
  clamp: (v: number, min: number, max: number) => {
    const n = Number(v);
    if (Number.isNaN(n)) return min;
    return Math.max(min, Math.min(max, n));
  },
  sum: (arr: number[]) =>
    Array.isArray(arr) && arr.length > 0 ? arr.reduce((a, b) => a + b, 0) : 0,
  min: (arr: number[]) => (Array.isArray(arr) && arr.length > 0 ? Math.min(...arr) : Infinity),
  randInt: (max: number) => Math.floor(Math.random() * Math.max(1, Math.floor(max))),
  randRange: (min: number, max: number) => (min >= max ? min : Math.random() * (max - min) + min),
  randChoice: <T,>(arr: readonly T[]) =>
    Array.isArray(arr) && arr.length > 0 ? arr[Utils.randInt(arr.length)] : null,

  normalizeAngle: (angle: number) => {
    let a = angle % (Math.PI * 2);
    if (a > Math.PI) a -= Math.PI * 2;
    if (a < -Math.PI) a += Math.PI * 2;
    return a;
  },

  formatTime: (ms: number) => {
    if (typeof ms !== 'number' || Number.isNaN(ms)) return '-:--.-';
    const abs = Math.abs(ms);
    const m = Math.floor(abs / 60000);
    const s = Math.floor((abs % 60000) / 1000);
    const c = Math.floor((abs % 1000) / 100);
    return `${m}:${String(s).padStart(2, '0')}.${c}`;
  },

  safeIndex: <T,>(arr: readonly T[], idx: number, fallback: T) =>
    Array.isArray(arr) && idx >= 0 && idx < arr.length ? arr[idx] : fallback,

  dist: (x1: number, y1: number, x2: number, y2: number) => Math.hypot(x2 - x1, y2 - y1),
};

// ============================================
// 3. サウンドエンジン
// ============================================

const SoundEngine = (() => {
  let ctx: AudioContext | null = null;
  let master: GainNode | null = null;
  let volume = Config.audio.defaultVolume;
  let muted = false;
  let engineOsc: OscillatorNode | null = null;
  let engineGain: GainNode | null = null;
  const pendingTimeouts = new Set<NodeJS.Timeout>();

  const getCtx = () => {
    if (!ctx) {
      try {
        const AudioContextClass =
          window.AudioContext ||
          (window as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
        if (!AudioContextClass) return null;
        ctx = new AudioContextClass();
        master = ctx!.createGain();
        master.connect(ctx!.destination);
        master.gain.value = volume;
      } catch {
        return null;
      }
    }
    if (ctx.state === 'suspended') ctx.resume().catch(() => {});
    return ctx;
  };

  const tone = (freq: number, dur: number, type: OscillatorType = 'square', vol = 1) => {
    if (muted) return;
    const c = getCtx();
    if (!c) return;
    try {
      const o = c.createOscillator();
      const g = c.createGain();
      o.type = type;
      o.frequency.value = Utils.clamp(freq, 20, 20000);
      g.gain.value = Utils.clamp(volume * vol, 0, 1);
      g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + dur);
      o.connect(g);
      g!.connect(master!);
      o.start(c.currentTime);
      o.stop(c.currentTime + dur);
    } catch {}
  };

  const sequence = (
    freqs: number[],
    interval: number,
    type: OscillatorType = 'square',
    vol = 1
  ) => {
    if (!Array.isArray(freqs)) return;
    freqs.forEach((f, i) => {
      const id = setTimeout(
        () => {
          tone(f, interval * 0.9, type, vol);
          pendingTimeouts.delete(id);
        },
        i * interval * 1000
      );
      pendingTimeouts.add(id);
    });
  };

  const noise = (dur: number, vol = 0.3) => {
    if (muted) return;
    const c = getCtx();
    if (!c) return;
    try {
      const size = Math.min(c.sampleRate * dur, c.sampleRate * 2);
      const buf = c.createBuffer(1, size, c.sampleRate);
      const data = buf.getChannelData(0);
      for (let i = 0; i < size; i++) data[i] = Math.random() * 2 - 1;
      const src = c.createBufferSource();
      const g = c.createGain();
      const f = c.createBiquadFilter();
      f.type = 'lowpass';
      f.frequency.value = 500;
      src.buffer = buf;
      g.gain.value = Utils.clamp(volume * vol, 0, 1);
      g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + dur);
      src.connect(f);
      f.connect(g);
      g.connect(master!);
      src.start();
    } catch {}
  };

  const F = Config.audio.freq;

  return {
    collision: () => {
      tone(F.collision[0], 0.1, 'sawtooth', 0.4);
      setTimeout(() => tone(F.collision[1], 0.15, 'sawtooth', 0.3), 50);
      noise(0.15, 0.2);
    },
    wall: () => {
      tone(F.wall[0], 0.08, 'square', 0.3);
      noise(0.1, 0.15);
    },
    lap: () => sequence(F.lap, 0.12, 'sine', 0.5),
    finalLap: () => {
      sequence(F.finalLap, 0.15, 'sine', 0.6);
      setTimeout(() => sequence(F.finalLap, 0.15, 'sine', 0.4), 500);
    },
    countdown: () => tone(F.countdown[0], 0.15, 'sine', 0.5),
    go: () => sequence(F.go, 0.1, 'sine', 0.6),
    finish: () => {
      sequence(F.finish, 0.2, 'sine', 0.5);
      setTimeout(() => sequence([...F.finish].reverse(), 0.15, 'triangle', 0.4), 800);
    },
    checkpoint: () => sequence(F.checkpoint, 0.08, 'sine', 0.3),

    startEngine: () => {
      if (muted || engineOsc) return;
      const c = getCtx();
      if (!c) return;
      try {
        engineOsc = c.createOscillator();
        engineGain = c.createGain();
        engineOsc.type = 'sawtooth';
        engineOsc.frequency.value = F.engine[0];
        engineGain.gain.value = volume * 0.08;
        engineOsc.connect(engineGain);
        engineGain.connect(master!);
        engineOsc.start();
      } catch {}
    },

    updateEngine: (spd: number) => {
      if (engineOsc && engineGain) {
        engineOsc.frequency.value = F.engine[0] + Utils.clamp(spd, 0, 2) * 60;
        engineGain.gain.value = volume * (0.05 + Utils.clamp(spd, 0, 2) * 0.05);
      }
    },

    stopEngine: () => {
      try {
        engineOsc?.stop();
      } catch {}
      engineOsc = null;
      engineGain = null;
    },

    setVolume: (v: number) => {
      volume = Utils.clamp(v, Config.audio.minVolume, Config.audio.maxVolume);
      if (master) master.gain.value = muted ? 0 : volume;
      if (engineGain) engineGain.gain.value = volume * 0.08;
    },

    getVolume: () => volume,
    toggleMute: () => {
      muted = !muted;
      if (master) master.gain.value = muted ? 0 : volume;
      return muted;
    },
    isMuted: () => muted,

    cleanup: () => {
      pendingTimeouts.forEach(id => clearTimeout(id));
      pendingTimeouts.clear();
      try {
        engineOsc?.stop();
      } catch {}
      engineOsc = null;
      engineGain = null;
    },
  };
})();

// ============================================
// 4. エンティティ
// ============================================

interface Player {
  x: number;
  y: number;
  angle: number;
  color: string;
  name: string;
  isCpu: boolean;
  lap: number;
  checkpointFlags: number;
  lapTimes: number[];
  lapStart: number;
  speed: number;
  wallStuck: number;
  progress: number;
  lastSeg: number;
}

const Entity = {
  player: (
    x: number,
    y: number,
    angle: number,
    color: string,
    name: string,
    isCpu: boolean
  ): Player => ({
    x,
    y,
    angle,
    color,
    name,
    isCpu,
    lap: 1,
    checkpointFlags: 0,
    lapTimes: [],
    lapStart: 0,
    speed: 1,
    wallStuck: 0,
    progress: 0,
    lastSeg: -1,
  }),

  particle: (x: number, y: number, i: number) => {
    const a = (i / Config.game.particleCount) * Math.PI * 2;
    return {
      x,
      y,
      vx: Math.cos(a) * 3,
      vy: Math.sin(a) * 3,
      life: 1,
      size: 3,
      color: Colors.particle[i % 3],
    };
  },

  spark: (x: number, y: number, angle: number, color: string) => ({
    x: x - Math.cos(angle) * 20 + Utils.randRange(-15, 15),
    y: y - Math.sin(angle) * 20 + Utils.randRange(-15, 15),
    vx: -Math.cos(angle) * 8,
    vy: -Math.sin(angle) * 8,
    life: 0.5,
    color,
  }),

  confetti: () => ({
    x: Math.random() * Config.canvas.width,
    y: Utils.randRange(-700, 0),
    vx: Utils.randRange(-2, 2),
    vy: Utils.randRange(3, 8),
    size: Utils.randRange(5, 15),
    color: Utils.randChoice(Colors.confetti),
    rot: Utils.randRange(0, 360),
    rotSpd: Utils.randRange(-7.5, 7.5),
  }),

  decoration: (x: number, y: number) => ({ x, y, variant: Utils.randInt(3) }),
};

// ============================================
// 5. トラック計算
// ============================================

const Track = {
  getInfo: (px: number, py: number, points: Point[]) => {
    const { trackWidth } = Config.game;
    let best = { dist: Infinity, seg: 0, pt: { x: px, y: py }, dir: 0 };

    for (let i = 0; i < points.length; i++) {
      const p1 = points[i];
      const p2 = points[(i + 1) % points.length];
      const dx = p2.x - p1.x,
        dy = p2.y - p1.y;
      const lenSq = dx * dx + dy * dy;
      if (lenSq === 0) continue;

      const t = Utils.clamp(((px - p1.x) * dx + (py - p1.y) * dy) / lenSq, 0, 1);
      const proj = { x: p1.x + t * dx, y: p1.y + t * dy };
      const dist = Math.hypot(px - proj.x, py - proj.y);

      if (dist < best.dist) {
        best = { dist, seg: i, pt: proj, dir: Math.atan2(dy, dx) };
      }
    }

    return { ...best, onTrack: best.dist < trackWidth };
  },

  startLine: (pts: Point[]) => {
    if (pts.length < 2) return { cx: 0, cy: 0, px: 0, py: 1, dx: 1, dy: 0, len: 100 };
    const p0 = pts[0],
      pL = pts[pts.length - 1];
    const dx = p0.x - pL.x,
      dy = p0.y - pL.y;
    const len = Math.hypot(dx, dy) || 1;
    return {
      cx: p0.x,
      cy: p0.y,
      px: -dy / len,
      py: dx / len,
      dx: dx / len,
      dy: dy / len,
      len: Config.game.trackWidth * 2,
    };
  },

  crossedStart: (
    player: Player,
    sl: StartLine,
    currentSeg: number,
    prevSeg: number,
    totalSegs: number
  ) => {
    if (totalSegs < 2) return false;
    const lastSeg = totalSegs - 1;
    const crossedFromEnd = prevSeg >= lastSeg - 1 && currentSeg <= 1;
    if (!crossedFromEnd) return false;
    const dx = player.x - sl.cx;
    const dy = player.y - sl.cy;
    const distAlongLine = Math.abs(dx * sl.px + dy * sl.py);
    const distFromLine = Math.abs(dx * sl.dx + dy * sl.dy);
    return distFromLine < 50 && distAlongLine < Config.game.trackWidth;
  },
};

// ============================================
// 6. レンダラー
// ============================================

const Render = {
  circle: (c: CanvasRenderingContext2D, x: number, y: number, r: number, col: string) => {
    c.fillStyle = col;
    c.beginPath();
    c.arc(x, y, r, 0, Math.PI * 2);
    c.fill();
  },
  ellipse: (
    c: CanvasRenderingContext2D,
    x: number,
    y: number,
    rx: number,
    ry: number,
    col: string
  ) => {
    c.fillStyle = col;
    c.beginPath();
    c.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
    c.fill();
  },
  rect: (c: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, col: string) => {
    c.fillStyle = col;
    c.fillRect(x, y, w, h);
  },
  tri: (c: CanvasRenderingContext2D, pts: number[], col: string) => {
    c.fillStyle = col;
    c.beginPath();
    c.moveTo(pts[0], pts[1]);
    c.lineTo(pts[2], pts[3]);
    c.lineTo(pts[4], pts[5]);
    c.fill();
  },

  background: (c: CanvasRenderingContext2D, course: Course) => {
    const { width, height } = Config.canvas;
    c.fillStyle = course.bg;
    c.fillRect(0, 0, width, height);
    c.fillStyle = course.ground;
    for (let i = 0; i < 150; i++) {
      c.beginPath();
      c.arc((i * 137) % width, (i * 97) % height, 2, 0, Math.PI * 2);
      c.fill();
    }
  },

  track: (c: CanvasRenderingContext2D, pts: Point[]) => {
    if (pts.length < 2) return;
    const { trackWidth } = Config.game;
    const path = () => {
      c.beginPath();
      c.moveTo(pts[0].x, pts[0].y);
      pts.forEach(p => c.lineTo(p.x, p.y));
      c.closePath();
    };
    c.lineCap = c.lineJoin = 'round';
    [
      [trackWidth * 2 + 16, '#c00', []],
      [trackWidth * 2 + 16, '#fff', [20, 20]],
      [trackWidth * 2, '#3a3a3a', []],
      [trackWidth * 2 - 15, '#505050', []],
      [3, '#fff', [30, 20]],
    ].forEach(([w, col, dash]) => {
      c.lineWidth = w as number;
      c.strokeStyle = col as string;
      c.setLineDash(dash as number[]);
      path();
      c.stroke();
    });
    c.setLineDash([]);
  },

  startLine: (c: CanvasRenderingContext2D, sl: StartLine) => {
    const { width, squares } = Config.startLine;
    c.save();
    c.translate(sl.cx, sl.cy);
    c.rotate(Math.atan2(sl.py, sl.px));
    const sq = sl.len / squares;
    for (let i = 0; i < squares; i++) {
      for (let j = 0; j < 2; j++) {
        c.fillStyle = (i + j) % 2 ? '#000' : '#fff';
        c.fillRect(-sl.len / 2 + i * sq, -width / 2 + j * 6, sq, 6);
      }
    }
    c.restore();
  },

  checkpoints: (c: CanvasRenderingContext2D, coords: Checkpoint[]) => {
    const radius = Config.game.checkpointRadius;

    coords.forEach((cp, i) => {
      if (i === 0) return;

      c.globalAlpha = 0.3;
      c.strokeStyle = '#ffff00';
      c.lineWidth = 2;
      c.setLineDash([8, 8]);
      c.beginPath();
      c.arc(cp.x, cp.y, radius, 0, Math.PI * 2);
      c.stroke();
      c.setLineDash([]);

      c.globalAlpha = 0.7;
      c.font = '20px Arial';
      c.textAlign = 'center';
      c.textBaseline = 'middle';
      c.fillText('🚩', cp.x, cp.y);

      c.globalAlpha = 1;
      c.textBaseline = 'alphabetic';
    });
  },

  kart: (c: CanvasRenderingContext2D, p: Player) => {
    c.save();
    c.translate(p.x, p.y);
    c.rotate(p.angle + Math.PI / 2);
    c.fillStyle = 'rgba(0,0,0,0.3)';
    c.beginPath();
    c.ellipse(3, 3, 12, 8, 0, 0, Math.PI * 2);
    c.fill();
    c.fillStyle = p.color;
    c.beginPath();
    c.roundRect(-10, -15, 20, 30, 4);
    c.fill();
    c.strokeStyle = '#fff';
    c.lineWidth = 2;
    c.stroke();
    c.fillStyle = '#FFE4C4';
    c.beginPath();
    c.arc(0, -3, 6, 0, Math.PI * 2);
    c.fill();
    c.fillStyle = p.color;
    c.beginPath();
    c.arc(0, -6, 5, Math.PI, 0);
    c.fill();
    c.fillStyle = '#111';
    [
      [-11, -10],
      [11, -10],
      [-11, 10],
      [11, 10],
    ].forEach(([x, y]) => c.fillRect(x - 3, y - 5, 6, 10));
    c.restore();
    c.fillStyle = '#fff';
    c.strokeStyle = p.color;
    c.lineWidth = 3;
    c.font = 'bold 14px Arial';
    c.textAlign = 'center';
    c.strokeText(p.name, p.x, p.y - 28);
    c.fillText(p.name, p.x, p.y - 28);
  },

  particles: (c: CanvasRenderingContext2D, parts: Particle[], sparks: Spark[]) => {
    parts.forEach(p => {
      c.globalAlpha = p.life;
      c.fillStyle = p.color;
      c.beginPath();
      c.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      c.fill();
    });
    sparks.forEach(p => {
      c.globalAlpha = p.life;
      c.strokeStyle = p.color;
      c.lineWidth = 2;
      c.beginPath();
      c.moveTo(p.x, p.y);
      c.lineTo(p.x + p.vx * 3, p.y + p.vy * 3);
      c.stroke();
    });
    c.globalAlpha = 1;
  },

  confetti: (c: CanvasRenderingContext2D, items: Confetti[]) =>
    items.forEach(i => {
      c.save();
      c.translate(i.x, i.y);
      c.rotate((i.rot * Math.PI) / 180);
      c.fillStyle = i.color;
      c.fillRect(-i.size / 2, -i.size / 4, i.size, i.size / 2);
      c.restore();
    }),

  fireworks: (c: CanvasRenderingContext2D, time: number) => {
    [
      [200, 200, 0],
      [700, 150, 500],
      [450, 250, 1000],
    ].forEach(([x, y, d]) => {
      const t = (time + d) % 2000;
      if (t < 800) {
        const p = t / 800,
          r = p * 60;
        for (let i = 0; i < 10; i++) {
          const a = (i / 10) * Math.PI * 2;
          c.fillStyle = Colors.firework[i % 5];
          c.globalAlpha = 1 - p;
          c.beginPath();
          c.arc(x + Math.cos(a) * r, y + Math.sin(a) * r, 4 * (1 - p) + 2, 0, Math.PI * 2);
          c.fill();
        }
        c.globalAlpha = 1;
      }
    });
  },
};

const DecoRenderers: Record<
  string,
  ((c: CanvasRenderingContext2D, x: number, y: number) => void)[]
> = {
  forest: [
    (c, x, y) => {
      Render.circle(c, x, y, 15, '#0a5f0a');
      Render.rect(c, x - 3, y + 8, 6, 10, '#4a2800');
    },
    (c, x, y) => {
      Render.tri(c, [x, y - 20, x - 12, y + 10, x + 12, y + 10], '#2d5a1d');
      Render.rect(c, x - 2, y + 10, 4, 8, '#4a2800');
    },
    (c, x, y) => Render.ellipse(c, x, y, 8, 5, '#654321'),
  ],
  city: [
    (c, x, y) => {
      Render.rect(c, x - 12, y - 25, 24, 35, '#555');
      for (let i = 0; i < 6; i++)
        Render.rect(c, x - 8 + (i % 2) * 12, y - 20 + Math.floor(i / 2) * 10, 5, 6, '#ff0');
    },
    (c, x, y) => {
      Render.rect(c, x - 8, y - 35, 16, 45, '#444');
      for (let i = 0; i < 4; i++) Render.rect(c, x - 5, y - 30 + i * 10, 10, 5, '#0ff');
    },
    (c, x, y) => {
      Render.rect(c, x - 2, y - 25, 4, 30, '#333');
      Render.circle(c, x, y - 27, 5, '#ff0');
    },
  ],
  mountain: [
    (c, x, y) => Render.ellipse(c, x, y, 14, 9, '#666'),
    (c, x, y) => {
      Render.ellipse(c, x, y, 10, 6, '#f40');
      Render.ellipse(c, x, y, 5, 3, '#f80');
    },
    (c, x, y) => {
      Render.tri(c, [x, y - 18, x - 15, y + 8, x + 15, y + 8], '#5a4a3a');
      Render.tri(c, [x, y - 18, x - 5, y - 10, x + 5, y - 10], '#fff');
    },
  ],
  beach: [
    (c, x, y) => {
      Render.ellipse(c, x, y, 18, 10, '#2196F3');
      Render.ellipse(c, x, y - 3, 8, 4, '#fff');
    },
    (c, x, y) => {
      Render.rect(c, x - 2, y - 20, 4, 25, '#8B4513');
      Render.circle(c, x + 8, y - 18, 10, '#228B22');
    },
    (c, x, y) => Render.ellipse(c, x, y, 10, 6, '#f4a460'),
  ],
  night: [
    (c, x, y) => {
      Render.circle(c, x, y, 2, '#ffeb3b');
      Render.circle(c, x, y, 6, 'rgba(255,235,59,0.15)');
    },
    (c, x, y) => {
      Render.rect(c, x - 10, y - 20, 20, 30, '#333');
      Render.rect(c, x - 7, y - 15, 6, 8, '#0ff');
      Render.rect(c, x + 1, y - 15, 6, 8, '#0ff');
      Render.rect(c, x - 7, y - 2, 14, 6, '#f0f');
    },
    (c, x, y) => {
      Render.rect(c, x - 1, y - 18, 2, 20, '#444');
      Render.circle(c, x, y - 20, 4, '#f0f');
    },
  ],
  snow: [
    (c, x, y) => {
      Render.circle(c, x, y + 5, 10, '#fff');
      Render.circle(c, x, y - 5, 7, '#fff');
      Render.circle(c, x, y - 13, 5, '#fff');
      Render.circle(c, x - 2, y - 14, 1.5, '#333');
      Render.circle(c, x + 2, y - 14, 1.5, '#333');
      Render.tri(c, [x, y - 12, x + 4, y - 11, x, y - 10], '#f60');
    },
    (c, x, y) => {
      Render.tri(c, [x, y - 22, x - 12, y + 10, x + 12, y + 10], '#1a5c1a');
      Render.ellipse(c, x - 5, y - 8, 4, 2, '#fff');
      Render.ellipse(c, x + 6, y, 5, 2, '#fff');
    },
    (c, x, y) => Render.ellipse(c, x, y, 15, 8, '#a0c4e8'),
  ],
};

const renderDecos = (
  c: CanvasRenderingContext2D,
  decos: { x: number; y: number; variant: number }[],
  type: string
) => {
  const fns = DecoRenderers[type];
  if (fns) decos.forEach(d => fns[d.variant % 3]?.(c, d.x, d.y));
};

// ============================================
// 7. ゲームロジック
// ============================================

const Logic = {
  cpuTurn: (p: Player, pts: Point[], skill: number, miss: number) => {
    const info = Track.getInfo(p.x, p.y, pts);
    const toCenter = Math.atan2(info.pt.y - p.y, info.pt.x - p.x);
    const nextIdx = (info.seg + 1) % pts.length;
    const toNext = Math.atan2(pts[nextIdx].y - p.y, pts[nextIdx].x - p.x);
    const target = info.dist / Config.game.trackWidth > 0.6 ? toCenter : toNext;
    let diff = Utils.normalizeAngle(target - p.angle);
    if (Math.random() < miss) diff += Utils.randRange(-0.4, 0.4);
    const rate = Config.game.turnRate * skill;
    return diff > 0.03 ? rate : diff < -0.03 ? -rate : 0;
  },

  movePlayer: (p: Player, baseSpd: number, pts: Point[]) => {
    const { speedRecovery, wallWarpThreshold } = Config.game;
    const spd = Math.min(1, p.speed + speedRecovery);
    const vel = baseSpd * spd;
    const nx = p.x + Math.cos(p.angle) * vel;
    const ny = p.y + Math.sin(p.angle) * vel;
    const info = Track.getInfo(nx, ny, pts);

    if (info.onTrack) {
      return { p: { ...p, x: nx, y: ny, speed: spd, wallStuck: 0 }, info, vel, hit: false };
    }

    const stuck = p.wallStuck + 1;
    if (stuck >= wallWarpThreshold) {
      const wi = (info.seg + 3) % pts.length;
      const wp = pts[wi];
      const nwi = (wi + 1) % pts.length;
      const nwp = pts[nwi];
      return {
        p: {
          ...p,
          x: wp.x,
          y: wp.y,
          angle: Math.atan2(nwp.y - wp.y, nwp.x - wp.x),
          speed: 0.3,
          wallStuck: 0,
        },
        info,
        vel,
        hit: true,
      };
    }

    const off = stuck >= 2 ? 2 : 1;
    const ti = (info.seg + off) % pts.length;
    const tp = pts[ti];
    return {
      p: {
        ...p,
        x: info.pt.x,
        y: info.pt.y,
        angle: Math.atan2(tp.y - info.pt.y, tp.x - info.pt.x),
        speed: 0.5,
        wallStuck: stuck,
      },
      info,
      vel,
      hit: true,
    };
  },

  updateCheckpoints: (p: Player, checkpointCoords: Checkpoint[], onNew?: () => void) => {
    let flags = p.checkpointFlags;
    const radius = Config.game.checkpointRadius;

    checkpointCoords.forEach((cp, i) => {
      if ((flags & (1 << i)) !== 0) return;
      if (i > 0 && (flags & (1 << (i - 1))) === 0) return;

      const dist = Utils.dist(p.x, p.y, cp.x, cp.y);
      if (dist < radius) {
        flags |= 1 << i;
        if (i > 0) onNew?.();
      }
    });

    return { ...p, checkpointFlags: flags };
  },

  allCheckpointsPassed: (flags: number, totalCheckpoints: number) => {
    const allFlags = (1 << totalCheckpoints) - 1;
    return (flags & allFlags) === allFlags;
  },

  handleCollision: (p1: Player, p2: Player) => {
    const dx = p2.x - p1.x,
      dy = p2.y - p1.y;
    const dist = Math.hypot(dx, dy);
    if (dist >= Config.game.collisionDist || dist === 0) return null;
    const ov = (Config.game.collisionDist - dist) / 2;
    const nx = dx / dist,
      ny = dy / dist;
    return {
      p1: { ...p1, x: p1.x - nx * ov, y: p1.y - ny * ov },
      p2: { ...p2, x: p2.x + nx * ov, y: p2.y + ny * ov },
      pt: { x: (p1.x + p2.x) / 2, y: (p1.y + p2.y) / 2 },
    };
  },
};

// ============================================
// 8. カスタムフック
// ============================================

const useInput = () => {
  const keys = useRef<Record<string, boolean>>({});
  const touch = useRef({ L: false, R: false });

  useEffect(() => {
    const kd = (e: KeyboardEvent) => {
      keys.current[e.key] = true;
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key))
        e.preventDefault();
    };
    const ku = (e: KeyboardEvent) => {
      keys.current[e.key] = false;
    };
    const blur = () => {
      keys.current = {};
    };
    window.addEventListener('keydown', kd);
    window.addEventListener('keyup', ku);
    window.addEventListener('blur', blur);
    return () => {
      window.removeEventListener('keydown', kd);
      window.removeEventListener('keyup', ku);
      window.removeEventListener('blur', blur);
    };
  }, []);

  const setTouch = useCallback((side: 'L' | 'R', active: boolean) => {
    if (touch.current) touch.current[side] = active;
  }, []);

  return { keys, touch, setTouch };
};

const useIdle = (
  active: boolean,
  timeout: number
): [boolean, React.Dispatch<React.SetStateAction<boolean>>] => {
  // idle はカウンター目的でのみ使用、直接の読み取りは不要
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [idle, setIdle] = useState(0);
  const [demo, setDemo] = useState(false);

  useEffect(() => {
    if (!active) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setIdle(0);
      setDemo(false);
      return;
    }
    const timer = setInterval(
      () =>
        setIdle(t => {
          if (t >= timeout && !demo) setDemo(true);
          return t + 1;
        }),
      1000
    );
    const reset = () => {
      setIdle(0);
      if (demo) setDemo(false);
    };
    const events = ['mousemove', 'keydown', 'touchstart', 'click'];
    events.forEach(e => window.addEventListener(e, reset, { passive: true }));
    return () => {
      clearInterval(timer);
      events.forEach(e => window.removeEventListener(e, reset));
    };
  }, [active, timeout, demo]);

  return [demo, setDemo];
};

// ============================================
// 9. UI Components
// ============================================

const VolumeCtrl = memo(function VolumeCtrl({
  vol,
  setVol,
  muted,
  setMuted,
}: {
  vol: number;
  setVol: (v: number) => void;
  muted: boolean;
  setMuted: (m: boolean) => void;
}) {
  return (
    <ControlGroup>
      <Button onClick={() => setMuted(SoundEngine.toggleMute())}>
        {muted ? '🔇' : vol > 0.5 ? '🔊' : vol > 0 ? '🔉' : '🔈'}
      </Button>
      <input
        type="range"
        min="0"
        max="1"
        step="0.1"
        value={muted ? 0 : vol}
        onChange={e => {
          const v = +e.target.value;
          setVol(v);
          SoundEngine.setVolume(v);
        }}
        style={{
          width: '80px',
          height: '4px',
          background: '#666',
          borderRadius: '4px',
          cursor: 'pointer',
          appearance: 'none',
          outline: 'none',
        }}
        disabled={muted}
      />
    </ControlGroup>
  );
});

// ============================================
// 10. メインコンポーネント
// ============================================

export default function RacingGamePage() {
  const [mode, setMode] = useState('2p');
  const [course, setCourse] = useState(0);
  const [speed, setSpeed] = useState(1);
  const [cpu, setCpu] = useState(1);
  const [laps, setLaps] = useState(3);
  const [c1, setC1] = useState(0);
  const [c2, setC2] = useState(1);

  const [state, setState] = useState('menu'); // 'menu' | 'countdown' | 'race' | 'result'
  const [winner, setWinner] = useState<string | null>(null);
  const [results, setResults] = useState<{
    winnerName: string;
    winnerColor: string;
    times: { p1: number; p2: number };
    fastest: number;
  } | null>(null);
  // bests は将来のベストタイム記録機能用に保持（現在は未使用）
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [bests, setBests] = useState<Record<string, number>>({});
  const [paused, setPaused] = useState(false);
  const [vol, setVol] = useState(Config.audio.defaultVolume);
  const [muted, setMuted] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { keys, touch, setTouch } = useInput();
  const [demo, setDemo] = useIdle(state === 'menu', Config.timing.idle);

  // Sound Cleanup
  useEffect(() => {
    // Load best times
    const loadBests = async () => {
      const newBests: Record<string, number> = {};
      for (let c = 0; c < Courses.length; c++) {
        for (const l of Options.laps) {
          const key = `c${c}-l${l}`;
          // eslint-disable-next-line no-await-in-loop
          const time = await getHighScore('racing', key, 'asc');
          if (time > 0) newBests[key] = time;
        }
      }
      setBests(newBests);
    };
    loadBests();

    return () => SoundEngine.cleanup();
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { width, height } = Config.canvas;
    canvas.width = width;
    canvas.height = height;

    const cIdx = demo ? Utils.randInt(Courses.length) : Utils.clamp(course, 0, Courses.length - 1);
    const cur = Courses[cIdx] || Courses[0]; // Fallback for safety
    if (!cur) return;
    const pts = cur.points;
    const cpCoords = cur.checkpointCoords;
    const baseSpd = Utils.safeIndex(Options.speed, speed, Options.speed[1]).value;
    const cpuCfg = Utils.safeIndex(Options.cpu, cpu, Options.cpu[1]);
    const maxLaps = laps;
    const sl = Track.startLine(pts);

    const sAngle = pts.length >= 2 ? Math.atan2(pts[1].y - pts[0].y, pts[1].x - pts[0].x) : 0;
    const pAngle = sAngle + Math.PI / 2;
    const col1 = Colors.car[demo ? Utils.randInt(6) : Utils.clamp(c1, 0, 5)];
    const col2 = Colors.car[demo ? Utils.randInt(6) : Utils.clamp(c2, 0, 5)];

    let players = [
      Entity.player(
        pts[0].x + Math.cos(pAngle) * 18,
        pts[0].y + Math.sin(pAngle) * 18 - 30,
        sAngle,
        col1,
        'P1',
        demo
      ),
      Entity.player(
        pts[0].x - Math.cos(pAngle) * 18,
        pts[0].y - Math.sin(pAngle) * 18 - 30,
        sAngle,
        col2,
        demo || mode === 'cpu' ? 'CPU' : 'P2',
        demo || mode === 'cpu'
      ),
    ];

    const cdStart = Date.now();
    let raceStart = 0;
    let particles: Particle[] = [];
    let sparks: Spark[] = [];
    const confetti: Confetti[] = [];
    let shake = 0;
    let lapAnn: string | null = null;
    let lapAnnT = 0;
    let lastCd = 4;
    let engineOn = false;
    let isRunning = true;
    const demoStart = demo ? Date.now() : 0;

    const decos: { x: number; y: number; variant: number }[] = [];
    for (let i = 0; i < Config.game.decoCount; i++) {
      let x = 0,
        y = 0,
        ok = false,
        att = 0;
      while (!ok && att++ < 50) {
        x = Math.random() * 860 + 20;
        y = Math.random() * 660 + 20;
        ok = Track.getInfo(x, y, pts).dist > Config.game.trackWidth + 30;
      }
      if (ok) decos.push(Entity.decoration(x, y));
    }

    const addParts = (x: number, y: number) => {
      for (let i = 0; i < Config.game.particleCount; i++) particles.push(Entity.particle(x, y, i));
      particles = particles.slice(-Config.game.maxParticles);
      shake = 5;
    };

    const update = () => {
      if (paused || !isRunning) return;
      if (demo && Date.now() - demoStart > Config.timing.demo) {
        setDemo(false);
        return;
      }

      players = players.map((p, i) => {
        let rot = 0;
        if (demo || p.isCpu)
          rot = Logic.cpuTurn(p, pts, demo ? 0.7 : cpuCfg.skill, demo ? 0.03 : cpuCfg.miss);
        else if (i === 0) {
          if (keys.current.a || keys.current.A || touch.current.L) rot = -Config.game.turnRate;
          if (keys.current.d || keys.current.D || touch.current.R) rot = Config.game.turnRate;
        } else {
          if (keys.current.ArrowLeft) rot = -Config.game.turnRate;
          if (keys.current.ArrowRight) rot = Config.game.turnRate;
        }
        return { ...p, angle: p.angle + rot };
      });

      let finished = false;
      if (state === 'race' || demo) {
        if (!demo && !engineOn) {
          SoundEngine.startEngine();
          engineOn = true;
        }
        if (!demo) SoundEngine.updateEngine((players[0].speed + players[1].speed) / 2);

        players = players.map(p => {
          // 移動
          // eslint-disable-next-line prefer-const
          let { p: np, info, hit } = Logic.movePlayer(p, baseSpd, pts);

          if (hit) {
            if (!demo) SoundEngine.wall();
            addParts(np.x, np.y);
          }

          // チェックポイント判定
          const newCp = Logic.updateCheckpoints(
            np,
            cpCoords,
            !p.isCpu && !demo ? SoundEngine.checkpoint : undefined
          );
          np = newCp;

          // 周回・進行度
          if (info.seg !== p.lastSeg) {
            if (
              info.seg === 0 &&
              p.lastSeg > pts.length - 5 &&
              Logic.allCheckpointsPassed(p.checkpointFlags, cpCoords.length)
            ) {
              // 周回完了（全てのチェックポイントを通過している場合のみ）
              if (!demo && !p.isCpu) {
                SoundEngine.lap();
                lapAnn = 'LAP ' + (p.lap + 1);
                lapAnnT = Date.now();
              }
              np.lap++;
              np.checkpointFlags = 0; // チェックポイントリセット
              np.lapTimes.push(Date.now() - p.lapStart);
              np.lapStart = Date.now();

              if (np.lap > maxLaps) {
                if (!demo && !winner) {
                  const winName = p.name;
                  setWinner(winName);
                  finished = true;
                  SoundEngine.stopEngine();
                  SoundEngine.finish();
                }
                return np;
              }
              if (np.lap === maxLaps && !demo && !p.isCpu) SoundEngine.finalLap();
            }
            np.lastSeg = info.seg;
          }
          np.progress = (np.lap - 1) * pts.length + info.seg;
          return np;
        });

        // 衝突判定
        if (state === 'race' || demo) {
          const col = Logic.handleCollision(players[0], players[1]);
          if (col) {
            if (!demo) SoundEngine.collision();
            players[0] = col.p1;
            players[1] = col.p2;
            sparks.push(
              Entity.spark(
                col.pt.x,
                col.pt.y,
                Math.atan2(players[1].y - players[0].y, players[1].x - players[0].x),
                '#fff'
              )
            );
            addParts(col.pt.x, col.pt.y);
          }
        }
      }

      // エフェクト更新
      particles = particles
        .map(p => ({ ...p, x: p.x + p.vx, y: p.y + p.vy, life: p.life - 0.05 }))
        .filter(p => p.life > 0);
      sparks = sparks
        .map(p => ({ ...p, x: p.x + p.vx, y: p.y + p.vy, life: p.life - 0.05 }))
        .filter(p => p.life > 0);
      confetti.forEach(i => {
        i.y += i.vy;
        i.rot += i.rotSpd;
        if (i.y > height) i.y = -20;
      });

      if (finished && !demo) {
        setState('result');
        const winName = players.find(p => p.lap > maxLaps)?.name || 'Unknown';
        const p1Time = players[0].lapTimes.reduce((a, b) => a + b, 0);
        const p2Time = players[1].lapTimes.reduce((a, b) => a + b, 0);

        setResults({
          winnerName: winName,
          winnerColor: players.find(p => p.name === winName)?.color || '#fff',
          times: { p1: p1Time, p2: p2Time },
          fastest: Utils.min([...players[0].lapTimes, ...players[1].lapTimes]),
        });

        // Save score if P1 (human) finished
        if (players[0].lap === maxLaps + 1) {
          const key = `c${course}-l${laps}`;
          saveScore('racing', p1Time, key).then(() => {
            getHighScore('racing', key, 'asc').then(t => {
              setBests(prev => ({ ...prev, [key]: t }));
            });
          });
        }

        isRunning = false;
      }
    };

    const draw = () => {
      // シェイク
      const sx = shake > 0 ? (Math.random() - 0.5) * shake : 0;
      const sy = shake > 0 ? (Math.random() - 0.5) * shake : 0;
      if (shake > 0) shake *= 0.9;

      ctx.save();
      ctx.translate(sx, sy);

      Render.background(ctx, cur);
      renderDecos(ctx, decos, cur.deco);
      Render.track(ctx, pts);
      Render.startLine(ctx, sl);
      Render.checkpoints(ctx, cpCoords); // チェックポイント表示
      Render.particles(ctx, particles, sparks);
      players
        .slice()
        .sort((a, b) => a.y - b.y)
        .forEach(p => Render.kart(ctx, p));

      if (state === 'countdown' && !demo) {
        const el = Date.now() - cdStart;
        const count = Math.ceil((Config.timing.countdown - el) / 1000);
        if (count !== lastCd && count > 0 && count <= 3) {
          SoundEngine.countdown();
          lastCd = count;
        }

        ctx.fillStyle = 'rgba(0,0,0,0.5)';
        ctx.fillRect(0, 0, width, height);
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 100px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        if (el < Config.timing.countdown) {
          ctx.fillText(String(count), width / 2, height / 2);
        } else {
          if (raceStart === 0) {
            raceStart = Date.now();
            setState('race');
            SoundEngine.go();
            players.forEach(p => (p.lapStart = Date.now()));
          }
        }
      }

      if ((state === 'race' || demo) && raceStart !== 0 && raceStart - Date.now() < 1000) {
        ctx.fillStyle = '#ffeb3b';
        ctx.font = 'bold 100px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('GO!', width / 2, height / 2);
      }

      if (state === 'result') {
        Render.confetti(ctx, confetti);
        Render.fireworks(ctx, Date.now());
      }

      // HUD (Only in Race or Demo)
      if (state === 'race' || demo) {
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 20px Arial';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';
        ctx.fillText(cur.name, 20, 20);

        players.forEach((p, i) => {
          const y = 50 + i * 30;
          ctx.fillStyle = p.color;
          ctx.fillText(`${p.name}: LAP ${Math.min(p.lap, maxLaps)}/${maxLaps}`, 20, y);
        });

        if (lapAnn && Date.now() - lapAnnT < Config.timing.lapAnnounce) {
          ctx.fillStyle = '#ffeb3b';
          ctx.font = 'bold 60px Arial';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(lapAnn, width / 2, 200);
        }
      }

      ctx.restore();
    };

    const loop = () => {
      update();
      draw();
      if (isRunning) requestAnimationFrame(loop);
    };

    // Confetti init for result
    if (state === 'result') {
      for (let i = 0; i < Config.game.confettiCount; i++) confetti.push(Entity.confetti());
    }

    try {
      loop();
    } catch (e) {
      console.error('Game Loop Error:', e);
    }
    return () => {
      isRunning = false;
      SoundEngine.stopEngine();
      SoundEngine.cleanup();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, course, speed, cpu, laps, c1, c2, state, paused, demo, winner]);

  const reset = () => {
    setState('menu'); // Back to menu instead of start
    setWinner(null);
    setResults(null);
    setPaused(false);
  };

  const startGame = () => {
    setState('countdown');
    setDemo(false);
  };

  return (
    <PageContainer>
      <GameContainer>
        <div style={{ textAlign: 'center' }}>
          <Title>Racing Game</Title>
          <SubTitle>{Courses[Utils.clamp(course, 0, Courses.length - 1)]?.name || ''}</SubTitle>
          <div style={{ color: '#fbbf24', fontSize: '1rem', marginTop: '0.5rem' }}>
            Best:{' '}
            {bests[`c${course}-l${laps}`]
              ? Utils.formatTime(bests[`c${course}-l${laps}`])
              : '--:--.-'}
          </div>
        </div>

        <CanvasContainer>
          <Canvas ref={canvasRef} role="img" aria-label="レーシングゲーム画面" tabIndex={0} />

          {state === 'menu' && (
            <Overlay>
              <ResultTitle style={{ marginBottom: '0.5rem', color: '#fbbf24', fontSize: '1.5rem' }}>
                🏎️ レースゲーム
              </ResultTitle>

              <ControlGroup style={{ padding: '0.25rem 0.5rem' }}>
                <Label style={{ fontSize: '0.8rem' }}>Mode</Label>
                <Btn $sel={mode === '2p'} onClick={() => setMode('2p')} $color="#10b981">
                  👫2人
                </Btn>
                <Btn $sel={mode === 'cpu'} onClick={() => setMode('cpu')} $color="#a855f7">
                  🤖CPU
                </Btn>
              </ControlGroup>

              {mode === 'cpu' && (
                <ControlGroup style={{ padding: '0.25rem 0.5rem' }}>
                  <Label style={{ fontSize: '0.8rem' }}>CPU Level</Label>
                  {Options.cpu.map((c, i) => (
                    <Btn key={i} $sel={cpu === i} onClick={() => setCpu(i)} $color="#f97316">
                      {c.label.split(' ')[0]}
                    </Btn>
                  ))}
                </ControlGroup>
              )}

              <ControlGroup style={{ padding: '0.25rem 0.5rem' }}>
                <Label style={{ fontSize: '0.8rem' }}>P1 Color</Label>
                <div style={{ display: 'flex', gap: '4px' }}>
                  {Colors.car.map((c, i) => (
                    <ColorBtn
                      key={i}
                      $color={c}
                      $sel={c1 === i}
                      onClick={() => setC1(i)}
                      label={`P1 Color ${i + 1}`}
                    />
                  ))}
                </div>
              </ControlGroup>

              <ControlGroup style={{ padding: '0.25rem 0.5rem' }}>
                <Label style={{ fontSize: '0.8rem' }}>{mode === 'cpu' ? 'CPU' : 'P2'} Color</Label>
                <div style={{ display: 'flex', gap: '4px' }}>
                  {Colors.car.map((c, i) => (
                    <ColorBtn
                      key={i}
                      $color={c}
                      $sel={c2 === i}
                      onClick={() => setC2(i)}
                      label={`P2 Color ${i + 1}`}
                    />
                  ))}
                </div>
              </ControlGroup>

              <ControlGroup
                style={{
                  padding: '0.25rem 0.5rem',
                  maxWidth: '800px',
                  flexWrap: 'wrap',
                  justifyContent: 'center',
                }}
              >
                <Label style={{ fontSize: '0.8rem' }}>Course</Label>
                {Courses.map((c, i) => (
                  <Button
                    key={i}
                    $active={course === i}
                    onClick={() => setCourse(i)}
                    $color="#eab308"
                    style={{
                      color: '#000',
                      marginRight: '2px',
                      padding: '0.25rem 0.5rem',
                      fontSize: '0.75rem',
                    }}
                  >
                    {c.name}
                  </Button>
                ))}
              </ControlGroup>

              <ControlGroup style={{ padding: '0.25rem 0.5rem' }}>
                <Label style={{ fontSize: '0.8rem' }}>Speed</Label>
                {Options.speed.map((s, i) => (
                  <Btn key={i} $sel={speed === i} onClick={() => setSpeed(i)} $color="#3b82f6">
                    {s.label.split(' ')[0]}
                  </Btn>
                ))}
              </ControlGroup>

              <ControlGroup style={{ padding: '0.25rem 0.5rem' }}>
                <Label style={{ fontSize: '0.8rem' }}>Laps</Label>
                {Options.laps.map(l => (
                  <Btn key={l} $sel={laps === l} onClick={() => setLaps(l)} $color="#ec4899">
                    {l}周
                  </Btn>
                ))}
              </ControlGroup>

              <ActionButton
                onClick={startGame}
                style={{
                  marginTop: '1rem',
                  padding: '0.5rem 2rem',
                  background: 'linear-gradient(to right, #4ade80, #facc15)',
                  color: '#000',
                  fontSize: '1rem',
                }}
              >
                🏁 スタート!
              </ActionButton>
            </Overlay>
          )}

          {state === 'result' && results && (
            <Overlay>
              <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🏆👑🏆</div>
              <ResultTitle>{results.winnerName} Wins!</ResultTitle>
              <div
                style={{
                  fontSize: '2.5rem',
                  fontWeight: 'bold',
                  marginBottom: '1rem',
                  color: results.winnerColor,
                }}
              >
                {results.winnerName}
              </div>
              <ResultCard>
                <ResultRow>
                  <span>Total Time:</span> <span>{Utils.formatTime(results.times.p1)}</span>
                </ResultRow>
                <ResultRow>
                  <span>Fastest Lap:</span> <span>{Utils.formatTime(results.fastest)}</span>
                </ResultRow>
              </ResultCard>
              <div style={{ color: '#fbbf24', fontSize: '1.2rem', marginTop: '1rem' }}>
                Best:{' '}
                {bests[`c${course}-l${laps}`]
                  ? Utils.formatTime(bests[`c${course}-l${laps}`])
                  : '--:--.-'}
              </div>
              <div style={{ marginTop: '2rem' }}>
                <ActionButton
                  onClick={reset}
                  style={{ background: 'linear-gradient(to right, #a855f7, #ec4899)' }}
                >
                  🔄 もういちど
                </ActionButton>
              </div>
            </Overlay>
          )}

          {paused && (
            <Overlay>
              <ResultTitle>PAUSED</ResultTitle>
              <ActionButton onClick={() => setPaused(false)}>Resume</ActionButton>
              <Button onClick={reset} style={{ marginTop: '1rem' }}>
                Exit
              </Button>
            </Overlay>
          )}
        </CanvasContainer>

        <MobileControls>
          <TouchButton
            onTouchStart={() => setTouch('L', true)}
            onTouchEnd={() => setTouch('L', false)}
          >
            ◀
          </TouchButton>
          <TouchButton
            onTouchStart={() => setTouch('R', true)}
            onTouchEnd={() => setTouch('R', false)}
          >
            ▶
          </TouchButton>
        </MobileControls>

        <div style={{ marginTop: '1rem', textAlign: 'center' }}>
          <VolumeCtrl vol={vol} setVol={setVol} muted={muted} setMuted={setMuted} />
          <p
            style={{
              color: '#9ca3af',
              fontSize: '0.75rem',
              marginTop: '0.5rem',
            }}
          >
            P1:A/D P2:←/→ P:ポーズ ESC:終了
          </p>
        </div>
      </GameContainer>
    </PageContainer>
  );
}
