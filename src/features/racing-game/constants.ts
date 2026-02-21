// Racing Game 定数定義

import type { Course } from './types';

export const Config = Object.freeze({
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

export const Colors = Object.freeze({
  car: ['#E60012', '#0066FF', '#00AA00', '#FF6600', '#AA00AA', '#FFCC00'],
  particle: ['#ff0', '#f80', '#f00'],
  confetti: ['#ff0', '#f0f', '#0ff', '#f00', '#0f0', '#00f'],
  firework: ['#ff0', '#f0f', '#0ff', '#f00', '#0f0'],
});

export const Options = Object.freeze({
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

// ドリフト定数
export const DRIFT = Object.freeze({
  MIN_SPEED: 0.4,
  ANGLE_MULTIPLIER: 1.8,
  SPEED_RETAIN: 0.92,
  MAX_SLIP_ANGLE: Math.PI / 4, // 45度
  LATERAL_FORCE: 0.15,
  BOOST_BASE: 0.05,
  BOOST_PER_SEC: 0.1,
  BOOST_MAX: 0.3,
  BOOST_DURATION: 0.5,
});

// HEAT（ニアミスボーナス）定数
export const HEAT = Object.freeze({
  WALL_THRESHOLD: 25,
  CAR_THRESHOLD: 40,
  GAIN_RATE: 0.8,
  DECAY_RATE: 0.15,
  BOOST_POWER: 0.25,
  BOOST_DURATION: 0.8,
  COOLDOWN: 1.0,
});

// 壁ヒットペナルティ定数（段階的減速 — 強化版）
export const WALL = Object.freeze({
  LIGHT_FACTOR: 0.60,   // wallStuck = 1（壁接触1回目で40%減速）
  MEDIUM_FACTOR: 0.40,  // wallStuck = 2〜3（2-3回目で60%減速）
  HEAVY_FACTOR: 0.20,   // wallStuck >= 4（4回目以降で80%減速）
  WARP_THRESHOLD: 3,    // ワープしきい値（3フレームでワープ、ハマり時間さらに短縮）
});

// コースデータ
export const Courses: Course[] = [
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
