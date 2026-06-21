/**
 * WCAG 2.x コントラスト比の計算ユーティリティ（テスト用）。
 *
 * テキスト色がアクセシビリティ基準(AA=4.5:1)を満たすことを自動検証するために使う。
 */

/** #rrggbb を [r,g,b]（0-255）に変換する */
function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace('#', '');
  return [
    parseInt(h.slice(0, 2), 16),
    parseInt(h.slice(2, 4), 16),
    parseInt(h.slice(4, 6), 16),
  ];
}

/** sRGB チャンネル(0-1)を相対輝度の線形値へ変換する（WCAG 定義） */
function linearize(c: number): number {
  const s = c / 255;
  return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
}

/** 相対輝度（WCAG, 0=黒〜1=白） */
export function relativeLuminance(hex: string): number {
  const [r, g, b] = hexToRgb(hex);
  return 0.2126 * linearize(r) + 0.7152 * linearize(g) + 0.0722 * linearize(b);
}

/** 2 色のコントラスト比（1〜21） */
export function contrastRatio(fg: string, bg: string): number {
  const l1 = relativeLuminance(fg);
  const l2 = relativeLuminance(bg);
  const [hi, lo] = l1 >= l2 ? [l1, l2] : [l2, l1];
  return (hi + 0.05) / (lo + 0.05);
}
