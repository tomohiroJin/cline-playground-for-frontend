/**
 * コンボシステム
 *
 * 短時間に連続で敵を撃破するとコンボカウンターが加算され、
 * エフェクトが強化される。ダメージ倍率には影響しない。
 */

import { GAME_BALANCE } from '../config/gameBalance';

/** コンボ状態 */
export interface ComboState {
  /** 現在のコンボ数 */
  count: number;
  /** 最後の撃破時刻（ms） */
  lastKillTime: number;
  /** 最大コンボ数（記録用） */
  maxCombo: number;
}

/** コンボの時間窓（ms） */
export const COMBO_WINDOW_MS = GAME_BALANCE.combo.windowMs;

/** コンボ表示の最小値 */
export const COMBO_DISPLAY_MIN = GAME_BALANCE.combo.minDisplay;

/**
 * 初期コンボ状態を生成する
 */
export function createComboState(): ComboState {
  return { count: 0, lastKillTime: 0, maxCombo: 0 };
}

/**
 * 敵撃破時のコンボ更新
 *
 * 前回撃破から時間窓内なら加算、超過ならリセットして1から。
 */
export function registerKill(state: ComboState, now: number): ComboState {
  const isWithinWindow =
    state.count > 0 && now - state.lastKillTime <= COMBO_WINDOW_MS;

  const newCount = isWithinWindow ? state.count + 1 : 1;
  const newMax = Math.max(state.maxCombo, newCount);

  return {
    count: newCount,
    lastKillTime: now,
    maxCombo: newMax,
  };
}

/**
 * コンボが有効かどうかを判定する
 */
export function isComboActive(state: ComboState, now: number): boolean {
  if (state.count === 0) return false;
  return now - state.lastKillTime <= COMBO_WINDOW_MS;
}

/**
 * コンボによるエフェクト倍率を取得する
 *
 * パーティクル数や速度に適用される（ダメージには影響しない）。
 */
export function getComboMultiplier(state: ComboState): number {
  const { count } = state;
  if (count <= 1) return 1.0;
  if (count <= 3) return 1.2;
  if (count <= 6) return 1.4;
  if (count <= 9) return 1.6;
  return 1.8;
}
