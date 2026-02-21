import { readLocalStorage, writeLocalStorage } from './localStorage';

/**
 * クリア履歴の型定義
 */
export type ClearHistory = {
  id: string;
  imageName: string;
  clearTime: number; // 秒単位
  clearDate: string; // ISO形式の日付文字列
};

const CLEAR_HISTORY_KEY = 'puzzle_clear_history';

/**
 * クリア履歴をローカルストレージから取得する
 */
export const getClearHistory = (): ClearHistory[] => {
  return readLocalStorage<ClearHistory[]>(CLEAR_HISTORY_KEY, []);
};

/**
 * クリア履歴をローカルストレージに保存する
 */
export const saveClearHistory = (history: ClearHistory[]): void => {
  writeLocalStorage(CLEAR_HISTORY_KEY, history);
};

/**
 * 新しいクリア履歴を追加する
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
 */
export const generateId = (): string => {
  return Date.now().toString(36) + Math.random().toString(36).substring(2);
};

/**
 * 画像URLから画像名を抽出する
 */
export const extractImageName = (imageUrl: string): string => {
  if (!imageUrl) return 'Unknown';

  const parts = imageUrl.split('/');
  const filename = parts[parts.length - 1];
  const name = filename.split('.')[0];

  return name;
};
