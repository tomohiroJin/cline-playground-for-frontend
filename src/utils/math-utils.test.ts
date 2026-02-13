import {
  distance,
  clamp,
  magnitude,
  randomRange,
  randomInt,
  lerp,
  shuffle,
  normalize,
  normalizeVector,
  manhattanDistance,
  randomBool,
} from './math-utils';

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

  describe('lerp', () => {
    it('t=0のとき開始値を返す', () => {
      expect(lerp(0, 10, 0)).toBe(0);
      expect(lerp(-5, 5, 0)).toBe(-5);
    });

    it('t=1のとき終了値を返す', () => {
      expect(lerp(0, 10, 1)).toBe(10);
      expect(lerp(-5, 5, 1)).toBe(5);
    });

    it('t=0.5のとき中間値を返す', () => {
      expect(lerp(0, 10, 0.5)).toBe(5);
      expect(lerp(-10, 10, 0.5)).toBe(0);
    });

    it('t>1やt<0でも外挿される', () => {
      expect(lerp(0, 10, 2)).toBe(20);
      expect(lerp(0, 10, -1)).toBe(-10);
    });
  });

  describe('shuffle', () => {
    it('元の配列と同じ要素を含む', () => {
      const original = [1, 2, 3, 4, 5];
      const shuffled = shuffle(original);
      expect(shuffled).toHaveLength(original.length);
      expect(shuffled.sort()).toEqual(original.sort());
    });

    it('元の配列を変更しない', () => {
      const original = [1, 2, 3, 4, 5];
      const copy = [...original];
      shuffle(original);
      expect(original).toEqual(copy);
    });

    it('空配列はそのまま返す', () => {
      expect(shuffle([])).toEqual([]);
    });

    it('1要素の配列はそのまま返す', () => {
      expect(shuffle([42])).toEqual([42]);
    });
  });

  describe('normalize', () => {
    it('最小値を0に正規化する', () => {
      expect(normalize(0, 0, 10)).toBe(0);
    });

    it('最大値を1に正規化する', () => {
      expect(normalize(10, 0, 10)).toBe(1);
    });

    it('中間値を正しく正規化する', () => {
      expect(normalize(5, 0, 10)).toBe(0.5);
      expect(normalize(25, 0, 100)).toBe(0.25);
    });

    it('min === maxの場合は0を返す', () => {
      expect(normalize(5, 5, 5)).toBe(0);
    });

    it('範囲外の値も正規化する', () => {
      expect(normalize(15, 0, 10)).toBe(1.5);
      expect(normalize(-5, 0, 10)).toBe(-0.5);
    });
  });

  describe('normalizeVector', () => {
    it('単位ベクトルはそのまま返す', () => {
      const result = normalizeVector(1, 0);
      expect(result.x).toBe(1);
      expect(result.y).toBe(0);
    });

    it('ベクトルを正規化する', () => {
      const result = normalizeVector(3, 4);
      expect(result.x).toBeCloseTo(0.6);
      expect(result.y).toBeCloseTo(0.8);
    });

    it('ゼロベクトルは{x: 0, y: 0}を返す', () => {
      const result = normalizeVector(0, 0);
      expect(result.x).toBe(0);
      expect(result.y).toBe(0);
    });

    it('負の成分も正しく処理する', () => {
      const result = normalizeVector(-3, -4);
      expect(result.x).toBeCloseTo(-0.6);
      expect(result.y).toBeCloseTo(-0.8);
    });

    it('正規化後のベクトルの大きさは1', () => {
      const result = normalizeVector(7, 11);
      const len = Math.sqrt(result.x ** 2 + result.y ** 2);
      expect(len).toBeCloseTo(1);
    });
  });

  describe('manhattanDistance', () => {
    it('同じ点間の距離は0', () => {
      expect(manhattanDistance(0, 0, 0, 0)).toBe(0);
      expect(manhattanDistance(5, 5, 5, 5)).toBe(0);
    });

    it('水平方向の距離を正しく計算', () => {
      expect(manhattanDistance(0, 0, 3, 0)).toBe(3);
      expect(manhattanDistance(0, 0, -4, 0)).toBe(4);
    });

    it('垂直方向の距離を正しく計算', () => {
      expect(manhattanDistance(0, 0, 0, 3)).toBe(3);
      expect(manhattanDistance(0, 0, 0, -4)).toBe(4);
    });

    it('斜め方向の距離を正しく計算', () => {
      expect(manhattanDistance(0, 0, 3, 4)).toBe(7);
      expect(manhattanDistance(1, 1, 4, 5)).toBe(7);
    });
  });

  describe('randomBool', () => {
    it('probability=1のとき常にtrueを返す', () => {
      for (let i = 0; i < 100; i++) {
        expect(randomBool(1)).toBe(true);
      }
    });

    it('probability=0のとき常にfalseを返す', () => {
      for (let i = 0; i < 100; i++) {
        expect(randomBool(0)).toBe(false);
      }
    });

    it('デフォルトの確率は0.5', () => {
      // 統計的にtrueとfalseの両方が出ることを確認
      const results = Array.from({ length: 1000 }, () => randomBool());
      const trueCount = results.filter(Boolean).length;
      // 1000回で200〜800回trueが出れば妥当（極端な偏りがないことを確認）
      expect(trueCount).toBeGreaterThan(200);
      expect(trueCount).toBeLessThan(800);
    });
  });
});
