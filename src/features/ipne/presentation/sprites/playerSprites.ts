/**
 * プレイヤースプライト定義
 *
 * 戦士（warrior）と盗賊（thief）の2クラス分のスプライトを定義する。
 * 各クラスは4方向（down/up/left/right）× 各種アニメーション。
 * すべて32×32ピクセルのコードスプライト方式（12色パレット）。
 */

import { SpriteDefinition } from './spriteData';
import { SpriteSheetDefinition } from './spriteSheet';
import { clonePixels, applyPixelEdits, type PixelEdit } from './pixelOps';
import {
  WARRIOR_SPRITES,
  WARRIOR_IDLE_SPRITE_SHEETS,
  WARRIOR_ATTACK_SPRITE_SHEETS,
  WARRIOR_DAMAGE_SPRITES,
} from './warriorSpritesV3';

/** 方向の型 */
export type Direction = 'down' | 'up' | 'left' | 'right';

// ============================================================================
// 盗賊（Thief）パレット
// ============================================================================
/**
 * 盗賊のカラーパレット
 * 0: 透明
 * 1: ダーククローク (#4c1d95)
 * 2: クローク (#6d28d9)
 * 3: メインボディ (#a78bfa)
 * 4: ハイライト (#c4b5fd)
 * 5: クロークの縁 (#ddd6fe)
 * 6: 白・ダガー (#f5f5f5)
 * 7: 肌 (#d4a574)
 */
const THIEF_PALETTE: string[] = [
  '',          // 0: 透明
  '#3b0f70',   // 1: ダーククローク（深化）
  '#6d28d9',   // 2: クローク
  '#a78bfa',   // 3: メインボディ
  '#c4b5fd',   // 4: ハイライト
  '#ddd6fe',   // 5: クロークの縁
  '#f5f5f5',   // 6: 白・ダガー
  '#d4a574',   // 7: 肌
  '#5b21b6',   // 8: クローク装飾（新）
  '#b8845a',   // 9: 肌影（新）
  '#ede9fe',   // 10: ダガーハイライト/目（新）
  '#4a3728',   // 11: ベルト・靴・暗部（新）
];

// ============================================================================
// ヘルパー関数: スプライト定義を生成
// ============================================================================

/**
 * ピクセルデータとパレットから SpriteDefinition を生成する
 *
 * @param pixels - 32×32 のパレットインデックス配列
 * @param palette - カラーパレット
 * @returns SpriteDefinition
 */
function createSpriteDefinition(
  pixels: number[][],
  palette: string[]
): SpriteDefinition {
  return {
    width: 32,
    height: 32,
    pixels,
    palette,
  };
}

type RegionShift = Readonly<{
  left: number;
  top: number;
  right: number;
  bottom: number;
  dx: number;
  dy: number;
}>;

function shiftRegion(base: number[][], shift: RegionShift): number[][] {
  const source = clonePixels(base);
  const next = clonePixels(base);

  for (let y = shift.top; y <= shift.bottom; y += 1) {
    for (let x = shift.left; x <= shift.right; x += 1) {
      if (next[y] && next[y][x] !== undefined) {
        next[y][x] = 0;
      }
    }
  }

  for (let y = shift.top; y <= shift.bottom; y += 1) {
    for (let x = shift.left; x <= shift.right; x += 1) {
      const value = source[y]?.[x] ?? 0;
      if (value === 0) {
        continue;
      }

      const nextX = x + shift.dx;
      const nextY = y + shift.dy;

      if (next[nextY] && next[nextY][nextX] !== undefined) {
        next[nextY][nextX] = value;
      }
    }
  }

  return next;
}

function createVariant(
  base: number[][],
  shifts: RegionShift[],
  edits: PixelEdit[] = []
): number[][] {
  const shifted = shifts.reduce((pixels, shift) => shiftRegion(pixels, shift), base);
  return applyPixelEdits(shifted, edits);
}

function mirrorPixels(base: number[][]): number[][] {
  return base.map((row) => [...row].reverse());
}

// ============================================================================
// 盗賊スプライトデータ - 下向き（正面）
// ============================================================================

/** 盗賊・下向き・待機フレーム */
const thiefDownIdleBase: number[][] = [
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 2, 2, 2, 2, 2, 2, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 2, 2, 2, 2, 2, 2, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 2, 1, 1, 1, 1, 1, 1, 1, 1, 2, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 2, 1, 1, 1, 1, 1, 1, 1, 1, 2, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 7, 7, 7, 7, 7, 7, 7, 7, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 7, 7, 7, 7, 7, 7, 7, 7, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 7, 7, 1, 1, 1, 1, 7, 7, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 7, 7, 1, 1, 1, 1, 7, 7, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 7, 7, 7, 7, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 7, 7, 7, 7, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 2, 3, 3, 3, 3, 3, 3, 3, 3, 2, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 2, 3, 3, 3, 3, 3, 3, 3, 3, 2, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 5, 5, 2, 2, 3, 3, 4, 4, 4, 4, 3, 3, 2, 2, 6, 6, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 5, 5, 2, 2, 3, 3, 4, 4, 4, 4, 3, 3, 2, 2, 6, 6, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 5, 5, 1, 1, 3, 3, 3, 3, 3, 3, 3, 3, 1, 1, 6, 6, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 5, 5, 1, 1, 3, 3, 3, 3, 3, 3, 3, 3, 1, 1, 6, 6, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 2, 2, 3, 3, 3, 3, 2, 2, 1, 1, 6, 6, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 2, 2, 3, 3, 3, 3, 2, 2, 1, 1, 6, 6, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 2, 3, 3, 3, 3, 2, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 2, 3, 3, 3, 3, 2, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 2, 2, 2, 2, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 2, 2, 2, 2, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 0, 0, 0, 0, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 0, 0, 0, 0, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 0, 0, 0, 0, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 0, 0, 0, 0, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 0, 0, 0, 0, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 0, 0, 0, 0, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
];

