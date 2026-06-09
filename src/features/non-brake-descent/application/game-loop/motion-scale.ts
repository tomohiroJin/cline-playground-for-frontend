/**
 * reduced-motion 係数ヘルパー
 *
 * prefers-reduced-motion が有効なときは時間操作（ヒットストップ/スローモー）を
 * 無効化するための係数を提供する。純粋関数。
 */

/** reduced-motion の有効/無効から演出強度の係数を解決する */
export const resolveMotionScale = (reduced: boolean): number => (reduced ? 0 : 1);

/** フレーム数に係数を掛けて四捨五入する */
export const scaleFrames = (frames: number, scale: number): number => Math.round(frames * scale);
