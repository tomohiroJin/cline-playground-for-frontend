/**
 * Agile Quiz Sugoroku - 履歴ストレージ
 *
 * 過去のプレイ結果を最大10件保存
 * 既存の aqs_last_result との互換性を維持（マイグレーション対応）
 */
import { GameHistoryEntry, SavedGameResult } from './types';

const HISTORY_KEY = 'aqs_history';
const LAST_RESULT_KEY = 'aqs_last_result';

/** 最大保存件数 */
export const MAX_HISTORY_COUNT = 10;

/** 履歴を読み込む */
export function loadHistory(): GameHistoryEntry[] {
  try {
    const data = localStorage.getItem(HISTORY_KEY);
    if (!data) return [];
    const parsed: GameHistoryEntry[] = JSON.parse(data);
    if (!Array.isArray(parsed)) return [];
    return parsed;
  } catch {
    return [];
  }
}

/** 履歴にエントリを追加（最大件数を超えたら古いものを削除） */
export function saveHistory(entry: GameHistoryEntry): void {
  try {
    const history = loadHistory();
    history.push(entry);
    // 古い順に保持されるため、先頭を削除
    while (history.length > MAX_HISTORY_COUNT) {
      history.shift();
    }
    localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
  } catch {
    // localStorage が利用できない場合は無視
  }
}

/** SavedGameResult から GameHistoryEntry に変換 */
export function toHistoryEntry(result: SavedGameResult): GameHistoryEntry {
  return {
    totalCorrect: result.totalCorrect,
    totalQuestions: result.totalQuestions,
    correctRate: result.correctRate,
    averageSpeed: result.averageSpeed,
    stability: result.stability,
    debt: result.debt,
    maxCombo: result.maxCombo,
    grade: result.grade,
    gradeLabel: result.gradeLabel,
    teamTypeId: result.teamTypeId,
    teamTypeName: result.teamTypeName,
    timestamp: result.timestamp,
  };
}

/** 履歴を削除する */
export function clearHistory(): void {
  try {
    localStorage.removeItem(HISTORY_KEY);
  } catch {
    // localStorage が利用できない場合は無視
  }
}

/**
 * 旧 aqs_last_result から履歴へのマイグレーション
 * 履歴が空で aqs_last_result が存在する場合のみ実行
 */
export function migrateLastResultToHistory(): void {
  try {
    const existing = loadHistory();
    if (existing.length > 0) return;

    const lastData = localStorage.getItem(LAST_RESULT_KEY);
    if (!lastData) return;

    const lastResult: SavedGameResult = JSON.parse(lastData);
    const entry = toHistoryEntry(lastResult);
    saveHistory(entry);
  } catch {
    // パース失敗時は無視
  }
}