const thiefDownIdle = applyPixelEdits(thiefDownIdleBase, [
  { x: 12, y: 0, value: 0 },
  { x: 13, y: 0, value: 5 },
  { x: 14, y: 0, value: 1 },
  { x: 15, y: 0, value: 1 },
  { x: 16, y: 0, value: 1 },
  { x: 17, y: 0, value: 1 },
  { x: 18, y: 0, value: 5 },
  { x: 19, y: 0, value: 0 },
  { x: 11, y: 1, value: 0 },
  { x: 12, y: 1, value: 5 },
  { x: 13, y: 1, value: 1 },
  { x: 14, y: 1, value: 1 },
  { x: 15, y: 1, value: 2 },
  { x: 16, y: 1, value: 2 },
  { x: 17, y: 1, value: 1 },
  { x: 18, y: 1, value: 1 },
  { x: 19, y: 1, value: 5 },
  { x: 20, y: 1, value: 0 },
  { x: 9, y: 2, value: 5 },
  { x: 11, y: 2, value: 1 },
  { x: 12, y: 2, value: 1 },
  { x: 13, y: 2, value: 2 },
  { x: 18, y: 2, value: 2 },
  { x: 19, y: 2, value: 1 },
  { x: 20, y: 2, value: 1 },
  { x: 21, y: 2, value: 1 },
  { x: 22, y: 2, value: 5 },
  { x: 9, y: 3, value: 5 },
  { x: 11, y: 3, value: 1 },
  { x: 20, y: 3, value: 1 },
  { x: 22, y: 3, value: 5 },
  { x: 10, y: 4, value: 1 },
  { x: 21, y: 4, value: 1 },
  { x: 10, y: 5, value: 1 },
  { x: 21, y: 5, value: 1 },
  { x: 11, y: 6, value: 1 },
  { x: 20, y: 6, value: 1 },
  { x: 12, y: 6, value: 7 },
  { x: 13, y: 6, value: 10 },
  { x: 17, y: 6, value: 10 },
  { x: 18, y: 6, value: 7 },
  { x: 11, y: 7, value: 7 },
  { x: 12, y: 7, value: 7 },
  { x: 18, y: 7, value: 7 },
  { x: 19, y: 7, value: 7 },
  { x: 12, y: 8, value: 7 },
  { x: 13, y: 8, value: 7 },
  { x: 14, y: 8, value: 9 },
  { x: 16, y: 8, value: 9 },
  { x: 17, y: 8, value: 7 },
  { x: 18, y: 8, value: 7 },
  { x: 6, y: 11, value: 5 },
  { x: 24, y: 11, value: 6 },
  { x: 25, y: 11, value: 10 },
  { x: 10, y: 12, value: 1 },
  { x: 21, y: 12, value: 1 },
]);

/** 盗賊・下向き・歩行フレーム1（左足前）— 足幅拡大+腕振り */
const thiefDownWalk1 = createVariant(
  thiefDownIdle,
  [
    { left: 8, top: 14, right: 11, bottom: 18, dx: -2, dy: 0 },
    { left: 21, top: 14, right: 24, bottom: 18, dx: 1, dy: 0 },
    { left: 11, top: 12, right: 20, bottom: 18, dx: -1, dy: 0 },
    { left: 12, top: 19, right: 20, bottom: 29, dx: 0, dy: -1 },
    { left: 12, top: 24, right: 15, bottom: 29, dx: -2, dy: 0 },
    { left: 17, top: 24, right: 21, bottom: 29, dx: 2, dy: 1 },
  ],
  [
    { x: 9, y: 15, value: 5 },
    { x: 10, y: 15, value: 5 },
    { x: 22, y: 15, value: 6 },
    { x: 23, y: 15, value: 6 },
    { x: 14, y: 14, value: 4 },
    { x: 15, y: 14, value: 4 },
    { x: 16, y: 14, value: 4 },
    { x: 17, y: 14, value: 4 },
    { x: 12, y: 19, value: 2 },
    { x: 19, y: 20, value: 2 },
  ]
);

/** 盗賊・下向き・歩行フレーム2（右足前）— 足幅拡大+腕振り逆+ボビング */
const thiefDownWalk2 = createVariant(
  thiefDownIdle,
  [
    { left: 8, top: 14, right: 11, bottom: 18, dx: 1, dy: 0 },
    { left: 21, top: 14, right: 24, bottom: 18, dx: -2, dy: 0 },
    { left: 11, top: 12, right: 20, bottom: 18, dx: 1, dy: 0 },
    { left: 12, top: 19, right: 20, bottom: 29, dx: 0, dy: 1 },
    { left: 12, top: 24, right: 15, bottom: 29, dx: 2, dy: 1 },
    { left: 17, top: 24, right: 21, bottom: 29, dx: -2, dy: 0 },
  ],
  [
    { x: 9, y: 15, value: 6 },
    { x: 10, y: 15, value: 6 },
    { x: 22, y: 15, value: 5 },
    { x: 23, y: 15, value: 5 },
    { x: 14, y: 15, value: 4 },
    { x: 15, y: 15, value: 4 },
    { x: 16, y: 15, value: 4 },
    { x: 17, y: 15, value: 4 },
    { x: 12, y: 20, value: 2 },
    { x: 19, y: 19, value: 2 },
  ]
);

