/**
 * Phase 0C テスト
 *
 * 0C-1: HUD右上の重なり修正
 * 0C-4: 敵スプライトフレーム数強化（2F→4F）
 * 0C-5: 環境・エフェクトスプライト品質向上
 */

import {
  PATROL_SPRITE_SHEET,
  CHARGE_SPRITE_SHEET,
  RANGED_SPRITE_SHEET,
  SPECIMEN_SPRITE_SHEET,
  BOSS_SPRITE_SHEET,
  MINI_BOSS_SPRITE_SHEET,
  MEGA_BOSS_SPRITE_SHEET,
} from './enemySprites';
import { FLOOR_SPRITE, WALL_SPRITE, getStageFloorSprite, getStageWallSprite } from './tileSprites';
import { BREAKABLE_INTACT_SPRITE, BREAKABLE_DAMAGED_SPRITE, BREAKABLE_BROKEN_SPRITE } from './wallSprites';
import { ATTACK_SLASH_SPRITE_SHEET, ENEMY_MELEE_SLASH_SPRITE_SHEET, ENEMY_RANGED_SHOT_SPRITE_SHEET } from './effectSprites';
import { SpriteDefinition } from './spriteData';
import { StageNumber } from '../../types';

// ============================================================================
// 0C-4: 敵スプライトフレーム数強化
// ============================================================================

