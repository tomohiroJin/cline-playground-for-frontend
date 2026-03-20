/**
 * タイマーポート（インターフェース）
 *
 * タイマーの具体実装に依存しないようにする。
 */
export interface TimerPort {
  /** タイマーを開始する */
  start(): void;
  /** タイマーを停止する */
  stop(): void;
  /** 経過時間（秒）を取得する */
  getElapsed(): number;
}