/** 盗賊・下向き・中間フレーム（軽く沈み込んで踏み替える） */
const thiefDownMid = createVariant(
  thiefDownIdle,
  [
    { left: 10, top: 12, right: 22, bottom: 22, dx: 0, dy: 1 },
  ],
  [
    { x: 14, y: 14, value: 4 },
    { x: 15, y: 14, value: 4 },
    { x: 16, y: 14, value: 4 },
    { x: 17, y: 14, value: 4 },
    { x: 13, y: 19, value: 2 },
    { x: 18, y: 19, value: 2 },
  ]
);

// ============================================================================
// 盗賊スプライトデータ - 上向き（背面）
// ============================================================================

/** 盗賊・上向き・待機フレーム */
const thiefUpIdleBase: number[][] = [
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 2, 2, 2, 2, 2, 2, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 2, 2, 2, 2, 2, 2, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 2, 1, 1, 1, 1, 1, 1, 1, 1, 2, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 2, 1, 1, 1, 1, 1, 1, 1, 1, 2, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 2, 2, 2, 2, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 2, 2, 2, 2, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 7, 7, 7, 7, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 7, 7, 7, 7, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 2, 3, 3, 3, 3, 3, 3, 3, 3, 2, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 2, 3, 3, 3, 3, 3, 3, 3, 3, 2, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 6, 6, 2, 2, 3, 3, 2, 2, 2, 2, 3, 3, 2, 2, 5, 5, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 6, 6, 2, 2, 3, 3, 2, 2, 2, 2, 3, 3, 2, 2, 5, 5, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 6, 6, 1, 1, 3, 3, 3, 3, 3, 3, 3, 3, 1, 1, 5, 5, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 6, 6, 1, 1, 3, 3, 3, 3, 3, 3, 3, 3, 1, 1, 5, 5, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 2, 2, 3, 3, 3, 3, 2, 2, 1, 1, 5, 5, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 2, 2, 3, 3, 3, 3, 2, 2, 1, 1, 5, 5, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 2, 3, 3, 3, 3, 2, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 2, 3, 3, 3, 3, 2, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 2, 2, 2, 2, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 2, 2, 2, 2, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 0, 0, 0, 0, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 0, 0, 0, 0, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 0, 0, 0, 0, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 0, 0, 0, 0, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 0, 0, 0, 0, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 0, 0, 0, 0, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
];

const thiefUpIdle = applyPixelEdits(thiefUpIdleBase, [
  { x: 12, y: 0, value: 0 },
  { x: 13, y: 0, value: 5 },
  { x: 14, y: 0, value: 1 },
  { x: 15, y: 0, value: 1 },
  { x: 16, y: 0, value: 1 },
  { x: 17, y: 0, value: 1 },
  { x: 18, y: 0, value: 5 },
  { x: 19, y: 0, value: 0 },
  { x: 11, y: 1, value: 0 },
  { x: 12, y: 1, value: 5 },
  { x: 13, y: 1, value: 1 },
  { x: 14, y: 1, value: 1 },
  { x: 15, y: 1, value: 2 },
  { x: 16, y: 1, value: 2 },
  { x: 17, y: 1, value: 1 },
  { x: 18, y: 1, value: 1 },
  { x: 19, y: 1, value: 5 },
  { x: 20, y: 1, value: 0 },
  { x: 9, y: 2, value: 5 },
  { x: 11, y: 2, value: 1 },
  { x: 20, y: 2, value: 1 },
  { x: 21, y: 2, value: 1 },
  { x: 22, y: 2, value: 5 },
  { x: 9, y: 3, value: 5 },
  { x: 11, y: 3, value: 1 },
  { x: 20, y: 3, value: 1 },
  { x: 22, y: 3, value: 5 },
  { x: 11, y: 4, value: 1 },
  { x: 20, y: 4, value: 1 },
  { x: 11, y: 5, value: 1 },
  { x: 20, y: 5, value: 1 },
  { x: 12, y: 6, value: 1 },
  { x: 19, y: 6, value: 1 },
  { x: 13, y: 6, value: 5 },
  { x: 14, y: 6, value: 8 },
  { x: 17, y: 6, value: 8 },
  { x: 18, y: 6, value: 5 },
  { x: 12, y: 7, value: 8 },
  { x: 13, y: 7, value: 8 },
  { x: 14, y: 7, value: 8 },
  { x: 17, y: 7, value: 8 },
  { x: 18, y: 7, value: 8 },
  { x: 19, y: 7, value: 8 },
  { x: 7, y: 11, value: 6 },
  { x: 24, y: 11, value: 5 },
  { x: 10, y: 12, value: 1 },
  { x: 21, y: 12, value: 1 },
]);

