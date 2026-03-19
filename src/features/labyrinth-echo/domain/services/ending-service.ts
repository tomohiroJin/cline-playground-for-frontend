/**
 * 迷宮の残響 - EndingService（エンディング判定サービス）
 *
 * エンディング判定・死亡テキストを提供する純粋関数群。
 * definitions.ts から抽出。
 */
import { ENDINGS, DEATH_FLAVORS, DEATH_TIPS } from '../constants/ending-defs';
import type { EndingDef } from '../models/ending';
import type { Player } from '../models/player';
import type { LogEntry, DeathCause } from '../models/game-state';

/** 旧互換用の難易度型 */
interface DifficultyLike {
  readonly id: string;
}

/**
 * 脱出時のプレイヤー状態からエンディングを決定する
 * 最初にマッチしたエンディングが優先される
 * @pre player.hp > 0 && player.mn > 0
 */
export const determineEnding = (
  player: Player,
  log: LogEntry[],
  diff: DifficultyLike | null,
): EndingDef => {
  for (const e of ENDINGS) {
    if (e.cond(player, log, diff)) return e;
  }
  return ENDINGS[ENDINGS.length - 1];
};

/** 死亡フレーバーテキストを取得する */
export const getDeathFlavor = (cause: DeathCause, runCount: number): string => {
  const flavors = DEATH_FLAVORS[cause];
  return flavors[runCount % flavors.length];
};

/** 死亡時のコンテキストヒントを取得する */
export const getDeathTip = (cause: DeathCause, floor: number): string => {
  const tips = DEATH_TIPS[cause];

  // フロア別ヒントを付加
  let floorHint = '';
  if (floor <= 2) floorHint = DEATH_TIPS.early;
  else if (floor <= 4) floorHint = DEATH_TIPS.mid;
  else floorHint = DEATH_TIPS.late;

  // ランダムにヒントを選択（決定論的にするため floor をインデックスに使用）
  return tips[floor % tips.length] + '\n' + floorHint;
};
