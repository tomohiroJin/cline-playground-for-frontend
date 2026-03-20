/**
 * ブラウザタイマー — TimerPort の Date.now() ベース実装
 */
import { TimerPort } from '../../application/ports/timer-port';

/**
 * Date.now() ベースのタイマー実装
 *
 * start() は新しいタイマーを開始する（前回の経過時間はリセットされる）。
 * 一時停止・再開が必要な場合は別途 resume メソッドを追加すること。
 */
export class BrowserTimer implements TimerPort {
  private startTime: number | null = null;
  private elapsedAtStop = 0;
  private running = false;

  /** 新しいタイマーを開始する（経過時間をリセット） */
  start(): void {
    this.startTime = Date.now();
    this.elapsedAtStop = 0;
    this.running = true;
  }

  /** タイマーを停止する（経過時間を保持） */
  stop(): void {
    if (this.running && this.startTime !== null) {
      this.elapsedAtStop = this.getElapsed();
      this.startTime = null;
      this.running = false;
    }
  }

  /** 経過時間（秒）を取得する */
  getElapsed(): number {
    if (!this.running || this.startTime === null) return this.elapsedAtStop;
    return Math.floor((Date.now() - this.startTime) / 1000);
  }
}
