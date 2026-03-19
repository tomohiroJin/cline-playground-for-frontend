/**
 * 迷宮の残響 - Ending 値オブジェクト
 *
 * エンディング定義を表現する値オブジェクト。
 */
import type { Player } from './player';
import type { LogEntry } from './game-state';
import type { DifficultyId } from './difficulty';

/** エンディング定義 */
export interface EndingDef {
  readonly id: string;
  readonly name: string;
  readonly subtitle: string;
  readonly description: string;
  readonly cond: (player: Player, log: LogEntry[], diff: { readonly id: DifficultyId | string } | null) => boolean;
  readonly color: string;
  readonly icon: string;
  readonly bonusKp: number;
  readonly gradient: string;
}
