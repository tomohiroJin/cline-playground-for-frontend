/**
 * 戦闘状態の型定義
 */
import type { Enemy } from './units';

/** 戦闘の進行状態 */
export interface BattleState {
  /** 現在の敵（非戦闘時は null） */
  en: Enemy | null;
  /** 現在ターン数 */
  turn: number;
  /** バイオーム内の撃破数 */
  cW: number;
  /** バイオームあたりの敵数 */
  wpb: number;
  /** ティックカウンター */
  cT: number;
  /** 現在のログインデックス */
  cL: number;
  /** 会心発生回数 */
  cR: number;
  /** バイオーム環境ダメージ */
  bE: number;
}
