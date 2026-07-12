/**
 * 照明・後処理のムードパラメータを一元管理する純粋モジュール。
 * R3F は jsdom テスト不可のため、見た目を決める数値をここに集約してテスト可能にする。
 * 現行の暗紫フォグ＋橙トーチ路線を「深化」させる（路線変更はしない）。
 */

/** 迷宮のムード色（現行値を起点に深化） */
export const MOOD = {
  /** 指数フォグ色（暗紫） */
  fog: '#05040a',
  /** フォグ密度（Phase1-3 の 0.11 を踏襲） */
  fogDensity: 0.11,
  /** 環境光色（石壁の寒色に寄せる） */
  ambient: '#3a4258',
  /** 環境光強度 */
  ambientIntensity: 0.35,
  /** トーチ火の橙 */
  torch: '#ffb060',
} as const;

/**
 * トーチの多周波フリッカ（GameController の既存合成式を抽出）。
 * 時刻 timeSec に対し決定論的。概ね 0.0〜1.0 付近を返す。
 */
export const torchFlicker = (timeSec: number): number =>
  Math.sin(timeSec * 3.7) * 0.3 +
  Math.sin(timeSec * 7.1) * 0.15 +
  Math.sin(timeSec * 11.3) * 0.05 +
  0.5;

/** トーチ点光源の基準強度（物理ベース照明準拠で高め） */
const TORCH_BASE_INTENSITY = 9;
/** フリッカによる強度振幅 */
const TORCH_FLICKER_AMP = 3;

/**
 * トーチ強度。reducedMotion 時は揺らぎを止めて一定値にする
 * （design-ui-ux-principles のマイクロアニメーション規約）。
 */
export const torchIntensity = (flicker: number, reducedMotion: boolean): number =>
  reducedMotion
    ? TORCH_BASE_INTENSITY + TORCH_FLICKER_AMP * 0.5
    : TORCH_BASE_INTENSITY + flicker * TORCH_FLICKER_AMP;

/** Bloom（発光体のにじみ）設定。壁・床は閾値を超えないため にじまない */
export const BLOOM_CONFIG = {
  intensity: 0.9,
  luminanceThreshold: 0.35,
  luminanceSmoothing: 0.3,
  mipmapBlur: true,
} as const;

/** Vignette（周辺減光）設定。閉塞感と視線集中 */
export const VIGNETTE_CONFIG = {
  offset: 0.3,
  darkness: 0.7,
} as const;

/** Bloom 強度。reducedMotion 時は控えめに固定 */
export const bloomIntensity = (reducedMotion: boolean): number =>
  reducedMotion ? 0.5 : BLOOM_CONFIG.intensity;
