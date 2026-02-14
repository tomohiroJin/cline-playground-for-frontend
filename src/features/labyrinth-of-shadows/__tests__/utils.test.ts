import { manhattan, normAngle, toHex, formatTime, clamp, distance } from '../utils';

describe('labyrinth-of-shadows/utils', () => {
  describe('manhattan', () => {
    test('同じ点のマンハッタン距離は0', () => {
      expect(manhattan(0, 0, 0, 0)).toBe(0);
    });

    test('正しいマンハッタン距離を計算する', () => {
      expect(manhattan(1, 2, 4, 6)).toBe(7);
    });

    test('負の座標でも正しく計算する', () => {
      expect(manhattan(-1, -2, 3, 4)).toBe(10);
    });
  });

  describe('normAngle', () => {
    test('範囲内の角度はそのまま返す', () => {
      expect(normAngle(0)).toBe(0);
      expect(normAngle(1)).toBe(1);
      expect(normAngle(-1)).toBe(-1);
    });

    test('PI超の角度を正規化する', () => {
      const result = normAngle(Math.PI + 1);
      expect(result).toBeCloseTo(-Math.PI + 1);
    });

    test('-PI未満の角度を正規化する', () => {
      const result = normAngle(-Math.PI - 1);
      expect(result).toBeCloseTo(Math.PI - 1);
    });
  });

  describe('toHex', () => {
    test('0を正しく変換する', () => {
      expect(toHex(0)).toBe('00');
    });

    test('255を正しく変換する', () => {
      expect(toHex(255)).toBe('ff');
    });

    test('小数点を切り捨てる', () => {
      expect(toHex(15.9)).toBe('0f');
    });
  });

  describe('formatTime', () => {
    test('0秒を正しくフォーマットする', () => {
      expect(formatTime(0)).toBe('0:00');
    });

    test('90秒を1:30にフォーマットする', () => {
      expect(formatTime(90)).toBe('1:30');
    });

    test('秒が2桁にパディングされる', () => {
      expect(formatTime(65)).toBe('1:05');
    });
  });

  describe('re-exported clamp', () => {
    test('値を範囲内に制限する', () => {
      expect(clamp(5, 0, 10)).toBe(5);
      expect(clamp(-1, 0, 10)).toBe(0);
      expect(clamp(15, 0, 10)).toBe(10);
    });
  });

  describe('re-exported distance', () => {
    test('2点間の距離を正しく計算する', () => {
      expect(distance(0, 0, 3, 4)).toBe(5);
    });
  });
});
