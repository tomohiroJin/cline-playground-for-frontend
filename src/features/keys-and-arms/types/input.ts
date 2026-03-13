/**
 * KEYS & ARMS — 入力状態の型定義
 */

/** キー名 → 押下状態のマップ */
export interface InputState {
  [key: string]: boolean;
}