/** 盗賊・上向き・歩行フレーム1（左足前）— 足幅拡大+腕振り */
const thiefUpWalk1 = createVariant(
  thiefUpIdle,
  [
    { left: 8, top: 14, right: 11, bottom: 18, dx: -2, dy: 0 },
    { left: 21, top: 14, right: 24, bottom: 18, dx: 1, dy: 0 },
    { left: 11, top: 12, right: 20, bottom: 18, dx: -1, dy: 0 },
    { left: 12, top: 19, right: 20, bottom: 29, dx: 0, dy: -1 },
    { left: 12, top: 24, right: 15, bottom: 29, dx: -2, dy: 0 },
    { left: 17, top: 24, right: 21, bottom: 29, dx: 2, dy: 1 },
  ],
  [
    { x: 9, y: 15, value: 6 },
    { x: 10, y: 15, value: 6 },
    { x: 22, y: 15, value: 5 },
    { x: 23, y: 15, value: 5 },
    { x: 14, y: 14, value: 2 },
    { x: 15, y: 14, value: 2 },
    { x: 16, y: 14, value: 2 },
    { x: 17, y: 14, value: 2 },
    { x: 12, y: 19, value: 2 },
    { x: 19, y: 20, value: 2 },
  ]
);

/** 盗賊・上向き・歩行フレーム2（右足前）— 足幅拡大+腕振り逆+ボビング */
const thiefUpWalk2 = createVariant(
  thiefUpIdle,
  [
    { left: 8, top: 14, right: 11, bottom: 18, dx: 1, dy: 0 },
    { left: 21, top: 14, right: 24, bottom: 18, dx: -2, dy: 0 },
    { left: 11, top: 12, right: 20, bottom: 18, dx: 1, dy: 0 },
    { left: 12, top: 19, right: 20, bottom: 29, dx: 0, dy: 1 },
    { left: 12, top: 24, right: 15, bottom: 29, dx: 2, dy: 1 },
    { left: 17, top: 24, right: 21, bottom: 29, dx: -2, dy: 0 },
  ],
  [
    { x: 9, y: 15, value: 5 },
    { x: 10, y: 15, value: 5 },
    { x: 22, y: 15, value: 6 },
    { x: 23, y: 15, value: 6 },
    { x: 14, y: 15, value: 2 },
    { x: 15, y: 15, value: 2 },
    { x: 16, y: 15, value: 2 },
    { x: 17, y: 15, value: 2 },
    { x: 12, y: 20, value: 2 },
    { x: 19, y: 19, value: 2 },
  ]
);

/** 盗賊・上向き・中間フレーム（背を低くして次の一歩へ繋ぐ） */
const thiefUpMid = createVariant(
  thiefUpIdle,
  [
    { left: 10, top: 12, right: 22, bottom: 22, dx: 0, dy: 1 },
  ],
  [
    { x: 14, y: 14, value: 2 },
    { x: 15, y: 14, value: 2 },
    { x: 16, y: 14, value: 2 },
    { x: 17, y: 14, value: 2 },
    { x: 13, y: 19, value: 2 },
    { x: 18, y: 19, value: 2 },
  ]
);

// ============================================================================
// 盗賊スプライトデータ - 左向き
// ============================================================================

/** 盗賊・左向き・待機フレーム（左手にダガー） */
const thiefLeftIdleBase: number[][] = [
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 2, 2, 2, 2, 2, 2, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 2, 2, 2, 2, 2, 2, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 2, 2, 1, 1, 1, 1, 1, 1, 1, 1, 2, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 2, 2, 1, 1, 1, 1, 1, 1, 1, 1, 2, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 7, 7, 7, 7, 1, 1, 7, 7, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 7, 7, 7, 7, 1, 1, 7, 7, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 7, 7, 7, 7, 7, 7, 7, 7, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 7, 7, 7, 7, 7, 7, 7, 7, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 7, 7, 7, 7, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 7, 7, 7, 7, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 2, 2, 3, 3, 3, 3, 3, 3, 3, 3, 2, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 2, 2, 3, 3, 3, 3, 3, 3, 3, 3, 2, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 5, 5, 2, 2, 3, 3, 4, 4, 4, 4, 3, 3, 2, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 5, 5, 2, 2, 3, 3, 4, 4, 4, 4, 3, 3, 2, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 5, 5, 1, 1, 3, 3, 3, 3, 3, 3, 3, 3, 1, 1, 6, 6, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 5, 5, 1, 1, 3, 3, 3, 3, 3, 3, 3, 3, 1, 1, 6, 6, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 2, 2, 3, 3, 3, 3, 2, 2, 1, 1, 6, 6, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 2, 2, 3, 3, 3, 3, 2, 2, 1, 1, 6, 6, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 2, 3, 3, 3, 3, 2, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 2, 3, 3, 3, 3, 2, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 2, 2, 2, 2, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 2, 2, 2, 2, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 0, 0, 0, 0, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 0, 0, 0, 0, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 0, 0, 0, 0, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 0, 0, 0, 0, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 0, 0, 0, 0, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 0, 0, 0, 0, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
];

