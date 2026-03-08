/**
 * ゲーム進行状態の型定義
 */
import type { BiomeId, BiomeIdExt, CivTypeExt, Difficulty } from './common';

/** ゲーム進行状態 */
export interface ProgressState {
  /** 現在の難易度インデックス */
  di: number;
  /** 難易度定義 */
  dd: Difficulty;
  /** クリア済みバイオーム数 */
  bc: number;
  /** バイオーム順序 */
  bms: BiomeId[];
  /** 現在のバイオームインデックス */
  cB: number;
  /** 現在のバイオームタイプID */
  cBT: BiomeIdExt;
  /** 最終進化の文明タイプ（未達成は null） */
  fe: CivTypeExt | null;
  /** 進化回数 */
  evoN: number;
  /** 最終進化要件（必要文明レベル） */
  fReq: number;
}
