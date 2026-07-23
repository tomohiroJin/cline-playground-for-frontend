import {
  PLAINS_MAP,
  isHighGround,
  isSlowCell,
  coveredPathCells,
} from './stage-map';

describe('stage-map 地形述語', () => {
  it('高台セルは isHighGround が真になる', () => {
    expect(isHighGround(PLAINS_MAP, { x: 3, y: 4 })).toBe(true);
    expect(isHighGround(PLAINS_MAP, { x: 7, y: 2 })).toBe(true);
  });

  it('高台でないスロットは isHighGround が偽になる', () => {
    expect(isHighGround(PLAINS_MAP, { x: 1, y: 2 })).toBe(false);
  });

  it('滞留セルは isSlowCell が真になる', () => {
    expect(isSlowCell(PLAINS_MAP, { x: 4, y: 2 })).toBe(true);
  });

  it('滞留でない経路セルは isSlowCell が偽になる', () => {
    expect(isSlowCell(PLAINS_MAP, { x: 0, y: 3 })).toBe(false);
  });
});

describe('coveredPathCells', () => {
  it('射程内の経路セルだけを返す', () => {
    // (3,2) から range 1.6: (3,3)=1.0, (2,3)=1.41, (4,3)=1.41 は含む。
    // (5,1)=2.24 は含まない。
    // ※ ブリーフ記載の (4,1)=2.24 は実距離1.41（範囲内）のため誤り。
    //    2.24 は (5,1) の距離と一致するためこちらに修正（タスク1レポート参照）。
    const covered = coveredPathCells(PLAINS_MAP, { x: 3, y: 2 }, 1.6);
    const has = (x: number, y: number) =>
      covered.some((c) => c.x === x && c.y === y);
    expect(has(3, 3)).toBe(true);
    expect(has(4, 3)).toBe(true);
    expect(has(5, 1)).toBe(false);
  });

  it('射程0ならどの経路セルも覆わない', () => {
    expect(coveredPathCells(PLAINS_MAP, { x: 3, y: 2 }, 0)).toEqual([]);
  });
});
