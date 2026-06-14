/**
 * ピクセルグリッド編集プリミティブ
 *
 * コードスプライト（2次元パレットインデックス配列）への編集操作を提供する。
 * スプライトの定義・レンダリングは spriteData.ts が担い、本モジュールは
 * 「ピクセル配列そのものの非破壊操作」に特化する。
 */

/** ピクセル1点の編集（パレットインデックスの上書き） */
export type PixelEdit = Readonly<{ x: number; y: number; value: number }>;

/** ピクセル配列を深く複製する（行ごとにコピー） */
export const clonePixels = (pixels: number[][]): number[][] =>
  pixels.map((row) => [...row]);

/**
 * ピクセル配列に編集列を適用した新しい配列を返す（非破壊）。
 * 範囲外の座標は無視する。
 */
export const applyPixelEdits = (
  pixels: number[][],
  edits: readonly PixelEdit[]
): number[][] => {
  const next = clonePixels(pixels);
  edits.forEach(({ x, y, value }) => {
    if (next[y] && next[y][x] !== undefined) {
      next[y][x] = value;
    }
  });
  return next;
};
