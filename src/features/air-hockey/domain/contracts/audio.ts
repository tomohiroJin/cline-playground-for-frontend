/**
 * オーディオポート（インターフェース）
 * - ドメイン層で定義し、インフラ層で実装する
 * - 依存性逆転の原則（DIP）に基づく抽象化
 */
export interface AudioPort {
  // 効果音
  playHit(speed: number): void;
  playWall(angle?: number): void;
  playGoal(): void;
  playLose(): void;
  playItem(): void;
  playCountdown(): void;
  playGo(): void;
  playStart(): void;

  // BGM
  startBgm(): void;
  stopBgm(): void;
  setBgmTempo(tempo: number): void;

  // 設定
  setBgmVolume(volume: number): void;
  setSeVolume(volume: number): void;
  setMuted(muted: boolean): void;
}
