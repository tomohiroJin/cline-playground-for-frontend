import {
  MOOD,
  torchFlicker,
  torchIntensity,
  BLOOM_CONFIG,
  VIGNETTE_CONFIG,
  bloomIntensity,
} from '../lighting-config';

describe('lighting-config', () => {
  it('MOOD は現行路線（暗紫フォグ・橙トーチ）を維持する', () => {
    expect(MOOD.fog).toBe('#05040a');
    expect(MOOD.torch).toBe('#ffb060');
    expect(MOOD.fogDensity).toBeGreaterThan(0);
  });

  it('torchFlicker は決定論的で概ね 0〜1 の範囲に収まる', () => {
    for (let t = 0; t < 10; t += 0.37) {
      const v = torchFlicker(t);
      expect(v).toBeGreaterThanOrEqual(-0.2);
      expect(v).toBeLessThanOrEqual(1.2);
    }
    // 同一入力→同一出力
    expect(torchFlicker(3.14)).toBe(torchFlicker(3.14));
  });

  it('torchIntensity は reducedMotion で揺らぎのない一定値を返す', () => {
    const a = torchIntensity(torchFlicker(1), true);
    const b = torchIntensity(torchFlicker(2), true);
    expect(a).toBe(b); // フリッカに依らず一定
    // 通常時はフリッカで変動する
    expect(torchIntensity(0, false)).not.toBe(torchIntensity(1, false));
  });

  it('bloomIntensity は reducedMotion で通常時以下に抑制される', () => {
    expect(bloomIntensity(true)).toBeLessThanOrEqual(bloomIntensity(false));
  });

  it('BLOOM/VIGNETTE パラメータが妥当な値域', () => {
    expect(BLOOM_CONFIG.luminanceThreshold).toBeGreaterThan(0);
    expect(BLOOM_CONFIG.luminanceThreshold).toBeLessThan(1);
    expect(VIGNETTE_CONFIG.darkness).toBeGreaterThan(0);
  });
});
