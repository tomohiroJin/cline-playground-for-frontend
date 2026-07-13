import { generateStoneTexture } from '../stone-texture';

// テスト本体にループを持ち込まないための集計ヘルパー（バッファ検証用）
/** RGBA バッファ全チャンネルの最小・最大値 */
const channelExtent = (buf: Uint8Array): { min: number; max: number } => ({
  min: buf.reduce((m, v) => Math.min(m, v), 255),
  max: buf.reduce((m, v) => Math.max(m, v), 0),
});

/** 指定オフセット（0=R,1=G,2=B,3=A）のチャンネルだけを抜き出す */
const channel = (buf: Uint8Array, offset: number): Uint8Array =>
  buf.filter((_, i) => i % 4 === offset);

/** 指定オフセットのチャンネル値の合計 */
const channelSum = (buf: Uint8Array, offset: number): number =>
  channel(buf, offset).reduce((a, b) => a + b, 0);

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

  it('全チャンネルが 0〜255 の値域に収まる', () => {
    const { min, max } = channelExtent(generateStoneTexture(opts).color);
    expect(min).toBeGreaterThanOrEqual(0);
    expect(max).toBeLessThanOrEqual(255);
  });

  it('アルファチャンネルは全て 255', () => {
    const alpha = channelExtent(channel(generateStoneTexture(opts).color, 3));
    expect(alpha).toEqual({ min: 255, max: 255 });
  });

  it('normal マップは青チャンネル（法線Z）が赤チャンネルより強い（平坦面が上向き）', () => {
    const tex = generateStoneTexture(opts);
    expect(channelSum(tex.normal, 2)).toBeGreaterThan(channelSum(tex.normal, 0));
  });

  it('kind により基調色が変わる（wall と floor）', () => {
    const wall = generateStoneTexture({ ...opts, kind: 'wall' });
    const floor = generateStoneTexture({ ...opts, kind: 'floor' });
    expect(Array.from(wall.color)).not.toEqual(Array.from(floor.color));
  });
});
