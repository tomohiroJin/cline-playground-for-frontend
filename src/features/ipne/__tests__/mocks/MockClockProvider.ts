/**
 * テスト用時計プロバイダーモック
 */
import { ClockProvider } from '../../domain/ports';

export class MockClockProvider implements ClockProvider {
  private currentTime: number;

  constructor(initialTime: number = 0) {
    this.currentTime = initialTime;
  }

  now(): number {
    return this.currentTime;
  }

  /** 指定ミリ秒だけ時刻を進める */
  advance(ms: number): void {
    this.currentTime += ms;
  }

  /** 時刻を直接設定する */
  set(time: number): void {
    this.currentTime = time;
  }
}
