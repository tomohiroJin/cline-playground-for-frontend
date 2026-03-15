/**
 * Agile Quiz Sugoroku - チャレンジモード ストレージ
 *
 * 後方互換用の再エクスポート。
 * 実装は infrastructure/storage/challenge-repository.ts に移行済み。
 */
import { LocalStorageAdapter } from './infrastructure/storage/local-storage-adapter';
import { ChallengeRepository } from './infrastructure/storage/challenge-repository';

const repository = new ChallengeRepository(new LocalStorageAdapter());

/** ハイスコアを読み込む */
export function loadHighScore(): number {
  return repository.loadHighScore();
}

/** ハイスコアを保存する（既存より高い場合のみ） */
export function saveHighScore(score: number): void {
  repository.saveHighScore(score);
}

/** ハイスコアを削除する */
export function clearHighScore(): void {
  repository.clear();
}
