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
