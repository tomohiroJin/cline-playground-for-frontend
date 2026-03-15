/**
 * 迷宮の残響 - Ending 値オブジェクト
 *
 * エンディング定義を表現する値オブジェクト。
 */
import type { Player } from './player';
import type { LogEntry } from './game-state';

/** 旧互換用のDifficultyDef型（循環依存回避） */
interface DifficultyDefLike {
  readonly id: string;
}

/** エンディング定義 */
export interface EndingDef {
  readonly id: string;
  readonly name: string;
  readonly subtitle: string;
  readonly description: string;
  readonly cond: (player: Player, log: LogEntry[], diff: DifficultyDefLike | null) => boolean;
  readonly color: string;
  readonly icon: string;
  readonly bonusKp: number;
  readonly gradient: string;
}
