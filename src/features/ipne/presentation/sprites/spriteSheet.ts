/**
 * スプライトシート定義・フレーム計算ヘルパー
 *
 * アニメーションスプライトのフレーム管理を行う。
 */

import { SpriteDefinition } from './spriteData';

/**
 * スプライトシート定義（アニメーション用）
 */
export interface SpriteSheetDefinition {
  /** アニメーションフレームの配列 */
  sprites: SpriteDefinition[];
  /** 1フレームあたりの表示時間（ミリ秒） */
  frameDuration: number;
}

/**
 * 現在時刻からアニメーションフレームインデックスを計算する
 *
 * @param sheet - スプライトシート定義
 * @param currentTime - 現在時刻（ミリ秒）
 * @returns 表示すべきフレームのインデックス
 */
export function getAnimationFrameIndex(
  sheet: SpriteSheetDefinition,
  currentTime: number
): number {
  const frameCount = sheet.sprites.length;
  if (frameCount === 0) return 0;
  return Math.floor(currentTime / sheet.frameDuration) % frameCount;
}

/**
 * 現在時刻から表示すべきスプライトを取得する
 *
 * @param sheet - スプライトシート定義
 * @param currentTime - 現在時刻（ミリ秒）
 * @returns 表示すべきフレームの SpriteDefinition
 */
export function getAnimationFrame(
  sheet: SpriteSheetDefinition,
  currentTime: number
): SpriteDefinition {
  const index = getAnimationFrameIndex(sheet, currentTime);
  return sheet.sprites[index];
}
