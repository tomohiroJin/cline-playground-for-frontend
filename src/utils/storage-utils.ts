import { PuzzleScore, PuzzleRecord } from '../types/puzzle';

/**
 * クリア履歴の型定義
 */
export type ClearHistory = {
  id: string;
  imageName: string;
  clearTime: number; // 秒単位
  clearDate: string; // ISO形式の日付文字列
};

/**
 * ローカルストレージのキー
 */
const CLEAR_HISTORY_KEY = 'puzzle_clear_history';

/**
 * クリア履歴をローカルストレージから取得する
 *
 * @returns クリア履歴の配列
 */
export const getClearHistory = (): ClearHistory[] => {
  try {
    const historyJson = localStorage.getItem(CLEAR_HISTORY_KEY);
    if (!historyJson) return [];

    return JSON.parse(historyJson) as ClearHistory[];
  } catch (error) {
    console.error('クリア履歴の取得に失敗しました:', error);
    return [];
  }
};

/**
 * クリア履歴をローカルストレージに保存する
 *
 * @param history クリア履歴の配列
 */
export const saveClearHistory = (history: ClearHistory[]): void => {
  try {
    localStorage.setItem(CLEAR_HISTORY_KEY, JSON.stringify(history));
  } catch (error) {
    console.error('クリア履歴の保存に失敗しました:', error);
  }
};

/**
 * 新しいクリア履歴を追加する
 *
 * @param imageName 画像名
 * @param clearTime クリア時間（秒）
 * @returns 更新されたクリア履歴の配列
 */
export const addClearHistory = (imageName: string, clearTime: number): ClearHistory[] => {
  const history = getClearHistory();

  const newEntry: ClearHistory = {
    id: generateId(),
    imageName,
    clearTime,
    clearDate: new Date().toISOString(),
  };

  const updatedHistory = [newEntry, ...history];
  saveClearHistory(updatedHistory);

  return updatedHistory;
};

/**
 * 一意のIDを生成する
 *
 * @returns ランダムなID文字列
 */
const generateId = (): string => {
  return Date.now().toString(36) + Math.random().toString(36).substring(2);
};

/**
 * 画像URLから画像名を抽出する
 *
 * @param imageUrl 画像のURL
 * @returns 画像名（ファイル名または「アップロード画像」）
 */
export const extractImageName = (imageUrl: string): string => {
  if (!imageUrl) return 'Unknown';

  // パスから最後の部分（ファイル名）を取得
  const parts = imageUrl.split('/');
  const filename = parts[parts.length - 1];

  // 拡張子を除去
  const name = filename.split('.')[0];

  return name;
};

const TOTAL_CLEARS_KEY = 'puzzle_total_clears';

/**
 * 累計クリア回数を取得する
 */
export const getTotalClears = (): number => {
  try {
    const value = localStorage.getItem(TOTAL_CLEARS_KEY);
    return value ? parseInt(value, 10) : 0;
  } catch {
    return 0;
  }
};

/**
 * 累計クリア回数をインクリメントする
 */
export const incrementTotalClears = (): number => {
  const current = getTotalClears();
  const next = current + 1;
  try {
    localStorage.setItem(TOTAL_CLEARS_KEY, String(next));
  } catch {
    // ignore
  }
  return next;
};

const RECORDS_KEY = 'puzzle_records';

/**
 * パズル記録をローカルストレージから取得する
 */
export const getPuzzleRecords = (): PuzzleRecord[] => {
  try {
    const json = localStorage.getItem(RECORDS_KEY);
    if (!json) return [];
    return JSON.parse(json) as PuzzleRecord[];
  } catch (error) {
    console.error('パズル記録の取得に失敗しました:', error);
    return [];
  }
};

/**
 * パズル記録をローカルストレージに保存する
 */
export const savePuzzleRecords = (records: PuzzleRecord[]): void => {
  try {
    localStorage.setItem(RECORDS_KEY, JSON.stringify(records));
  } catch (error) {
    console.error('パズル記録の保存に失敗しました:', error);
  }
};

/**
 * スコアを記録し、ベスト更新があれば true を返す
 */
export const recordScore = (
  imageId: string,
  division: number,
  score: PuzzleScore
): { record: PuzzleRecord; isBestScore: boolean } => {
  const records = getPuzzleRecords();
  const existing = records.find(
    r => r.imageId === imageId && r.division === division
  );

  if (existing) {
    const isBestScore = score.totalScore > existing.bestScore;
    const updated: PuzzleRecord = {
      ...existing,
      bestScore: Math.max(existing.bestScore, score.totalScore),
      bestRank: isBestScore ? score.rank : existing.bestRank,
      bestTime: Math.min(existing.bestTime, score.elapsedTime),
      bestMoves: existing.bestMoves === 0
        ? score.moveCount
        : Math.min(existing.bestMoves, score.moveCount),
      clearCount: existing.clearCount + 1,
      lastClearDate: new Date().toISOString(),
    };
    savePuzzleRecords(records.map(r =>
      r.imageId === imageId && r.division === division ? updated : r
    ));
    return { record: updated, isBestScore };
  }

  const newRecord: PuzzleRecord = {
    imageId,
    division,
    bestScore: score.totalScore,
    bestRank: score.rank,
    bestTime: score.elapsedTime,
    bestMoves: score.moveCount,
    clearCount: 1,
    lastClearDate: new Date().toISOString(),
  };
  savePuzzleRecords([...records, newRecord]);
  return { record: newRecord, isBestScore: true };
};

/**
 * 旧 ClearHistory から PuzzleRecord へマイグレーションする
 */
export const migrateClearHistory = (): void => {
  const MIGRATION_KEY = 'puzzle_migration_v1';
  if (localStorage.getItem(MIGRATION_KEY)) return;

  const oldHistory = getClearHistory();
  if (oldHistory.length === 0) {
    localStorage.setItem(MIGRATION_KEY, 'done');
    return;
  }

  const grouped = new Map<string, ClearHistory[]>();
  for (const entry of oldHistory) {
    const list = grouped.get(entry.imageName) ?? [];
    list.push(entry);
    grouped.set(entry.imageName, list);
  }

  const records: PuzzleRecord[] = [];
  for (const [imageId, entries] of grouped) {
    const bestEntry = entries.reduce((a, b) =>
      a.clearTime < b.clearTime ? a : b
    );
    records.push({
      imageId,
      division: 4,
      bestScore: 0,
      bestRank: 'クリア',
      bestTime: bestEntry.clearTime,
      bestMoves: 0,
      clearCount: entries.length,
      lastClearDate: bestEntry.clearDate,
    });
  }

  savePuzzleRecords(records);
  localStorage.setItem(MIGRATION_KEY, 'done');
};
