/**
 * 難易度調整ドメインサービス
 * - core/difficulty-adjust.ts のロジックを移行（localStorage 依存なし）
 * - 純粋関数のみ
 */
import type { Difficulty } from '../../core/types';

/** 連勝/連敗の記録 */
export type StreakRecord = {
  winStreak: number;
  loseStreak: number;
};

/** 提案を出す閾値 */
export const STREAK_THRESHOLD = 3;

/** 難易度の順序 */
const DIFFICULTY_ORDER: Difficulty[] = ['easy', 'normal', 'hard'];

/** 試合結果を記録し、更新された記録を返す */
export function recordMatchResult(prev: StreakRecord, isWin: boolean): StreakRecord {
  if (isWin) {
    return { winStreak: prev.winStreak + 1, loseStreak: 0 };
  }
  return { winStreak: 0, loseStreak: prev.loseStreak + 1 };
}

/** 連勝/連敗に基づいて難易度変更を提案する */
export function getSuggestedDifficulty(
  record: StreakRecord,
  currentDifficulty: Difficulty
): Difficulty | undefined {
  const currentIndex = DIFFICULTY_ORDER.indexOf(currentDifficulty);

  if (record.loseStreak >= STREAK_THRESHOLD && currentIndex > 0) {
    return DIFFICULTY_ORDER[currentIndex - 1];
  }

  if (record.winStreak >= STREAK_THRESHOLD && currentIndex < DIFFICULTY_ORDER.length - 1) {
    return DIFFICULTY_ORDER[currentIndex + 1];
  }

  return undefined;
}
