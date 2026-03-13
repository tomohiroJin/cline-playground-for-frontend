/**
 * KEYS & ARMS — ゲームストレージリポジトリ
 * ハイスコアの永続化を抽象化し、副作用を隔離する。
 */

/** ストレージキー */
const STORAGE_KEY = 'kaG';

/** ゲームストレージリポジトリのインターフェース */
export interface GameStorageRepository {
  /** ハイスコアを取得（保存されていない場合は 0） */
  getHighScore(): number;
  /** ハイスコアを保存 */
  setHighScore(score: number): void;
}

/** localStorage を使用した実装（本番用） */
export function createLocalStorageRepository(): GameStorageRepository {
  return {
    getHighScore(): number {
      try {
        return parseInt(localStorage.getItem(STORAGE_KEY) || '0', 10) || 0;
      } catch {
        return 0;
      }
    },
    setHighScore(score: number): void {
      try {
        localStorage.setItem(STORAGE_KEY, String(score));
      } catch {
        // ストレージが利用不可の場合は無視
      }
    },
  };
}

/** インメモリ実装（テスト用） */
export function createInMemoryStorageRepository(
  initialHighScore = 0,
): GameStorageRepository {
  let highScore = initialHighScore;
  return {
    getHighScore(): number {
      return highScore;
    },
    setHighScore(score: number): void {
      highScore = score;
    },
  };
}
