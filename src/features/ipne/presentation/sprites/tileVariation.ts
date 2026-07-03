/**
 * タイルバリエーション選択（決定論的座標ハッシュ）
 *
 * 床タイルの単調さを解消するため、座標から決定論的にバリアントを選ぶ。
 * Math.random は使わない（毎フレーム同じタイルが同じ見た目である必要があるため）。
 */

/** 装飾タイルの出現率（1 - これ がベースタイルの率）。控えめに 3 割 */
const DECORATION_RATE = 0.3;

/**
 * 2次元整数座標の決定論的ハッシュ（非負 32bit 整数）。
 * 大きな素数の乗算 + XOR で隣接座標の相関を崩す定番手法。
 */
export function hashTileCoord(x: number, y: number): number {
  const h = Math.imul(x, 73856093) ^ Math.imul(y, 19349663);
  return h >>> 0;
}

/**
 * 座標からタイルバリアントの index を選ぶ。
 * ベース（0）が過半数、残りを装飾バリアント（1..variantCount-1）で等分する。
 */
export function selectTileVariantIndex(x: number, y: number, variantCount: number): number {
  if (variantCount <= 1) return 0;
  const h = hashTileCoord(x, y);
  const roll = (h % 1000) / 1000;
  if (roll >= DECORATION_RATE) return 0;
  return 1 + (Math.floor(h / 1000) % (variantCount - 1));
}
