/**
 * 難易度オートアジャスト
 * 連勝/連敗に応じて難易度変更を提案する
 */
import { Difficulty } from './types';

const STORAGE_KEY = 'ah_streak_record';

/** 連勝/連敗の記録 */
export type StreakRecord = {
  winStreak: number;
  loseStreak: number;
};

/** 提案を出す閾値 */
export const STREAK_THRESHOLD = 3;

/** 難易度の順序 */
const DIFFICULTY_ORDER: Difficulty[] = ['easy', 'normal', 'hard'];

/** 連勝/連敗記録を読み込む */
export function getStreakRecord(): StreakRecord {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    // 読み込み失敗時はデフォルト値
  }
  return { winStreak: 0, loseStreak: 0 };
}

/** 連勝/連敗記録を保存する */
export function saveStreakRecord(record: StreakRecord): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(record));
}

/** 試合結果を記録し、更新された記録を返す */
export function recordMatchResult(prev: StreakRecord, isWin: boolean): StreakRecord {
  if (isWin) {
    return { winStreak: prev.winStreak + 1, loseStreak: 0 };
  }
  return { winStreak: 0, loseStreak: prev.loseStreak + 1 };
}

/**
 * 連勝/連敗に基づいて難易度変更を提案する
 * 提案がない場合は undefined を返す
 */
export function getSuggestedDifficulty(
  record: StreakRecord,
  currentDifficulty: Difficulty
): Difficulty | undefined {
  const currentIndex = DIFFICULTY_ORDER.indexOf(currentDifficulty);

  // 連敗 → 難易度を下げる提案
  if (record.loseStreak >= STREAK_THRESHOLD && currentIndex > 0) {
    return DIFFICULTY_ORDER[currentIndex - 1];
  }

  // 連勝 → 難易度を上げる提案
  if (record.winStreak >= STREAK_THRESHOLD && currentIndex < DIFFICULTY_ORDER.length - 1) {
    return DIFFICULTY_ORDER[currentIndex + 1];
  }

  return undefined;
}
