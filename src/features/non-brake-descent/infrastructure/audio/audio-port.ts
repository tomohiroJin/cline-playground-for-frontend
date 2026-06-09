/**
 * オーディオシステムのポートインターフェース
 * アプリケーション層からオーディオ機能にアクセスするための抽象化
 */
export interface AudioPort {
  /** オーディオコンテキストを初期化する */
  init(): void;
  /** 指定された効果音を再生する */
  play(sound: string): void;
  /** 指定されたメロディを再生する */
  playMelody(name: string): void;
  /** コンボレベルに応じた効果音を再生する */
  playCombo(level: number): void;
  /** BGM を開始する */
  startBGM(): void;
  /** BGM を停止する */
  stopBGM(): void;
  /** 速度ランクに応じて BGM のテンポ・音色を切り替える */
  setSpeedRank(rank: number): void;
  /** オーディオリソースを解放する */
  cleanup(): void;
}