describe('0C-4: 敵スプライトフレーム数強化', () => {
  describe('パトロール（スライム）', () => {
    it('4フレームであること', () => {
      expect(PATROL_SPRITE_SHEET.sprites).toHaveLength(4);
    });

    it('frameDurationが250msであること', () => {
      expect(PATROL_SPRITE_SHEET.frameDuration).toBe(250);
    });

    it('全フレームが32x32であること', () => {
      PATROL_SPRITE_SHEET.sprites.forEach((sprite) => {
        expect(sprite.width).toBe(32);
        expect(sprite.height).toBe(32);
        expect(sprite.pixels).toHaveLength(32);
        sprite.pixels.forEach((row) => {
          expect(row).toHaveLength(32);
        });
      });
    });
  });

  describe('チャージ（ビースト）', () => {
    it('4フレームであること', () => {
      expect(CHARGE_SPRITE_SHEET.sprites).toHaveLength(4);
    });

    it('frameDurationが200msであること', () => {
      expect(CHARGE_SPRITE_SHEET.frameDuration).toBe(200);
    });

    it('全フレームが32x32であること', () => {
      CHARGE_SPRITE_SHEET.sprites.forEach((sprite) => {
        expect(sprite.width).toBe(32);
        expect(sprite.height).toBe(32);
        expect(sprite.pixels).toHaveLength(32);
        sprite.pixels.forEach((row) => {
          expect(row).toHaveLength(32);
        });
      });
    });
  });

  describe('レンジ（メイジ）', () => {
    it('4フレームであること', () => {
      expect(RANGED_SPRITE_SHEET.sprites).toHaveLength(4);
    });

    it('frameDurationが300msであること', () => {
      expect(RANGED_SPRITE_SHEET.frameDuration).toBe(300);
    });

    it('全フレームが32x32であること', () => {
      RANGED_SPRITE_SHEET.sprites.forEach((sprite) => {
        expect(sprite.width).toBe(32);
        expect(sprite.height).toBe(32);
        expect(sprite.pixels).toHaveLength(32);
        sprite.pixels.forEach((row) => {
          expect(row).toHaveLength(32);
        });
      });
    });
  });

  describe('スペシメン', () => {
    it('4フレームであること', () => {
      expect(SPECIMEN_SPRITE_SHEET.sprites).toHaveLength(4);
    });

    it('frameDurationが350msであること', () => {
      expect(SPECIMEN_SPRITE_SHEET.frameDuration).toBe(350);
    });

    it('全フレームが32x32であること', () => {
      SPECIMEN_SPRITE_SHEET.sprites.forEach((sprite) => {
        expect(sprite.width).toBe(32);
        expect(sprite.height).toBe(32);
        expect(sprite.pixels).toHaveLength(32);
        sprite.pixels.forEach((row) => {
          expect(row).toHaveLength(32);
        });
      });
    });
  });

  describe('ボス', () => {
    it('4フレームを維持すること', () => {
      expect(BOSS_SPRITE_SHEET.sprites).toHaveLength(4);
    });

    it('frameDurationが250msを維持すること', () => {
      expect(BOSS_SPRITE_SHEET.frameDuration).toBe(250);
    });

    it('全フレームが48x48であること', () => {
      BOSS_SPRITE_SHEET.sprites.forEach((sprite) => {
        expect(sprite.width).toBe(48);
        expect(sprite.height).toBe(48);
      });
    });
  });

  describe('ミニボス', () => {
    it('4フレームであること', () => {
      expect(MINI_BOSS_SPRITE_SHEET.sprites).toHaveLength(4);
    });

    it('frameDurationが200msであること', () => {
      expect(MINI_BOSS_SPRITE_SHEET.frameDuration).toBe(200);
    });

    it('全フレームが40x40であること', () => {
      MINI_BOSS_SPRITE_SHEET.sprites.forEach((sprite) => {
        expect(sprite.width).toBe(40);
        expect(sprite.height).toBe(40);
        expect(sprite.pixels).toHaveLength(40);
        sprite.pixels.forEach((row) => {
          expect(row).toHaveLength(40);
        });
      });
    });
  });

  describe('メガボス', () => {
    it('4フレームであること', () => {
      expect(MEGA_BOSS_SPRITE_SHEET.sprites).toHaveLength(4);
    });

    it('frameDurationが200msであること', () => {
      expect(MEGA_BOSS_SPRITE_SHEET.frameDuration).toBe(200);
    });

    it('全フレームが56x56であること', () => {
      MEGA_BOSS_SPRITE_SHEET.sprites.forEach((sprite) => {
        expect(sprite.width).toBe(56);
        expect(sprite.height).toBe(56);
        expect(sprite.pixels).toHaveLength(56);
        sprite.pixels.forEach((row) => {
          expect(row).toHaveLength(56);
        });
      });
    });
  });

  describe('全敵タイプ共通', () => {
    it('全スプライトのパレットインデックスが有効範囲内であること', () => {
      const sheets = [
        PATROL_SPRITE_SHEET,
        CHARGE_SPRITE_SHEET,
        RANGED_SPRITE_SHEET,
        SPECIMEN_SPRITE_SHEET,
        BOSS_SPRITE_SHEET,
        MINI_BOSS_SPRITE_SHEET,
        MEGA_BOSS_SPRITE_SHEET,
      ];

      sheets.forEach((sheet) => {
        sheet.sprites.forEach((sprite) => {
          const maxIndex = sprite.palette.length - 1;
          sprite.pixels.forEach((row, _y) => {
            row.forEach((pixel, _x) => {
              expect(pixel).toBeGreaterThanOrEqual(0);
              expect(pixel).toBeLessThanOrEqual(maxIndex);
            });
          });
        });
      });
    });
  });
});

// ============================================================================
// 0C-5: 環境・エフェクトスプライト品質向上
// ============================================================================

/** スプライトのパレットインデックス有効性を検証するヘルパー */
function validateSpriteIntegrity(sprite: SpriteDefinition, label: string) {
  const maxIndex = sprite.palette.length - 1;
  expect(sprite.pixels).toHaveLength(sprite.height);
  sprite.pixels.forEach((row, y) => {
    expect(row).toHaveLength(sprite.width);
    row.forEach((pixel, x) => {
      if (pixel < 0 || pixel > maxIndex) {
        fail(`${label}: 無効なパレットインデックス ${pixel} at (${x}, ${y}), max=${maxIndex}`);
      }
    });
  });
}

