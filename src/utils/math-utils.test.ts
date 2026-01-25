import { distance, clamp, magnitude, randomRange, randomInt } from './math-utils';

describe('math-utils', () => {
  describe('distance', () => {
    it('同じ点間の距離は0', () => {
      expect(distance(0, 0, 0, 0)).toBe(0);
      expect(distance(5, 5, 5, 5)).toBe(0);
    });

    it('水平方向の距離を正しく計算', () => {
      expect(distance(0, 0, 3, 0)).toBe(3);
      expect(distance(0, 0, -4, 0)).toBe(4);
    });

    it('垂直方向の距離を正しく計算', () => {
      expect(distance(0, 0, 0, 3)).toBe(3);
      expect(distance(0, 0, 0, -4)).toBe(4);
    });

    it('斜め方向の距離を正しく計算（3-4-5三角形）', () => {
      expect(distance(0, 0, 3, 4)).toBe(5);
      expect(distance(1, 1, 4, 5)).toBe(5);
    });
  });

  describe('clamp', () => {
    it('範囲内の値はそのまま返す', () => {
      expect(clamp(5, 0, 10)).toBe(5);
      expect(clamp(0, 0, 10)).toBe(0);
      expect(clamp(10, 0, 10)).toBe(10);
    });

    it('最小値より小さい値は最小値に制限', () => {
      expect(clamp(-5, 0, 10)).toBe(0);
      expect(clamp(-100, -50, 50)).toBe(-50);
    });

    it('最大値より大きい値は最大値に制限', () => {
      expect(clamp(15, 0, 10)).toBe(10);
      expect(clamp(100, -50, 50)).toBe(50);
    });

    it('負の範囲でも正しく動作', () => {
      expect(clamp(-5, -10, -1)).toBe(-5);
      expect(clamp(-15, -10, -1)).toBe(-10);
      expect(clamp(0, -10, -1)).toBe(-1);
    });
  });

  describe('magnitude', () => {
    it('ゼロベクトルの大きさは0', () => {
      expect(magnitude(0, 0)).toBe(0);
    });

    it('単位ベクトルの大きさは1', () => {
      expect(magnitude(1, 0)).toBe(1);
      expect(magnitude(0, 1)).toBe(1);
    });

    it('3-4-5三角形', () => {
      expect(magnitude(3, 4)).toBe(5);
    });

    it('負の成分も正しく処理', () => {
      expect(magnitude(-3, -4)).toBe(5);
      expect(magnitude(-3, 4)).toBe(5);
    });
  });

  describe('randomRange', () => {
    it('生成された値が範囲内にある', () => {
      for (let i = 0; i < 100; i++) {
        const result = randomRange(0, 10);
        expect(result).toBeGreaterThanOrEqual(0);
        expect(result).toBeLessThan(10);
      }
    });

    it('負の範囲でも正しく動作', () => {
      for (let i = 0; i < 100; i++) {
        const result = randomRange(-10, 0);
        expect(result).toBeGreaterThanOrEqual(-10);
        expect(result).toBeLessThan(0);
      }
    });

    it('min === maxの場合はminを返す', () => {
      expect(randomRange(5, 5)).toBe(5);
    });
  });

  describe('randomInt', () => {
    it('生成された値が範囲内の整数である', () => {
      for (let i = 0; i < 100; i++) {
        const result = randomInt(0, 10);
        expect(Number.isInteger(result)).toBe(true);
        expect(result).toBeGreaterThanOrEqual(0);
        expect(result).toBeLessThanOrEqual(10);
      }
    });

    it('min === maxの場合はその値を返す', () => {
      expect(randomInt(5, 5)).toBe(5);
    });

    it('負の範囲でも正しく動作', () => {
      for (let i = 0; i < 100; i++) {
        const result = randomInt(-10, -5);
        expect(Number.isInteger(result)).toBe(true);
        expect(result).toBeGreaterThanOrEqual(-10);
        expect(result).toBeLessThanOrEqual(-5);
      }
    });
  });
});
