/**
 * Air Hockey ポートレート画像の輪郭近傍フリンジ監査ライブラリ（S9-B2-1）
 *
 * 純粋関数のみをエクスポートするピュアモジュール。
 * CLI として実行する場合は run-audit-portrait-fringe.ts を使用。
 *
 * - 境界ピクセル（0 < alpha < 255）の中で白フリンジ（R/G/B >= 240）と
 *   黒ずみ（R+G+B < 60）の割合を計測
 * - 白フリンジ率 / 黒ずみ率のいずれかが 2% を超えると NG 判定
 *
 * テスト: scripts/__tests__/audit-portrait-fringe.test.ts
 */

export type Pixel = { r: number; g: number; b: number; a: number };

/** 半透明境界ピクセル判定（完全透明・完全不透明は除外） */
export const isEdgePixel = (alpha: number): boolean => alpha > 0 && alpha < 255;

/** 白フリンジ判定（R/G/B 全て 240 以上） */
export const isWhiteFringe = (p: Pixel): boolean =>
  p.r >= 240 && p.g >= 240 && p.b >= 240;

/** 黒ずみ判定（R+G+B の総和が 60 未満） */
export const isDarkened = (p: Pixel): boolean =>
  p.r + p.g + p.b < 60;

const THRESHOLD_PERCENT = 0.02;

export type AuditResult = {
  totalEdgePixels: number;
  whiteFringeCount: number;
  darkenedCount: number;
  whiteRatio: number;
  darkenedRatio: number;
  verdict: 'OK' | 'NG';
};

/** ピクセル配列を走査して監査結果を返す（純粋関数） */
export function analyzePixels(pixels: Pixel[]): AuditResult {
  let totalEdgePixels = 0;
  let whiteFringeCount = 0;
  let darkenedCount = 0;

  for (const p of pixels) {
    if (!isEdgePixel(p.a)) continue;
    totalEdgePixels++;
    if (isWhiteFringe(p)) whiteFringeCount++;
    if (isDarkened(p)) darkenedCount++;
  }

  const whiteRatio = totalEdgePixels > 0 ? whiteFringeCount / totalEdgePixels : 0;
  const darkenedRatio = totalEdgePixels > 0 ? darkenedCount / totalEdgePixels : 0;
  const verdict: 'OK' | 'NG' =
    whiteRatio >= THRESHOLD_PERCENT || darkenedRatio >= THRESHOLD_PERCENT ? 'NG' : 'OK';

  return {
    totalEdgePixels,
    whiteFringeCount,
    darkenedCount,
    whiteRatio,
    darkenedRatio,
    verdict,
  };
}
