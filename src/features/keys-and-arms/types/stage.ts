/**
 * KEYS & ARMS — ステージ共通インターフェース・ステージ状態型
 */

import type {
  Particle,
  GrassParticle,
  SparkParticle,
  DustParticle,
  FeatherParticle,
  SmokeParticle,
  KeySparkParticle,
  DripParticle,
} from './particles';

/** ステージ共通インターフェース */
export interface Stage {
  init(): void;
  update(newBeat: boolean): void;
  draw(): void;
}

/** 洞窟ステージ状態 */
export interface CaveState {
  pos: number;
  prevPos: number;
  dir: number;
  keys: boolean[];
  keysPlaced: number;
  carrying: boolean;
  trapOn: boolean;
  trapBeat: number;
  trapSparks: Array<{ x: number; y: number; vx: number; vy: number; l: number }>;
  trapWasDanger: number;
  cageProgress: number;
  cageMax: number;
  cageHolding: boolean;
  batPhase: number;
  batBeat: number;
  batHitAnim: number;
  batWasDanger: number;
  mimicOpen: boolean;
  mimicBeat: number;
  pryCount: number;
  mimicShake: number;
  mimicWasDanger: number;
  pryDecayT: number;
  spiderY: number;
  spiderBeat: number;
  spiderWasDanger: number;
  hurtCD: number;
  actAnim: number;
  actType: string;
  walkAnim: number;
  idleT: number;
  won: boolean;
  wonT: number;
  trailAlpha: number;
  roomNameT: number;
  roomName: string;
  // パーティクルプール（旧 GameState トップレベルから移動）
  sparks: SparkParticle[];
  dust: DustParticle[];
  feathers: FeatherParticle[];
  smoke: SmokeParticle[];
  stepDust: Particle[];
  keySpk: KeySparkParticle[];
  drips: DripParticle[];
}

/** 草原の敵 */
export interface PrairieEnemy {
  type: string;
  beh: string;
  lane: number;
  step: number;
  dead: boolean;
  wait: number;
  shiftDir: number;
  shifted: boolean;
  dashReady: boolean;
  dashFlash: number;
  spawnT: number;
}

/** 草原のシールドオーブ */
export interface ShieldOrb {
  y: number;
  alpha: number;
  t: number;
}

/** 草原ステージ状態 */
export interface PrairieState {
  ens: PrairieEnemy[];
  kills: number;
  goal: number;
  maxSpawn: number;
  spawned: number;
  guards: number;
  atkAnim: [number, number];
  atkCD: number;
  guardAnim: number;
  guardFlash: number;
  hurtCD: number;
  combo: number;
  comboT: number;
  maxCombo: number;
  won: boolean;
  wonT: number;
  shieldOrbs: ShieldOrb[];
  nextShieldAt: number;
  sweepReady: boolean;
  sweepFlash: number;
  // パーティクルプール（旧 GameState トップレベルから移動）
  slash: Array<{ lane: number; life: number; hit: boolean }>;
  dead: Particle[];
  grass: GrassParticle[];
  laneFlash: Array<{ lane: number; life: number }>;
  miss: Array<{ lane: number; life: number }>;
}

/** ボスステージ状態 */
export interface BossState {
  pos: number;
  hasGem: boolean;
  peds: number[];
  armStage: number[];
  armDir: number[];
  armSpeed: number[];
  armBaseSpd: number;
  armSpdVar: number;
  armRest: number[];
  armBaseRest: number;
  armRestVar: number;
  armBeat: number[];
  armResting: boolean[];
  armRestT: number[];
  armWarn: number[];
  shields: number;
  hurtCD: number;
  moveCD: number;
  won: boolean;
  wonT: number;
  walkT: number;
  prevPos: number;
  stealAnim: [number, number];
  placeAnim: [number, number];
  shieldAnim: [number, number];
  bossAnger: number;
  bossPulse: number;
  bossBreath: number;
  counterCD: number;
  counterFlash: [number, number];
  rageWave: number;
  quake: number;
  // パーティクルプール（旧 GameState トップレベルから移動）
  particles: Particle[];
  shieldBreak: Array<{ idx: number; life: number }>;
  armTrail: Array<{ idx: number; life: number }>;
}
