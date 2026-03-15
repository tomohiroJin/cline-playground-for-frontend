/**
 * Agile Quiz Sugoroku - ゲーム途中セーブ/ロード管理
 *
 * 後方互換用の再エクスポート。
 * 実装は infrastructure/storage/save-repository.ts に移行済み。
 */
import { SaveState } from './types';
import { LocalStorageAdapter } from './infrastructure/storage/local-storage-adapter';
import { SaveRepository } from './infrastructure/storage/save-repository';

export const SAVE_KEY = 'aqs_save_state';

const repository = new SaveRepository(new LocalStorageAdapter());

/** ゲーム状態を保存 */
export function saveGameState(state: SaveState): void {
  repository.save(state);
}

/** ゲーム状態を読み込み（破損データは自動削除） */
export function loadGameState(): SaveState | undefined {
  return repository.load();
}

/** セーブデータを削除 */
export function deleteSaveState(): void {
  repository.delete();
}

/** セーブデータが存在するか確認 */
export function hasSaveState(): boolean {
  return repository.exists();
}
