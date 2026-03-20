// 音声ポートインターフェース

/** 効果音の種類 */
export type SfxType =
  | 'collision'
  | 'lap'
  | 'countdown'
  | 'go'
  | 'finish'
  | 'finalLap'
  | 'checkpoint'
  | 'driftStart'
  | 'driftBoost'
  | 'heatMax'
  | 'heatBoost'
  | 'cardSelect';

/** 壁衝突段階 */
export type WallStage = 0 | 1 | 2 | 3;

export interface AudioPort {
  /** エンジン音の開始 */
  startEngine(): void;
  /** エンジン音の更新 */
  updateEngine(speed: number): void;
  /** エンジン音の停止 */
  stopEngine(): void;
  /** 効果音の再生 */
  playSfx(type: SfxType): void;
  /** 壁衝突音（段階別） */
  playWallHit(stage: WallStage): void;
  /** クリーンアップ */
  cleanup(): void;
}
