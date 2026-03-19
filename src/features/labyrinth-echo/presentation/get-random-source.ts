/**
 * 迷宮の残響 - 乱数ソース取得ヘルパー
 *
 * E2Eテスト用: window.__LE_TEST_RNG__ に seed 値が設定されていれば
 * SeededRandomSource を返す。未設定なら DefaultRandomSource を返す。
 */
import { DefaultRandomSource, SeededRandomSource } from '../domain/events/random';
import type { RandomSource } from '../domain/events/random';

/** グローバル型拡張（E2Eテスト用） */
declare global {
  interface Window {
    __LE_TEST_RNG__?: number;
    __LE_TEST_RNG_INSTANCE__?: RandomSource;
    __LE_TEST_RNG_SEED__?: number;
  }
}

/**
 * 乱数ソースを取得する
 * - window.__LE_TEST_RNG__ に seed（数値）が設定されている場合: SeededRandomSource を返す
 * - 未設定の場合: DefaultRandomSource を返す
 *
 * セキュリティ: __LE_TEST_RNG__ はテスト・開発環境専用。
 * 本番ビルド（NODE_ENV === 'production'）では無視される。
 */
export const getRandomSource = (): RandomSource => {
  if (
    process.env.NODE_ENV !== 'production' &&
    typeof window !== 'undefined' &&
    typeof window.__LE_TEST_RNG__ === 'number'
  ) {
    const seed = window.__LE_TEST_RNG__;
    // seed が変更された場合、または初回の場合はインスタンスを再生成する
    if (!window.__LE_TEST_RNG_INSTANCE__ || window.__LE_TEST_RNG_SEED__ !== seed) {
      window.__LE_TEST_RNG_INSTANCE__ = new SeededRandomSource(seed);
      window.__LE_TEST_RNG_SEED__ = seed;
    }
    return window.__LE_TEST_RNG_INSTANCE__;
  }
  return new DefaultRandomSource();
};

/**
 * テスト用: キャッシュされた乱数インスタンスをリセットする
 * ゲーム再開始時に呼び出すことで、同じ seed から再び同じ乱数列を生成可能にする
 */
export const resetRandomSourceCache = (): void => {
  if (typeof window !== 'undefined') {
    window.__LE_TEST_RNG_INSTANCE__ = undefined;
    window.__LE_TEST_RNG_SEED__ = undefined;
  }
};
