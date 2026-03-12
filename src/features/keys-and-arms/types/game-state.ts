/**
 * KEYS & ARMS — ゲーム全体状態の型定義
 */
import type { InputState } from './input';
import type { CaveState, PrairieState, BossState } from './stage';
import type { Particle } from './particles';

/** ゲーム画面状態 */
export type GameScreen =
  | 'title'
  | 'help'
  | 'cave'
  | 'grass'
  | 'boss'
  | 'over'
  | 'ending1'
  | 'trueEnd';

/** 浮遊ほこりパーティクル */
export interface DustParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  s: number;
  a: number;
}

/** 松明の煙パーティクル */
export interface SmokeParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  s: number;
}

/** 火花パーティクル */
export interface SparkParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
}

/** 羽パーティクル */
export interface FeatherParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
}

/** 鍵きらめきパーティクル */
export interface KeySparkParticle {
  x: number;
  y: number;
  life: number;
}

/** 水滴パーティクル */
export interface DripParticle {
  x: number;
  y: number;
  vy: number;
  life: number;
}

/** 草パーティクル */
export interface GrassParticle {
  x: number;
  y: number;
  h: number;
  ph: number;
}

/** ゲーム全体の状態 */
export interface GameState {
  // 画面制御
  state: GameScreen;
  loop: number;
  score: number;
  dispScore: number;
  hp: number;
  maxHp: number;
  tick: number;
  beatCtr: number;
  beatNum: number;
  beatPulse: number;
  noDmg: boolean;
  hurtFlash: number;
  shakeT: number;
  hitStop: number;
  hi: number;
  resetConfirm: number;
  earnedShields: number;
  bgmBeat: number;
  paused: boolean;
  helpPage: number;

  // 入力
  jp: InputState;
  kd: InputState;

  // トランジション
  trT: number;
  trTxt: string;
  trFn: (() => void) | undefined;
  trSub: string;

  // タイトル画面
  blink: number;
  cheatBuf: string;

  // エンディング
  e1T: number;
  teT: number;

  // ステージ状態（各ステージ init で完全初期化される）
  cav: CaveState;
  sparks: SparkParticle[];
  dust: DustParticle[];
  feathers: FeatherParticle[];
  smoke: SmokeParticle[];
  stepDust: Particle[];
  keySpk: KeySparkParticle[];
  cavDrips: DripParticle[];

  grs: PrairieState;
  grsSlash: Array<{ lane: number; life: number; hit: boolean }>;
  grsDead: Particle[];
  grsGrass: GrassParticle[];
  grsDust: Particle[];
  grsLaneFlash: Array<{ lane: number; life: number }>;
  grsMiss: Array<{ lane: number; life: number }>;

  bos: BossState;
  bosParticles: Particle[];
  bosShieldBreak: Array<{ idx: number; life: number }>;
  bosArmTrail: Array<{ idx: number; life: number }>;

  // 遅延バインド
  cavInit: (() => void) | undefined;
  grsInit: (() => void) | undefined;
  bosInit: (() => void) | undefined;
  startGame: (() => void) | undefined;
}

/**
 * 初期化途中のゲーム状態
 * ステージ状態と遅延バインドが未設定の状態を表す。
 * engine.ts で遅延バインドが完了した後、GameState として使用される。
 */
export type UninitializedGameState = Omit<GameState, 'cav' | 'grs' | 'bos' | 'cavInit' | 'grsInit' | 'bosInit' | 'startGame'> & {
  cav: Partial<CaveState>;
  grs: Partial<PrairieState>;
  bos: Partial<BossState>;
  cavInit: (() => void) | undefined;
  grsInit: (() => void) | undefined;
  bosInit: (() => void) | undefined;
  startGame: (() => void) | undefined;
}
