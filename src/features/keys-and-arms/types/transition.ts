/**
 * KEYS & ARMS — 画面トランジション状態の型定義
 */
export interface TransitionState {
  /** 残りティック数（0 で非アクティブ） */
  t: number;
  /** メインテキスト */
  txt: string;
  /** トランジション中盤で実行するコールバック（次ステージ init 等） */
  fn: (() => void) | undefined;
  /** サブテキスト */
  sub: string;
}
