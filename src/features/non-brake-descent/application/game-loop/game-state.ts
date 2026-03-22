/**
 * ゲーム状態の統合型定義
 *
 * ゲームワールドの状態と UI 状態を分離して管理する。
 * useReducer パターンで状態遷移を明示的に表現する。
 */
import type {
  Cloud,
  EffectState,
  NearMissEffect,
  Particle,
  Player,
  Ramp,
  ScorePopup,
} from '../../types';

/** コンボの状態 */
export interface ComboState {
  readonly count: number;
  readonly timer: number;
}

/** ゲームワールドの状態（ロジックに関わるデータ） */
export interface GameWorld {
  readonly player: Player;
  readonly ramps: readonly Ramp[];
  readonly speed: number;
  readonly camY: number;
  readonly score: number;
  readonly speedBonus: number;
  readonly combo: ComboState;
  readonly effect: EffectState;
  readonly lastRamp: number;
  readonly nearMissCount: number;
  readonly dangerLevel: number;
}

/** UI 表示に関わる状態（パーティクル・エフェクト等） */
export interface UIState {
  readonly particles: readonly Particle[];
  readonly jetParticles: readonly Particle[];
  readonly scorePopups: readonly ScorePopup[];
  readonly nearMissEffects: readonly NearMissEffect[];
  readonly clouds: readonly Cloud[];
  readonly shake: number;
  readonly transitionEffect: number;
}

/** useReducer で使用するゲームアクション型 */
export type GameAction =
  | { readonly type: 'TICK'; readonly input: FrameInput }
  | { readonly type: 'RESET' }
  | { readonly type: 'SET_SPEED'; readonly speed: number }
  | { readonly type: 'SET_SCORE'; readonly score: number }
  | { readonly type: 'ADD_SCORE'; readonly amount: number }
  | { readonly type: 'SET_EFFECT'; readonly effect: EffectState }
  | { readonly type: 'SET_COMBO'; readonly combo: ComboState }
  | { readonly type: 'SET_CAMERA'; readonly camY: number }
  | { readonly type: 'SET_DANGER_LEVEL'; readonly level: number }
  | { readonly type: 'TRANSITION_RAMP'; readonly player: Player; readonly lastRamp: number }
  | { readonly type: 'UPDATE_WORLD'; readonly world: Partial<GameWorld> }
  | { readonly type: 'UPDATE_UI'; readonly ui: Partial<UIState> };

/** フレーム処理に必要な入力情報 */
export interface FrameInput {
  readonly left: boolean;
  readonly right: boolean;
  readonly accel: boolean;
  readonly jump: boolean;
}

/** GameWorld のデフォルト初期値を生成するファクトリ */
export const createInitialGameWorld = (player: Player, ramps: readonly Ramp[]): GameWorld => ({
  player,
  ramps,
  speed: 0,
  camY: 0,
  score: 0,
  speedBonus: 0,
  combo: { count: 0, timer: 0 },
  effect: { type: undefined, timer: 0 },
  lastRamp: 0,
  nearMissCount: 0,
  dangerLevel: 0,
});

/** UIState のデフォルト初期値を生成するファクトリ */
export const createInitialUIState = (clouds: readonly Cloud[] = []): UIState => ({
  particles: [],
  jetParticles: [],
  scorePopups: [],
  nearMissEffects: [],
  clouds,
  shake: 0,
  transitionEffect: 0,
});
