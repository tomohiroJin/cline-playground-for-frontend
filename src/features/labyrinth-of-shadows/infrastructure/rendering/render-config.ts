/**
 * レンダリング設定
 * FOV、レイ数、最大描画距離等のレンダリングパラメータ
 */

/** レンダリング設定 */
export const RENDER_CONFIG = {
  /** 視野角（ラジアン） */
  FOV: Math.PI / 3,
  /** レイキャストのレイ数 */
  RAY_COUNT: 100,
  /** 最大描画距離 */
  MAX_DEPTH: 18,
  /** キャンバス幅 */
  WIDTH: 900,
  /** キャンバス高さ */
  HEIGHT: 560,
} as const;
