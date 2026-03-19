/**
 * 迷宮の残響 - AudioPort（オーディオポート）
 *
 * 依存性逆転の原則に基づくオーディオインターフェース。
 * infrastructure層の AudioEngine 実装詳細を隠蔽する。
 */

/** 効果音種別 */
export type SfxType =
  | 'tick' | 'hit' | 'bigHit' | 'heal'
  | 'status' | 'clear' | 'floor' | 'over'
  | 'victory' | 'choice' | 'drain' | 'levelUp'
  | 'page' | 'unlock' | 'titleGlow'
  | 'endingFanfare' | 'curseApply' | 'secondLife'
  | 'ambient';

/** イベントムード */
export type EventMood = 'exploration' | 'encounter' | 'trap' | 'rest' | 'boss';

/** オーディオポート */
export interface AudioPort {
  /** AudioContext を初期化 */
  initialize(): void;
  /** 効果音を再生 */
  playSfx(sfxType: SfxType): void;
  /** BGM を開始 */
  startBgm(floor: number): void;
  /** BGM を停止 */
  stopBgm(): void;
  /** イベントムードを設定 */
  setMood(mood: EventMood): void;
  /** 危機状態を更新 */
  updateCrisis(hpRatio: number, mnRatio: number): void;
  /** BGM 音量を設定 */
  setVolume(volume: number): void;
}
