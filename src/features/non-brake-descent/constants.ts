export const GameState = {
  TITLE: 'title',
  COUNTDOWN: 'countdown',
  PLAY: 'play',
  DYING: 'dying',
  OVER: 'over',
  CLEAR: 'clear',
} as const;

export const ObstacleType = {
  HOLE_S: 'holeS',
  HOLE_L: 'holeL',
  ROCK: 'rock',
  ENEMY: 'enemy',
  ENEMY_V: 'enemyV',
  SCORE: 'score',
  REVERSE: 'reverse',
  FORCE_JUMP: 'forceJ',
  TAKEN: 'taken',
  DEAD: 'dead',
} as const;

export const RampType = {
  NORMAL: 'normal',
  STEEP: 'steep',
  GENTLE: 'gentle',
  V_SHAPE: 'vshape',
} as const;

export const SpeedRank = {
  LOW: 0,
  MID: 1,
  HIGH: 2,
} as const;

export const EffectType = {
  REVERSE: 'reverse',
  FORCE_JUMP: 'forceJ',
} as const;

export const RampColors = [
  { base: ['#4466aa', '#223366'], stroke: '#6688cc', bg: '#1a2244' },
  { base: ['#aa6644', '#663322'], stroke: '#cc8866', bg: '#2a1a11' },
  { base: ['#44aa66', '#226633'], stroke: '#66cc88', bg: '#112a1a' },
  { base: ['#aa44aa', '#662266'], stroke: '#cc66cc', bg: '#2a112a' },
  { base: ['#aaaa44', '#666622'], stroke: '#cccc66', bg: '#2a2a11' },
  { base: ['#44aaaa', '#226666'], stroke: '#66cccc', bg: '#112a2a' },
] as const;

export const Ranks = [
  { rank: 'S', minScore: 50000, color: '#ffdd00', message: 'PERFECT!' },
  { rank: 'A', minScore: 30000, color: '#44ffaa', message: 'EXCELLENT!' },
  { rank: 'B', minScore: 15000, color: '#44aaff', message: 'GREAT!' },
  { rank: 'C', minScore: 5000, color: '#aaaaaa', message: 'GOOD' },
  { rank: 'D', minScore: 0, color: '#aa6666', message: 'TRY AGAIN' },
] as const;
