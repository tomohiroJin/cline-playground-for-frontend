/**
 * 灰燼の城壁 - WCAG 2.x のコントラスト比（純粋）
 *
 * 経路と経路外の色を「3:1 以上」（WCAG 1.4.11 非テキストのコントラスト）で
 * 固定するために使う（反復7 段階2・設計書 §4.0 b）。
 * features 間の import は禁止なので、primal-path のテスト用ヘルパーは使わずここに置く。
 */
const HEX_COLOR = /^#([0-9a-f]{6})$/i;
const HEX_RADIX = 16;
const RED_SHIFT = 16;
const GREEN_SHIFT = 8;
const BYTE_MASK = 0xff;
const CHANNEL_MAX = 255;
const HEX_BYTE_PAD = 2;

/** sRGB → 線形の変換定数（WCAG 2.x の相対輝度の定義） */
const SRGB_LINEAR_THRESHOLD = 0.03928;
const SRGB_LINEAR_DIVISOR = 12.92;
const SRGB_GAMMA_OFFSET = 0.055;
const SRGB_GAMMA_DIVISOR = 1.055;
const SRGB_GAMMA_EXPONENT = 2.4;
const LUMINANCE_WEIGHT = { r: 0.2126, g: 0.7152, b: 0.0722 } as const;
/** コントラスト比の分子・分母に足す定数（WCAG 2.x） */
const CONTRAST_OFFSET = 0.05;

/** `#rrggbb` を r/g/b（各0〜255）に分解する。relativeLuminance・compositeOver の共通処理 */
const rgbOf = (hex: string): { r: number; g: number; b: number } => {
  const digits = HEX_COLOR.exec(hex)?.[1];
  if (digits === undefined) {
    throw new Error(`#rrggbb 形式ではありません: ${hex}`);
  }
  const value = Number.parseInt(digits, HEX_RADIX);
  return {
    r: (value >> RED_SHIFT) & BYTE_MASK,
    g: (value >> GREEN_SHIFT) & BYTE_MASK,
    b: value & BYTE_MASK,
  };
};

const toLinear = (channel: number): number => {
  const c = channel / CHANNEL_MAX;
  return c <= SRGB_LINEAR_THRESHOLD
    ? c / SRGB_LINEAR_DIVISOR
    : ((c + SRGB_GAMMA_OFFSET) / SRGB_GAMMA_DIVISOR) ** SRGB_GAMMA_EXPONENT;
};

/** `#rrggbb` の相対輝度（0〜1） */
export const relativeLuminance = (hex: string): number => {
  const { r, g, b } = rgbOf(hex);
  return (
    LUMINANCE_WEIGHT.r * toLinear(r) + LUMINANCE_WEIGHT.g * toLinear(g) + LUMINANCE_WEIGHT.b * toLinear(b)
  );
};

/** 2色のコントラスト比（1〜21）。順序によらない */
export const contrastRatio = (a: string, b: string): number => {
  const la = relativeLuminance(a);
  const lb = relativeLuminance(b);
  return (Math.max(la, lb) + CONTRAST_OFFSET) / (Math.min(la, lb) + CONTRAST_OFFSET);
};

/** 0〜255 の整数を2桁16進（小文字）へ */
const toHexByte = (channel: number): string => channel.toString(HEX_RADIX).padStart(HEX_BYTE_PAD, '0');

/**
 * 前景色を不透明度 opacity で背景色に重ね、結果の不透明色を `#rrggbb` で返す
 *
 * LaneMark・CellArrow のように `opacity` 付きで描く印は、実際に目に入る色が
 * 前景色そのものではなく背景と混ざった後の色になる。不透明の色同士を比べても
 * 実際の見た目のコントラストは測れないため、この関数で合成してから測る
 * （反復7 段階2・コントローラ追加指示）。
 */
export const compositeOver = (foreground: string, background: string, opacity: number): string => {
  const fg = rgbOf(foreground);
  const bg = rgbOf(background);
  const blend = (f: number, b: number): number => Math.round(f * opacity + b * (1 - opacity));
  return `#${toHexByte(blend(fg.r, bg.r))}${toHexByte(blend(fg.g, bg.g))}${toHexByte(blend(fg.b, bg.b))}`;
};
