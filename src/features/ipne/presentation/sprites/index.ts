/**
 * スプライトシステム
 *
 * ドット絵スプライトの定義・レンダリング基盤モジュール。
 */

// スプライトデータ定義・生成
export { createSprite, hexToRgba } from './spriteData';
export type { SpriteDefinition } from './spriteData';

// スプライトシート・アニメーション
export { getAnimationFrame, getAnimationFrameIndex } from './spriteSheet';
export type { SpriteSheetDefinition } from './spriteSheet';

// スプライトレンダラー
export { SpriteRenderer } from './spriteRenderer';

// タイルスプライト
export { FLOOR_SPRITE, WALL_SPRITE, GOAL_SPRITE_SHEET, START_SPRITE } from './tileSprites';

// プレイヤースプライト
export { WARRIOR_SPRITES, THIEF_SPRITES, getPlayerSpriteSheet } from './playerSprites';
export type { Direction } from './playerSprites';

// 敵スプライト
export {
  PATROL_SPRITE_SHEET,
  CHARGE_SPRITE_SHEET,
  RANGED_SPRITE_SHEET,
  SPECIMEN_SPRITE_SHEET,
  BOSS_SPRITE_SHEET,
  getEnemySpriteSheet,
} from './enemySprites';

// アイテムスプライト
export {
  HEALTH_SMALL_SPRITE,
  HEALTH_LARGE_SPRITE,
  HEALTH_FULL_SPRITE_SHEET,
  LEVEL_UP_SPRITE_SHEET,
  MAP_REVEAL_SPRITE,
  KEY_SPRITE_SHEET,
  getItemSprite,
} from './itemSprites';

// 罠スプライト
export {
  DAMAGE_TRAP_SPRITE_SHEET,
  SLOW_TRAP_SPRITE_SHEET,
  TELEPORT_TRAP_SPRITE_SHEET,
  getTrapSpriteSheet,
} from './trapSprites';

// 特殊壁スプライト
export {
  BREAKABLE_INTACT_SPRITE,
  BREAKABLE_DAMAGED_SPRITE,
  BREAKABLE_BROKEN_SPRITE,
  PASSABLE_WALL_SPRITE,
  INVISIBLE_WALL_SPRITE,
  getWallSprite,
} from './wallSprites';

// エフェクトスプライト
export { ATTACK_SLASH_SPRITE_SHEET } from './effectSprites';