describe('0C-5: 環境・エフェクトスプライト品質向上', () => {
  describe('タイルスプライト', () => {
    it('床タイルが32x32でパレットインデックスが有効であること', () => {
      expect(FLOOR_SPRITE.width).toBe(32);
      expect(FLOOR_SPRITE.height).toBe(32);
      validateSpriteIntegrity(FLOOR_SPRITE, '床タイル');
    });

    it('壁タイルが32x32でパレットインデックスが有効であること', () => {
      expect(WALL_SPRITE.width).toBe(32);
      expect(WALL_SPRITE.height).toBe(32);
      validateSpriteIntegrity(WALL_SPRITE, '壁タイル');
    });

    it('床タイルにテクスチャバリエーション（3色以上使用）があること', () => {
      const usedIndices = new Set<number>();
      FLOOR_SPRITE.pixels.forEach((row) => {
        row.forEach((pixel) => usedIndices.add(pixel));
      });
      // 透明を除いて3色以上使用していること
      const nonTransparent = [...usedIndices].filter((i) => i > 0);
      expect(nonTransparent.length).toBeGreaterThanOrEqual(3);
    });

    it('壁タイルにテクスチャバリエーション（3色以上使用）があること', () => {
      const usedIndices = new Set<number>();
      WALL_SPRITE.pixels.forEach((row) => {
        row.forEach((pixel) => usedIndices.add(pixel));
      });
      const nonTransparent = [...usedIndices].filter((i) => i > 0);
      expect(nonTransparent.length).toBeGreaterThanOrEqual(3);
    });

    it('全ステージの床・壁スプライトが有効であること', () => {
      const stages: StageNumber[] = [1, 2, 3, 4, 5];
      stages.forEach((stage) => {
        const floor = getStageFloorSprite(stage);
        const wall = getStageWallSprite(stage);
        validateSpriteIntegrity(floor, `ステージ${stage}床`);
        validateSpriteIntegrity(wall, `ステージ${stage}壁`);
      });
    });
  });

  describe('壁スプライト（特殊壁）', () => {
    it('破壊可能壁（無傷）が32x32でパレットインデックスが有効であること', () => {
      expect(BREAKABLE_INTACT_SPRITE.width).toBe(32);
      expect(BREAKABLE_INTACT_SPRITE.height).toBe(32);
      validateSpriteIntegrity(BREAKABLE_INTACT_SPRITE, '破壊可能壁（無傷）');
    });

    it('破壊可能壁（ダメージ）が32x32でパレットインデックスが有効であること', () => {
      expect(BREAKABLE_DAMAGED_SPRITE.width).toBe(32);
      expect(BREAKABLE_DAMAGED_SPRITE.height).toBe(32);
      validateSpriteIntegrity(BREAKABLE_DAMAGED_SPRITE, '破壊可能壁（ダメージ）');
    });

    it('破壊可能壁（破壊）が32x32でパレットインデックスが有効であること', () => {
      expect(BREAKABLE_BROKEN_SPRITE.width).toBe(32);
      expect(BREAKABLE_BROKEN_SPRITE.height).toBe(32);
      validateSpriteIntegrity(BREAKABLE_BROKEN_SPRITE, '破壊可能壁（破壊）');
    });
  });

  describe('エフェクトスプライト', () => {
    it('攻撃斬撃エフェクトが3フレーム32x32であること', () => {
      expect(ATTACK_SLASH_SPRITE_SHEET.sprites).toHaveLength(3);
      ATTACK_SLASH_SPRITE_SHEET.sprites.forEach((sprite) => {
        expect(sprite.width).toBe(32);
        expect(sprite.height).toBe(32);
        validateSpriteIntegrity(sprite, '攻撃斬撃エフェクト');
      });
    });

    it('敵近接攻撃エフェクトが3フレーム32x32であること', () => {
      expect(ENEMY_MELEE_SLASH_SPRITE_SHEET.sprites).toHaveLength(3);
      ENEMY_MELEE_SLASH_SPRITE_SHEET.sprites.forEach((sprite) => {
        expect(sprite.width).toBe(32);
        expect(sprite.height).toBe(32);
        validateSpriteIntegrity(sprite, '敵近接攻撃エフェクト');
      });
    });

    it('敵遠距離攻撃エフェクトが3フレーム32x32であること', () => {
      expect(ENEMY_RANGED_SHOT_SPRITE_SHEET.sprites).toHaveLength(3);
      ENEMY_RANGED_SHOT_SPRITE_SHEET.sprites.forEach((sprite) => {
        expect(sprite.width).toBe(32);
        expect(sprite.height).toBe(32);
        validateSpriteIntegrity(sprite, '敵遠距離攻撃エフェクト');
      });
    });
  });
});