const thiefLeftIdle = applyPixelEdits(thiefLeftIdleBase, [
  { x: 12, y: 0, value: 0 },
  { x: 13, y: 0, value: 5 },
  { x: 14, y: 0, value: 1 },
  { x: 15, y: 0, value: 1 },
  { x: 16, y: 0, value: 5 },
  { x: 17, y: 0, value: 5 },
  { x: 18, y: 0, value: 0 },
  { x: 11, y: 1, value: 5 },
  { x: 12, y: 1, value: 1 },
  { x: 13, y: 1, value: 1 },
  { x: 14, y: 1, value: 2 },
  { x: 15, y: 1, value: 5 },
  { x: 16, y: 1, value: 5 },
  { x: 17, y: 1, value: 5 },
  { x: 18, y: 1, value: 5 },
  { x: 19, y: 1, value: 0 },
  { x: 10, y: 2, value: 5 },
  { x: 11, y: 2, value: 1 },
  { x: 12, y: 2, value: 7 },
  { x: 13, y: 2, value: 7 },
  { x: 14, y: 2, value: 10 },
  { x: 15, y: 2, value: 1 },
  { x: 16, y: 2, value: 5 },
  { x: 17, y: 2, value: 5 },
  { x: 18, y: 2, value: 5 },
  { x: 19, y: 2, value: 5 },
  { x: 20, y: 2, value: 0 },
  { x: 10, y: 3, value: 7 },
  { x: 11, y: 3, value: 10 },
  { x: 12, y: 3, value: 1 },
  { x: 13, y: 3, value: 7 },
  { x: 14, y: 3, value: 7 },
  { x: 15, y: 3, value: 9 },
  { x: 16, y: 3, value: 1 },
  { x: 17, y: 3, value: 5 },
  { x: 18, y: 3, value: 5 },
  { x: 19, y: 3, value: 5 },
  { x: 20, y: 3, value: 5 },
  { x: 21, y: 3, value: 0 },
  { x: 10, y: 4, value: 7 },
  { x: 11, y: 4, value: 10 },
  { x: 12, y: 4, value: 1 },
  { x: 13, y: 4, value: 7 },
  { x: 14, y: 4, value: 9 },
  { x: 15, y: 4, value: 9 },
  { x: 16, y: 4, value: 5 },
  { x: 17, y: 4, value: 5 },
  { x: 18, y: 4, value: 5 },
  { x: 19, y: 4, value: 5 },
  { x: 20, y: 4, value: 0 },
  { x: 21, y: 4, value: 0 },
  { x: 5, y: 14, value: 5 },
  { x: 20, y: 11, value: 6 },
]);

/** 盗賊・左向き・歩行フレーム1 — 足幅拡大 */
const thiefLeftWalk1 = createVariant(
  thiefLeftIdle,
  [
    { left: 6, top: 14, right: 9, bottom: 18, dx: -1, dy: 0 },
    { left: 19, top: 16, right: 22, bottom: 18, dx: 1, dy: -1 },
    { left: 10, top: 12, right: 18, bottom: 18, dx: -1, dy: 0 },
    { left: 10, top: 19, right: 19, bottom: 29, dx: 0, dy: -1 },
    { left: 8, top: 24, right: 12, bottom: 29, dx: -2, dy: 0 },
    { left: 16, top: 24, right: 21, bottom: 29, dx: 2, dy: 1 },
  ],
  [
    { x: 9, y: 15, value: 5 },
    { x: 18, y: 15, value: 6 },
    { x: 12, y: 14, value: 4 },
    { x: 13, y: 14, value: 4 },
    { x: 14, y: 14, value: 4 },
    { x: 10, y: 19, value: 2 },
    { x: 17, y: 20, value: 2 },
  ]
);

/** 盗賊・左向き・歩行フレーム2 — 足幅拡大+ボビング */
const thiefLeftWalk2 = createVariant(
  thiefLeftIdle,
  [
    { left: 6, top: 14, right: 9, bottom: 18, dx: 1, dy: -1 },
    { left: 19, top: 16, right: 22, bottom: 18, dx: -1, dy: 0 },
    { left: 10, top: 12, right: 18, bottom: 18, dx: 1, dy: 0 },
    { left: 10, top: 19, right: 19, bottom: 29, dx: 0, dy: 1 },
    { left: 8, top: 24, right: 12, bottom: 29, dx: 2, dy: 1 },
    { left: 16, top: 24, right: 21, bottom: 29, dx: -2, dy: 0 },
  ],
  [
    { x: 9, y: 15, value: 5 },
    { x: 18, y: 15, value: 6 },
    { x: 12, y: 15, value: 4 },
    { x: 13, y: 15, value: 4 },
    { x: 14, y: 15, value: 4 },
    { x: 10, y: 20, value: 2 },
    { x: 17, y: 19, value: 2 },
  ]
);

/** 盗賊・左向き・中間フレーム（前傾を少し深める） */
const thiefLeftMid = createVariant(
  thiefLeftIdle,
  [
    { left: 10, top: 12, right: 20, bottom: 22, dx: 0, dy: 1 },
  ],
  [
    { x: 13, y: 14, value: 4 },
    { x: 14, y: 14, value: 4 },
    { x: 15, y: 14, value: 4 },
    { x: 11, y: 19, value: 2 },
    { x: 17, y: 19, value: 2 },
  ]
);

// ============================================================================
// 盗賊スプライトデータ - 右向き
// ============================================================================

const thiefRightIdle = mirrorPixels(thiefLeftIdle);

/** 盗賊・右向き・歩行フレーム1 — 足幅拡大 */
const thiefRightWalk1 = mirrorPixels(thiefLeftWalk1);

/** 盗賊・右向き・歩行フレーム2 — 足幅拡大+ボビング */
const thiefRightWalk2 = mirrorPixels(thiefLeftWalk2);

/** 盗賊・右向き・中間フレーム */
const thiefRightMid = mirrorPixels(thiefLeftMid);

// ============================================================================
// 盗賊スプライトシート定義（方向ごと）
// ============================================================================

