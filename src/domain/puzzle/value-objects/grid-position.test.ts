import {
  createGridPosition,
  isPositionEqual,
  isAdjacent,
  getAdjacentPositions,
} from './grid-position';

describe('GridPosition 値オブジェクト', () => {
  describe('createGridPosition', () => {
    describe('正常系', () => {
      it('有効な位置を作成できる', () => {
        const pos = createGridPosition(0, 0, 4);
        expect(pos.row).toBe(0);
        expect(pos.col).toBe(0);
      });

      it('範囲内の最大値で作成できる', () => {
        const pos = createGridPosition(3, 3, 4);
        expect(pos.row).toBe(3);
        expect(pos.col).toBe(3);
      });

      it('作成された位置は凍結されている', () => {
        const pos = createGridPosition(1, 2, 4);
        expect(Object.isFrozen(pos)).toBe(true);
      });
    });

    describe('異常系', () => {
      it('行が負の場合にエラーをスローする', () => {
        expect(() => createGridPosition(-1, 0, 4)).toThrow('Assertion failed');
      });

      it('列が負の場合にエラーをスローする', () => {
        expect(() => createGridPosition(0, -1, 4)).toThrow('Assertion failed');
      });

      it('行がdivision以上の場合にエラーをスローする', () => {
        expect(() => createGridPosition(4, 0, 4)).toThrow('Assertion failed');
      });

      it('列がdivision以上の場合にエラーをスローする', () => {
        expect(() => createGridPosition(0, 4, 4)).toThrow('Assertion failed');
      });
    });
  });

  describe('isPositionEqual', () => {
    it('同じ位置はtrueを返す', () => {
      const a = createGridPosition(1, 2, 4);
      const b = createGridPosition(1, 2, 4);
      expect(isPositionEqual(a, b)).toBe(true);
    });

    it('異なる位置はfalseを返す', () => {
      const a = createGridPosition(1, 2, 4);
      const b = createGridPosition(2, 1, 4);
      expect(isPositionEqual(a, b)).toBe(false);
    });
  });

  describe('isAdjacent', () => {
    it('上方向に隣接する位置はtrueを返す', () => {
      const a = { row: 1, col: 0 };
      const b = { row: 0, col: 0 };
      expect(isAdjacent(a, b)).toBe(true);
    });

    it('右方向に隣接する位置はtrueを返す', () => {
      const a = { row: 0, col: 0 };
      const b = { row: 0, col: 1 };
      expect(isAdjacent(a, b)).toBe(true);
    });

    it('斜めの位置はfalseを返す', () => {
      const a = { row: 0, col: 0 };
      const b = { row: 1, col: 1 };
      expect(isAdjacent(a, b)).toBe(false);
    });

    it('同じ位置はfalseを返す', () => {
      const a = { row: 0, col: 0 };
      expect(isAdjacent(a, a)).toBe(false);
    });

    it('離れた位置はfalseを返す', () => {
      const a = { row: 0, col: 0 };
      const b = { row: 2, col: 0 };
      expect(isAdjacent(a, b)).toBe(false);
    });
  });

  describe('getAdjacentPositions', () => {
    it('中央の位置は4つの隣接位置を返す', () => {
      const pos = { row: 1, col: 1 };
      const adjacents = getAdjacentPositions(pos, 3);
      expect(adjacents).toHaveLength(4);
    });

    it('左上の角は2つの隣接位置を返す', () => {
      const pos = { row: 0, col: 0 };
      const adjacents = getAdjacentPositions(pos, 3);
      expect(adjacents).toHaveLength(2);
      expect(adjacents).toContainEqual({ row: 0, col: 1 });
      expect(adjacents).toContainEqual({ row: 1, col: 0 });
    });

    it('右下の角は2つの隣接位置を返す', () => {
      const pos = { row: 2, col: 2 };
      const adjacents = getAdjacentPositions(pos, 3);
      expect(adjacents).toHaveLength(2);
    });

    it('辺上の位置は3つの隣接位置を返す', () => {
      const pos = { row: 0, col: 1 };
      const adjacents = getAdjacentPositions(pos, 3);
      expect(adjacents).toHaveLength(3);
    });
  });
});
