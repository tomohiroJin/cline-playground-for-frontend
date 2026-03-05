/**
 * Agile Quiz Sugoroku - ゲーム途中セーブ/ロード管理
 */
import { SaveState } from './types';

export const SAVE_KEY = 'aqs_save_state';
const SAVE_VERSION = 1;

/** ゲーム状態を保存 */
export function saveGameState(state: SaveState): void {
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify(state));
  } catch {
    // localStorage が利用できない場合は無視
  }
}

/** ゲーム状態を読み込み */
export function loadGameState(): SaveState | undefined {
  try {
    const data = localStorage.getItem(SAVE_KEY);
    if (!data) return undefined;

    const parsed = JSON.parse(data) as SaveState;

    // バージョン不一致は削除
    if (parsed.version !== SAVE_VERSION) {
      deleteSaveState();
      return undefined;
    }

    return parsed;
  } catch {
    // 破損データは削除
    deleteSaveState();
    return undefined;
  }
}

/** セーブデータを削除 */
export function deleteSaveState(): void {
  try {
    localStorage.removeItem(SAVE_KEY);
  } catch {
    // localStorage が利用できない場合は無視
  }
}

/** セーブデータが存在するか確認 */
export function hasSaveState(): boolean {
  try {
    return localStorage.getItem(SAVE_KEY) !== null;
  } catch {
    return false;
  }
}
