/**
 * ドット自動補正（純粋関数）
 *
 * コードスプライトに輪郭線（パレット index 空間）と縁陰影（ImageData RGB 空間）を
 * 機械適用する。いずれも入力非破壊。
 */
import type { SpriteDefinition } from './spriteData';

/** 輪郭線に使う暗色 */
const OUTLINE_COLOR = '#0a0a14';

const isOpaque = (pixels: number[][], x: number, y: number): boolean =>
  pixels[y]?.[x] !== undefined && pixels[y][x] !== 0;

/**
 * 透明かつキャラ縁（4近傍に不透明あり）のピクセルを輪郭色で埋めた新スプライトを返す。
 */
export function applyOutline(sprite: SpriteDefinition): SpriteDefinition {
  const { pixels, palette } = sprite;
  const existing = palette.indexOf(OUTLINE_COLOR);
  const nextPalette = existing >= 0 ? palette : [...palette, OUTLINE_COLOR];
  const outlineIndex = existing >= 0 ? existing : nextPalette.length - 1;

  const next = pixels.map((row) => [...row]);
  for (let y = 0; y < pixels.length; y++) {
    for (let x = 0; x < pixels[y].length; x++) {
      if (pixels[y][x] !== 0) continue;
      const edge =
        isOpaque(pixels, x, y - 1) ||
        isOpaque(pixels, x, y + 1) ||
        isOpaque(pixels, x - 1, y) ||
        isOpaque(pixels, x + 1, y);
      if (edge) next[y][x] = outlineIndex;
    }
  }
  return { ...sprite, palette: nextPalette, pixels: next };
}

/** 縁内側（下・右が透明）の暗化係数 */
const SHADE_DARK = 0.62;
/** 上面（上・左が透明）の明化係数 */
const SHADE_LIGHT = 0.3;

/**
 * ImageData の不透明ピクセルについて、下/右に透明が隣接する縁を暗く、
 * 上/左に透明が隣接する縁を明るくした新しい ImageData を返す（非破壊）。
 */
export function applyEdgeShading(image: ImageData): ImageData {
  const { width, height, data } = image;
  const out = new Uint8ClampedArray(data);
  const isTransparent = (x: number, y: number): boolean =>
    x < 0 || y < 0 || x >= width || y >= height || data[(y * width + x) * 4 + 3] === 0;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const o = (y * width + x) * 4;
      if (data[o + 3] === 0) continue;
      const dark = isTransparent(x, y + 1) || isTransparent(x + 1, y);
      const light = isTransparent(x, y - 1) || isTransparent(x - 1, y);
      // 下/右の暗化を優先（孤立ピクセル等で dark/light 同時成立時は暗化のみ適用）
      if (dark) {
        out[o] = data[o] * SHADE_DARK;
        out[o + 1] = data[o + 1] * SHADE_DARK;
        out[o + 2] = data[o + 2] * SHADE_DARK;
      } else if (light) {
        out[o] = data[o] + (255 - data[o]) * SHADE_LIGHT;
        out[o + 1] = data[o + 1] + (255 - data[o + 1]) * SHADE_LIGHT;
        out[o + 2] = data[o + 2] + (255 - data[o + 2]) * SHADE_LIGHT;
      }
    }
  }
  return new ImageData(out, width, height);
}
