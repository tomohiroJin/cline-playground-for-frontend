/**
 * KEYS & ARMS — ゲーム全体状態の型定義
 */
import type { InputState } from './input';
import type { CaveState, PrairieState, BossState } from './stage';

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

  grs: PrairieState;

  bos: BossState;
}

/**
 * 初期化途中のゲーム状態
 * ステージ状態が未設定の状態を表す。
 * 各ステージ init でステージ状態が設定された後、GameState として使用される。
 */
export type UninitializedGameState = Omit<GameState, 'cav' | 'grs' | 'bos'> & {
  cav: Partial<CaveState>;
  grs: Partial<PrairieState>;
  bos: Partial<BossState>;
}