/** 盗賊のスプライトシート（4方向） */
export const THIEF_SPRITES: Record<Direction, SpriteSheetDefinition> = {
  /** 下向き（正面）：右手にダガー */
  down: createSheetWithDuration([
    createSpriteDefinition(thiefDownIdle, THIEF_PALETTE),
    createSpriteDefinition(thiefDownWalk1, THIEF_PALETTE),
    createSpriteDefinition(thiefDownMid, THIEF_PALETTE),
    createSpriteDefinition(thiefDownWalk2, THIEF_PALETTE),
  ], 92),
  /** 上向き（背面）：マント見え */
  up: createSheetWithDuration([
    createSpriteDefinition(thiefUpIdle, THIEF_PALETTE),
    createSpriteDefinition(thiefUpWalk1, THIEF_PALETTE),
    createSpriteDefinition(thiefUpMid, THIEF_PALETTE),
    createSpriteDefinition(thiefUpWalk2, THIEF_PALETTE),
  ], 92),
  /** 左向き：左手にダガー */
  left: createSheetWithDuration([
    createSpriteDefinition(thiefLeftIdle, THIEF_PALETTE),
    createSpriteDefinition(thiefLeftWalk1, THIEF_PALETTE),
    createSpriteDefinition(thiefLeftMid, THIEF_PALETTE),
    createSpriteDefinition(thiefLeftWalk2, THIEF_PALETTE),
  ], 92),
  /** 右向き：右手にダガー */
  right: createSheetWithDuration([
    createSpriteDefinition(thiefRightIdle, THIEF_PALETTE),
    createSpriteDefinition(thiefRightWalk1, THIEF_PALETTE),
    createSpriteDefinition(thiefRightMid, THIEF_PALETTE),
    createSpriteDefinition(thiefRightWalk2, THIEF_PALETTE),
  ], 92),
};

// ============================================================================
// カスタム frameDuration 付きシート生成ヘルパー
// ============================================================================

/**
 * frameDuration を指定してスプライトシート定義を生成する
 *
 * @param frames - SpriteDefinition 配列
 * @param frameDuration - フレーム持続時間（ms）
 * @returns SpriteSheetDefinition
 */
function createSheetWithDuration(
  frames: SpriteDefinition[],
  frameDuration: number
): SpriteSheetDefinition {
  return {
    sprites: frames,
    frameDuration,
  };
}

// ============================================================================
// 盗賊 攻撃スプライトデータ
// ============================================================================

/** 盗賊・下向き・攻撃フレーム1（構え） */
const thiefDownAttack1 = createVariant(
  thiefDownIdle,
  [
    { left: 8, top: 14, right: 10, bottom: 18, dx: -1, dy: 0 },
    { left: 21, top: 14, right: 23, bottom: 18, dx: 2, dy: -1 },
    { left: 12, top: 12, right: 20, bottom: 18, dx: 0, dy: 1 },
    { left: 12, top: 19, right: 20, bottom: 29, dx: 0, dy: 1 },
  ],
  [
    { x: 22, y: 13, value: 7 },
    { x: 23, y: 12, value: 7 },
    { x: 24, y: 11, value: 6 },
    { x: 25, y: 10, value: 6 },
    { x: 14, y: 14, value: 3 },
    { x: 15, y: 14, value: 4 },
    { x: 16, y: 14, value: 4 },
    { x: 17, y: 14, value: 3 },
    { x: 12, y: 20, value: 2 },
    { x: 19, y: 20, value: 2 },
  ]
);

/** 盗賊・下向き・攻撃フレーム2（突き） */
const thiefDownAttack2 = createVariant(
  thiefDownIdle,
  [
    { left: 21, top: 14, right: 23, bottom: 18, dx: 1, dy: 1 },
    { left: 12, top: 12, right: 20, bottom: 18, dx: 0, dy: 1 },
    { left: 12, top: 19, right: 20, bottom: 29, dx: 0, dy: 1 },
  ],
  [
    { x: 22, y: 15, value: 7 },
    { x: 23, y: 15, value: 7 },
    { x: 24, y: 15, value: 6 },
    { x: 25, y: 15, value: 6 },
    { x: 26, y: 15, value: 6 },
    { x: 14, y: 15, value: 3 },
    { x: 15, y: 15, value: 4 },
    { x: 16, y: 15, value: 4 },
    { x: 17, y: 15, value: 3 },
    { x: 12, y: 21, value: 2 },
    { x: 19, y: 21, value: 2 },
  ]
);

/** 盗賊・上向き・攻撃フレーム1（構え） */
const thiefUpAttack1 = createVariant(
  thiefUpIdle,
  [
    { left: 8, top: 14, right: 10, bottom: 18, dx: -1, dy: 0 },
    { left: 21, top: 14, right: 23, bottom: 18, dx: 2, dy: -1 },
    { left: 12, top: 12, right: 20, bottom: 18, dx: 0, dy: 1 },
    { left: 12, top: 19, right: 20, bottom: 29, dx: 0, dy: 1 },
  ],
  [
    { x: 22, y: 13, value: 5 },
    { x: 23, y: 12, value: 5 },
    { x: 24, y: 11, value: 6 },
    { x: 25, y: 10, value: 6 },
    { x: 14, y: 14, value: 1 },
    { x: 15, y: 14, value: 2 },
    { x: 16, y: 14, value: 2 },
    { x: 17, y: 14, value: 1 },
    { x: 12, y: 20, value: 2 },
    { x: 19, y: 20, value: 2 },
  ]
);

