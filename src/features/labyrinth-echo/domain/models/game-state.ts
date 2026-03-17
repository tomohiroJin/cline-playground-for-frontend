/**
 * 迷宮の残響 - GameState 集約ルート
 *
 * ゲーム状態とフェーズを表現する型定義。
 */
import type { Player } from './player';
import type { DifficultyDef } from './difficulty';

/** 死因 */
export type DeathCause = '体力消耗' | '精神崩壊';

/** メニュー画面種別 */
export type MenuScreen = 'unlocks' | 'titles' | 'records' | 'settings' | 'reset_confirm1' | 'reset_confirm2';

/**
 * ログエントリー定義
 *
 * 1ラン中に大量に蓄積されるため、プロパティ名はデータサイズ削減を目的に短縮形。
 */
export interface LogEntry {
  /** floor — フロア番号 */
  readonly fl: number;
  /** ステップ番号 */
  readonly step: number;
  /** choice — 選択した選択肢のテキスト */
  readonly ch: string;
  /** HP変化量 */
  readonly hp: number;
  /** MN(精神力)変化量 */
  readonly mn: number;
  /** INF(情報値)変化量 */
  readonly inf: number;
  /** フラグ文字列（"add:負傷" | "chain:xxx" 等） */
  readonly flag?: string;
}

/**
 * 旧互換用のGamePhase文字列型（移行期間中に使用）
 * TODO(2026-06-30): Discriminated Union への移行完了後に削除予定
 */
export type LegacyGamePhase =
  | 'title'
  | 'difficulty'
  | 'explore'
  | 'event'
  | 'result'
  | 'floor_clear'
  | 'game_over'
  | 'ending'
  | 'unlocks'
  | 'stats';

/**
 * ゲームフェーズ（Discriminated Union）
 * 将来的に各フェーズに関連データを同梱する予定。
 * 移行期間中はLegacyGamePhase文字列と併用。
 */
export type GamePhase = LegacyGamePhase;

/** ゲーム状態（1ラン分） */
export interface GameState {
  readonly phase: GamePhase;
  readonly player: Player | null;
  readonly difficulty: DifficultyDef | null;
  readonly floor: number;
  readonly step: number;
  readonly usedEventIds: readonly string[];
  readonly log: readonly LogEntry[];
  readonly chainNextId: string | null;
  readonly usedSecondLife: boolean;
}
