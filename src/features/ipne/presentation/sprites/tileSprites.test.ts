/**
 * タイルスプライトのテスト（バリアント生成・メモ化）
 */
import { getStageFloorVariants, getStageFloorSprite } from './tileSprites';
import type { StageNumber } from '../../domain/types/stage';

const STAGES: StageNumber[] = [1, 2, 3, 4, 5];

describe('getStageFloorVariants', () => {
  it.each(STAGES)('S%d: 3バリアントで、サイズ・パレットがベースと一致する', (stage) => {
    const variants = getStageFloorVariants(stage);
    const base = getStageFloorSprite(stage);
    expect(variants).toHaveLength(3);
    for (const v of variants) {
      expect(v.width).toBe(base.width);
      expect(v.height).toBe(base.height);
      expect(v.palette).toEqual(base.palette);
    }
  });

  it.each(STAGES)('S%d: 装飾バリアントはベースとピクセルが異なり、互いにも異なる', (stage) => {
    const [v0, v1, v2] = getStageFloorVariants(stage);
    expect(v1.pixels).not.toEqual(v0.pixels);
    expect(v2.pixels).not.toEqual(v0.pixels);
    expect(v1.pixels).not.toEqual(v2.pixels);
  });

  it.each(STAGES)('S%d: 装飾の差分は控えめ（1〜24ピクセル）', (stage) => {
    const [v0, v1, v2] = getStageFloorVariants(stage);
    for (const v of [v1, v2]) {
      let diff = 0;
      for (let y = 0; y < v0.height; y++)
        for (let x = 0; x < v0.width; x++)
          if (v.pixels[y][x] !== v0.pixels[y][x]) diff++;
      expect(diff).toBeGreaterThan(0);
      expect(diff).toBeLessThanOrEqual(24);
    }
  });

  it('メモ化: 同じ stage で常に同一の配列・要素参照を返す（描画キャッシュ前提）', () => {
    const a = getStageFloorVariants(3);
    const b = getStageFloorVariants(3);
    expect(a).toBe(b);
    expect(a[1]).toBe(b[1]);
  });

  it('全ピクセル値がパレット範囲内', () => {
    for (const stage of STAGES) {
      for (const v of getStageFloorVariants(stage)) {
        for (const row of v.pixels)
          for (const p of row) {
            expect(p).toBeGreaterThanOrEqual(0);
            expect(p).toBeLessThan(v.palette.length);
          }
      }
    }
  });
});
