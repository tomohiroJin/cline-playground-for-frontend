/**
 * プレイヤー状態管理（純粋関数）
 *
 * HP、スコア、ノーダメージフラグの管理を担当する。
 */
import { assert } from '../contracts/assertions';

/** プレイヤー状態 */
export interface PlayerState {
  readonly hp: number;
  readonly maxHp: number;
  readonly score: number;
  readonly noDmg: boolean;
}

/** プレイヤー状態を生成 */
export function createPlayerState(hp: number, maxHp: number): PlayerState {
  return { hp, maxHp, score: 0, noDmg: true };
}

/** ダメージを適用 */
export function applyDamage(state: PlayerState): PlayerState {
  return {
    ...state,
    hp: Math.max(0, state.hp - 1),
    noDmg: false,
  };
}

/** 回復を適用 */
export function applyHeal(state: PlayerState): PlayerState {
  return {
    ...state,
    hp: Math.min(state.maxHp, state.hp + 1),
  };
}

/** スコアを加算 */
export function addScore(state: PlayerState, points: number): PlayerState {
  assert(points >= 0, '加算ポイントは 0 以上');
  return {
    ...state,
    score: state.score + points,
  };
}

/** プレイヤーが死亡しているか */
export function isPlayerDead(state: PlayerState): boolean {
  return state.hp <= 0;
}

/** ダメージを受けられるか（無敵時間チェック） */
export function canBeHurt(hurtCD: number): boolean {
  return hurtCD <= 0;
}
