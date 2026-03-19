/**
 * オーディオ操作のポートインターフェース
 *
 * Tone.js 等の音声ライブラリを抽象化する。
 * テスト時は SilentAudioAdapter に差し替え可能。
 */

/** オーディオ操作のインターフェース */
export interface AudioPort {
  /** 音声システムを初期化する */
  initialize(): void;
  /** BGM を再生する */
  playBgm(): void;
  /** BGM を停止する */
  stopBgm(): void;
  /** 正解効果音を再生する */
  playSfxCorrect(): void;
  /** 不正解効果音を再生する */
  playSfxIncorrect(): void;
  /** タイマーティック音を再生する */
  playSfxTick(): void;
  /** 緊急ティック音を再生する（残り秒数でピッチ変動） */
  playSfxTickUrgent(remaining: number): void;
  /** コンボ効果音を再生する */
  playSfxCombo(): void;
  /** コンボ切れ効果音を再生する */
  playSfxComboBreak(): void;
  /** ドラムロール効果音を再生する */
  playSfxDrumroll(): void;
  /** ファンファーレ効果音を再生する */
  playSfxFanfare(): void;
  /** 実績獲得効果音を再生する */
  playSfxAchievement(): void;
  /** ゲーム開始効果音を再生する */
  playSfxStart(): void;
  /** 結果表示効果音を再生する */
  playSfxResult(): void;
}
