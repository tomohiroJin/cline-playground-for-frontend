/**
 * 迷宮の残響 - GameEvent エンティティ
 *
 * イベントの型定義を新しいドメインモデルとして再定義。
 */
import type { MetaState } from '../models/meta-state';

/** アウトカム（イベント結果） */
export interface Outcome {
  readonly c: string;
  readonly r: string;
  readonly hp?: number;
  readonly mn?: number;
  readonly inf?: number;
  readonly fl?: string;
}

/** 選択肢 */
export interface Choice {
  readonly t: string;
  readonly o: readonly Outcome[];
}

/** ゲームイベント定義 */
export interface GameEvent {
  readonly id: string;
  readonly fl: readonly number[];
  readonly tp: string;
  readonly sit: string;
  readonly ch: readonly Choice[];
  readonly chainOnly?: boolean;
  readonly metaCond?: (meta: MetaState) => boolean;
}

// EventTypeDef は domain/constants/event-type-defs.ts で定義
export type { EventTypeDef } from '../constants/event-type-defs';
