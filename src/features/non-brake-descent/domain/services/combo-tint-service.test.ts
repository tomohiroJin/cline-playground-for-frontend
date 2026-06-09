import { comboTintIntensity } from './combo-tint-service';

// comboTintIntensity: コンボ数とコンボタイマー残量からティント強度を算出するドメインサービスのテスト

describe('comboTintIntensity', () => {
  // ============================================================
  // 正常系
  // ============================================================
  describe('正常系', () => {
    it('combo が 2 かつ comboTimer が正の値のとき、0 より大きい値を返す', () => {
      const result = comboTintIntensity(2, 60);
      expect(result).toBeGreaterThan(0);
    });

    it('combo が増えるほど強度が増加する', () => {
      const timer = 60;
      const intensity2 = comboTintIntensity(2, timer);
      const intensity5 = comboTintIntensity(5, timer);
      const intensity10 = comboTintIntensity(10, timer);
      expect(intensity5).toBeGreaterThan(intensity2);
      expect(intensity10).toBeGreaterThan(intensity5);
    });

    it('非常に大きな combo でも強度は 1.0 を超えない', () => {
      const result = comboTintIntensity(9999, 120);
      expect(result).toBeLessThanOrEqual(1.0);
    });

    it('強度は常に 0 以上の値を返す', () => {
      const result = comboTintIntensity(5, 60);
      expect(result).toBeGreaterThanOrEqual(0);
    });
  });

  // ============================================================
  // 境界値
  // ============================================================
  describe('境界値', () => {
    it('combo が 1 のとき（最小コンボ未満）強度は 0 を返す', () => {
      expect(comboTintIntensity(1, 60)).toBe(0);
    });

    it('combo が 0 のとき強度は 0 を返す', () => {
      expect(comboTintIntensity(0, 60)).toBe(0);
    });

    it('combo が負値のとき強度は 0 を返す', () => {
      expect(comboTintIntensity(-3, 60)).toBe(0);
    });

    it('comboTimer が 0 のとき強度は 0 を返す', () => {
      expect(comboTintIntensity(5, 0)).toBe(0);
    });

    it('comboTimer が負値のとき強度は 0 を返す', () => {
      expect(comboTintIntensity(5, -1)).toBe(0);
    });

    it('combo がちょうど 2（発動閾値）のとき強度は 0 より大きい', () => {
      expect(comboTintIntensity(2, 1)).toBeGreaterThan(0);
    });
  });

  // ============================================================
  // 異常系
  // ============================================================
  describe('異常系', () => {
    it('combo が NaN のとき強度は 0 を返す', () => {
      expect(comboTintIntensity(NaN, 60)).toBe(0);
    });

    it('comboTimer が NaN のとき強度は 0 を返す', () => {
      expect(comboTintIntensity(5, NaN)).toBe(0);
    });

    it('combo が Infinity のとき強度は 1.0 を超えない', () => {
      const result = comboTintIntensity(Infinity, 60);
      expect(result).toBeLessThanOrEqual(1.0);
    });
  });
});
