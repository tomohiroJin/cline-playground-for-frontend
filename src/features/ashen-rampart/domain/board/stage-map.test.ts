import {
  PLAINS_MAP,
  isHighGround,
  isSlowCell,
  coveredPathCells,
  entranceCell,
  fortressCell,
  pathDirectionAt,
  remainingPathCells,
  laneOf,
  allPathCells,
  isPathCell,
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

describe('入口と砦', () => {
  it('入口は経路の始端を返す', () => {
    expect(entranceCell(PLAINS_MAP, 0)).toEqual({ x: 0, y: 3 });
  });

  it('砦は経路の終端を返す', () => {
    expect(fortressCell(PLAINS_MAP)).toEqual({ x: 8, y: 1 });
  });

  it('経路が空なら入口も砦も undefined を返す', () => {
    const emptyMap = { ...PLAINS_MAP, lanes: [] };
    expect(entranceCell(emptyMap, 0)).toBeUndefined();
    expect(fortressCell(emptyMap)).toBeUndefined();
  });
});

describe('pathDirectionAt', () => {
  const lane = laneOf(PLAINS_MAP, 0);

  it('横に進む経路セルは right を返す', () => {
    // (0,3) → (1,3)
    expect(pathDirectionAt(lane, { x: 0, y: 3 })).toBe('right');
  });

  it('上に折れる経路セルは up を返す', () => {
    // (4,3) → (4,2)
    expect(pathDirectionAt(lane, { x: 4, y: 3 })).toBe('up');
  });

  it('終端セルは進行方向を持たない', () => {
    expect(pathDirectionAt(lane, { x: 8, y: 1 })).toBeUndefined();
  });

  it('経路外のセルは undefined を返す', () => {
    expect(pathDirectionAt(lane, { x: 0, y: 0 })).toBeUndefined();
  });
});

describe('remainingPathCells', () => {
  const lane = laneOf(PLAINS_MAP, 0);

  it('入口にいる敵は経路長-1 の残りセル数を持つ', () => {
    // 経路は11セルなので入口からは残り10
    expect(remainingPathCells(lane, { x: 0, y: 3 })).toBe(10);
  });

  it('砦に到達した敵は残り0になる', () => {
    expect(remainingPathCells(lane, { x: 8, y: 1 })).toBe(0);
  });

  it('セル間の補間座標でも最も近い経路セルから概算する', () => {
    // (1.4, 3) は経路セル (1,3)（index 1）に最も近い → 残り9
    expect(remainingPathCells(lane, { x: 1.4, y: 3 })).toBe(9);
  });

  it('経路が空なら0を返す', () => {
    expect(remainingPathCells([], { x: 0, y: 0 })).toBe(0);
  });
});

describe('レーン構造', () => {
  it('lanes は1本以上のレーンを持ち、laneOf でセル列を取得できる', () => {
    expect(PLAINS_MAP.lanes.length).toBeGreaterThanOrEqual(1);
    expect(laneOf(PLAINS_MAP, 0).length).toBeGreaterThan(0);
  });

  it('allPathCells は全レーンのセルを重複なく返す', () => {
    const cells = allPathCells(PLAINS_MAP);
    const keys = cells.map((c) => `${c.x},${c.y}`);
    expect(new Set(keys).size).toBe(keys.length);
  });

  it('isPathCell は経路セルにだけ true を返す', () => {
    const first = laneOf(PLAINS_MAP, 0)[0];
    expect(first).toBeDefined();
    expect(isPathCell(PLAINS_MAP, first!)).toBe(true);
    expect(isPathCell(PLAINS_MAP, { x: 0, y: 0 })).toBe(false);
  });

  it('fortressCell は全レーンで共通の終端セルを返す', () => {
    const fortress = fortressCell(PLAINS_MAP);
    expect(fortress).toBeDefined();
    PLAINS_MAP.lanes.forEach((lane) => {
      expect(lane[lane.length - 1]).toEqual(fortress);
    });
  });
});
