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
export { FLOOR_SPRITE, WALL_SPRITE, GOAL_SPRITE_SHEET, START_SPRITE, getStageFloorSprite, getStageWallSprite } from './tileSprites';

// プレイヤースプライト
export {
  WARRIOR_SPRITES,
  THIEF_SPRITES,
  getPlayerSpriteSheet,
  WARRIOR_ATTACK_SPRITE_SHEETS,
  THIEF_ATTACK_SPRITE_SHEETS,
  WARRIOR_DAMAGE_SPRITES,
  THIEF_DAMAGE_SPRITES,
  WARRIOR_IDLE_SPRITE_SHEETS,
  THIEF_IDLE_SPRITE_SHEETS,
} from './playerSprites';
export type { Direction } from './playerSprites';

// 敵スプライト
export {
  PATROL_SPRITE_SHEET,
  CHARGE_SPRITE_SHEET,
  RANGED_SPRITE_SHEET,
  SPECIMEN_SPRITE_SHEET,
  BOSS_SPRITE_SHEET,
  MINI_BOSS_SPRITE_SHEET,
  MEGA_BOSS_SPRITE_SHEET,
  getEnemySpriteSheet,
  PATROL_ATTACK_FRAME,
  CHARGE_RUSH_FRAME,
  RANGED_CAST_FRAME,
  SPECIMEN_MUTATE_FRAME,
  BOSS_ATTACK_FRAME,
  BOSS_DAMAGE_FRAME,
  MINI_BOSS_ATTACK_FRAME,
  MINI_BOSS_DAMAGE_FRAME,
  MEGA_BOSS_ATTACK_FRAME,
  MEGA_BOSS_DAMAGE_FRAME,
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
export {
  ATTACK_SLASH_SPRITE_SHEET,
  ENEMY_MELEE_SLASH_SPRITE_SHEET,
  ENEMY_RANGED_SHOT_SPRITE_SHEET,
} from './effectSprites';