/** 盗賊・上向き・攻撃フレーム2（上段突き） */
const thiefUpAttack2 = createVariant(
  thiefUpIdle,
  [
    { left: 21, top: 14, right: 23, bottom: 18, dx: 1, dy: 1 },
    { left: 12, top: 12, right: 20, bottom: 18, dx: 0, dy: 1 },
    { left: 12, top: 19, right: 20, bottom: 29, dx: 0, dy: 1 },
  ],
  [
    { x: 22, y: 15, value: 5 },
    { x: 23, y: 15, value: 5 },
    { x: 24, y: 15, value: 6 },
    { x: 25, y: 15, value: 6 },
    { x: 26, y: 15, value: 6 },
    { x: 14, y: 15, value: 1 },
    { x: 15, y: 15, value: 2 },
    { x: 16, y: 15, value: 2 },
    { x: 17, y: 15, value: 1 },
    { x: 12, y: 21, value: 2 },
    { x: 19, y: 21, value: 2 },
  ]
);

/** 盗賊・左向き・攻撃フレーム1（構え） */
const thiefLeftAttack1 = createVariant(
  thiefLeftIdle,
  [
    { left: 6, top: 14, right: 9, bottom: 18, dx: -1, dy: 0 },
    { left: 18, top: 15, right: 21, bottom: 18, dx: 1, dy: -1 },
    { left: 10, top: 12, right: 18, bottom: 18, dx: 0, dy: 1 },
    { left: 10, top: 19, right: 19, bottom: 29, dx: 0, dy: 1 },
  ],
  [
    { x: 3, y: 15, value: 6 },
    { x: 4, y: 15, value: 6 },
    { x: 5, y: 15, value: 7 },
    { x: 6, y: 15, value: 7 },
    { x: 12, y: 14, value: 4 },
    { x: 13, y: 14, value: 4 },
    { x: 14, y: 14, value: 4 },
    { x: 10, y: 20, value: 2 },
    { x: 17, y: 20, value: 2 },
  ]
);

/** 盗賊・左向き・攻撃フレーム2（左突き） */
const thiefLeftAttack2 = createVariant(
  thiefLeftIdle,
  [
    { left: 18, top: 15, right: 21, bottom: 18, dx: 1, dy: 0 },
    { left: 10, top: 12, right: 18, bottom: 18, dx: 0, dy: 1 },
    { left: 10, top: 19, right: 19, bottom: 29, dx: 0, dy: 1 },
  ],
  [
    { x: 1, y: 15, value: 6 },
    { x: 2, y: 15, value: 6 },
    { x: 3, y: 15, value: 6 },
    { x: 4, y: 15, value: 7 },
    { x: 5, y: 15, value: 7 },
    { x: 12, y: 15, value: 4 },
    { x: 13, y: 15, value: 4 },
    { x: 14, y: 15, value: 4 },
    { x: 10, y: 21, value: 2 },
    { x: 17, y: 21, value: 2 },
  ]
);

/** 盗賊・右向き・攻撃フレーム1（構え） */
const thiefRightAttack1 = mirrorPixels(thiefLeftAttack1);

/** 盗賊・右向き・攻撃フレーム2（右突き） */
const thiefRightAttack2 = mirrorPixels(thiefLeftAttack2);

// ============================================================================
// 盗賊 攻撃スプライトシート定義
// ============================================================================

/** 盗賊の攻撃スプライトシート（4方向 × 2フレーム、100ms） */
export const THIEF_ATTACK_SPRITE_SHEETS: Record<Direction, SpriteSheetDefinition> = {
  down: createSheetWithDuration([
    createSpriteDefinition(thiefDownAttack1, THIEF_PALETTE),
    createSpriteDefinition(thiefDownAttack2, THIEF_PALETTE),
  ], 100),
  up: createSheetWithDuration([
    createSpriteDefinition(thiefUpAttack1, THIEF_PALETTE),
    createSpriteDefinition(thiefUpAttack2, THIEF_PALETTE),
  ], 100),
  left: createSheetWithDuration([
    createSpriteDefinition(thiefLeftAttack1, THIEF_PALETTE),
    createSpriteDefinition(thiefLeftAttack2, THIEF_PALETTE),
  ], 100),
  right: createSheetWithDuration([
    createSpriteDefinition(thiefRightAttack1, THIEF_PALETTE),
    createSpriteDefinition(thiefRightAttack2, THIEF_PALETTE),
  ], 100),
};

// ============================================================================
// 盗賊 被ダメージスプライトデータ
// ============================================================================

/** 盗賊・下向き・被ダメージ（後方にのけぞり） */
const thiefDownDamage = createVariant(
  thiefDownIdle,
  [
    { left: 10, top: 12, right: 22, bottom: 18, dx: 0, dy: 1 },
    { left: 8, top: 14, right: 11, bottom: 18, dx: -1, dy: 0 },
    { left: 21, top: 14, right: 24, bottom: 18, dx: 1, dy: 0 },
  ],
  [
    { x: 9, y: 15, value: 5 },
    { x: 22, y: 15, value: 6 },
    { x: 14, y: 15, value: 3 },
    { x: 15, y: 15, value: 4 },
    { x: 16, y: 15, value: 4 },
    { x: 17, y: 15, value: 3 },
  ]
);

