/**
 * チャレンジモードリポジトリ
 *
 * サバイバルモードのハイスコアを管理する。
 */
import { StoragePort } from './storage-port';

const STORAGE_KEY = 'aqs_challenge_highscore';

export class ChallengeRepository {
  constructor(private readonly storage: StoragePort) {}

  /** ハイスコアを読み込む（データがない場合は 0） */
  loadHighScore(): number {
    const data = this.storage.get<number>(STORAGE_KEY);
    if (data === undefined || isNaN(data)) return 0;
    return data;
  }

  /** ハイスコアを保存する（既存より高い場合のみ） */
  saveHighScore(score: number): void {
    const current = this.loadHighScore();
    if (score > current) {
      this.storage.set(STORAGE_KEY, score);
    }
  }

  /** ハイスコアを削除する */
  clear(): void {
    this.storage.remove(STORAGE_KEY);
  }
}
