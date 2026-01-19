import React, { useEffect, useRef, useState, memo, ReactNode } from 'react';

// ============================================
// 1. Types & Interfaces
// ============================================
type Point = { x: number; y: number };
type Checkpoint = Point & { idx: number };
type Player = {
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
};
type Particle = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  size: number;
  color: string;
};
type Spark = { x: number; y: number; vx: number; vy: number; life: number; color: string };
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
type Decoration = { x: number; y: number; variant: number };
type CourseData = {
  name: string;
  bg: string;
  ground: string;
  deco: 'forest' | 'city' | 'mountain' | 'beach' | 'night' | 'snow';
  pts: number[][];
  checkpoints: number[];
  points: Point[];
  checkpointCoords: Checkpoint[];
};
type TrackInfo = { dist: number; seg: number; pt: Point; dir: number; onTrack: boolean };

// ============================================
// 2. Constants
// ============================================
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

const Courses: CourseData[] = [
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
].map(c => ({
  ...c,
  points: c.pts.map(([x, y]) => ({ x, y })),
  checkpointCoords: c.checkpoints.map(idx => {
    const [x, y] = c.pts[idx];
    return { x, y, idx };
  }),
})) as CourseData[];

// ============================================
// 3. Utilities
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
  randChoice: <T,>(arr: T[] | readonly T[]): T | null =>
    Array.isArray(arr) && arr.length > 0 ? arr[Utils.randInt(arr.length)] : null,
  normalizeAngle: (angle: number) => {
    let a = angle % (Math.PI * 2);
    if (a > Math.PI) a -= Math.PI * 2;
    if (a < -Math.PI) a += Math.PI * 2;
    return a;
  },
  formatTime: (ms: number) => {
    if (typeof ms !== 'number' || Number.isNaN(ms)) return '-:--.--';
    const abs = Math.abs(ms);
    const m = Math.floor(abs / 60000);
    const s = Math.floor((abs % 60000) / 1000);
    const c = Math.floor((abs % 1000) / 10);
    return `${m}:${String(s).padStart(2, '0')}.${String(c).padStart(2, '0')}`;
  },
  safeIndex: <T,>(arr: readonly T[], idx: number, fallback: T): T =>
    Array.isArray(arr) && idx >= 0 && idx < arr.length ? arr[idx] : fallback,
  dist: (x1: number, y1: number, x2: number, y2: number) => Math.hypot(x2 - x1, y2 - y1),
};

