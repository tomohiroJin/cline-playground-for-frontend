/**
 * エンドレスモードの型定義
 */

/** エンドレスモード固有の状態 */
export interface EndlessState {
  /** エンドレスモードフラグ */
  isEndless: boolean;
  /** エンドレスウェーブ数（3バイオーム踏破ごとに+1） */
  endlessWave: number;
}
