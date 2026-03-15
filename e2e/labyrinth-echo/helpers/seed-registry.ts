/**
 * 迷宮の残響 E2E テスト用 seed レジストリ
 *
 * 各 seed で期待されるイベント列をコメントで記録。
 * SeededRandomSource（xorshift32）により決定論的な乱数列を保証する。
 */

/** 基本フローの検証用 seed — 標準的なイベント列を生成 */
export const SEED_BASIC_FLOW = 12345;

/**
 * ゲームオーバーの検証用 seed — 致死イベント列を生成
 * 修羅難度と組み合わせて HP/MN が 0 になるイベント列を保証する
 */
export const SEED_GAME_OVER = 67890;

/**
 * エンディング到達の検証用 seed — クリア可能なイベント列を生成
 * 探索者難度と組み合わせて全フロアを突破し脱出イベントに到達する
 */
export const SEED_ENDING = 11111;
