/**
 * Agile Quiz Sugoroku - ゲーム結果の localStorage 保存
 */
import { SavedGameResult } from './types';

const STORAGE_KEY = 'aqs_last_result';

/** ゲーム結果を保存 */
export function saveGameResult(result: SavedGameResult): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(result));
  } catch {
    // localStorage が利用できない場合は無視
  }
}

/** ゲーム結果を読み込み */
export function loadGameResult(): SavedGameResult | null {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) return null;
    return JSON.parse(data) as SavedGameResult;
  } catch {
    return null;
  }
}

/** ゲーム結果を削除 */
export function clearGameResult(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // localStorage が利用できない場合は無視
  }
}
