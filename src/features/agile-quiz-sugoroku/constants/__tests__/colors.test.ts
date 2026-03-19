/**
 * constants/colors.ts のテスト
 */
import { COLORS, getColorByThreshold, getInverseColorByThreshold } from '../colors';

describe('constants/colors', () => {
  // ── COLORS ──────────────────────────────────────────
  describe('COLORS - カラーパレット', () => {
    it('主要なカラーが定義されている', () => {
      expect(COLORS.bg).toBeDefined();
      expect(COLORS.text).toBeDefined();
      expect(COLORS.accent).toBeDefined();
      expect(COLORS.green).toBeDefined();
      expect(COLORS.red).toBeDefined();
      expect(COLORS.yellow).toBeDefined();
    });

    it('ガラスエフェクト用のカラーが定義されている', () => {
      expect(COLORS.glass).toContain('rgba');
      expect(COLORS.glassBorder).toContain('rgba');
    });

    it('Object.freeze で凍結されている', () => {
      expect(Object.isFrozen(COLORS)).toBe(true);
    });
  });

  // ── getColorByThreshold ──────────────────────────────
  describe('getColorByThreshold - 閾値に応じた色（高いほど良い）', () => {
    it('上限以上で緑を返す', () => {
      expect(getColorByThreshold(80, 70, 40)).toBe(COLORS.green);
    });

    it('上限と下限の間で黄色を返す', () => {
      expect(getColorByThreshold(50, 70, 40)).toBe(COLORS.yellow);
    });

    it('下限未満で赤を返す', () => {
      expect(getColorByThreshold(30, 70, 40)).toBe(COLORS.red);
    });

    it('境界値（上限ちょうど）で緑を返す', () => {
      expect(getColorByThreshold(70, 70, 40)).toBe(COLORS.green);
    });

    it('境界値（下限ちょうど）で黄色を返す', () => {
      expect(getColorByThreshold(40, 70, 40)).toBe(COLORS.yellow);
    });
  });

  // ── getInverseColorByThreshold ───────────────────────
  describe('getInverseColorByThreshold - 逆閾値の色（低いほど良い）', () => {
    it('低値で緑を返す', () => {
      expect(getInverseColorByThreshold(5, 10, 20)).toBe(COLORS.green);
    });

    it('中間値で黄色を返す', () => {
      expect(getInverseColorByThreshold(15, 10, 20)).toBe(COLORS.yellow);
    });

    it('高値で赤を返す', () => {
      expect(getInverseColorByThreshold(25, 10, 20)).toBe(COLORS.red);
    });

    it('境界値（下限ちょうど）で緑を返す', () => {
      expect(getInverseColorByThreshold(10, 10, 20)).toBe(COLORS.green);
    });

    it('境界値（上限ちょうど）で黄色を返す', () => {
      expect(getInverseColorByThreshold(20, 10, 20)).toBe(COLORS.yellow);
    });
  });
});