// ============================================
// 4. Sound Engine
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
        ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
        master = ctx.createGain();
        master.connect(ctx.destination);
        master.gain.value = volume;
      } catch {}
    }
    if (ctx && ctx.state === 'suspended') ctx.resume().catch(() => {});
    return ctx;
  };

  const tone = (freq: number, dur: number, type: OscillatorType = 'square', vol = 1) => {
    if (muted) return;
    const c = getCtx();
    if (!c || !master) return;
    try {
      const o = c.createOscillator();
      const g = c.createGain();
      o.type = type;
      o.frequency.value = Utils.clamp(freq, 20, 20000);
      g.gain.value = Utils.clamp(volume * vol, 0, 1);
      g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + dur);
      o.connect(g);
      g.connect(master);
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
    if (!c || !master) return;
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
      g.connect(master);
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
      if (!c || !master) return;
      try {
        engineOsc = c.createOscillator();
        engineGain = c.createGain();
        engineOsc.type = 'sawtooth';
        engineOsc.frequency.value = F.engine[0];
        engineGain.gain.value = volume * 0.08;
        engineOsc.connect(engineGain);
        engineGain.connect(master);
        engineOsc.start();
      } catch {}
    },

    updateEngine: (spd: number) => {
      if (engineOsc && engineGain && engineOsc.frequency) {
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
// 5. Entity Factory
// ============================================
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

  particle: (x: number, y: number, i: number): Particle => {
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

  spark: (x: number, y: number, angle: number, color: string): Spark => ({
    x: x - Math.cos(angle) * 20 + Utils.randRange(-15, 15),
    y: y - Math.sin(angle) * 20 + Utils.randRange(-15, 15),
    vx: -Math.cos(angle) * 8,
    vy: -Math.sin(angle) * 8,
    life: 0.5,
    color,
  }),

  confetti: (): Confetti => ({
    x: Math.random() * Config.canvas.width,
    y: Utils.randRange(-700, 0),
    vx: Utils.randRange(-2, 2),
    vy: Utils.randRange(3, 8),
    size: Utils.randRange(5, 15),
    color: Utils.randChoice(Colors.confetti) as string,
    rot: Utils.randRange(0, 360),
    rotSpd: Utils.randRange(-7.5, 7.5),
  }),

  decoration: (x: number, y: number): Decoration => ({ x, y, variant: Utils.randInt(3) }),
};

// ============================================
// 6. Track Calculations
// ============================================
const Track = {
  getInfo: (px: number, py: number, points: Point[]): TrackInfo => {
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
    sl: any,
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
// 7. Render & Logic Support
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

  background: (c: CanvasRenderingContext2D, course: CourseData) => {
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
    (
      [
        [trackWidth * 2 + 16, '#c00', []],
        [trackWidth * 2 + 16, '#fff', [20, 20]],
        [trackWidth * 2, '#3a3a3a', []],
        [trackWidth * 2 - 15, '#505050', []],
        [3, '#fff', [30, 20]],
      ] as [number, string, number[]][]
    ).forEach(([w, col, dash]) => {
      c.lineWidth = w;
      c.strokeStyle = col;
      c.setLineDash(dash);
      path();
      c.stroke();
    });
    c.setLineDash([]);
  },

  startLine: (c: CanvasRenderingContext2D, sl: any) => {
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

const renderDecos = (c: CanvasRenderingContext2D, decos: Decoration[], type: string) => {
  const fns = DecoRenderers[type];
  if (fns) decos.forEach(d => fns[d.variant % 3]?.(c, d.x, d.y));
};

const Logic = {
  cpuTurn: (p: Player, pts: Point[], skill: number, miss: number) => {
    const info = Track.getInfo(p.x, p.y, pts);
    const toCenter = Math.atan2(info.pt.y - p.y, info.pt.x - p.x);
    const nextIdx = (info.seg + 1) % pts.length;
    const toNext = Math.atan2(pts[nextIdx].y - p.y, pts[nextIdx].x - p.x);
    let target = info.dist / Config.game.trackWidth > 0.6 ? toCenter : toNext;
    let diff = Utils.normalizeAngle(target - p.angle);
    if (Math.random() < miss) diff += Utils.randRange(-0.4, 0.4);
    const rate = Config.game.turnRate * skill;
    return diff > 0.03 ? rate : diff < -0.03 ? -rate : 0;
  },

  movePlayer: (p: Player, baseSpd: number, pts: Point[]) => {
    const { speedRecovery, trackWidth, wallWarpThreshold } = Config.game;
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
// 8. UI Components
// ============================================
interface BtnProps {
  sel?: boolean;
  onClick?: () => void;
  children: ReactNode;
  cls?: string;
}
const Btn = memo(({ sel, onClick, children, cls = 'bg-blue-500' }: BtnProps) => (
  <button
    onClick={onClick}
    className={`px-2 py-1 rounded text-xs font-bold transition-colors ${sel ? cls : 'bg-gray-700 hover:bg-gray-600'}`}
    aria-pressed={sel}
  >
    {children}
  </button>
));

interface ColorBtnProps {
  color: string;
  sel: boolean;
  onClick: () => void;
  label?: string;
}
const ColorBtn = memo(({ color, sel, onClick, label }: ColorBtnProps) => (
  <button
    onClick={onClick}
    className={`w-6 h-6 rounded transition-transform ${sel ? 'ring-2 ring-white scale-110' : 'hover:scale-105'}`}
    style={{ background: color }}
    aria-label={label}
    aria-pressed={sel}
  />
));

interface TouchBtnProps {
  dir: string;
  onStart: (e: React.TouchEvent | React.MouseEvent) => void;
  onEnd: (e: React.TouchEvent | React.MouseEvent) => void;
  label?: string;
}
const TouchBtn = memo(({ dir, onStart, onEnd, label }: TouchBtnProps) => (
  <button
    className="w-16 h-16 bg-gray-700/80 rounded-full text-3xl active:bg-gray-500 select-none touch-none"
    onTouchStart={onStart}
    onTouchEnd={onEnd}
    onMouseDown={onStart}
    onMouseUp={onEnd}
    onMouseLeave={onEnd}
    aria-label={label}
  >
    {dir}
  </button>
));

interface VolumeCtrlProps {
  vol: number;
  setVol: (v: number) => void;
  muted: boolean;
  setMuted: (m: boolean) => void;
}
const VolumeCtrl = memo(({ vol, setVol, muted, setMuted }: VolumeCtrlProps) => (
  <div
    className="flex items-center gap-2 bg-gray-800/80 px-3 py-1 rounded-full"
    role="group"
    aria-label="音量コントロール"
  >
    <button
      onClick={() => setMuted(SoundEngine.toggleMute())}
      className="text-xl hover:scale-110 transition-transform"
      aria-label={muted ? 'ミュート解除' : 'ミュート'}
      aria-pressed={muted}
    >
      {muted ? '🔇' : vol > 0.5 ? '🔊' : vol > 0 ? '🔉' : '🔈'}
    </button>
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
      className="w-20 h-2 bg-gray-600 rounded-lg cursor-pointer accent-yellow-400"
      disabled={muted}
      aria-label="音量"
      aria-valuemin={0}
      aria-valuemax={1}
      aria-valuenow={vol}
    />
  </div>
));

// ============================================
// 9. Custom Hooks
// ============================================
const useInput = () => {
  const keys = useRef<Record<string, boolean>>({});
  const touch = useRef({ L: false, R: false });

  const setKey = (key: string, pressed: boolean) => {
    keys.current[key] = pressed;
  };

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

  return { keys, touch, setKey };
};

const useIdle = (
  active: boolean,
  timeout: number
): [boolean, React.Dispatch<React.SetStateAction<boolean>>] => {
  const [idle, setIdle] = useState(0);
  const [demo, setDemo] = useState(false);

  useEffect(() => {
    if (!active) {
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
// 10. Main Component
// ============================================
export default function RacingGame() {
  const [mode, setMode] = useState<'1p' | '2p' | 'cpu'>('2p');
  const [course, setCourse] = useState(0);
  const [speed, setSpeed] = useState(1);
  const [cpu, setCpu] = useState(1);
  const [laps, setLaps] = useState(3);
  const [c1, setC1] = useState(0);
  const [c2, setC2] = useState(1);

  const [state, setState] = useState<'start' | 'race' | 'result'>('start');
  const [winner, setWinner] = useState<string | null>(null);
  const [results, setResults] = useState<{ name: string; time: number; best: number }[] | null>(
    null
  );
  // const [bests, setBests] = useState<Record<string, number>>({}); // Corrected syntax
  const [paused, setPaused] = useState(false);
  const [vol, setVol] = useState(Config.audio.defaultVolume);
  const [muted, setMuted] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { keys, touch, setKey } = useInput();
  const [demo, setDemo] = useIdle(state === 'start', Config.timing.idle);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { width, height } = Config.canvas;
    canvas.width = width;
    canvas.height = height;

    const cIdx = demo ? Utils.randInt(Courses.length) : Utils.clamp(course, 0, Courses.length - 1);
    const cur = Courses[cIdx];
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

    let cdStart = Date.now();
    let raceStart = 0;
    let particles: Particle[] = [];
    let sparks: Spark[] = []; // Explicitly typed
    let confetti: Confetti[] = []; // Explicitly typed
    let shake = 0;
    let lapAnn: string | null = null;
    let lapAnnT = 0;
    let lead = 0;
    let lastCd = 4;
    let engineOn = false;
    let isRunning = true;
    const demoStart = demo ? Date.now() : 0;

    const decos: Decoration[] = [];
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
      if (particles.length > Config.game.maxParticles)
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
      const now = Date.now();

      if (state === 'start' && !demo) {
        if (cdStart === 0) cdStart = now;
        const diff = now - cdStart;
        const rem = Math.ceil((Config.timing.countdown - diff) / 1000);
        if (rem <= 0) {
          setState('race');
          raceStart = now;
          players.forEach(p => {
            p.lapStart = now;
          });
          SoundEngine.go();
          SoundEngine.startEngine();
          engineOn = true;
        } else if (rem < lastCd) {
          SoundEngine.countdown();
          lastCd = rem;
        }
      } else if (state === 'race' || demo) {
        // ... (truncated logic for brevity in prompt, effectively same as original but typed)
        // Re-implementing core race logic to ensure completeness

        // Move players
        players.forEach((p, i) => {
          const res = Logic.movePlayer(p, baseSpd, pts);
          players[i] = res.p;
          if (!res.info.onTrack && res.hit) {
            SoundEngine.wall();
            addParts(p.x, p.y);
          }

          // Checkpoints
          const updatedP = Logic.updateCheckpoints(players[i], cpCoords, () =>
            SoundEngine.checkpoint()
          );
          players[i] = updatedP;

          // Laps
          const info = res.info;
          const crossed = Track.crossedStart(p, sl, info.seg, p.lastSeg, pts.length);
          if (
            crossed &&
            Logic.allCheckpointsPassed(p.checkpointFlags, cur.checkpoints.length) &&
            now - p.lapStart > 5000
          ) {
            const t = now - p.lapStart;
            players[i].lapTimes.push(t);
            players[i].lapStart = now;
            players[i].lap++;
            players[i].checkpointFlags = 0; // Reset checkpoints

            if (!demo) {
              if (players[i].lap > maxLaps) {
                finished = true;
                if (!winner) {
                  setWinner(p.name);
                  SoundEngine.stopEngine();
                  SoundEngine.finish();
                  players[i].speed = 0;
                }
              } else {
                if (players[i].lap === maxLaps) SoundEngine.finalLap();
                else SoundEngine.lap();
                lapAnn = `LAP ${players[i].lap}`;
                lapAnnT = now;
              }
            }
          }
          if (info.seg >= 0) players[i].lastSeg = info.seg;

          // Progress for leading calc
          const lapScore = (p.lap - 1) * pts.length;
          const segScore =
            info.seg + (info.seg === 0 && p.lastSeg > pts.length - 5 ? pts.length : 0);
          players[i].progress = lapScore + segScore;
        });

        // Collisions
        if (mode !== '1p') {
          const col = Logic.handleCollision(players[0], players[1]);
          if (col) {
            players[0] = col.p1;
            players[1] = col.p2;
            SoundEngine.collision();
            const spark = Entity.spark(col.pt.x, col.pt.y, Math.random() * Math.PI * 2, '#fff'); // Placeholder angle
            sparks.push(spark);
          }
        }

        lead = players[0].progress > players[1].progress ? 0 : 1;
        if (engineOn) SoundEngine.updateEngine(Math.max(players[0].speed, players[1].speed));
      }

      // Physics updates (particles etc)
      particles = particles.filter(p => {
        p.x += p.vx;
        p.y += p.vy;
        p.life -= 0.05;
        return p.life > 0;
      });
      sparks = sparks.filter(p => {
        p.x += p.vx;
        p.y += p.vy;
        p.life -= 0.1;
        return p.life > 0;
      });
      confetti = confetti.filter(p => {
        p.y += p.vy * 0.5;
        p.rot += p.rotSpd;
        return p.y < height;
      });
      if (shake > 0) shake *= 0.9;
      if (shake < 0.5) shake = 0;

      // Winner sequence
      if (winner && state !== 'result') {
        if (confetti.length < Config.game.confettiCount) confetti.push(Entity.confetti());
        if (now - (players.find(p => p.name === winner)?.lapStart || 0) > 3000) {
          // Delay before result screen
          const res = players
            .map(p => ({
              name: p.name,
              time: Utils.sum(p.lapTimes),
              best: Utils.min(p.lapTimes),
            }))
            .sort((a, b) => a.time - b.time);
          setResults(res);
          setState('result');
          SoundEngine.stopEngine();
          isRunning = false;
        }
      }

      // Draw
      ctx.save();
      if (shake > 0)
        ctx.translate(Math.random() * shake - shake / 2, Math.random() * shake - shake / 2);

      Render.background(ctx, cur);
      Render.track(ctx, pts);
      Render.startLine(ctx, sl);
      Render.checkpoints(ctx, cpCoords); // Checkpoints render
      renderDecos(ctx, decos, cur.deco);

      players
        .slice()
        .sort((a, b) => a.y - b.y)
        .forEach(p => Render.kart(ctx, p)); // Z-sort cars

      Render.particles(ctx, particles, sparks);
      Render.confetti(ctx, confetti);
      if (winner) Render.fireworks(ctx, now);

      // HUD
      if (!demo && state !== 'result') {
        ctx.font = 'bold 20px Arial';
        ctx.textAlign = 'left';
        ctx.fillStyle = '#fff';
        ctx.fillText(`コース: ${cur.name} (${cur.checkpoints?.length || 0} checks)`, 20, 30);
        const remLaps = Math.max(0, maxLaps - players[0].lap + 1);
        const lapText = finished ? 'FINISH' : `LAP ${players[0].lap}/${maxLaps}`;
        ctx.fillText(lapText, 20, 60);

        if (lapAnn && now - lapAnnT < Config.timing.lapAnnounce) {
          ctx.font = 'bold 40px Arial';
          ctx.textAlign = 'center';
          ctx.fillStyle = '#ff0';
          ctx.fillText(lapAnn, width / 2, height / 3);
        }

        if (state === 'start') {
          const rem = Math.ceil((Config.timing.countdown - (now - cdStart)) / 1000);
          if (rem > 0 && rem <= 3) {
            ctx.font = 'bold 80px Arial';
            ctx.textAlign = 'center';
            ctx.fillStyle = rem === 1 ? '#f00' : '#ff0';
            ctx.fillText(String(rem), width / 2, height / 2);
          } else if (rem <= 0) {
            ctx.font = 'bold 80px Arial';
            ctx.textAlign = 'center';
            ctx.fillStyle = '#0f0';
            ctx.fillText('GO!', width / 2, height / 2);
          }
        }
      } else if (demo) {
        ctx.fillStyle = 'rgba(0,0,0,0.5)';
        ctx.fillRect(0, height - 60, width, 60);
        ctx.font = '20px Arial';
        ctx.textAlign = 'center';
        ctx.fillStyle = '#fff';
        ctx.fillText('デモプレイ中 - クリックまたはキーを押してスタート', width / 2, height - 25);
      }

      ctx.restore();
      requestAnimationFrame(update);
    };

    const animId = requestAnimationFrame(update);
    return () => {
      isRunning = false;
      cancelAnimationFrame(animId);
      SoundEngine.stopEngine();
    };
  }, [mode, course, speed, cpu, laps, c1, c2, state, winner, paused, demo]);

  const resetGame = () => {
    setState('start');
    setWinner(null);
    setResults(null);
    setPaused(false);
    SoundEngine.stopEngine();
    SoundEngine.cleanup();
  };

  // Render UI HTML
  if (state === 'start' && !demo) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white font-sans p-4">
        <h1 className="text-4xl font-bold mb-6 text-yellow-400">🏎️ レーシングゲーム</h1>
        <div className="bg-gray-800 p-6 rounded-lg shadow-lg max-w-2xl w-full space-y-4">
          <div className="flex justify-between items-center bg-gray-700 p-3 rounded">
            <span>モード:</span>
            <div className="flex gap-2">
              {['1p', '2p', 'cpu'].map(m => (
                <Btn key={m} sel={mode === m} onClick={() => setMode(m as '1p' | '2p' | 'cpu')}>
                  {m === '1p' ? '1人' : m === '2p' ? '2人対戦' : 'VS CPU'}
                </Btn>
              ))}
            </div>
          </div>
          <div className="flex justify-between items-center bg-gray-700 p-3 rounded">
            <span>コース:</span>
            <div className="grid grid-cols-3 gap-2">
              {Courses.map((c, i) => (
                <Btn key={i} sel={course === i} onClick={() => setCourse(i)}>
                  {c.name}
                </Btn>
              ))}
            </div>
          </div>
          <div className="flex justify-between items-center bg-gray-700 p-3 rounded">
            <span>スピード:</span>
            <div className="flex gap-2">
              {Options.speed.map((s, i) => (
                <Btn key={i} sel={speed === i} onClick={() => setSpeed(i)}>
                  {s.label}
                </Btn>
              ))}
            </div>
          </div>
          {mode === 'cpu' && (
            <div className="flex justify-between items-center bg-gray-700 p-3 rounded">
              <span>CPU強さ:</span>
              <div className="flex gap-2">
                {Options.cpu.map((c, i) => (
                  <Btn key={i} sel={cpu === i} onClick={() => setCpu(i)}>
                    {c.label}
                  </Btn>
                ))}
              </div>
            </div>
          )}
          <div className="flex justify-between items-center bg-gray-700 p-3 rounded">
            <span>周回数:</span>
            <div className="flex gap-2">
              {Options.laps.map(l => (
                <Btn key={l} sel={laps === l} onClick={() => setLaps(l)}>
                  {l}周
                </Btn>
              ))}
            </div>
          </div>
          <div className="flex flex-col gap-2 bg-gray-700 p-3 rounded">
            <div className="flex justify-between items-center">
              <span>P1カラー:</span>
              <div className="flex gap-1">
                {Colors.car.map((c, i) => (
                  <ColorBtn key={c} color={c} sel={c1 === i} onClick={() => setC1(i)} />
                ))}
              </div>
            </div>
            {mode !== '1p' && (
              <div className="flex justify-between items-center">
                <span>P2/CPUカラー:</span>
                <div className="flex gap-1">
                  {Colors.car.map((c, i) => (
                    <ColorBtn key={c} color={c} sel={c2 === i} onClick={() => setC2(i)} />
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
        <div className="mt-8 flex gap-4">
          <button
            onClick={() => setDemo(true)}
            className="px-6 py-2 bg-gray-600 rounded hover:bg-gray-500"
          >
            デモを見る
          </button>
          <button
            onClick={() => {
              setDemo(false);
              setState('start');
            }}
            className="px-8 py-3 bg-red-600 text-xl font-bold rounded-full hover:bg-red-500 transform hover:scale-105 transition-all shadow-lg shadow-red-500/50"
          >
            RACE START!
          </button>
        </div>
        <div className="mt-4">
          <VolumeCtrl vol={vol} setVol={setVol} muted={muted} setMuted={setMuted} />
        </div>
      </div>
    );
  }

  if (state === 'result' && results) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white p-4">
        <h1 className="text-5xl mb-4">🏁 FINISH!</h1>
        <div className="bg-gray-800 p-8 rounded-xl shadow-2xl max-w-md w-full text-center">
          <div className="text-3xl font-bold mb-6 text-yellow-400">{results[0].name} WINS!</div>
          <div className="space-y-4 mb-8">
            {results.map((r, i) => (
              <div
                key={i}
                className="flex justify-between items-center border-b border-gray-600 pb-2"
              >
                <span className={`text-xl ${i === 0 ? 'text-white' : 'text-gray-400'}`}>
                  {i + 1}. {r.name}
                </span>
                <div className="text-right">
                  <div className="text-2xl font-mono">{Utils.formatTime(r.time)}</div>
                  <div className="text-xs text-gray-500">Best: {Utils.formatTime(r.best)}</div>
                </div>
              </div>
            ))}
          </div>
          <button
            onClick={() => resetGame()}
            className="px-8 py-3 bg-blue-600 rounded-full font-bold hover:bg-blue-500"
          >
            もう一度走る
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-screen bg-black overflow-hidden select-none">
      <canvas ref={canvasRef} className="block w-full h-full object-contain" />

      {/* Controls Overlay */}
      {!demo && (
        <>
          <div className="absolute top-4 left-4 right-4 flex justify-between">
            <button
              onClick={() => setPaused(!paused)}
              className="bg-gray-800/80 p-2 rounded text-2xl"
            >
              {paused ? '▶' : '⏸'}
            </button>
            <VolumeCtrl vol={vol} setVol={setVol} muted={muted} setMuted={setMuted} />
          </div>

          <div className="absolute bottom-10 left-10 flex gap-4">
            <TouchBtn dir="←" onStart={() => setKey('a', true)} onEnd={() => setKey('a', false)} />
            <TouchBtn dir="→" onStart={() => setKey('d', true)} onEnd={() => setKey('d', false)} />
          </div>
          {mode !== '1p' &&
            !mode.includes('cpu') && ( // Only show P2 controls in 2P mode
              <div className="absolute bottom-10 right-10 flex gap-4">
                <TouchBtn
                  dir="←"
                  onStart={() => setKey('ArrowLeft', true)}
                  onEnd={() => setKey('ArrowLeft', false)}
                />
                <TouchBtn
                  dir="→"
                  onStart={() => setKey('ArrowRight', true)}
                  onEnd={() => setKey('ArrowRight', false)}
                />
              </div>
            )}
        </>
      )}

      {paused && (
        <div className="absolute inset-0 bg-black/60 flex items-center justify-center flex-col z-50">
          <h2 className="text-4xl text-white font-bold mb-8">PAUSED</h2>
          <div className="flex gap-4">
            <button
              onClick={() => setPaused(false)}
              className="px-6 py-2 bg-green-600 text-white rounded hover:bg-green-500"
            >
              再開
            </button>
            <button
              onClick={() => resetGame()}
              className="px-6 py-2 bg-red-600 text-white rounded hover:bg-red-500"
            >
              リタイア
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function cancelAnimationFrame(animId: number) {
  window.cancelAnimationFrame(animId);
}
