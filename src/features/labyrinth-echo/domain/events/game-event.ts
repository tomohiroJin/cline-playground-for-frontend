/**
 * 迷宮の残響 - GameEvent エンティティ
 *
 * イベントの型定義を新しいドメインモデルとして再定義。
 */
import type { MetaState } from '../models/meta-state';

/**
 * アウトカム（イベント結果）
 *
 * イベントデータ（163件）で頻繁に使用されるため、
 * プロパティ名はデータサイズ削減を目的に短縮形を採用している。
 */
export interface Outcome {
  /** condition — アウトカム適用条件（"default" | "hp>30" | "status:負傷" 等） */
  readonly c: string;
  /** result — 結果テキスト */
  readonly r: string;
  /** HP変化量（正:回復、負:ダメージ） */
  readonly hp?: number;
  /** MN(精神力)変化量 */
  readonly mn?: number;
  /** INF(情報値)変化量 */
  readonly inf?: number;
  /** flag — フラグ文字列（"chain:xxx" | "add:負傷" | "escape" 等） */
  readonly fl?: string;
}

/**
 * 選択肢
 *
 * プロパティ名はイベントデータとの一貫性を保つため短縮形。
 */
export interface Choice {
  /** text — 選択肢の表示テキスト */
  readonly t: string;
  /** outcomes — アウトカム配列（条件分岐対応） */
  readonly o: readonly Outcome[];
}

/**
 * ゲームイベント定義
 *
 * プロパティ名はイベントデータ（163件）との一貫性を保つため短縮形。
 * 各フィールドの正式名称は JSDoc を参照。
 */
export interface GameEvent {
  /** イベント一意ID */
  readonly id: string;
  /** floors — 出現フロア番号の配列 */
  readonly fl: readonly number[];
  /** type — イベント種別（"exploration" | "combat" | "rest" 等） */
  readonly tp: string;
  /** situation — シーン説明テキスト */
  readonly sit: string;
  /** choices — 選択肢の配列 */
  readonly ch: readonly Choice[];
  /** チェイン専用イベントかどうか（通常選出対象外） */
  readonly chainOnly?: boolean;
  /** メタ条件（メタ状態に基づく出現制御） */
  readonly metaCond?: (meta: MetaState) => boolean;
}

// EventTypeDef は domain/constants/event-type-defs.ts で定義
export type { EventTypeDef } from '../constants/event-type-defs';
