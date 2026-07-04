/**
 * ステージ別アンビエント設定のテスト
 */
import { getStageAmbient } from './ambientLight';

describe('getStageAmbient', () => {
  it('全ステージで光半径比・ヴィネット強度・色が妥当な範囲', () => {
    for (const stage of [1, 2, 3, 4, 5] as const) {
      const a = getStageAmbient(stage);
      expect(a.lightRadiusRatio).toBeGreaterThan(0.2);
      expect(a.lightRadiusRatio).toBeLessThanOrEqual(1);
      expect(a.vignetteAlpha).toBeGreaterThanOrEqual(0);
      expect(a.vignetteAlpha).toBeLessThanOrEqual(0.6);
      expect(a.tintAlpha).toBeGreaterThanOrEqual(0);
      expect(a.tintAlpha).toBeLessThanOrEqual(0.12);
      expect(a.tintColor).toMatch(/^#[0-9a-f]{6}$/i);
    }
  });

  it('S4（闇）は他ステージより光円が狭くヴィネットが強い', () => {
    const dark = getStageAmbient(4);
    for (const stage of [1, 2, 3, 5] as const) {
      const other = getStageAmbient(stage);
      expect(dark.lightRadiusRatio).toBeLessThan(other.lightRadiusRatio);
      expect(dark.vignetteAlpha).toBeGreaterThanOrEqual(other.vignetteAlpha);
    }
  });

  it('stage 未指定はデフォルト（S2 相当）を返す', () => {
    expect(getStageAmbient(undefined)).toEqual(getStageAmbient(2));
  });
});
