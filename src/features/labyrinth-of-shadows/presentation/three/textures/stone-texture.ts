/**
 * 石積みのプロシージャルテクスチャを Uint8Array（RGBA）に決定論的生成する純粋モジュール。
 * canvas API に依存しない（jsdom は canvas 2D の getImageData を標準実装しないため）。
 * R3F 側はこの配列を THREE.DataTexture に渡してマップとして供給する。
 */

/** 石テクスチャの種別（基調色・目地の強さを変える） */
export type StoneKind = 'wall' | 'floor' | 'ceiling';

/** 生成された石テクスチャ（各配列は size*size*4 の RGBA） */
export interface StoneTexture {
  color: Uint8Array;
  roughness: Uint8Array;
  normal: Uint8Array;
  size: number;
}

/** 種別ごとの基調色（RGB）と目地の暗さ */
const BASE: Record<StoneKind, { r: number; g: number; b: number; mortar: number }> = {
  wall: { r: 74, g: 82, b: 96, mortar: 0.45 },     // 冷たい青グレー
  floor: { r: 52, g: 54, b: 60, mortar: 0.55 },    // 湿った暗い石畳
  ceiling: { r: 30, g: 32, b: 40, mortar: 0.6 },   // より暗く
};

/** mulberry32: シード付き決定論的 PRNG（Math.random 非使用でテスト決定性を担保） */
function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** レンガの目地パターン（行ごとに半ブロックずらす） */
function isMortar(x: number, y: number, size: number): boolean {
  const brickH = size / 4; // 縦4段
  const brickW = size / 2; // 横2列
  const row = Math.floor(y / brickH);
  const offset = (row % 2) * (brickW / 2);
  const localX = (x + offset) % brickW;
  const localY = y % brickH;
  const line = Math.max(1, Math.floor(size / 32));
  return localX < line || localY < line;
}

export function generateStoneTexture(opts: {
  size: number;
  seed: number;
  kind: StoneKind;
}): StoneTexture {
  const { size, seed, kind } = opts;
  const base = BASE[kind];
  const rand = mulberry32(seed);
  const n = size * size * 4;
  const color = new Uint8Array(n);
  const roughness = new Uint8Array(n);
  const normal = new Uint8Array(n);

  // ピクセルごとの明度ノイズを先に生成（法線の勾配計算に使う）
  const lum = new Float32Array(size * size);
  for (let i = 0; i < size * size; i++) {
    lum[i] = 0.85 + rand() * 0.3; // 0.85〜1.15 の粒状ムラ
  }

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const idx = (y * size + x) * 4;
      const flat = y * size + x;
      const mortar = isMortar(x, y, size);
      const shade = mortar ? base.mortar : lum[flat];

      color[idx] = Math.min(255, Math.round(base.r * shade));
      color[idx + 1] = Math.min(255, Math.round(base.g * shade));
      color[idx + 2] = Math.min(255, Math.round(base.b * shade));
      color[idx + 3] = 255;

      // 目地は粗く、石面はやや滑らか
      const rough = mortar ? 245 : 200 + Math.round((lum[flat] - 1) * 60);
      const rv = Math.max(0, Math.min(255, rough));
      roughness[idx] = rv;
      roughness[idx + 1] = rv;
      roughness[idx + 2] = rv;
      roughness[idx + 3] = 255;

      // 高さ勾配から法線を近似（目地で凹む）
      const hL = pixelHeight(lum, size, x - 1, y);
      const hR = pixelHeight(lum, size, x + 1, y);
      const hU = pixelHeight(lum, size, x, y - 1);
      const hD = pixelHeight(lum, size, x, y + 1);
      const mortarDip = mortar ? -0.5 : 0;
      const dx = (hL - hR) + mortarDip;
      const dy = (hU - hD) + mortarDip;
      normal[idx] = Math.max(0, Math.min(255, Math.round(128 + dx * 90)));
      normal[idx + 1] = Math.max(0, Math.min(255, Math.round(128 + dy * 90)));
      normal[idx + 2] = 255; // Z（面法線）を最強に
      normal[idx + 3] = 255;
    }
  }

  return { color, roughness, normal, size };
}

/** 端をクランプして高さ（明度）を取得 */
function pixelHeight(lum: Float32Array, size: number, x: number, y: number): number {
  const cx = Math.max(0, Math.min(size - 1, x));
  const cy = Math.max(0, Math.min(size - 1, y));
  return lum[cy * size + cx];
}
