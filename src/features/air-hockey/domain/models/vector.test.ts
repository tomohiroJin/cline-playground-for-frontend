import { Vector } from './vector';

describe('Vector 値オブジェクト', () => {
  describe('ファクトリーメソッド', () => {
    it('create で指定した座標のベクトルを生成する', () => {
      const v = Vector.create(3, 4);
      expect(v.x).toBe(3);
      expect(v.y).toBe(4);
    });

    it('zero でゼロベクトルを生成する', () => {
      const v = Vector.zero();
      expect(v.x).toBe(0);
      expect(v.y).toBe(0);
    });

    it('NaN を渡すとエラーになる', () => {
      expect(() => Vector.create(NaN, 0)).toThrow();
    });

    it('Infinity を渡すとエラーになる', () => {
      expect(() => Vector.create(0, Infinity)).toThrow();
    });

    it('-Infinity を渡すとエラーになる', () => {
      expect(() => Vector.create(-Infinity, 0)).toThrow();
    });
  });

  describe('不変性', () => {
    it('プロパティが readonly である', () => {
      const v = Vector.create(1, 2);
      // TypeScript の readonly は型レベルだが、Object.freeze で実行時も保証
      expect(Object.isFrozen(v)).toBe(true);
    });
  });

  describe('演算メソッド', () => {
    it('add で2つのベクトルを加算する', () => {
      const a = Vector.create(1, 2);
      const b = Vector.create(3, 4);
      const result = a.add(b);
      expect(result.x).toBe(4);
      expect(result.y).toBe(6);
    });

    it('add は元のベクトルを変更しない', () => {
      const a = Vector.create(1, 2);
      const b = Vector.create(3, 4);
      a.add(b);
      expect(a.x).toBe(1);
      expect(a.y).toBe(2);
    });

    it('subtract で2つのベクトルを減算する', () => {
      const a = Vector.create(5, 7);
      const b = Vector.create(2, 3);
      const result = a.subtract(b);
      expect(result.x).toBe(3);
      expect(result.y).toBe(4);
    });

    it('multiply でスカラー倍する', () => {
      const v = Vector.create(3, 4);
      const result = v.multiply(2);
      expect(result.x).toBe(6);
      expect(result.y).toBe(8);
    });

    it('normalize で単位ベクトルを返す', () => {
      const v = Vector.create(3, 4);
      const result = v.normalize();
      expect(result.x).toBeCloseTo(0.6);
      expect(result.y).toBeCloseTo(0.8);
      expect(result.magnitude()).toBeCloseTo(1);
    });

    it('ゼロベクトルの normalize はゼロベクトルを返す', () => {
      const v = Vector.zero();
      const result = v.normalize();
      expect(result.x).toBe(0);
      expect(result.y).toBe(0);
    });
  });

  describe('クエリメソッド', () => {
    it('magnitude でベクトルの大きさを返す', () => {
      const v = Vector.create(3, 4);
      expect(v.magnitude()).toBe(5);
    });

    it('magnitudeSquared で大きさの2乗を返す', () => {
      const v = Vector.create(3, 4);
      expect(v.magnitudeSquared()).toBe(25);
    });

    it('distanceTo で2点間の距離を返す', () => {
      const a = Vector.create(0, 0);
      const b = Vector.create(3, 4);
      expect(a.distanceTo(b)).toBe(5);
    });
  });

  describe('等値比較', () => {
    it('同じ座標のベクトルは等しい', () => {
      const a = Vector.create(3, 4);
      const b = Vector.create(3, 4);
      expect(a.equals(b)).toBe(true);
    });

    it('異なる座標のベクトルは等しくない', () => {
      const a = Vector.create(3, 4);
      const b = Vector.create(3, 5);
      expect(a.equals(b)).toBe(false);
    });
  });
});
