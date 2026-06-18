/**
 * プレイヤースプライト定義
 *
 * 戦士（warrior）と盗賊（thief）の2クラス分のスプライトを再export する。
 * 各クラスのスプライト定義は専用モジュール（warriorSpritesV3 / thiefSpritesV3）に分離済み。
 */

import { SpriteSheetDefinition } from './spriteSheet';
import {
  WARRIOR_SPRITES,
  WARRIOR_IDLE_SPRITE_SHEETS,
  WARRIOR_ATTACK_SPRITE_SHEETS,
  WARRIOR_DAMAGE_SPRITES,
} from './warriorSpritesV3';
import {
  THIEF_SPRITES,
  THIEF_IDLE_SPRITE_SHEETS,
  THIEF_ATTACK_SPRITE_SHEETS,
  THIEF_DAMAGE_SPRITES,
} from './thiefSpritesV3';

/** 方向の型 */
export type Direction = 'down' | 'up' | 'left' | 'right';

export {
  WARRIOR_SPRITES,
  WARRIOR_IDLE_SPRITE_SHEETS,
  WARRIOR_ATTACK_SPRITE_SHEETS,
  WARRIOR_DAMAGE_SPRITES,
  THIEF_SPRITES,
  THIEF_IDLE_SPRITE_SHEETS,
  THIEF_ATTACK_SPRITE_SHEETS,
  THIEF_DAMAGE_SPRITES,
};

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
