/**
 * 迷宮の残響 - ゲーム設定定数
 *
 * ゲーム全体の基本設定値を定義する。
 */

/** ゲーム基本設定 */
export const CFG = Object.freeze({
  EVENTS_PER_FLOOR: 3,
  MAX_FLOOR: 5,
  BASE_HP: 55,
  BASE_MN: 35,
  BASE_INF: 5,
  BOSS_EVENT_ID: "e030",
  MAX_BOSS_RETRIES: 3,
});

// FRESH_META は models/meta-state.ts で定義（DRY の単一ソース）
export { FRESH_META } from '../models/meta-state';
