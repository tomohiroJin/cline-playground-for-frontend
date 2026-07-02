/**
 * 戦士スプライト v3 の不変条件テスト
 *
 * 全フレームが 32×32・パレット範囲内であること、
 * 左向きが右向きの単純ミラーでない（光源固定で個性化されている）ことを保証する。
 */
import {
  WARRIOR_SPRITES,
  WARRIOR_IDLE_SPRITE_SHEETS,
  WARRIOR_ATTACK_SPRITE_SHEETS,
  WARRIOR_DAMAGE_SPRITES,
} from './warriorSpritesV3';
import type { Direction } from './playerSprites';
import type { SpriteDefinition } from './spriteData';

const DIRECTIONS: Direction[] = ['down', 'up', 'left', 'right'];

/** 全フレームを平坦に集める */
function allFrames(): SpriteDefinition[] {
  const frames: SpriteDefinition[] = [];
  for (const dir of DIRECTIONS) {
    frames.push(...WARRIOR_SPRITES[dir].sprites);
    frames.push(...WARRIOR_IDLE_SPRITE_SHEETS[dir].sprites);
    frames.push(...WARRIOR_ATTACK_SPRITE_SHEETS[dir].sprites);
    frames.push(WARRIOR_DAMAGE_SPRITES[dir]);
  }
  return frames;
}

/** pixels を左右反転する */
function mirror(pixels: number[][]): number[][] {
  return pixels.map((row) => [...row].reverse());
}

describe('戦士スプライト v3 の構造', () => {
  it('は全フレームが 32×32 を維持する', () => {
    for (const f of allFrames()) {
      expect(f.width).toBe(32);
      expect(f.height).toBe(32);
      expect(f.pixels).toHaveLength(32);
      f.pixels.forEach((row) => expect(row).toHaveLength(32));
    }
  });

  it('はパレット範囲外の index を持たない', () => {
    for (const f of allFrames()) {
      const max = f.palette.length - 1;
      f.pixels.forEach((row) =>
        row.forEach((v) => {
          expect(v).toBeGreaterThanOrEqual(0);
          expect(v).toBeLessThanOrEqual(max);
        })
      );
    }
  });

  it('は left の idle が right の単純ミラーではない（個性化）', () => {
    const left = WARRIOR_SPRITES.left.sprites[0];
    const rightMirrored = mirror(WARRIOR_SPRITES.right.sprites[0].pixels);
    expect(JSON.stringify(left.pixels)).not.toBe(JSON.stringify(rightMirrored));
  });

  it('は各方向の歩行シートが idle/walk1/mid/walk2 の4枚を持つ', () => {
    for (const dir of DIRECTIONS) {
      expect(WARRIOR_SPRITES[dir].sprites).toHaveLength(4);
    }
  });

  it('攻撃シートは4フレームで、隣接フレームが互いに異なる', () => {
    for (const dir of DIRECTIONS) {
      const sheet = WARRIOR_ATTACK_SPRITE_SHEETS[dir];
      expect(sheet.sprites).toHaveLength(4);
      for (let i = 0; i < 3; i++) {
        expect(sheet.sprites[i].pixels).not.toEqual(sheet.sprites[i + 1].pixels);
      }
    }
  });
});