/** 盗賊・上向き・被ダメージ（前方にのけぞり＝画面下方向へ） */
const thiefUpDamage = createVariant(
  thiefUpIdle,
  [
    { left: 10, top: 12, right: 22, bottom: 18, dx: 0, dy: 1 },
    { left: 8, top: 14, right: 11, bottom: 18, dx: -1, dy: 0 },
    { left: 21, top: 14, right: 24, bottom: 18, dx: 1, dy: 0 },
  ],
  [
    { x: 9, y: 15, value: 6 },
    { x: 22, y: 15, value: 5 },
    { x: 14, y: 15, value: 1 },
    { x: 15, y: 15, value: 2 },
    { x: 16, y: 15, value: 2 },
    { x: 17, y: 15, value: 1 },
  ]
);

/** 盗賊・左向き・被ダメージ（右にのけぞり） */
const thiefLeftDamage = createVariant(
  thiefLeftIdle,
  [
    { left: 10, top: 12, right: 20, bottom: 18, dx: 0, dy: 1 },
    { left: 6, top: 14, right: 9, bottom: 18, dx: -1, dy: 0 },
    { left: 18, top: 15, right: 21, bottom: 18, dx: 1, dy: 0 },
  ],
  [
    { x: 9, y: 15, value: 5 },
    { x: 18, y: 15, value: 6 },
    { x: 12, y: 15, value: 4 },
    { x: 13, y: 15, value: 4 },
    { x: 14, y: 15, value: 4 },
  ]
);

/** 盗賊・右向き・被ダメージ（左にのけぞり） */
const thiefRightDamage = mirrorPixels(thiefLeftDamage);

// ============================================================================
// 盗賊 被ダメージスプライト定義
// ============================================================================

/** 盗賊の被ダメージスプライト（4方向 × 1フレーム） */
export const THIEF_DAMAGE_SPRITES: Record<Direction, SpriteDefinition> = {
  down: createSpriteDefinition(thiefDownDamage, THIEF_PALETTE),
  up: createSpriteDefinition(thiefUpDamage, THIEF_PALETTE),
  left: createSpriteDefinition(thiefLeftDamage, THIEF_PALETTE),
  right: createSpriteDefinition(thiefRightDamage, THIEF_PALETTE),
};

// ============================================================================
// 盗賊 待機（呼吸）スプライトデータ
// ============================================================================
const thiefDownBreathe = createVariant(
  thiefDownIdle,
  [
    { left: 10, top: 12, right: 22, bottom: 18, dx: 0, dy: 1 },
  ],
  [
    { x: 14, y: 15, value: 4 },
    { x: 15, y: 15, value: 4 },
    { x: 16, y: 15, value: 4 },
    { x: 17, y: 15, value: 4 },
  ]
);

/** 盗賊・上向き・呼吸フレーム（肩が1px下がる） */
const thiefUpBreathe = createVariant(
  thiefUpIdle,
  [
    { left: 10, top: 12, right: 22, bottom: 18, dx: 0, dy: 1 },
  ],
  [
    { x: 14, y: 15, value: 2 },
    { x: 15, y: 15, value: 2 },
    { x: 16, y: 15, value: 2 },
    { x: 17, y: 15, value: 2 },
  ]
);

/** 盗賊・左向き・呼吸フレーム（肩が1px下がる） */
const thiefLeftBreathe = createVariant(
  thiefLeftIdle,
  [
    { left: 9, top: 12, right: 20, bottom: 18, dx: 0, dy: 1 },
  ],
  [
    { x: 12, y: 14, value: 4 },
    { x: 13, y: 14, value: 4 },
    { x: 9, y: 12, value: 5 },
  ]
);

/** 盗賊・右向き・呼吸フレーム（肩が1px下がる） */
const thiefRightBreathe = mirrorPixels(thiefLeftBreathe);

// ============================================================================
// 盗賊 待機スプライトシート定義
// ============================================================================

/** 盗賊の待機スプライトシート（4方向 × 2フレーム、800ms） */
export const THIEF_IDLE_SPRITE_SHEETS: Record<Direction, SpriteSheetDefinition> = {
  down: createSheetWithDuration([
    createSpriteDefinition(thiefDownIdle, THIEF_PALETTE),
    createSpriteDefinition(thiefDownBreathe, THIEF_PALETTE),
  ], 800),
  up: createSheetWithDuration([
    createSpriteDefinition(thiefUpIdle, THIEF_PALETTE),
    createSpriteDefinition(thiefUpBreathe, THIEF_PALETTE),
  ], 800),
  left: createSheetWithDuration([
    createSpriteDefinition(thiefLeftIdle, THIEF_PALETTE),
    createSpriteDefinition(thiefLeftBreathe, THIEF_PALETTE),
  ], 800),
  right: createSheetWithDuration([
    createSpriteDefinition(thiefRightIdle, THIEF_PALETTE),
    createSpriteDefinition(thiefRightBreathe, THIEF_PALETTE),
  ], 800),
};

// ============================================================================
// ヘルパー関数
// ============================================================================

/**
 * プレイヤークラスと方向からスプライトシートを取得する
 *
 * @param playerClass - プレイヤーの職業（'warrior' | 'thief'）
 * @param direction - 向いている方向
 * @returns 該当するスプライトシート定義
 */
export function getPlayerSpriteSheet(
  playerClass: 'warrior' | 'thief',
  direction: Direction
): SpriteSheetDefinition {
  if (playerClass === 'warrior') {
    return WARRIOR_SPRITES[direction];
  }
  return THIEF_SPRITES[direction];
}

export {
  WARRIOR_SPRITES,
  WARRIOR_IDLE_SPRITE_SHEETS,
  WARRIOR_ATTACK_SPRITE_SHEETS,
  WARRIOR_DAMAGE_SPRITES,
};
