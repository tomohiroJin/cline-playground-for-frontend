import { manhattanDistance } from './geometryService';

describe('manhattanDistance', () => {
  it('同一座標は 0 を返す', () => {
    expect(manhattanDistance({ x: 3, y: 5 }, { x: 3, y: 5 })).toBe(0);
  });

  it('各軸の差の絶対値の和を返す', () => {
    expect(manhattanDistance({ x: 0, y: 0 }, { x: 3, y: 4 })).toBe(7);
  });

  it('負方向（引数の順序）でも同じ値を返す（対称性）', () => {
    const a = { x: 1, y: 2 };
    const b = { x: 5, y: 9 };
    expect(manhattanDistance(a, b)).toBe(manhattanDistance(b, a));
    expect(manhattanDistance(a, b)).toBe(4 + 7);
  });
});
