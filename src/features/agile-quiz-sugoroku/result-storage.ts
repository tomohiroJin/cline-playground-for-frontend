/**
 * Agile Quiz Sugoroku - ゲーム結果の localStorage 保存
 *
 * 後方互換用の再エクスポート。
 * 実装は infrastructure/storage/game-repository.ts に移行済み。
 */
import { SavedGameResult } from './types';
import { LocalStorageAdapter } from './infrastructure/storage/local-storage-adapter';
import { GameResultRepository } from './infrastructure/storage/game-repository';

const repository = new GameResultRepository(new LocalStorageAdapter());

/** ゲーム結果を保存 */
export function saveGameResult(result: SavedGameResult): void {
  repository.save(result);
}

/** ゲーム結果を読み込み */
export function loadGameResult(): SavedGameResult | undefined {
  return repository.load();
}

/** ゲーム結果を削除 */
export function clearGameResult(): void {
  repository.clear();
}
