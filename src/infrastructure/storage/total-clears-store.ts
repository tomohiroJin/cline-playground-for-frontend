/**
 * 累計クリア数ストア — TotalClearsStorage ポートの localStorage 実装
 */
import { TotalClearsStorage } from '../../application/ports/storage-port';

const TOTAL_CLEARS_KEY = 'puzzle_total_clears';

/**
 * localStorage ベースの累計クリア数ストレージ
 */
export class LocalTotalClearsStorage implements TotalClearsStorage {
  get(): number {
    try {
      const value = localStorage.getItem(TOTAL_CLEARS_KEY);
      return value ? parseInt(value, 10) : 0;
    } catch {
      return 0;
    }
  }

  increment(): number {
    const next = this.get() + 1;
    try {
      localStorage.setItem(TOTAL_CLEARS_KEY, String(next));
    } catch {
      // ストレージ書き込み失敗は無視
    }
    return next;
  }
}
