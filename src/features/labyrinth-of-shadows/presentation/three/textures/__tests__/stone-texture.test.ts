import { generateStoneTexture } from '../stone-texture';

describe('stone-texture', () => {
  const opts = { size: 32, seed: 7, kind: 'wall' as const };

  it('color/roughness/normal を size*size*4 の Uint8Array で返す', () => {
    const tex = generateStoneTexture(opts);
    expect(tex.size).toBe(32);
    expect(tex.color).toBeInstanceOf(Uint8Array);
    expect(tex.color.length).toBe(32 * 32 * 4);
    expect(tex.roughness.length).toBe(32 * 32 * 4);
    expect(tex.normal.length).toBe(32 * 32 * 4);
  });

  it('決定論的（同一シード→同一ピクセル）', () => {
    const a = generateStoneTexture(opts);
    const b = generateStoneTexture(opts);
    expect(Array.from(a.color)).toEqual(Array.from(b.color));
  });

  it('シードが違えば色パターンが変わる', () => {
    const a = generateStoneTexture({ ...opts, seed: 1 });
    const b = generateStoneTexture({ ...opts, seed: 2 });
    expect(Array.from(a.color)).not.toEqual(Array.from(b.color));
  });

  it('全チャンネルが 0〜255 の値域に収まりアルファは 255', () => {
    const tex = generateStoneTexture(opts);
    for (let i = 0; i < tex.color.length; i++) {
      expect(tex.color[i]).toBeGreaterThanOrEqual(0);
      expect(tex.color[i]).toBeLessThanOrEqual(255);
    }
    for (let i = 3; i < tex.color.length; i += 4) {
      expect(tex.color[i]).toBe(255); // アルファ
    }
  });

  it('normal マップの中央値は概ね (128,128,255) 付近（平坦面が上向き）', () => {
    const tex = generateStoneTexture(opts);
    // 青チャンネル（法線Z）が最も強いことを平均で確認
    let sumR = 0, sumB = 0;
    for (let i = 0; i < tex.normal.length; i += 4) {
      sumR += tex.normal[i];
      sumB += tex.normal[i + 2];
    }
    expect(sumB).toBeGreaterThan(sumR);
  });

  it('kind により基調色が変わる（wall と floor）', () => {
    const wall = generateStoneTexture({ ...opts, kind: 'wall' });
    const floor = generateStoneTexture({ ...opts, kind: 'floor' });
    expect(Array.from(wall.color)).not.toEqual(Array.from(floor.color));
  });
});
