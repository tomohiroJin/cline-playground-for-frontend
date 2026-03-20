/**
 * テスト用 Null オーディオアダプタ
 * - 何もしない実装（テスト時の音声抑制）
 * - 呼び出し記録機能付き（spy 的に使用可能）
 */
import type { AudioPort } from '../../domain/contracts/audio';

export type AudioCall = { method: string; args: unknown[] };

export class NullAudioAdapter implements AudioPort {
  readonly calls: AudioCall[] = [];

  private record(method: string, ...args: unknown[]): void {
    this.calls.push({ method, args });
  }

  playHit(speed: number): void { this.record('playHit', speed); }
  playWall(angle?: number): void { this.record('playWall', angle); }
  playGoal(): void { this.record('playGoal'); }
  playLose(): void { this.record('playLose'); }
  playItem(): void { this.record('playItem'); }
  playCountdown(): void { this.record('playCountdown'); }
  playGo(): void { this.record('playGo'); }
  playStart(): void { this.record('playStart'); }
  startBgm(): void { this.record('startBgm'); }
  stopBgm(): void { this.record('stopBgm'); }
  setBgmTempo(tempo: number): void { this.record('setBgmTempo', tempo); }
  setBgmVolume(volume: number): void { this.record('setBgmVolume', volume); }
  setSeVolume(volume: number): void { this.record('setSeVolume', volume); }
  setMuted(muted: boolean): void { this.record('setMuted', muted); }

  /** 指定メソッドの呼び出し回数を返す */
  getCallCount(method: string): number {
    return this.calls.filter(c => c.method === method).length;
  }

  /** 呼び出し記録をクリアする */
  clear(): void {
    this.calls.length = 0;
  }
}
